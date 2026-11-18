// Contexto de áudio falso para os testes: conta os nós criados e quantas vezes foi retomado. Não toca nada.
export class FakeParam {
  value = 0;
  setValueAtTime(): this { return this; }
  linearRampToValueAtTime(): this { return this; }
  exponentialRampToValueAtTime(): this { return this; }
  cancelScheduledValues(): this { return this; }
  setTargetAtTime(): this { return this; }
}
export class FakeNode {
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
export class FakeContext {
  readonly nodes: FakeNode[] = [];
  readonly sampleRate = 1000;
  currentTime = 0;
  state: 'running' | 'suspended' = 'running';
  resumeCalls = 0;
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
  resume(): Promise<void> { this.resumeCalls++; this.state = 'running'; return Promise.resolve(); }
}

