import { describe, expect, it } from 'vitest';
import { rollReward } from '../src/game/rewards';

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
