import { describe, expect, it } from 'vitest';
import { currentStage, isStageUnlocked } from '../src/game/mapRules';

const done = (...stages: number[]) => (s: number): boolean => stages.includes(s);

describe('mapa', () => {
  it('uma partida nova só libera a fase 1', () => {
    const c = done();
    expect([1, 2, 3, 4].map(s => isStageUnlocked(s, c, 4))).toEqual([true, false, false, false]);
    expect(currentStage(c, 4)).toBe(1);
  });

  it('vencer uma fase libera a seguinte', () => {
    const c = done(1, 2);
    expect([1, 2, 3, 4].map(s => isStageUnlocked(s, c, 4))).toEqual([true, true, true, false]);
    expect(currentStage(c, 4)).toBe(3);
  });

  it('quem já venceu uma fase adiante (progresso antigo) não perde as anteriores', () => {
    const c = done(4);
    expect([1, 2, 3, 4].map(s => isStageUnlocked(s, c, 4))).toEqual([true, true, true, true]);
  });

  it('com tudo vencido, a fase atual é a última', () => {
    expect(currentStage(done(1, 2, 3, 4), 4)).toBe(4);
  });
});
