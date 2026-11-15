import { describe, expect, it } from 'vitest';
import {
  ELEMENT_CYCLE, OUROBOROS_HIT_NEUTRAL, OUROBOROS_HIT_WEAK, OUROBOROS_HP, cycleMs, ouroborosCooldown, ouroborosDamage, pickOuroborosSkill, ringTiles, weakAt,
} from '../../../src/game/entities/bosses/ouroboros/rules';
import { pickOuroborosLine } from '../../../src/game/entities/bosses/ouroboros/lines';

describe('Ouroboros: o ciclo', () => {
  it('a fraqueza gira pelos quatro elementos, na ordem, e dá a volta (também com negativos)', () => {
    expect([0, 1, 2, 3, 4].map(weakAt)).toEqual(['fire', 'earth', 'water', 'air', 'fire']);
    expect(weakAt(-1)).toBe('air');
    expect(new Set(ELEMENT_CYCLE).size).toBe(4);
  });
  it('o elemento da vez causa 4, os vizinhos no ciclo 1 e o oposto nada (ele devora)', () => {
    expect(ouroborosDamage('fire', 'fire')).toBe(OUROBOROS_HIT_WEAK);
    expect(ouroborosDamage('earth', 'fire')).toBe(OUROBOROS_HIT_NEUTRAL);
    expect(ouroborosDamage('air', 'fire')).toBe(OUROBOROS_HIT_NEUTRAL);
    expect(ouroborosDamage('water', 'fire')).toBe(0);
    expect(ouroborosDamage('air', 'water')).toBe(OUROBOROS_HIT_NEUTRAL);
    expect(ouroborosDamage('earth', 'air')).toBe(0);
  });
  it('em cada momento do ciclo há exatamente um elemento forte, dois fracos e um que ele devora', () => {
    for (let i = 0; i < 4; i++) {
      const weak = weakAt(i);
      const hits = ELEMENT_CYCLE.map(e => ouroborosDamage(e, weak)).sort();
      expect(hits).toEqual([0, 1, 1, OUROBOROS_HIT_WEAK]);
    }
  });
  it('o ciclo é mais curto na fúria; a vida permite uns 8 golpes certeiros', () => {
    expect(cycleMs(2)).toBeLessThan(cycleMs(1));
    expect(ouroborosCooldown(2)).toBeLessThan(ouroborosCooldown(1));
    expect(Math.ceil(OUROBOROS_HP / OUROBOROS_HIT_WEAK)).toBeGreaterThanOrEqual(6);
    expect(Math.ceil(OUROBOROS_HP / OUROBOROS_HIT_WEAK)).toBeLessThanOrEqual(10);
  });
});

describe('Ouroboros: habilidades e anéis', () => {
  const open = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < 15 && y < 13;
  it('o Ciclo só existe na fúria e nenhuma habilidade repete', () => {
    for (let i = 0; i < 40; i++) {
      expect(pickOuroborosSkill(1, null, () => i / 40)).not.toBe('cycle');
    }
    expect(pickOuroborosSkill(1, 'ring', () => 0.1)).toBe('bite');
    expect(pickOuroborosSkill(1, 'bite', () => 0.1)).toBe('ring');
    const seen = new Set([0.05, 0.4, 0.7, 0.99].map(r => pickOuroborosSkill(2, null, () => r)));
    expect(seen.has('cycle')).toBe(true);
  });
  it('o anel é um quadrado oco: 8 vezes o raio de casas, todas a esse raio', () => {
    for (const r of [1, 2, 4]) {
      const tiles = ringTiles({ x: 7, y: 6 }, r, open);
      expect(tiles).toHaveLength(8 * r);
      for (const t of tiles) expect(Math.max(Math.abs(t.x - 7), Math.abs(t.y - 6))).toBe(r);
    }
  });
  it('o anel só tem casas livres e se corta na borda da grade', () => {
    const tiles = ringTiles({ x: 1, y: 1 }, 2, open);
    for (const t of tiles) expect(open(t.x, t.y)).toBe(true);
    expect(tiles.length).toBeLessThan(16);
    expect(ringTiles({ x: 7, y: 6 }, 2, (x, y) => open(x, y) && x !== 9)).toHaveLength(16 - 5);
  });
  it('tem falas para cada tipo', () => {
    for (const k of ['ring', 'bite', 'cycle', 'turn', 'hurt', 'furious', 'defeat'] as const) expect(pickOuroborosLine(k).length, k).toBeGreaterThan(3);
  });
});
