import { describe, expect, it } from 'vitest';
import {
  MANDRAKE_DAMAGE, lineTiles, mandrakeCooldown, pickMandrakeSkill, ringTiles, shriekPlan,
} from '../../../src/game/entities/bosses/mandrake/rules';
import { MANDRAKE_LINES, pickMandrakeLine } from '../../../src/game/entities/bosses/mandrake/lines';
import { damageTo } from '../../../src/game/entities/damage';
import { PROFILES } from '../../../src/game/entities/profiles';

const open = (x: number, y: number): boolean => x >= 1 && x <= 10 && y >= 1 && y <= 10;
const sorted = (a: number[]): number[] => [...a].sort((p, q) => p - q);

describe('Mandrágora: dano por elemento', () => {
  it('o fogo é a fraqueza; terra e água só resistem (nada de imunidade nem cura)', () => {
    expect(MANDRAKE_DAMAGE.fire).toBeGreaterThan(MANDRAKE_DAMAGE.air);
    expect(MANDRAKE_DAMAGE.air).toBeGreaterThan(MANDRAKE_DAMAGE.earth);
    expect(MANDRAKE_DAMAGE.earth).toBe(damageTo(PROFILES.mandrake, 'earth'));
    expect(MANDRAKE_DAMAGE.earth).toBeGreaterThanOrEqual(1);
    expect(MANDRAKE_DAMAGE.water).toBeGreaterThanOrEqual(1);
    expect(MANDRAKE_DAMAGE.water).toBeLessThan(MANDRAKE_DAMAGE.air);
  });
});

describe('Mandrágora: escolha de habilidade', () => {
  it('nunca repete a anterior', () => {
    for (let i = 0; i < 80; i++) {
      expect(pickMandrakeSkill(2, 'roots', true, () => i / 80)).not.toBe('roots');
    }
  });
  it('Grito e Brotos só existem na fase 2; Brotos só se couber outra flor', () => {
    for (let i = 0; i < 60; i++) {
      const s = pickMandrakeSkill(1, null, true, () => i / 60);
      expect(['shriek', 'sprouts']).not.toContain(s);
      expect(pickMandrakeSkill(2, null, false, () => i / 60)).not.toBe('sprouts');
    }
  });
  it('a fase 2 age mais rápido', () => {
    expect(mandrakeCooldown(2)).toBeLessThan(mandrakeCooldown(1));
  });
});

describe('Mandrágora: áreas', () => {
  it('raízes cobrem a linha inteira até a parede', () => {
    const t = lineTiles(5, 5, true, open);
    expect(sorted(t.map(p => p.x))).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(t.every(p => p.y === 5)).toBe(true);
  });
  it('raízes param em obstáculos', () => {
    const t = lineTiles(5, 5, true, (x, y) => open(x, y) && x !== 7);
    expect(Math.max(...t.map(p => p.x))).toBe(6);
  });
  it('o anel da maré fica a d passos e deixa a faixa livre', () => {
    const c = { x: 5, y: 5 };
    const ring = ringTiles(c, 3, open, 'vertical');
    for (const t of ring) {
      expect(Math.abs(t.x - 5) + Math.abs(t.y - 5)).toBe(3);
      expect(t.x).not.toBe(5);
    }
    expect(ring.length).toBeGreaterThan(0);
  });
});

describe('Mandrágora: Grito', () => {
  const all = Array.from({ length: 100 }, (_, i) => ({ x: (i % 10) + 1, y: Math.floor(i / 10) + 1 }));
  it('há casas seguras ao alcance, nunca a casa da jogadora, e o resto é perigoso', () => {
    const player = { x: 5, y: 5 };
    const { danger, safe } = shriekPlan(all, player, 3, Math.random);
    expect(safe).toHaveLength(3);
    for (const s of safe) {
      const d = Math.abs(s.x - 5) + Math.abs(s.y - 5);
      expect(d).toBeGreaterThanOrEqual(1);
      expect(d).toBeLessThanOrEqual(3);
    }
    expect(danger.some(t => t.x === 5 && t.y === 5)).toBe(true);
    expect(danger.length + safe.length).toBe(all.length);
  });
});

describe('falas da Mandrágora', () => {
  it('toda fala é curta e o sorteio nunca estoura', () => {
    for (const [kind, list] of Object.entries(MANDRAKE_LINES)) {
      expect(list.length, kind).toBeGreaterThan(0);
      for (const line of list) expect(line.length, line).toBeLessThanOrEqual(28);
    }
    expect(pickMandrakeLine('hurt', 0.999)).toBe(MANDRAKE_LINES.hurt[MANDRAKE_LINES.hurt.length - 1]);
  });
});
