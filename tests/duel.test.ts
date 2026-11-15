import { describe, expect, it } from 'vitest';
import { DUEL_MS, duelOutcome, validDuel } from '../src/game/duel';
import { arenaStageDef, duelStageDef } from '../src/game/arena';
import { retryData } from '../src/game/retry';

const up = (hp: number) => ({ hp, defeated: false });
const down = { hp: 0, defeated: true };

describe('duelo de chefes', () => {
  it('dura 100 segundos', () => {
    expect(DUEL_MS).toBe(100000);
    expect(duelStageDef('belladonna', 'lion').time).toBe(100000);
  });
  it('a luta segue enquanto os dois estão de pé e o tempo não acabou', () => {
    expect(duelOutcome(up(10), up(8), false)).toBeNull();
  });
  it('quem cai primeiro perde', () => {
    expect(duelOutcome(down, up(3), false)).toEqual({ winner: 1, reason: 'ko' });
    expect(duelOutcome(up(3), down, false)).toEqual({ winner: 0, reason: 'ko' });
  });
  it('os dois caindo juntos é empate', () => {
    expect(duelOutcome(down, down, false)).toEqual({ winner: null, reason: 'draw' });
  });
  it('acabou o tempo: perde quem tem menos vida; vida igual é empate', () => {
    expect(duelOutcome(up(12), up(7), true)).toEqual({ winner: 0, reason: 'time' });
    expect(duelOutcome(up(5), up(9), true)).toEqual({ winner: 1, reason: 'time' });
    expect(duelOutcome(up(6), up(6), true)).toEqual({ winner: null, reason: 'draw' });
  });
  it('um nocaute vale mais que o relógio', () => {
    expect(duelOutcome(down, up(1), true)).toEqual({ winner: 1, reason: 'ko' });
  });
  it('os dois lados precisam ser chefes diferentes', () => {
    expect(validDuel('lion', 'mandrake')).toBe(true);
    expect(validDuel('lion', 'lion')).toBe(false);
    expect(validDuel('lion', null)).toBe(false);
  });
  it('a fase do duelo usa o chão do primeiro chefe e não tem inimigos nem porta', () => {
    const d = duelStageDef('mandrake', 'chimera');
    expect(d.theme).toBe(arenaStageDef('mandrake').theme);
    expect(d.enemies).toEqual([]);
    expect(d.door).toBe(false);
  });
  it('perder (ou apertar R) recomeça o mesmo duelo', () => {
    expect(retryData(0, 'lion', 0, 'chimera')).toEqual({ stage: 0, arena: 'lion', duel: 'chimera' });
    expect(retryData(0, 'lion', 0)).toEqual({ stage: 0, arena: 'lion' });
  });
});
