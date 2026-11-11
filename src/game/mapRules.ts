// Regras do mapa (puras, testáveis): quais fases estão liberadas e qual é a próxima da Roo.
import { LAST_STAGE } from '../config';

type Completed = (stage: number) => boolean;

// Fase liberada: a primeira, ou a seguinte a uma fase vencida (quem já passou da fase não a perde).
export function isStageUnlocked(stage: number, completed: Completed, last = LAST_STAGE): boolean {
  if (stage <= 1) return true;
  for (let s = stage - 1; s <= last; s++) if (completed(s)) return true;
  return false;
}

// A fase que a Roo tem à frente: a primeira ainda não vencida (ou a última, se tudo foi vencido).
export function currentStage(completed: Completed, last = LAST_STAGE): number {
  for (let s = 1; s <= last; s++) if (!completed(s)) return s;
  return last;
}
