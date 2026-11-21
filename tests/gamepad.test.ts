import { describe, expect, it, vi } from 'vitest';
import { PAD_BUTTONS, applyPad, pressedNames, type PadName } from '../src/input/gamepad';
import { TOUCH_NAMES } from '../src/input/touch';

const buttons = (...on: number[]): boolean[] => Array.from({ length: 17 }, (_, i) => on.includes(i));

describe('gamepad', () => {
  it('todo botão mapeado é uma ação que o jogo conhece', () => {
    for (const [, name] of PAD_BUTTONS) expect(TOUCH_NAMES).toContain(name);
  });
  it('A coloca poção, Start pausa', () => {
    expect(pressedNames({ buttons: buttons(0), axes: [0, 0] }).has('bomb')).toBe(true);
    expect(pressedNames({ buttons: buttons(9), axes: [0, 0] }).has('pause')).toBe(true);
  });
  it('analógico: só passa da zona morta', () => {
    expect(pressedNames({ buttons: buttons(), axes: [0.3, -0.4] }).size).toBe(0);
    const n = pressedNames({ buttons: buttons(), axes: [-0.8, 0.9] });
    expect(n.has('left')).toBe(true);
    expect(n.has('down')).toBe(true);
  });
  it('aperta uma vez ao pressionar e solta ao largar', () => {
    const input = { press: vi.fn(), release: vi.fn() };
    const none = new Set<PadName>();
    const a = new Set<PadName>(['bomb', 'left']);
    applyPad(a, none, input);
    expect(input.press).toHaveBeenCalledTimes(2);
    applyPad(a, a, input); // segurando: nada novo
    expect(input.press).toHaveBeenCalledTimes(2);
    applyPad(none, a, input);
    expect(input.release).toHaveBeenCalledTimes(2);
  });
});
