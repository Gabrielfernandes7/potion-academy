import { afterEach, describe, expect, it } from 'vitest';
import { canUseBomb, isBlockedBomb, setArenaLoadout, setFormElement } from '../src/game/loadout';

afterEach(() => { setArenaLoadout(false); setFormElement(null); });

describe('poções que a Roo pode usar', () => {
  it('na forma de água, só a Poção de Água funciona (mesmo na Arena); ao acabar, todas voltam', () => {
    setArenaLoadout(true);
    expect(canUseBomb('mega')).toBe(true);
    setFormElement('water');
    expect(isBlockedBomb('mega')).toBe(false);
    for (const t of ['normal', 'pierce', 'remote'] as const) {
      expect(isBlockedBomb(t), t).toBe(true);
      expect(canUseBomb(t), t).toBe(false);
    }
    setFormElement(null);
    for (const t of ['normal', 'mega', 'pierce', 'remote'] as const) expect(canUseBomb(t), t).toBe(true);
  });

  it('na forma de fogo, só a Poção de Fogo funciona', () => {
    setArenaLoadout(true);
    setFormElement('fire');
    expect(canUseBomb('normal')).toBe(true);
    expect(canUseBomb('mega')).toBe(false);
  });

  it('fora da Arena, a poção precisa ser aprendida e não pode estar bloqueada pela forma', () => {
    expect(canUseBomb('remote')).toBe(false); // ainda não aprendida (o storage vazio só tem o fogo)
    expect(canUseBomb('normal')).toBe(true);
  });
});
