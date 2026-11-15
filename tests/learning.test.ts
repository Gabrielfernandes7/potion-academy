import { describe, expect, it } from 'vitest';
import { BOMB_ORDER } from '../src/config';
import { LEARNED_AFTER_STAGE, learnedAfter } from '../src/game/learning';
import { STAGES } from '../src/game/stages/index';

describe('poções aprendidas na jornada', () => {
  it('o fogo é o primeiro elemento: a inicial não precisa ser aprendida', () => {
    expect(BOMB_ORDER[0]).toBe('normal');
    expect(Object.values(LEARNED_AFTER_STAGE)).not.toContain('normal');
  });

  it('cada poção de elemento é aprendida uma única vez, numa fase que existe', () => {
    const learned = Object.values(LEARNED_AFTER_STAGE);
    expect(new Set(learned).size).toBe(learned.length);
    expect(new Set(learned)).toEqual(new Set(['mega', 'pierce', 'remote']));
    for (const s of Object.keys(LEARNED_AFTER_STAGE)) expect(STAGES.length).toBeGreaterThanOrEqual(Number(s));
  });

  it('a água vem antes do fogo da Torre, a terra antes do Poço e o ar depois do Poço', () => {
    expect(learnedAfter(1)).toBe('mega');
    expect(learnedAfter(3)).toBe('pierce');
    expect(learnedAfter(4)).toBe('remote');
    expect(learnedAfter(2)).toBeUndefined();
  });
});
