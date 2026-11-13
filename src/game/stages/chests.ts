// Tabelas de baú (OURO): a fase mais avançada tem baús mais generosos, mas ainda raros.
// Regra: quanto maior a recompensa, menor a chance. Valores pela metade desde o ajuste de OURO.
import type { ChestOdd } from './types';

export const CHEST_COMMON: ReadonlyArray<ChestOdd> = [
  { chance: 0.70, coins: 5 }, { chance: 0.25, coins: 10 }, { chance: 0.04, coins: 10 }, { chance: 0.01, coins: 50 },
];
export const CHEST_RICH: ReadonlyArray<ChestOdd> = [
  { chance: 0.55, coins: 5 }, { chance: 0.30, coins: 10 }, { chance: 0.12, coins: 10 }, { chance: 0.03, coins: 50 },
];
