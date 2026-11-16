import { afterEach, describe, expect, it } from 'vitest';
import { clearSeed, currentSeed, mulberry32, random, seedFromUrl, startRun } from '../src/game/rng';
import { buildTiles } from '../src/game/grid';

afterEach(() => clearSeed());

describe('fonte de sorteios com semente', () => {
  it('a mesma semente repete a sequência; sementes diferentes divergem', () => {
    startRun(42); const a = [random(), random(), random()];
    startRun(42); const b = [random(), random(), random()];
    startRun(43); const c = [random(), random(), random()];
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
    expect(currentSeed()).toBe(43);
  });
  it('sem semente pedida, sorteia uma e a devolve (para repetir depois)', () => {
    const s = startRun();
    expect(Number.isInteger(s)).toBe(true);
    const x = random(); startRun(s);
    expect(random()).toBe(x);
  });
  it('mulberry32 é o mesmo gerador das músicas', async () => {
    const t = await import('../src/audio/tracks');
    expect(t.mulberry32).toBe(mulberry32);
  });
  it('lê ?seed= da URL e ignora valores inválidos', () => {
    expect(seedFromUrl('?seed=849201')).toBe(849201);
    expect(seedFromUrl('?seed=abc')).toBeNull();
    expect(seedFromUrl('?x=1')).toBeNull();
    expect(seedFromUrl('')).toBeNull();
  });
  it('o mapa da fase é o mesmo com a mesma semente', () => {
    const gen = (seed: number) => { startRun(seed); return buildTiles(15, 13, 0.6, () => false).tiles; };
    expect(gen(7)).toEqual(gen(7));
    expect(gen(7)).not.toEqual(gen(8));
  });
});
