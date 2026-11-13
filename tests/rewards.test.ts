import { describe, expect, it } from 'vitest';
import { ELEMENTS, type BombId } from '../src/config';
import { isPotionPowerup, pickupHalo, pickupTexture, rollChestCoins, rollReward } from '../src/game/rewards';
import { pickPowerupPotion } from '../src/game/pickupRules';

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

describe('power-ups de poção: elemental', () => {
  it('+frasco e +raio carregam a poção; a textura e o brilho seguem o elemento dela', () => {
    expect(isPotionPowerup('bomb_up')).toBe(true);
    expect(isPotionPowerup('fire_up')).toBe(true);
    expect(isPotionPowerup('speed_up')).toBe(false);
    expect(pickupTexture('fire_up', 'mega')).toBe('pickup_radius_water');
    expect(pickupTexture('bomb_up', 'pierce')).toBe('pickup_flask_earth');
    expect(pickupTexture('coin', 'mega')).toBe('pickup_coin');
    expect(pickupHalo('fire_up', 'remote')).toBe(ELEMENTS.air.color);
    expect(pickupHalo('speed_up')).toBeDefined();
  });

  it('o sorteio só escolhe entre as poções que a Roo tem', () => {
    const owned: BombId[] = ['normal', 'pierce'];
    for (let i = 0; i < 40; i++) expect(owned).toContain(pickPowerupPotion(owned, () => i / 40));
    expect(pickPowerupPotion(['normal'], () => 0.99)).toBe('normal');
    expect(pickPowerupPotion(owned, () => 0)).toBe('normal');
    expect(pickPowerupPotion(owned, () => 0.999)).toBe('pierce');
  });
});
