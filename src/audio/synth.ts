// Primitivas do WebAudio: a cadeia de saída (com reverb) e os blocos de voz e ruído.
// Sem estado de jogo: recebe um Graph e cria nós. Os sons de verdade estão em sounds.ts.
//
// Cadeia: vozes -> barramento (sfx/música) -> passa-baixa -> compressor suave -> saída,
// com um reverb (resposta ao impulso gerada em código).

export type BusName = 'sfx' | 'music';

export interface VoiceOptions {
  gain: number;
  type?: OscillatorType;
  attack?: number;
  bus?: BusName;
  send?: number; // quanto vai para o reverb (0 a 1)
  glideTo?: number; // frequência final de um glissando
  glideTime?: number;
}

export interface Graph {
  ctx: AudioContext;
  sfxBus: GainNode;
  musicBus: GainNode;
  reverbIn: GainNode;
  noise: AudioBuffer; // ruído branco reaproveitado nos sopros e crepitares
}

// Solta nós de áudio que já terminaram: desconecta de tudo (o navegador os libera depois).
export function release(...nodes: Array<AudioNode | undefined>): void {
  for (const n of nodes) n?.disconnect();
}

// resposta ao impulso: ruído estéreo que decai exponencialmente
function makeImpulse(ctx: AudioContext, seconds: number, decay: number): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}

export function createGraph(ctx: AudioContext): Graph {
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -20;
  compressor.knee.value = 24;
  compressor.ratio.value = 3;
  compressor.attack.value = 0.01;
  compressor.release.value = 0.3;
  compressor.connect(ctx.destination);

  const master = ctx.createGain();
  master.gain.value = 1.7; // o compressor logo depois segura os picos
  master.connect(compressor);

  // tira os agudos ásperos de tudo
  const soften = ctx.createBiquadFilter();
  soften.type = 'lowpass';
  soften.frequency.value = 5200;
  soften.Q.value = 0.4;
  soften.connect(master);

  const sfxBus = ctx.createGain();
  sfxBus.gain.value = 0.9;
  sfxBus.connect(soften);

  const musicBus = ctx.createGain();
  musicBus.gain.value = 0.0001;
  musicBus.connect(soften);

  // reverb
  const convolver = ctx.createConvolver();
  convolver.buffer = makeImpulse(ctx, 2.4, 2.6);
  const reverbOut = ctx.createGain();
  reverbOut.gain.value = 0.55;
  const reverbIn = ctx.createGain();
  reverbIn.connect(convolver);
  convolver.connect(reverbOut);
  reverbOut.connect(soften);

  const len = ctx.sampleRate * 2;
  const noise = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

  return { ctx, sfxBus, musicBus, reverbIn, noise };
}

// Liga um envio ao reverb (se houver quantidade). Devolve o nó para ser solto depois.
function connectSend(g: Graph, env: GainNode, amount: number): GainNode | undefined {
  if (amount <= 0) return undefined;
  const send = g.ctx.createGain();
  send.gain.value = amount;
  env.connect(send);
  send.connect(g.reverbIn);
  return send;
}

// Uma nota: ataque suave, queda exponencial, com envio opcional ao reverb.
export function voice(g: Graph, freq: number, time: number, dur: number, o: VoiceOptions): void {
  const bus = (o.bus ?? 'sfx') === 'music' ? g.musicBus : g.sfxBus;
  const attack = Math.min(o.attack ?? 0.012, dur * 0.5);

  const osc = g.ctx.createOscillator();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(freq, time);
  if (o.glideTo) osc.frequency.exponentialRampToValueAtTime(o.glideTo, time + Math.min(dur, o.glideTime ?? 0.15));

  const env = g.ctx.createGain();
  env.gain.setValueAtTime(0.0001, time);
  env.gain.linearRampToValueAtTime(o.gain, time + attack);
  env.gain.exponentialRampToValueAtTime(0.0001, time + dur);

  osc.connect(env);
  env.connect(bus);
  const send = connectSend(g, env, o.send ?? 0);
  // quando a nota acaba, solta os nós (sem isso o grafo cresce para sempre)
  osc.onended = () => release(osc, env, send);
  osc.start(time);
  osc.stop(time + dur + 0.05);
}

// Grão de ruído filtrado: a base de chiados, crepitares e sopros.
export function grain(
  g: Graph, time: number, dur: number, gain: number, type: BiquadFilterType, freq: number, q = 1, send = 0.3,
): void {
  const src = g.ctx.createBufferSource();
  src.buffer = g.noise;
  const filter = g.ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = freq;
  filter.Q.value = q;
  const env = g.ctx.createGain();
  env.gain.setValueAtTime(0.0001, time);
  env.gain.linearRampToValueAtTime(gain, time + Math.min(0.004, dur * 0.3));
  env.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  src.connect(filter);
  filter.connect(env);
  env.connect(g.sfxBus);
  const s = connectSend(g, env, send);
  src.onended = () => release(src, filter, env, s);
  src.start(time, Math.random() * 1.5);
  src.stop(time + dur + 0.02);
}

// Crepitar: muitos estalos curtinhos espalhados por um intervalo (cristais, brasas).
export function crackle(g: Graph, time: number, count: number, span: number, freq: number, gain: number): void {
  for (let i = 0; i < count; i++) {
    const t = time + Math.random() * span;
    const f = freq * (0.8 + Math.random() * 0.4);
    grain(g, t, 0.012 + Math.random() * 0.02, gain * (0.5 + Math.random() * 0.8), 'bandpass', f, 3, 0.25);
  }
}

// Sopro de ruído filtrado: sobe e desce suave (como vento ou borbulhar).
export function breath(
  g: Graph, time: number, dur: number, gain: number, fromHz: number, toHz: number, send = 0.3, attackFrac = 0.25,
): void {
  const src = g.ctx.createBufferSource();
  src.buffer = g.noise;
  const filter = g.ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(fromHz, time);
  filter.frequency.exponentialRampToValueAtTime(toHz, time + dur);
  const env = g.ctx.createGain();
  env.gain.setValueAtTime(0.0001, time);
  env.gain.linearRampToValueAtTime(gain, time + dur * attackFrac);
  env.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  src.connect(filter);
  filter.connect(env);
  env.connect(g.sfxBus);
  const s = connectSend(g, env, send);
  src.onended = () => release(src, filter, env, s);
  src.start(time, Math.random() * 1.5);
  src.stop(time + dur + 0.05);
}
