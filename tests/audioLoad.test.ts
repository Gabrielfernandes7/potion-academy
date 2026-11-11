// Testes de carga da música: orçamento de notas e vozes, e liberação dos nós de áudio.
// Não usam WebAudio de verdade: um contexto falso conta quantos nós são criados e quantos
// continuam conectados depois que cada som termina (é isso que causava a lentidão).
import { describe, expect, it } from 'vitest';
import { audio, release } from '../src/audio/AudioEngine';
import { STEPS_PER_BAR, TRACKS, Track, generateBar, mulberry32, MelodyState } from '../src/audio/tracks';

// ---- contexto falso ----
class FakeParam {
  value = 0;
  setValueAtTime(): this { return this; }
  linearRampToValueAtTime(): this { return this; }
  exponentialRampToValueAtTime(): this { return this; }
}
class FakeNode {
  readonly outs = new Set<FakeNode>();
  onended: (() => void) | null = null;
  gain = new FakeParam();
  frequency = new FakeParam();
  Q = new FakeParam();
  threshold = new FakeParam();
  knee = new FakeParam();
  ratio = new FakeParam();
  attack = new FakeParam();
  release = new FakeParam();
  type = '';
  buffer: unknown = null;
  constructor(readonly kind: string) {}
  connect(n: FakeNode): FakeNode { this.outs.add(n); return n; }
  disconnect(n?: FakeNode): void { if (n) this.outs.delete(n); else this.outs.clear(); }
  start(): void { /* nada: o teste dispara onended */ }
  stop(): void { /* idem */ }
}
class FakeContext {
  readonly nodes: FakeNode[] = [];
  readonly sampleRate = 1000;
  currentTime = 0;
  state = 'running';
  onstatechange: (() => void) | null = null;
  destination = new FakeNode('destination');
  private make(kind: string): FakeNode { const n = new FakeNode(kind); this.nodes.push(n); return n; }
  createGain(): FakeNode { return this.make('gain'); }
  createOscillator(): FakeNode { return this.make('osc'); }
  createBufferSource(): FakeNode { return this.make('src'); }
  createBiquadFilter(): FakeNode { return this.make('filter'); }
  createConvolver(): FakeNode { return this.make('convolver'); }
  createDynamicsCompressor(): FakeNode { return this.make('compressor'); }
  createBuffer(_ch: number, len: number): { getChannelData(): Float32Array } {
    return { getChannelData: () => new Float32Array(len) };
  }
  resume(): Promise<void> { return Promise.resolve(); }
}

// nós que ainda estão ligados a alguma saída (o estado "vivo" do grafo)
const connected = (ctx: FakeContext): number => ctx.nodes.filter(n => n.outs.size > 0).length;

// Toca barras de uma faixa no contexto dado, como o agendador faz; devolve o número de notas.
function playBarsOn(ctx: FakeContext, track: Track, bars: number): number {
  // o grafo base é montado uma vez por contexto (0 barras = só montar)
  if (ctx.nodes.length === 0) audio.attachContext(ctx as unknown as AudioContext);
  const stepDur = 60 / track.bpm / 2;
  const rng = mulberry32(11);
  const melody: MelodyState = { idx: 3 };
  let notes = 0;
  for (let b = 0; b < bars; b++) {
    for (const ev of generateBar(track, b, rng, melody)) {
      audio.playNote(ev, 0.01 + (b * STEPS_PER_BAR + ev.step) * stepDur, stepDur);
      notes++;
    }
  }
  return notes;
}

describe('carga: orçamento de notas', () => {
  const ALL = TRACKS;

  it('cada faixa fica abaixo de 4 notas por segundo (média de 60 s)', () => {
    for (const track of ALL) {
      const stepDur = 60 / track.bpm / 2;
      const barSec = STEPS_PER_BAR * stepDur;
      const bars = Math.ceil(60 / barSec);
      const rng = mulberry32(3);
      const melody: MelodyState = { idx: 3 };
      let notes = 0;
      for (let b = 0; b < bars; b++) notes += generateBar(track, b, rng, melody).length;
      expect(notes / (bars * barSec), track.id).toBeLessThan(4);
    }
  });

  it('no máximo 12 vozes soando ao mesmo tempo', () => {
    for (const track of ALL) {
      const stepDur = 60 / track.bpm / 2;
      const rng = mulberry32(5);
      const melody: MelodyState = { idx: 3 };
      const spans: Array<[number, number]> = [];
      for (let b = 0; b < 16; b++) {
        for (const ev of generateBar(track, b, rng, melody)) {
          const start = (b * STEPS_PER_BAR + ev.step) * stepDur;
          spans.push([start, start + ev.steps * stepDur]);
        }
      }
      let peak = 0;
      for (const [s] of spans) {
        const alive = spans.filter(([a, e]) => a <= s && s < e).length;
        peak = Math.max(peak, alive);
      }
      expect(peak, track.id).toBeLessThanOrEqual(12);
    }
  });
});

describe('carga: nós de áudio', () => {
  it('cada nota cria no máximo 6 nós', () => {
    const ctx = new FakeContext();
    playBarsOn(ctx, TRACKS[0], 0);
    const base = ctx.nodes.length;
    const notes = playBarsOn(ctx, TRACKS[0], 8);
    expect(notes).toBeGreaterThan(0);
    expect((ctx.nodes.length - base) / notes).toBeLessThanOrEqual(6);
  });

  it('quando as notas acabam, nenhum nó continua ligado ao grafo', () => {
    const ctx = new FakeContext();
    playBarsOn(ctx, TRACKS[1], 0);
    const base = connected(ctx);
    playBarsOn(ctx, TRACKS[1], 40);
    expect(connected(ctx)).toBeGreaterThan(base); // as notas estão tocando
    // simula o fim de todos os sons
    for (const n of ctx.nodes) n.onended?.();
    expect(connected(ctx)).toBeLessThanOrEqual(base);
  });

  it('release() desconecta o nó de todas as saídas', () => {
    const a = new FakeNode('a');
    const b = new FakeNode('b');
    a.connect(b);
    release(a as unknown as AudioNode);
    expect(a.outs.size).toBe(0);
  });
});
