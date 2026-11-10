import { describe, expect, it } from 'vitest';
import { rollChestCoins, rollReward } from '../src/game/rewards';

describe('rollReward', () => {
  it('mapeia as faixas de probabilidade para os tipos de item', () => {
    expect(rollReward(0.0)).toBe('coin');
    expect(rollReward(0.44)).toBe('coin');
    expect(rollReward(0.45)).toBe('gem');
    expect(rollReward(0.60)).toBe('chest');
    expect(rollReward(0.70)).toBe('heart');
    expect(rollReward(0.75)).toBe('bomb_up');
    expect(rollReward(0.85)).toBe('fire_up');
    expect(rollReward(0.93)).toBe('speed_up');
    expect(rollReward(0.98)).toBe('time_up');
    expect(rollReward(0.999)).toBe('time_up');
  });
});

describe('rollChestCoins', () => {
  const table = [
    { chance: 0.70, coins: 5 }, { chance: 0.25, coins: 10 }, { chance: 0.04, coins: 20 }, { chance: 0.01, coins: 50 },
  ];
  it('mapeia as faixas acumuladas para o valor do baú', () => {
    expect(rollChestCoins(table, 0.0)).toBe(5);
    expect(rollChestCoins(table, 0.69)).toBe(5);
    expect(rollChestCoins(table, 0.70)).toBe(10);
    expect(rollChestCoins(table, 0.95)).toBe(20);
    expect(rollChestCoins(table, 0.99)).toBe(50);
    expect(rollChestCoins(table, 0.999)).toBe(50);
  });
});
