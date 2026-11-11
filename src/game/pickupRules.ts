// Regras puras dos itens do chão (sem Phaser, testáveis). Ver game/PickupSystem.ts.
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
