import { describe, expect, it } from 'vitest';
import { chooseMove, nextLastDir } from '../src/game/playerInput';

const none = { up: false, down: false, left: false, right: false };

describe('nextLastDir', () => {
  it('a seta recém-apertada vira a última direção', () => {
    expect(nextLastDir({ x: 0, y: 0 }, { ...none, left: true })).toEqual({ x: -1, y: 0 });
    expect(nextLastDir({ x: 0, y: 0 }, { ...none, down: true })).toEqual({ x: 0, y: 1 });
  });
  it('sem seta nova, mantém a anterior', () => {
    expect(nextLastDir({ x: 1, y: 0 }, none)).toEqual({ x: 1, y: 0 });
  });
});

describe('chooseMove', () => {
  it('nada segurado: sem passo', () => {
    expect(chooseMove({ x: 1, y: 0 }, none)).toBeNull();
  });
  it('segue a última direção se ela continua segurada, mesmo com outra seta', () => {
    expect(chooseMove({ x: 1, y: 0 }, { ...none, up: true, right: true })).toEqual({ x: 1, y: 0 });
  });
  it('se soltou a última, vale a outra segurada', () => {
    expect(chooseMove({ x: 1, y: 0 }, { ...none, down: true })).toEqual({ x: 0, y: 1 });
  });
});
