import { describe, expect, it } from 'vitest';
import { EMPTY, BLOCK, WALL } from '../src/config';
import { canSpawnEnemyAt, countKind, enemyMoveOptions, MIN_SPAWN_DISTANCE, SpawnContext } from '../src/game/enemyRules';
import { pickupAt, resolveRewardType, timeAfterBonus } from '../src/game/pickupRules';
import { SleepState, stepSleep } from '../src/game/sleepRules';

describe('regras dos inimigos', () => {
  it('conta os inimigos por tipo', () => {
    const list = [{ kind: 'frog' as const }, { kind: 'ghost' as const }, { kind: 'frog' as const }];
    expect(countKind(list, 'frog')).toBe(2);
    expect(countKind(list, 'ghost')).toBe(1);
    expect(countKind(list, 'flower')).toBe(0);
  });

  const base: SpawnContext = {
    tile: EMPTY, door: { x: 11, y: 9 }, player: { x: 1, y: 1 }, enemyAt: false, bombAt: false,
  };

  it('só nasce em casa livre, longe da Roo e da porta', () => {
    expect(canSpawnEnemyAt(5, 5, base)).toBe(true);
    expect(canSpawnEnemyAt(5, 5, { ...base, tile: BLOCK })).toBe(false);
    expect(canSpawnEnemyAt(11, 9, base)).toBe(false);
    expect(canSpawnEnemyAt(1 + MIN_SPAWN_DISTANCE - 1, 1, base)).toBe(false);
    expect(canSpawnEnemyAt(1 + MIN_SPAWN_DISTANCE, 1, base)).toBe(true);
    expect(canSpawnEnemyAt(5, 5, { ...base, enemyAt: true })).toBe(false);
    expect(canSpawnEnemyAt(5, 5, { ...base, bombAt: true })).toBe(false);
  });

  const move = (over: Partial<Parameters<typeof enemyMoveOptions>[0]>) => enemyMoveOptions({
    from: { x: 3, y: 3 }, passWalls: false, door: { x: 99, y: 99 }, cols: 13, rows: 11,
    isFree: () => true, occupied: () => false, ...over,
  });

  it('anda só para casas livres e sem outro inimigo', () => {
    expect(move({})).toHaveLength(4);
    expect(move({ isFree: (x, y) => !(x === 3 && y === 2) })).toHaveLength(3);
    expect(move({ occupied: (x, y) => x === 4 && y === 3 })).toHaveLength(3);
    expect(move({ isFree: () => false })).toEqual([]);
  });

  it('nunca pisa na porta', () => {
    const opts = move({ door: { x: 3, y: 4 } });
    expect(opts).toHaveLength(3);
    expect(opts.some(([dx, dy]) => dx === 0 && dy === 1)).toBe(false);
  });

  it('o fantasma atravessa o que bloqueia, mas não sai da sala', () => {
    expect(move({ passWalls: true, isFree: () => false })).toHaveLength(4);
    // no canto (1,1): esquerda e cima saem da sala
    const corner = move({ from: { x: 1, y: 1 }, passWalls: true, isFree: () => false });
    expect(corner).toHaveLength(2);
    expect(corner).toEqual([[0, 1], [1, 0]]);
    expect(WALL).not.toBe(EMPTY);
  });
});

describe('regras dos itens', () => {
  it('sem porta, a gema sorteada vira moeda', () => {
    expect(resolveRewardType('gem', false)).toBe('coin');
    expect(resolveRewardType('gem', true)).toBe('gem');
    expect(resolveRewardType('heart', false)).toBe('heart');
  });

  it('acha o item da casa, se houver', () => {
    const a = { gridX: 1, gridY: 1 };
    const b = { gridX: 2, gridY: 3 };
    expect(pickupAt([a, b], 2, 3)).toBe(b);
    expect(pickupAt([a, b], 5, 5)).toBeUndefined();
  });

  it('o relógio nunca passa do dobro do tempo da fase', () => {
    expect(timeAfterBonus(10_000, 15_000, 120_000)).toBe(25_000);
    expect(timeAfterBonus(230_000, 15_000, 120_000)).toBe(240_000);
  });
});

describe('sono da Roo', () => {
  const fresh = (): SleepState => ({ idleMs: 0, sleeping: false, zzzMs: 0 });

  it('dorme depois do tempo parada e solta o primeiro "z" no quadro seguinte', () => {
    const s = fresh();
    expect(stepSleep(s, 500, false, 1000, 300)).toBeNull();
    expect(stepSleep(s, 500, false, 1000, 300)).toBe('sleep');
    expect(s.sleeping).toBe(true);
    expect(stepSleep(s, 16, false, 1000, 300)).toBe('zzz');
    expect(s.zzzMs).toBe(0);
    expect(stepSleep(s, 100, false, 1000, 300)).toBeNull();
    expect(stepSleep(s, 200, false, 1000, 300)).toBe('zzz');
  });

  it('atividade zera o tempo e acorda quem dorme', () => {
    const s = fresh();
    stepSleep(s, 1000, false, 1000, 300);
    expect(s.sleeping).toBe(true);
    expect(stepSleep(s, 16, true, 1000, 300)).toBe('wake');
    expect(s).toEqual({ idleMs: 0, sleeping: false, zzzMs: 0 });
    expect(stepSleep(s, 16, true, 1000, 300)).toBeNull();
  });
});
