// Issue #5: o bot joga cada fase comum (de gemas e porta) em muitas sementes. Garante que as 3 gemas e a porta são
// alcançáveis e que um jogador cuidadoso e sequencial termina dentro do tempo da fase. Roda em milissegundos (puro).
import { describe, expect, it } from 'vitest';
import { STAGES } from '../src/game/stages';
import { playMany, playStage } from './helpers/playthroughBot';

// cada fase é simulada uma vez e os dois testes dela leem o mesmo resultado
const cache = new Map<number, ReturnType<typeof playMany>>();
const run = (n: number, def: (typeof STAGES)[number]) => { if (!cache.has(n)) cache.set(n, playMany(def, SEEDS)); return cache.get(n) as ReturnType<typeof playMany>; };

const SEEDS = Array.from({ length: 30 }, (_, i) => 1000 + i * 7919);
const COMMON = STAGES.map((def, i) => ({ def, n: i + 1 })).filter(({ def }) => def.door && !def.boss);

describe('o bot joga as fases comuns', () => {
  it('há 16 fases comuns', () => {
    expect(COMMON).toHaveLength(16);
  });

  for (const { def, n } of COMMON) {
    it(`fase ${n} (${def.name}): gemas e porta alcançáveis em todas as sementes`, () => {
      const r = run(n, def);
      const failed = r.results.map((x, i) => ({ x, seed: SEEDS[i] })).filter(({ x }) => !x.won);
      expect(failed.map(f => `semente ${f.seed}: ${f.x.reason}`)).toEqual([]);
    });

    it(`fase ${n} (${def.name}): o bot cuidadoso, com dois frascos, termina dentro do tempo`, () => {
      const r = run(n, def);
      // eslint-disable-next-line no-console
      console.log(`fase ${String(n).padStart(2)} ${def.name.padEnd(24)} 1 frasco: mediana ${(r.medianMs / 1000).toFixed(0)} s, pior ${(r.worstMs / 1000).toFixed(0)} s | 2 frascos: pior ${(r.worstTwoMs / 1000).toFixed(0)} s | tempo da fase ${(def.time / 1000).toFixed(0)} s`);
      expect(r.worstTwoMs).toBeLessThanOrEqual(def.time);
    });
  }

  it('o bot é determinístico: a mesma semente dá o mesmo resultado', () => {
    const def = COMMON[0].def;
    expect(playStage(def, 42)).toEqual(playStage(def, 42));
  });
});
