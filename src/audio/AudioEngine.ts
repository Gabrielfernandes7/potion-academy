// Áudio sintetizado com WebAudio (sem arquivos externos), pensado para ser calmo.
//
// Cadeia: vozes -> barramento (sfx/música) -> filtro passa-baixa -> compressor suave -> saída,
// com um reverb (resposta ao impulso gerada em código) para dar espaço e maciez.
// Efeitos: senoides/triângulos com ataque lento, mais grãos de ruído filtrados (chiado, crepitar, gotas).
// Cada elemento tem um som próprio (ver elementSound).
// Música: faixas procedurais (ver tracks.ts); cada jogo sorteia faixa e semente novas.
//
// Música (enabled/playing) e efeitos (sfx) são flags independentes.
// O sfx é ligado pelo primeiro clique em JOGAR/COMEÇAR.
import type { ElementId } from '../config';
import {
  BOSS_TRACK, MelodyState, NoteEvent, STEPS_PER_BAR, TRACKS, Track, generateBar, midiToHz, mulberry32, pickNextTrack,
} from './tracks';

export type SfxName = 'bomb' | 'explosion' | 'pickup' | 'powerup' | 'hurt' | 'door' | 'fizzle';

type WebkitWindow = { webkitAudioContext?: typeof AudioContext };
type BusName = 'sfx' | 'music';

interface VoiceOptions {
  gain: number;
  type?: OscillatorType;
  attack?: number;
  bus?: BusName;
  send?: number; // quanto vai para o reverb (0 a 1)
  glideTo?: number; // frequência final de um glissando
  glideTime?: number;
}

const MUSIC_LEVEL = 0.55;
// Agenda notas com 1 s de antecedência: navegadores aceleram os timers de abas em segundo plano
// e, com pouca antecedência, a música falhava em silêncio.
const LOOKAHEAD_S = 1.0;
const SCHEDULER_MS = 100;

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private reverbIn: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  playing = false;
  enabled = false;
  sfx = false;

  // música
  private track: Track | null = null;
  // faixa escolhida no menu (id); null = sorteia a cada jogo
  private trackChoice: string | null = null;
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

  // ------------------------------------------------------------------ infraestrutura

  private ensureContext(): boolean {
    if (!this.ctx) {
      try {
        const Ctor = window.AudioContext ?? (window as unknown as WebkitWindow).webkitAudioContext;
        if (!this.makeContext && !Ctor) return false;
        this.ctx = this.makeContext ? this.makeContext() : new (Ctor as typeof AudioContext)();
        this.buildGraph(this.ctx);
        // o navegador pode suspender o áudio sozinho (troca de aba, economia de energia, ligação)
        this.ctx.onstatechange = () => this.resumeIfNeeded();
      } catch {
        this.ctx = null;
        return false;
      }
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return true;
  }

  private buildGraph(ctx: AudioContext): void {
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -20;
    compressor.knee.value = 24;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.01;
    compressor.release.value = 0.3;
    compressor.connect(ctx.destination);

    this.master = ctx.createGain();
    this.master.gain.value = 1.7; // o compressor logo depois segura os picos
    this.master.connect(compressor);

    // tira os agudos ásperos de tudo
    const soften = ctx.createBiquadFilter();
    soften.type = 'lowpass';
    soften.frequency.value = 5200;
    soften.Q.value = 0.4;
    soften.connect(this.master);

    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = 0.9;
    this.sfxBus.connect(soften);

    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = 0.0001;
    this.musicBus.connect(soften);

    // reverb
    const convolver = ctx.createConvolver();
    convolver.buffer = this.makeImpulse(ctx, 2.4, 2.6);
    const reverbOut = ctx.createGain();
    reverbOut.gain.value = 0.55;
    this.reverbIn = ctx.createGain();
    this.reverbIn.connect(convolver);
    convolver.connect(reverbOut);
    reverbOut.connect(soften);

    // ruído branco reaproveitado nos sopros
    const len = ctx.sampleRate * 2;
    this.noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }

  // resposta ao impulso: ruído estéreo que decai exponencialmente
  private makeImpulse(ctx: AudioContext, seconds: number, decay: number): AudioBuffer {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  // Uma nota: ataque suave, queda exponencial, com envio opcional ao reverb.
  private voice(freq: number, time: number, dur: number, o: VoiceOptions): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const bus = (o.bus ?? 'sfx') === 'music' ? this.musicBus : this.sfxBus;
    if (!bus) return;
    const attack = Math.min(o.attack ?? 0.012, dur * 0.5);

    const osc = ctx.createOscillator();
    osc.type = o.type ?? 'sine';
    osc.frequency.setValueAtTime(freq, time);
    if (o.glideTo) osc.frequency.exponentialRampToValueAtTime(o.glideTo, time + Math.min(dur, o.glideTime ?? 0.15));

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    env.gain.linearRampToValueAtTime(o.gain, time + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    osc.connect(env);
    env.connect(bus);
    if (o.send && this.reverbIn) {
      const send = ctx.createGain();
      send.gain.value = o.send;
      env.connect(send);
      send.connect(this.reverbIn);
    }
    osc.start(time);
    osc.stop(time + dur + 0.05);
  }

  // Grão de ruído filtrado: a base de chiados, crepitares e sopros.
  private grain(time: number, dur: number, gain: number, type: BiquadFilterType, freq: number, q = 1, send = 0.3): void {
    const ctx = this.ctx;
    if (!ctx || !this.noiseBuffer || !this.sfxBus) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    env.gain.linearRampToValueAtTime(gain, time + Math.min(0.004, dur * 0.3));
    env.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    src.connect(filter);
    filter.connect(env);
    env.connect(this.sfxBus);
    if (send > 0 && this.reverbIn) {
      const s = ctx.createGain();
      s.gain.value = send;
      env.connect(s);
      s.connect(this.reverbIn);
    }
    src.start(time, Math.random() * 1.5);
    src.stop(time + dur + 0.02);
  }

  // Crepitar: muitos estalos curtinhos espalhados por um intervalo (cristais, brasas).
  private crackle(time: number, count: number, span: number, freq: number, gain: number): void {
    for (let i = 0; i < count; i++) {
      const t = time + Math.random() * span;
      const f = freq * (0.8 + Math.random() * 0.4);
      this.grain(t, 0.012 + Math.random() * 0.02, gain * (0.5 + Math.random() * 0.8), 'bandpass', f, 3, 0.25);
    }
  }

  // Gota pesada: um tom curto que cai de altura (metal líquido caindo).
  // Sons de cada elemento (inspirados em fenômenos reais, não em "sons oficiais" dos elementos):
  //   fogo  (enxofre queimando): chiado de chama e estalos
  //   água  (mercúrio líquido):   gotas pesadas caindo em sequência
  //   terra (sal):                cristais crepitando
  //   éter  (gás luminoso):       zumbido suave com brilho no ar
  // Cada elemento tem uma "assinatura" sonora que lembra o que ele é:
  // - fogo: um rugido que cai (ar aquecido) + um baque grave + estalos de brasa;
  // - água: um chiado que sobe (respingo) + bolhas que estouram subindo de tom;
  // - terra: um baque seco + pedra se soltando (ruído agudo curto) + um ronco baixo;
  // - ar/éter: um vento que cresce devagar + um brilho suave no fim.
  private elementSound(element: ElementId, t: number): void {
    switch (element) {
      case 'fire':
        this.breath(t, 0.9, 0.08, 1600, 260, 0.3);
        this.voice(72, t, 0.6, { gain: 0.09, type: 'sine', attack: 0.004, glideTo: 36, glideTime: 0.5, send: 0.2 });
        this.crackle(t + 0.05, 16, 0.6, 3000, 0.05);
        break;
      case 'water':
        this.breath(t, 0.6, 0.05, 420, 2400, 0.3);
        [0.08, 0.17, 0.27, 0.38, 0.5, 0.6].forEach((d, i) => {
          const f = 300 + i * 70 + Math.random() * 40;
          this.voice(f, t + d, 0.12, { gain: 0.05 * (1 - i * 0.08), type: 'sine', attack: 0.002, glideTo: f * 2.2, glideTime: 0.08, send: 0.3 });
        });
        break;
      case 'earth':
        this.voice(58, t, 0.5, { gain: 0.12, type: 'sine', attack: 0.003, glideTo: 34, glideTime: 0.3 });
        this.crackle(t + 0.02, 10, 0.25, 1800, 0.05);
        this.grain(t, 0.35, 0.05, 'highpass', 3000, 0.7, 0.1);
        this.breath(t, 0.5, 0.04, 500, 180, 0.1);
        break;
      case 'air':
        this.breath(t, 1.5, 0.05, 300, 2800, 0.8);
        this.voice(880, t + 0.5, 0.8, { gain: 0.012, type: 'sine', attack: 0.3, send: 0.8 });
        this.voice(1320, t + 0.6, 0.8, { gain: 0.008, type: 'sine', attack: 0.3, send: 0.8 });
        break;
    }
  }

  // Sopro de ruído filtrado: sobe e desce suave (como vento ou borbulhar).
  private breath(time: number, dur: number, gain: number, fromHz: number, toHz: number, send = 0.3): void {
    const ctx = this.ctx;
    if (!ctx || !this.noiseBuffer || !this.sfxBus) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(fromHz, time);
    filter.frequency.exponentialRampToValueAtTime(toHz, time + dur);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    env.gain.linearRampToValueAtTime(gain, time + dur * 0.25);
    env.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    src.connect(filter);
    filter.connect(env);
    env.connect(this.sfxBus);
    if (send > 0 && this.reverbIn) {
      const s = ctx.createGain();
      s.gain.value = send;
      env.connect(s);
      s.connect(this.reverbIn);
    }
    src.start(time, Math.random() * 1.5);
    src.stop(time + dur + 0.05);
  }

  // ------------------------------------------------------------------ música

  // Cria/retoma o AudioContext. Deve ser chamado dentro de um clique (exigência dos navegadores).
  unlock(): void {
    this.ensureContext();
    this.resumeIfNeeded();
  }

  // Se a música deveria estar tocando mas o contexto ficou suspenso, retoma.
  resumeIfNeeded(): void {
    if (this.ctx && this.playing && this.ctx.state !== 'running') void this.ctx.resume();
  }

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
    if (!this.track) this.chooseTrack();
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

  // Novo jogo: sorteia outra faixa (e outra semente). Se a música está ligada, troca com fade.
  // boss: usa a faixa fixa do duelo em vez de sortear.
  nextTrack(boss = false, stageTrack?: string): void {
    this.chooseTrack(boss, stageTrack);
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

  // Escolha da jogadora no menu: um id de faixa, ou null para sortear. Se a música está
  // ligada, troca na hora (com fade), para ela ouvir a faixa ao escolher.
  setTrackChoice(id: string | null): void {
    this.trackChoice = id && TRACKS.some(t => t.id === id) ? id : null;
    this.nextTrack();
  }

  get trackChoiceId(): string | null {
    return this.trackChoice;
  }

  get trackName(): string | null {
    return this.track ? this.track.name : null;
  }

  // Prioridade: duelo > escolha da jogadora (Sala de Música) > faixa da fase > sorteio.
  private chooseTrack(boss = false, stageTrack?: string): void {
    const wanted = this.trackChoice ?? stageTrack;
    const chosen = wanted ? TRACKS.find(t => t.id === wanted) : undefined;
    this.track = boss ? BOSS_TRACK : chosen ?? pickNextTrack(this.track ? this.track.id : null);
    this.seed = Math.floor(Math.random() * 0xffffffff);
  }

  private fadeMusic(target: number, timeConstant: number): void {
    if (!this.ctx || !this.musicBus) return;
    const g = this.musicBus.gain;
    g.cancelScheduledValues(this.ctx.currentTime);
    g.setTargetAtTime(Math.max(0.0001, target), this.ctx.currentTime, timeConstant);
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

  private playNote(ev: NoteEvent, time: number, stepDur: number): void {
    const freq = midiToHz(ev.midi);
    const dur = ev.steps * stepDur;
    switch (ev.voice) {
      case 'pad':
        this.voice(freq, time, dur * 1.05, { gain: 0.011, type: 'triangle', attack: 0.9, bus: 'music', send: 0.5 });
        break;
      case 'bass':
        this.voice(freq, time, dur * 1.1, { gain: 0.03, type: 'sine', attack: 0.06, bus: 'music', send: 0.1 });
        break;
      case 'melody':
        this.voice(freq, time, dur * 1.8, { gain: 0.026, type: 'sine', attack: 0.02, bus: 'music', send: 0.45 });
        this.voice(freq * 2, time, dur * 0.9, { gain: 0.005, type: 'sine', attack: 0.02, bus: 'music', send: 0.45 });
        break;
      case 'bell':
        this.voice(freq, time, 1.9, { gain: 0.02, type: 'sine', attack: 0.006, bus: 'music', send: 0.6 });
        this.voice(freq * 2.01, time, 1.0, { gain: 0.006, type: 'sine', attack: 0.006, bus: 'music', send: 0.6 });
        break;
    }
  }

  // ------------------------------------------------------------------ efeitos

  // variant: elemento da poção (muda o timbre do estouro).
  play(name: SfxName, variant?: ElementId): void {
    if (!this.sfx || !this.ctx) return;
    const t = this.ctx.currentTime;
    switch (name) {
      case 'bomb': {
        // poção pousando: uma gota/bolha suave
        this.voice(420, t, 0.3, { gain: 0.04, glideTo: 640, glideTime: 0.12, send: 0.4 });
        this.voice(560, t + 0.08, 0.26, { gain: 0.022, glideTo: 780, glideTime: 0.1, send: 0.4 });
        break;
      }
      case 'explosion':
        this.elementSound(variant ?? 'fire', t);
        break;
      case 'fizzle': {
        // poção de fogo apagada pela água: chiado de vapor que some + uma gota
        this.breath(t, 0.7, 0.06, 3200, 500, 0.4);
        this.voice(420, t + 0.05, 0.18, { gain: 0.04, type: 'sine', attack: 0.003, glideTo: 180, glideTime: 0.15, send: 0.4 });
        break;
      }
      case 'pickup': {
        // sininho
        this.voice(784, t, 0.55, { gain: 0.034, attack: 0.008, send: 0.5 });
        this.voice(1175, t + 0.06, 0.65, { gain: 0.02, attack: 0.008, send: 0.5 });
        break;
      }
      case 'powerup': {
        // arpejo ascendente, delicado
        [523, 659, 784, 1047].forEach((f, i) => {
          this.voice(f, t + i * 0.085, 0.7, { gain: 0.032, type: i % 2 ? 'triangle' : 'sine', attack: 0.012, send: 0.55 });
        });
        break;
      }
      case 'hurt': {
        // batida grave e abafada (sem aspereza)
        this.voice(150, t, 0.34, { gain: 0.06, glideTo: 92, glideTime: 0.3, send: 0.15 });
        this.breath(t, 0.2, 0.012, 500, 200, 0.1);
        break;
      }
      case 'door': {
        // acorde que "abre" como uma respiração
        [392, 523, 659].forEach((f, i) => {
          this.voice(f, t + i * 0.05, 1.3, { gain: 0.028, attack: 0.16, send: 0.6 });
        });
        break;
      }
    }
  }

  playWinMusic(): void {
    if (!this.sfx) return;
    this.stop();
    if (!this.ensureContext() || !this.ctx) return;
    const t = this.ctx.currentTime + 0.05;
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) => {
      this.voice(f, t + i * 0.27, 1.4, { gain: 0.042, attack: 0.012, send: 0.6 });
      this.voice(f * 1.5, t + i * 0.27, 1.0, { gain: 0.012, type: 'triangle', attack: 0.012, send: 0.6 });
    });
  }

  playGameOverMusic(): void {
    if (!this.sfx) return;
    this.stop();
    if (!this.ensureContext() || !this.ctx) return;
    const t = this.ctx.currentTime + 0.05;
    // frase descendente, melancólica mas macia
    [392, 349, 330, 262].forEach((f, i) => {
      this.voice(f, t + i * 0.5, 1.6, { gain: 0.04, attack: 0.05, send: 0.6 });
      this.voice(f / 2, t + i * 0.5, 1.6, { gain: 0.02, type: 'triangle', attack: 0.08, send: 0.4 });
    });
  }
}

export const audio = new AudioEngine();
