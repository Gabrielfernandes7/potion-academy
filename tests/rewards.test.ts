import { describe, expect, it } from 'vitest';
import { ELEMENTS, type BombId } from '../src/config';
import { isPotionPowerup, pickupHalo, pickupTexture, rollChestPrize, rollReward } from '../src/game/rewards';
import { pickPowerupPotion } from '../src/game/pickupRules';

describe('rollReward', () => {
  it('mapeia as faixas de probabilidade para os tipos de item', () => {
    expect(rollReward(0.0)).toBeNull(); // bloco vazio (sem moedas)
    expect(rollReward(0.44)).toBeNull();
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

describe('rollChestPrize', () => {
  const table = [
    { chance: 0.70, prize: 'heart' as const }, { chance: 0.25, prize: 'bomb_up' as const }, { chance: 0.05, prize: 'fire_up' as const },
  ];
  it('mapeia as faixas acumuladas para o item do baú', () => {
    expect(rollChestPrize(table, 0.0)).toBe('heart');
    expect(rollChestPrize(table, 0.69)).toBe('heart');
    expect(rollChestPrize(table, 0.70)).toBe('bomb_up');
    expect(rollChestPrize(table, 0.999)).toBe('fire_up');
  });
});

describe('power-ups de poção: elemental', () => {
  it('+frasco e +raio carregam a poção; a textura e o brilho seguem o elemento dela', () => {
    expect(isPotionPowerup('bomb_up')).toBe(true);
    expect(isPotionPowerup('fire_up')).toBe(true);
    expect(isPotionPowerup('speed_up')).toBe(false);
    expect(pickupTexture('fire_up', 'mega')).toBe('pickup_radius_water');
    expect(pickupTexture('bomb_up', 'pierce')).toBe('pickup_flask_earth');
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
