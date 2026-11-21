import { describe, expect, it } from 'vitest';
import { DEFAULT_KEYMAP, KEY_ACTIONS, keyLabel, rebind, sanitizeKeymap } from '../src/input/keymap';

describe('teclas', () => {
  it('trocar uma ação muda só a tecla dela', () => {
    const m = rebind(DEFAULT_KEYMAP, 'ability', 81); // Q
    expect(m.ability).toBe(81);
    expect(m.bomb).toBe(DEFAULT_KEYMAP.bomb);
  });
  it('tecla de outra ação: as duas trocam de lugar', () => {
    const m = rebind(DEFAULT_KEYMAP, 'ability', DEFAULT_KEYMAP.defense);
    expect(m.ability).toBe(DEFAULT_KEYMAP.defense);
    expect(m.defense).toBe(DEFAULT_KEYMAP.ability);
  });
  it('teclas reservadas (setas, Enter, R, 1 a 4) não valem', () => {
    for (const code of [37, 38, 13, 82, 49, 27]) expect(rebind(DEFAULT_KEYMAP, 'bomb', code)).toBe(DEFAULT_KEYMAP);
  });
  it('nunca fica duas ações na mesma tecla', () => {
    let m = DEFAULT_KEYMAP;
    for (const a of KEY_ACTIONS) m = rebind(m, a.id, 65 + (a.id.length % 5));
    const codes = Object.values(m);
    expect(new Set(codes).size).toBe(codes.length);
  });
  it('save inválido ou repetido volta ao padrão', () => {
    expect(sanitizeKeymap(null)).toEqual(DEFAULT_KEYMAP);
    expect(sanitizeKeymap({ bomb: 'x', ability: -3 })).toEqual(DEFAULT_KEYMAP);
    expect(sanitizeKeymap({ bomb: 65, ability: 65 })).toEqual(DEFAULT_KEYMAP);
    expect(sanitizeKeymap({ bomb: 65 }).bomb).toBe(65);
  });
  it('nomes das teclas', () => {
    expect(keyLabel(32)).toBe('Espaço');
    expect(keyLabel(88)).toBe('X');
  });
});
