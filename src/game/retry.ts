// Recomeço ao perder (puro, testável): a campanha volta à fase em que a Roo perdeu; a Arena recomeça a luta
// (o duelo de chefes, o mesmo duelo).
import type { BossId } from './stages/types';
import type { StageData } from './types';

export function retryData(stage: number, arena: BossId | null, arenaStage: number, duel: BossId | null = null): StageData {
  if (!arena) return { stage };
  return duel ? { stage: arenaStage, arena, duel } : { stage: arenaStage, arena };
}
