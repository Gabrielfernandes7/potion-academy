// Recomeço ao perder (puro, testável): a campanha volta à fase em que a Roo perdeu; a Arena recomeça a luta.
import type { BossId } from './stages/types';
import type { StageData } from './types';

export function retryData(stage: number, arena: BossId | null, arenaStage: number): StageData {
  return arena ? { stage: arenaStage, arena } : { stage };
}
