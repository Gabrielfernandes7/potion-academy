import { BOMB_TYPES, ELEMENTS, type BombId } from '../config';
import { POWERUP_COLORS } from '../textures/entities';
import type { ChestOdd } from './stages/types';

// Tabela de drop: o que sai quando um bloco é destruído.
// Probabilidades acumuladas: roll < limite => tipo.

export type PickupType =
  | 'coin'
  | 'gem'
  | 'chest'
  | 'heart'
  | 'bomb_up'
  | 'fire_up'
  | 'speed_up'
  | 'time_up';

const REWARD_TABLE: ReadonlyArray<readonly [number, PickupType]> = [
  [0.45, 'coin'],
  [0.60, 'gem'],
  [0.70, 'chest'],
  [0.75, 'heart'],
  [0.85, 'bomb_up'],
  [0.93, 'fire_up'],
  [0.98, 'speed_up'],
  [1.00, 'time_up'],
];

// Brilho suave atrás dos itens que merecem atenção: power-ups e gemas (a gema abre a porta).
export const PICKUP_HALO: Partial<Record<PickupType, number>> = {
  gem: 0x4dd0e1,
  speed_up: POWERUP_COLORS.speed_up,
  time_up: POWERUP_COLORS.time_up,
};

export const PICKUP_TEXTURE: Record<PickupType, string> = {
  coin: 'pickup_coin',
  gem: 'pickup_gem',
  chest: 'pickup_chest',
  heart: 'pickup_heart',
  bomb_up: 'pickup_flask_fire', // o real depende da poção: pickupTexture()
  fire_up: 'pickup_radius_fire',
  speed_up: 'pickup_speed_up',
  time_up: 'pickup_time_up',
};

// +frasco e +raio valem para uma poção específica, que o item carrega (ver pickupRules.pickPowerupPotion).
export function isPotionPowerup(type: PickupType): boolean {
  return type === 'bomb_up' || type === 'fire_up';
}

export function pickupTexture(type: PickupType, potion?: BombId): string {
  if (potion && isPotionPowerup(type)) {
    return `${type === 'bomb_up' ? 'pickup_flask' : 'pickup_radius'}_${BOMB_TYPES[potion].element}`;
  }
  return PICKUP_TEXTURE[type];
}

export function pickupHalo(type: PickupType, potion?: BombId): number | undefined {
  if (potion && isPotionPowerup(type)) return ELEMENTS[BOMB_TYPES[potion].element].color;
  return PICKUP_HALO[type];
}

export function rollReward(roll: number = Math.random()): PickupType {
  for (const [limit, type] of REWARD_TABLE) {
    if (roll < limit) return type;
  }
  return 'time_up';
}

// Quantas moedas o baú traz, sorteado pela tabela da fase (roll em [0, 1)).
export function rollChestCoins(table: ReadonlyArray<ChestOdd>, roll: number = Math.random()): number {
  let acc = 0;
  for (const odd of table) {
    acc += odd.chance;
    if (roll < acc) return odd.coins;
  }
  return table[table.length - 1].coins;
}
