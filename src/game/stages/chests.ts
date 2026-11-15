// Tabelas de baú: o baú guarda um item (coração ou power-up). Quanto mais avançada a fase, mais
// power-ups, mas o coração segue sendo o mais comum. Regra: a soma das chances é 1.
import type { ChestOdd } from './types';

export const CHEST_COMMON: ReadonlyArray<ChestOdd> = [
  { chance: 0.60, prize: 'heart' }, { chance: 0.25, prize: 'time_up' }, { chance: 0.15, prize: 'bomb_up' },
];
export const CHEST_RICH: ReadonlyArray<ChestOdd> = [
  { chance: 0.35, prize: 'heart' }, { chance: 0.25, prize: 'bomb_up' }, { chance: 0.20, prize: 'fire_up' }, { chance: 0.20, prize: 'time_up' },
];
