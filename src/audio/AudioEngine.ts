// Áudio sintetizado com WebAudio (sem arquivos externos).
// Música (enabled/playing) e efeitos (sfx) são flags independentes.
// O sfx é ligado pelo primeiro clique em COMEÇAR.

export type SfxName = 'bomb' | 'explosion' | 'pickup' | 'powerup' | 'hurt' | 'door';

type WebkitWindow = { webkitAudioContext?: typeof AudioContext };

export class AudioEngine {
  private ctx: AudioContext | null = null;
  playing = false;
  enabled = false;
  sfx = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private step = 0;

  // Loop calmo, inspirado em Kirby (campo pacífico / hub).
  // Frequências em Hz; 0 = silêncio.
  private readonly melody = [
    392, 440, 494, 523, 587, 523, 494, 440,
    392, 349, 330, 349, 392, 440, 494, 523,
    587, 659, 587, 523, 494, 440, 392, 349,
    330, 349, 392, 0,   392, 440, 523, 0,
  ];
  private readonly harmony = [
    262, 0,   294, 0,   330, 0,   349, 0,
    262, 0,   247, 0,   262, 0,   294, 0,
    330, 0,   349, 0,   330, 0,   294, 0,
    262, 0,   247, 0,   262, 0,   0,   0,
  ];
  private readonly bass = [
    131, 0, 0, 0,  98, 0, 0, 0,
    110, 0, 0, 0,  131, 0, 0, 0,
    147, 0, 0, 0,  131, 0, 0, 0,
    98,  0, 0, 0,  110, 0, 0, 0,
  ];

  private ensureContext(): boolean {
    if (!this.ctx) {
      try {
        const Ctor = window.AudioContext ?? (window as unknown as WebkitWindow).webkitAudioContext;
        if (!Ctor) return false;
        this.ctx = new Ctor();
      } catch {
        return false;
      }
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return true;
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
    this.enabled = true;
    this.playing = true;
    this.step = 0;
    this.tick();
  }

  stop(): void {
    this.playing = false;
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private tick(): void {
    if (!this.playing || !this.ctx) return;
    const t = this.ctx.currentTime;
    // ~72 BPM, colcheias suaves
    const stepDur = 60 / 72 / 2;
    const i = this.step % 32;
    if (this.melody[i]) this.note(this.melody[i], t, stepDur * 2.2, 'sine', 0.022);
    if (this.harmony[i]) this.note(this.harmony[i], t, stepDur * 2.4, 'triangle', 0.014);
    if (this.bass[i]) this.note(this.bass[i], t, stepDur * 2.8, 'triangle', 0.028);
    this.step++;
    this.timer = setTimeout(() => this.tick(), stepDur * 1000);
  }

  private note(freq: number, time: number, dur: number, type: OscillatorType, gain: number): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + dur);
  }

  private noise(time: number, dur: number, gain: number): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const size = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, size, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < size; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / size);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + dur);
    src.connect(g);
    g.connect(ctx.destination);
    src.start(time);
    src.stop(time + dur);
  }

  play(name: SfxName): void {
    if (!this.sfx || !this.ctx) return;
    const t = this.ctx.currentTime;
    switch (name) {
      case 'bomb':
        this.note(220, t, 0.08, 'sine', 0.035);
        break;
      case 'explosion':
        this.noise(t, 0.35, 0.08);
        this.note(80, t, 0.2, 'sawtooth', 0.04);
        break;
      case 'pickup':
        this.note(880, t, 0.07, 'sine', 0.05);
        this.note(1320, t + 0.05, 0.08, 'sine', 0.04);
        break;
      case 'powerup':
        this.note(660, t, 0.08, 'square', 0.05);
        this.note(880, t + 0.06, 0.08, 'square', 0.05);
        this.note(1320, t + 0.12, 0.12, 'square', 0.05);
        break;
      case 'hurt':
        this.note(110, t, 0.22, 'sawtooth', 0.07);
        break;
      case 'door':
        this.note(660, t, 0.08, 'square', 0.05);
        this.note(880, t + 0.08, 0.18, 'square', 0.05);
        break;
    }
  }

  playWinMusic(): void {
    if (!this.sfx) return;
    this.stop();
    if (!this.ensureContext() || !this.ctx) return;
    let time = this.ctx.currentTime + 0.02;
    const notes: Array<[number, number]> = [
      [523, 0.10], [659, 0.10], [784, 0.10], [1047, 0.45],
      [784, 0.12], [1047, 0.6],
    ];
    for (const [freq, dur] of notes) {
      this.note(freq, time, dur, 'square', 0.06);
      this.note(freq * 1.5, time, dur, 'triangle', 0.03);
      time += dur * 0.92;
    }
  }

  playGameOverMusic(): void {
    if (!this.sfx) return;
    this.stop();
    if (!this.ensureContext() || !this.ctx) return;
    let time = this.ctx.currentTime + 0.02;
    const notes: Array<[number, number]> = [
      [392, 0.30], [349, 0.30], [330, 0.30], [294, 0.30],
      [262, 0.60], [247, 0.45], [220, 1.40],
    ];
    for (const [freq, dur] of notes) {
      this.note(freq, time, dur, 'square', 0.06);
      this.note(freq / 2, time, dur, 'triangle', 0.045);
      this.note(freq * 1.5, time, dur * 0.6, 'sine', 0.02);
      time += dur * 0.92;
    }
  }
}

export const audio = new AudioEngine();
