import { describe, expect, it } from 'vitest';
import { pipsView, segmentFill, timerView } from "../src/game/hudState";

describe('timerView', () => {
  it('arredonda para cima e sinaliza aviso nos últimos 20 s', () => {
    expect(timerView(90000)).toEqual({ seconds: 90, warning: false, overtime: false });
    expect(timerView(20000).warning).toBe(true);
    expect(timerView(20001).warning).toBe(false);
    expect(timerView(500).seconds).toBe(1);
  });
  it('hora extra quando zera ou fica negativo', () => {
    expect(timerView(0)).toEqual({ seconds: 0, warning: false, overtime: true });
    expect(timerView(-3000).seconds).toBe(0);
    expect(timerView(-3000).overtime).toBe(true);
  });
});

describe('bolinhas e degraus da HUD', () => {
  it('uma bolinha por frasco: cheias as que já estão no chão', () => {
    expect(pipsView(1, 3)).toEqual([true, false, false]);
    expect(pipsView(0, 2)).toEqual([false, false]);
    expect(pipsView(5, 5)).toEqual([true, true, true, true, true]);
    expect(pipsView(2, 0)).toEqual([]);
    expect(pipsView(9, 2)).toEqual([true, true]);
  });
  it('a barra de degraus enche um segmento por vez', () => {
    expect([0, 1, 2, 3].map(i => segmentFill(1, i))).toEqual([1, 1, 1, 1]);
    expect([0, 1, 2, 3].map(i => segmentFill(0, i))).toEqual([0, 0, 0, 0]);
    expect([0, 1, 2, 3].map(i => segmentFill(0.5, i))).toEqual([1, 1, 0, 0]);
    expect(segmentFill(0.375, 1)).toBeCloseTo(0.5);
    expect(segmentFill(0.1, 3)).toBe(0);
    expect(segmentFill(2, 0)).toBe(1);
  });
});
