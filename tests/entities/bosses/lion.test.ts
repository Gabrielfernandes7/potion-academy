import { describe, expect, it } from 'vitest';
import {
  LION_DAMAGE, LION_HP, dissolveTiles, lionCooldown, pickLionSkill,
} from '../../../src/game/entities/bosses/lion/rules';
import { LION_LINES, pickLionLine } from '../../../src/game/entities/bosses/lion/lines';
import { hitsToKill } from '../../../src/game/entities/damage';
import { PROFILES } from '../../../src/game/entities/profiles';

const open = (x: number, y: number): boolean => x >= 1 && x <= 13 && y >= 1 && y <= 11;

describe('Leão Verde: dano por elemento', () => {
  it('o éter o fere muito, a terra não o toca, a água o dilui, o fogo é neutro', () => {
    expect(PROFILES.lion.weak).toEqual(['air']);
    expect(PROFILES.lion.immune).toEqual(['earth']);
    expect(LION_DAMAGE.earth).toBe(0);
    expect(LION_DAMAGE.air).toBeGreaterThan(LION_DAMAGE.fire);
    expect(LION_DAMAGE.fire).toBeGreaterThan(LION_DAMAGE.water);
    expect(LION_DAMAGE.water).toBeGreaterThanOrEqual(1);
  });
  it('o fogo (poção inicial) o vence em poucos golpes, o éter em menos, a terra nunca', () => {
    expect(hitsToKill(PROFILES.lion, 'earth')).toBe(Infinity);
    expect(hitsToKill(PROFILES.lion, 'fire')).toBeLessThanOrEqual(8);
    expect(hitsToKill(PROFILES.lion, 'air')).toBeLessThan(hitsToKill(PROFILES.lion, 'fire'));
    expect(LION_HP).toBe(PROFILES.lion.maxHp);
  });
  it('é o contrário da Quimera: a terra, fraqueza dela, é imunidade dele', () => {
    expect(PROFILES.chimera.weak).toContain('earth');
    expect(PROFILES.lion.immune).toContain('earth');
  });
});

describe('Leão Verde: habilidades', () => {
  it('nunca repete a anterior, e o Rugido só existe na fase 2', () => {
    for (let i = 0; i < 80; i++) expect(pickLionSkill(2, 'pounce', () => i / 80)).not.toBe('pounce');
    for (let i = 0; i < 60; i++) expect(pickLionSkill(1, null, () => i / 60)).not.toBe('roar');
    expect(new Set(Array.from({ length: 90 }, (_, i) => pickLionSkill(2, null, () => i / 90))).has('roar')).toBe(true);
  });
  it('a fase 2 age mais rápido, mas sempre depois do aviso de 1,2 s', () => {
    expect(lionCooldown(2)).toBeLessThan(lionCooldown(1));
    expect(lionCooldown(2)).toBeGreaterThan(1200);
  });
  it('o ácido cobre a linha da jogadora até a parede; furioso, a linha e a coluna', () => {
    const row = dissolveTiles({ x: 5, y: 5 }, true, false, open);
    expect(row.every(t => t.y === 5)).toBe(true);
    expect(row.map(t => t.x).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
    const cross = dissolveTiles({ x: 5, y: 5 }, true, true, open);
    expect(cross.length).toBe(13 + 11 - 1);
    expect(new Set(cross.map(t => `${t.x},${t.y}`)).size).toBe(cross.length);
  });
  it('o ácido para em obstáculos', () => {
    const t = dissolveTiles({ x: 5, y: 5 }, true, false, (x, y) => open(x, y) && x !== 8);
    expect(Math.max(...t.map(p => p.x))).toBe(7);
  });
});

describe('falas do Leão Verde', () => {
  it('toda fala é curta e o sorteio nunca estoura', () => {
    for (const [kind, list] of Object.entries(LION_LINES)) {
      expect(list.length, kind).toBeGreaterThan(0);
      for (const line of list) expect(line.length, line).toBeLessThanOrEqual(28);
    }
    expect(pickLionLine('hurt', 0.999)).toBe(LION_LINES.hurt[LION_LINES.hurt.length - 1]);
  });
});
