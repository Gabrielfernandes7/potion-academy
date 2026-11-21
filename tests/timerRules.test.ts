import { describe, expect, it } from 'vitest';
import { stepOvertime } from '../src/game/timerRules';

describe('dano de tempo esgotado', () => {
  it('parado não conta nem causa dano', () => {
    expect(stepOvertime(500, 1000, 1000, false)).toEqual({ timer: 500, hit: false });
  });
  it('conta sem dano enquanto não chega a zero', () => {
    expect(stepOvertime(1000, 400, 1000, true)).toEqual({ timer: 600, hit: false });
  });
  it('causa dano ao chegar a zero e recomeça o intervalo', () => {
    expect(stepOvertime(300, 300, 1000, true)).toEqual({ timer: 1000, hit: true });
    expect(stepOvertime(100, 500, 1000, true)).toEqual({ timer: 1000, hit: true });
  });
});
