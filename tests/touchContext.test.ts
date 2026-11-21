import { describe, expect, it } from 'vitest';
import { touchButtonsShown } from '../src/input/touchContext';

describe('touchButtonsShown (#18)', () => {
  it('no começo, só o essencial: sem DETONAR, HABILIDADE nem TROCAR FRASCO', () => {
    expect(touchButtonsShown({ formActive: false, hasRemote: false, ownedPotions: 1 })).toEqual({
      detonate: false,
      ability: false,
      cycle: false,
    });
  });

  it('DETONAR entra com a poção de Ar', () => {
    expect(touchButtonsShown({ formActive: false, hasRemote: true, ownedPotions: 4 }).detonate).toBe(true);
  });

  it('TROCAR FRASCO entra com a segunda poção', () => {
    expect(touchButtonsShown({ formActive: false, hasRemote: false, ownedPotions: 2 }).cycle).toBe(true);
  });

  it('HABILIDADE só aparece transformada', () => {
    expect(touchButtonsShown({ formActive: true, hasRemote: false, ownedPotions: 1 }).ability).toBe(true);
  });
});
