// Motor de áudio: contexto do navegador, flags de música e efeitos, e o agendador das faixas.
// Os blocos de som ficam em synth.ts (primitivas) e sounds.ts (quais sons tocam e como soam).
// Música (enabled/playing) e efeitos (sfx) são flags independentes.
// O sfx é ligado pelo primeiro clique em JOGAR/COMEÇAR.
import type { ElementId } from '../config';
import { MelodyState, NoteEvent, STEPS_PER_BAR, Track, generateBar, midiToHz, mulberry32, trackById } from './tracks';
import { createGraph, voice, type Graph } from './synth';
import { gameOverJingle, playSfx, winJingle, type SfxName } from './sounds';

export type { SfxName } from './sounds';
export { release } from './synth';

type WebkitWindow = { webkitAudioContext?: typeof AudioContext };

const MUSIC_LEVEL = 0.55;
const SFX_LEVEL = 0.9; // o mesmo valor de sfxBus em synth.ts
// Agenda notas com 1 s de antecedência: navegadores aceleram os timers de abas em segundo plano
// e, com pouca antecedência, a música falhava em silêncio.
const LOOKAHEAD_S = 1.0;
const SCHEDULER_MS = 100;

class AudioEngine {
  private ctx: AudioContext | null = null;
  private graph: Graph | null = null;

  playing = false;
  enabled = false;
  sfx = false;
  private musicVolume = 1; // escolha da jogadora (0 a 1), multiplica o nível da música
  private sfxVolume = 1; // idem para os efeitos

  // música
  private track: Track | null = null;
  private seed = 1;
  private rng: () => number = Math.random;
  private melody: MelodyState = { idx: 3 };
  private bar = 0;
  private step = 0;
  private barEvents: NoteEvent[] = [];
  private nextTime = 0;
  private scheduler: ReturnType<typeof setInterval> | null = null;
  private switchTimer: ReturnType<typeof setTimeout> | null = null;

  // chamado quando a faixa muda (nome) ou a música para (null); a interface mostra o nome
  onTrackChange: ((name: string | null) => void) | null = null;
  // chamado quando a música começa (true) ou para (false); a interface mostra o botão de som com isso
  onPlayingChange: ((playing: boolean) => void) | null = null;

  constructor(private readonly makeContext?: () => AudioContext) {}

  // ------------------------------------------------------------------ contexto

  private ensureContext(): boolean {
    if (!this.ctx) {
      try {
        const Ctor = window.AudioContext ?? (window as unknown as WebkitWindow).webkitAudioContext;
        if (!this.makeContext && !Ctor) return false;
        this.ctx = this.makeContext ? this.makeContext() : new (Ctor as typeof AudioContext)({ latencyHint: 'interactive' });
        this.graph = createGraph(this.ctx);
        this.applySfxVolume();
        // o navegador pode suspender o áudio sozinho (troca de aba, economia de energia, ligação)
        this.ctx.onstatechange = () => this.resumeIfNeeded();
      } catch {
        this.ctx = null;
        return false;
      }
    }
    this.resumeContext();
    return true;
  }

  // O navegador deixa o contexto "suspenso" até um gesto do jogador (e o suspende de novo em troca de aba,
  // economia de energia ou chamada). Retomar pode ser recusado: a próxima tentativa vem no próximo gesto.
  private resumeContext(): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state === 'running') return;
    try {
      void Promise.resolve(ctx.resume()).catch(() => { /* sem gesto ainda: tenta de novo depois */ });
    } catch {
      // idem
    }
  }

  // Usa um contexto já criado (testes e benchmarks): monta a cadeia de áudio nele.
  attachContext(ctx: AudioContext): void {
    this.ctx = ctx;
    this.graph = createGraph(ctx);
    this.applySfxVolume();
  }

  // Cria/retoma o AudioContext. Deve ser chamado dentro de um clique (exigência dos navegadores).
  unlock(): void {
    this.ensureContext();
    this.resumeIfNeeded();
  }

  // Se a música ou os efeitos deveriam soar mas o contexto ficou suspenso, retoma. (Antes só a música retomava:
  // com a música desligada e os EFEITOS ligados, o som não voltava depois de uma suspensão.)
  resumeIfNeeded(): void {
    if (this.playing || this.sfx) this.resumeContext();
  }

  // ------------------------------------------------------------------ música

  toggleMusic(): boolean {
    if (this.playing) {
      this.stop();
      this.enabled = false;
    } else {
      this.enabled = true;
      this.start();
    }
    return this.playing;
  }

  start(): void {
    if (this.playing) return;
    if (!this.ensureContext()) return;
    if (!this.track) this.chooseTrack('nocturno');
    this.enabled = true;
    this.playing = true;
    this.beginTrack();
  }

  stop(): void {
    this.playing = false;
    this.onPlayingChange?.(false);
    if (this.switchTimer) {
      clearTimeout(this.switchTimer);
      this.switchTimer = null;
    }
    if (this.scheduler !== null) {
      clearInterval(this.scheduler);
      this.scheduler = null;
    }
    this.fadeMusic(0, 0.3);
    this.onTrackChange?.(null);
  }

  // Toca a faixa da parte do jogo em que estamos (menu, fase, final). Se já é a faixa atual e
  // a música toca, só segue (sem reiniciar). Se a música está ligada, troca com fade.
  playTrack(id: string): void {
    if (this.playing && this.track?.id === id) return;
    this.chooseTrack(id);
    if (!this.enabled) return;
    if (!this.playing) {
      if (!this.ensureContext()) return;
      this.playing = true;
      this.beginTrack();
      return;
    }
    if (this.switchTimer) clearTimeout(this.switchTimer);
    this.fadeMusic(0, 0.25);
    this.switchTimer = setTimeout(() => {
      this.switchTimer = null;
      if (this.playing) this.beginTrack();
    }, 600);
  }

  get trackName(): string | null {
    return this.track ? this.track.name : null;
  }

  get trackId(): string | null {
    return this.track ? this.track.id : null;
  }

  private chooseTrack(id: string): void {
    this.track = trackById(id) ?? trackById('nocturno') ?? null;
    this.seed = Math.floor(Math.random() * 0xffffffff);
  }

  private fadeMusic(target: number, timeConstant: number): void {
    if (!this.ctx || !this.graph) return;
    const g = this.graph.musicBus.gain;
    g.cancelScheduledValues(this.ctx.currentTime);
    g.setTargetAtTime(Math.max(0.0001, target * this.musicVolume), this.ctx.currentTime, timeConstant);
  }

  /** Volume da música (0 a 1): vale já, com a música tocando. */
  setMusicVolume(v: number): void {
    this.musicVolume = Math.min(1, Math.max(0, v));
    if (this.playing) this.fadeMusic(MUSIC_LEVEL, 0.05);
  }

  /** Volume dos efeitos (0 a 1). */
  setSfxVolume(v: number): void {
    this.sfxVolume = Math.min(1, Math.max(0, v));
    this.applySfxVolume();
  }

  private applySfxVolume(): void {
    if (!this.ctx || !this.graph) return;
    this.graph.sfxBus.gain.setValueAtTime(SFX_LEVEL * this.sfxVolume, this.ctx.currentTime);
  }

  private beginTrack(): void {
    const ctx = this.ctx;
    const track = this.track;
    if (!ctx || !track) return;
    if (this.scheduler !== null) clearInterval(this.scheduler);
    this.rng = mulberry32(this.seed);
    this.melody = { idx: 3 };
    this.bar = 0;
    this.step = 0;
    this.barEvents = [];
    this.nextTime = ctx.currentTime + 0.1;
    this.fadeMusic(MUSIC_LEVEL, 0.8); // entra devagar
    this.onTrackChange?.(track.name);
    this.onPlayingChange?.(true);
    this.scheduler = setInterval(() => this.schedule(), SCHEDULER_MS);
    this.schedule();
  }

  private schedule(): void {
    const ctx = this.ctx;
    const track = this.track;
    if (!ctx || !track || !this.playing) return;
    const stepDur = 60 / track.bpm / 2; // colcheia
    while (this.nextTime < ctx.currentTime + LOOKAHEAD_S) {
      const s = this.step % STEPS_PER_BAR;
      if (s === 0) {
        this.barEvents = generateBar(track, this.bar, this.rng, this.melody);
        this.bar++;
      }
      for (const ev of this.barEvents) {
        if (ev.step === s) this.playNote(ev, this.nextTime, stepDur);
      }
      this.step++;
      this.nextTime += stepDur;
    }
  }

  // Toca uma nota no tempo dado (chamado pelo agendador; público para testes de carga e benchmarks).
  playNote(ev: NoteEvent, time: number, stepDur: number): void {
    const g = this.graph;
    if (!g) return;
    const freq = midiToHz(ev.midi);
    const dur = ev.steps * stepDur;
    switch (ev.voice) {
      case 'pad':
        voice(g, freq, time, dur * 1.05, { gain: 0.011, type: 'triangle', attack: 0.9, bus: 'music', send: 0.5 });
        break;
      case 'bass':
        voice(g, freq, time, dur * 1.1, { gain: 0.03, type: 'sine', attack: 0.06, bus: 'music', send: 0.1 });
        break;
      case 'melody':
        voice(g, freq, time, dur * 1.8, { gain: 0.026, type: 'sine', attack: 0.02, bus: 'music', send: 0.45 });
        voice(g, freq * 2, time, dur * 0.9, { gain: 0.005, type: 'sine', attack: 0.02, bus: 'music', send: 0.45 });
        break;
      case 'flute':
        // flauta: tom puro, ataque lento para o sopro entrar, um toque de harmônico e a nota se sustenta
        voice(g, freq, time, dur * 1.6, { gain: 0.03, type: 'sine', attack: 0.09, bus: 'music', send: 0.35 });
        voice(g, freq * 2, time, dur * 0.8, { gain: 0.004, type: 'sine', attack: 0.12, bus: 'music', send: 0.3 });
        break;
      case 'bell':
        voice(g, freq, time, 1.9, { gain: 0.02, type: 'sine', attack: 0.006, bus: 'music', send: 0.6 });
        voice(g, freq * 2.01, time, 1.0, { gain: 0.006, type: 'sine', attack: 0.006, bus: 'music', send: 0.6 });
        break;
    }
  }

  // ------------------------------------------------------------------ efeitos

  // variant: elemento da poção ou da forma (muda o timbre).
  play(name: SfxName, variant?: ElementId): void {
    if (!this.sfx) return;
    if (!this.ctx) this.ensureContext();
    if (!this.ctx || !this.graph) return;
    // Com o contexto suspenso o som ficaria na fila e sairia todo de uma vez ao retomar: melhor pular este
    // efeito e pedir a retomada.
    if (this.ctx.state !== 'running') { this.resumeContext(); return; }
    playSfx(this.graph, name, this.ctx.currentTime, variant);
  }

  playWinMusic(): void {
    if (!this.sfx) return;
    this.stop();
    if (!this.ensureContext() || !this.ctx || !this.graph) return;
    winJingle(this.graph, this.ctx.currentTime + 0.05);
  }

  playGameOverMusic(): void {
    if (!this.sfx) return;
    this.stop();
    if (!this.ensureContext() || !this.ctx || !this.graph) return;
    gameOverJingle(this.graph, this.ctx.currentTime + 0.05);
  }
}

export const audio = new AudioEngine();
