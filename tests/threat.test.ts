// Issue #17: a perseguição do sapo dá tensão sem dobrar a pressão, e a fase 1 (o tutorial) fica sem ela.
// Mede pelo bot (tests/helpers/playthroughBot.ts) e pela simulação de inimigos (tests/helpers/threatSim.ts), 30 sementes
// por fase. O bot não foge: os números são a pressão do plano, não o que um jogador cuidadoso sofre.
import { describe, expect, it } from 'vitest';
import { STAGES } from '../src/game/stages';
import { stageThreat, type StageThreat } from './helpers/threatSim';

const SEEDS = Array.from({ length: 30 }, (_, i) => 1000 + i * 7919);
const COMMON = STAGES.map((def, i) => ({ def, n: i + 1 })).filter(({ def }) => def.door && !def.boss);

const cache = new Map<number, StageThreat>();
const threatOf = (n: number, def: (typeof STAGES)[number]): StageThreat => {
  if (!cache.has(n)) cache.set(n, stageThreat(def, SEEDS));
  return cache.get(n) as StageThreat;
};

describe('tensão: perseguição do sapo (issue #17)', () => {
  it('a fase 1 (O CHAMADO, o tutorial) não tem perseguição: com ou sem ela, a pressão é a mesma', () => {
    const first = COMMON[0];
    expect(first.def.name).toBe('O CHAMADO');
    const t = threatOf(first.n, first.def);
    expect(t.chasers).toBe(0);
    expect(t.hitsOn).toBe(t.hitsOff);
  });

  for (const { def, n } of COMMON.slice(1)) {
    it(`fase ${n} (${def.name}): a perseguição soma no máximo 3 toques em média (não dobra a pressão)`, () => {
      const t = threatOf(n, def);
      expect(t.hitsOn - t.hitsOff).toBeLessThanOrEqual(3);
    });
  }

  it('a perseguição muda algo de verdade em pelo menos 3 fases (senão a regra não tem efeito)', () => {
    const changed = COMMON.filter(({ def, n }) => {
      const t = threatOf(n, def);
      return t.hitsOn > t.hitsOff;
    });
    expect(changed.length).toBeGreaterThanOrEqual(3);
  });

  it('o dano médio com perseguição fica abaixo da vida da Roo (24) em toda fase comum', () => {
    for (const { def, n } of COMMON) {
      const t = threatOf(n, def);
      expect(t.damageOn, def.name).toBeLessThan(24);
    }
  });

  it('o bot continua terminando dentro do tempo da fase (a perseguição não muda o plano)', () => {
    for (const { def, n } of COMMON) {
      const t = threatOf(n, def);
      expect(t.timeWorstTwoMs, def.name).toBeLessThanOrEqual(def.time);
      expect(t.wins, def.name).toBe(SEEDS.length);
    }
  });
});
