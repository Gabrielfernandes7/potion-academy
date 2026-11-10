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

export const PICKUP_TEXTURE: Record<PickupType, string> = {
  coin: 'pickup_coin',
  gem: 'pickup_gem',
  chest: 'pickup_chest',
  heart: 'pickup_heart',
  bomb_up: 'pickup_bomb_up',
  fire_up: 'pickup_fire_up',
  speed_up: 'pickup_speed_up',
  time_up: 'pickup_time_up',
};

export function rollReward(roll: number = Math.random()): PickupType {
  for (const [limit, type] of REWARD_TABLE) {
    if (roll < limit) return type;
  }
  return 'time_up';
}
