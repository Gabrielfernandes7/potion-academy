// Regras puras dos itens do chão (sem Phaser, testáveis). Ver game/PickupSystem.ts.
import { CONFIG, type BombId } from '../config';
import type { Objective } from './objective';
import type { PickupType } from './rewards';
import { random } from './rng';

// Item que de fato nasce de um sorteio: na fase do chefe não há porta, então a gema não nasce (null).
export function resolveRewardType(rolled: PickupType, hasDoor: boolean): PickupType | null {
  return !hasDoor && rolled === "gem" ? null : rolled;
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
export function pickPowerupPotion(owned: readonly BombId[], rng: () => number = random): BombId {
  return owned[Math.min(owned.length - 1, Math.floor(rng() * owned.length))];
}

/** A gema abre a porta? Só na fase de gemas, fora do chefe e com a porta ainda fechada. */
export function doorOpensByGem(o: Objective, gems: number, bossStage: boolean, doorOpen: boolean): boolean {
  return o.type === 'gems' && !bossStage && gems >= CONFIG.gemsForDoor && !doorOpen;
}
