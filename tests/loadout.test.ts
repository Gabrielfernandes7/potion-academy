import { afterEach, describe, expect, it } from 'vitest';
import { canUseBomb, forbiddenElement, isBannedBomb, setArenaLoadout, setForbiddenElement } from '../src/game/loadout';

afterEach(() => { setArenaLoadout(false); setForbiddenElement(null); });

describe('poções que a Roo pode usar', () => {
  it('a forma de fogo proíbe a Poção Aqua, mesmo na Arena, e libera de novo ao acabar', () => {
    setArenaLoadout(true);
    expect(canUseBomb('mega')).toBe(true);
    setForbiddenElement('water');
    expect(forbiddenElement()).toBe('water');
    expect(isBannedBomb('mega')).toBe(true);
    expect(canUseBomb('mega')).toBe(false);
    for (const t of ['normal', 'pierce', 'remote'] as const) expect(canUseBomb(t), t).toBe(true);
    setForbiddenElement(null);
    expect(canUseBomb('mega')).toBe(true);
  });
  it('fora da Arena, a proibição soma com o que não foi comprado', () => {
    setForbiddenElement('fire');
    expect(canUseBomb('normal')).toBe(false); // a Poção de Fogo é do elemento proibido
    setForbiddenElement(null);
    expect(canUseBomb('normal')).toBe(true);
    expect(canUseBomb('remote')).toBe(false); // não comprada
  });
});
