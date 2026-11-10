import { describe, expect, it } from 'vitest';
import { timerView } from '../src/game/hudState';

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
