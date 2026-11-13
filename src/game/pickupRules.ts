// Regras puras dos itens do chão (sem Phaser, testáveis). Ver game/PickupSystem.ts.
import type { BombId } from '../config';
import type { PickupType } from './rewards';

// Item que de fato nasce de um sorteio: na fase do chefe não há porta, então a gema vira moeda.
export function resolveRewardType(rolled: PickupType, hasDoor: boolean): PickupType {
  return !hasDoor && rolled === 'gem' ? 'coin' : rolled;
}

// Item parado na casa (x, y), se houver (o primeiro da lista).
export function pickupAt<T extends { gridX: number; gridY: number }>(
  pickups: readonly T[], x: number, y: number,
): T | undefined {
  return pickups.find(p => p.gridX === x && p.gridY === y);
}

// TEMPO depois do bônus de um relógio: nunca passa do dobro do tempo da fase.
export function timeAfterBonus(timeLeft: number, bonus: number, stageTime: number): number {
  return Math.min(timeLeft + bonus, stageTime * 2);
}

// Poção que um power-up de alcance ou de frasco vai fortalecer: sorteada entre as que a Roo já tem
// (assim o item nunca é inútil e a cor dele diz qual poção recebe o bônus).
export function pickPowerupPotion(owned: readonly BombId[], rng: () => number = Math.random): BombId {
  return owned[Math.min(owned.length - 1, Math.floor(rng() * owned.length))];
}
