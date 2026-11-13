import { describe, expect, it } from 'vitest';
import { BASE_HIT, MULT, damageTo, hitsToKill, multiplierFor } from '../../src/game/entities/damage';
import { EntityId, PROFILES } from '../../src/game/entities/profiles';
import { isImmune } from '../../src/game/entities/enemies/defs';

const ELEMENTS = ['fire', 'water', 'earth', 'air'] as const;
const ids = Object.keys(PROFILES) as EntityId[];

describe('dano por elemento', () => {
  it('fraqueza causa mais, resistência menos, imunidade zero', () => {
    const p = PROFILES.mandrake;
    expect(multiplierFor(p, 'fire')).toBe(MULT.weak);
    expect(multiplierFor(p, 'earth')).toBe(MULT.resist);
    expect(damageTo(p, 'fire')).toBeGreaterThan(BASE_HIT);
    expect(damageTo(p, 'water')).toBeLessThan(BASE_HIT);
    expect(damageTo(PROFILES.flower, 'water')).toBe(0);
  });

  it('só há dano zero onde há imunidade; o resto causa pelo menos 1', () => {
    for (const id of ids) for (const el of ELEMENTS) {
      expect(damageTo(PROFILES[id], el) === 0).toBe(PROFILES[id].immune.includes(el));
    }
  });

  it('todo personagem tem atributo, pelo menos uma fraqueza e nenhuma regra contraditória', () => {
    for (const id of ids) {
      const p = PROFILES[id];
      expect(p.weak.length, id).toBeGreaterThan(0);
      expect(p.maxHp, id).toBeGreaterThan(0);
      for (const el of p.weak) {
        expect(p.resist, id).not.toContain(el);
        expect(p.immune, id).not.toContain(el);
      }
      // o atributo principal nunca é fraqueza
      expect(p.weak, id).not.toContain(p.element);
    }
  });

  it('nenhuma poção é a melhor contra todos: cada elemento é fraco em algum personagem', () => {
    for (const el of ELEMENTS) {
      const bestEverywhere = ids.every(id => PROFILES[id].weak.includes(el));
      expect(bestEverywhere, el).toBe(false);
    }
    // e os três elementos que a Roo compra têm alguém para quem são fracos ou ao menos neutros
    for (const el of ELEMENTS) expect(ids.some(id => damageTo(PROFILES[id], el) >= BASE_HIT)).toBe(true);
  });

  it('a fraqueza derruba sapo e fantasma de um golpe; o neutro leva dois', () => {
    expect(hitsToKill(PROFILES.frog, 'earth')).toBe(1);
    expect(hitsToKill(PROFILES.ghost, 'water')).toBe(1);
    expect(hitsToKill(PROFILES.frog, 'fire')).toBe(2);
    expect(hitsToKill(PROFILES.ghost, 'fire')).toBe(2);
  });

  it('nenhum personagem exige golpes demais com qualquer elemento que o machuque', () => {
    for (const id of ids) for (const el of ELEMENTS) {
      const n = hitsToKill(PROFILES[id], el);
      if (n !== Infinity) expect(n, `${id}/${el}`).toBeLessThanOrEqual(14);
    }
  });

  it('isImmune vem da mesma tabela', () => {
    expect(isImmune('flower', 'water')).toBe(true);
    expect(isImmune('ghost', 'earth')).toBe(true);
    expect(isImmune('frog', 'water')).toBe(false);
  });
});
