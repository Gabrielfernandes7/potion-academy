// Recomeço ao perder (puro, testável): a campanha volta à fase em que a Roo perdeu; a Arena recomeça a luta
// (o duelo de chefes, o mesmo duelo; e a mesma transformação fixa, se houve).
import type { FormId } from './forms/types';
import type { BossId } from './stages/types';
import type { StageData } from './types';

export function retryData(stage: number, arena: BossId | null, arenaStage: number, duel: BossId | null = null, form: FormId | null = null): StageData {
  if (!arena) return { stage };
  if (duel) return { stage: arenaStage, arena, duel };
  return form ? { stage: arenaStage, arena, form } : { stage: arenaStage, arena };
}
