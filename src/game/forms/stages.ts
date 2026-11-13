// Tempo e degraus das transformações (puro). Todas as formas duram o mesmo e esfriam em 4 degraus.
import type { FormStage } from './types';

export const FORM_MS = 20000; // era 12 s; subiu para 16 s (+33%) e agora 20 s (+25%): o limite do poder, em um só lugar
export const FORM_STAGES = 4;
export const FORM_COOLDOWN_MS = 25000; // espera depois que a forma acaba (valor de teste)
const STEP_MS = FORM_MS / FORM_STAGES;

/** Degrau da transformação para o tempo que resta: 4 no começo, 0 quando acaba. */
export function formStage(remainingMs: number): FormStage {
  if (remainingMs <= 0) return 0;
  return Math.min(FORM_STAGES, Math.ceil(remainingMs / STEP_MS)) as FormStage;
}
