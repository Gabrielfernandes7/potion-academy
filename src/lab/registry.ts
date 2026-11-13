// Lista dos experimentos do lab, na ordem da barra. Para um experimento novo: crie
// lab/experiments/<nome>.ts exportando um LabExperiment e acrescente-o aqui.
import { fireRooExperiment } from './experiments/fireRoo';
import { fogExperiment } from './experiments/fog';
import type { LabExperiment } from './types';

export const EXPERIMENTS: readonly LabExperiment[] = [fogExperiment, fireRooExperiment];

export function findExperiment(id: string | null): LabExperiment {
  return EXPERIMENTS.find(e => e.id === id) ?? EXPERIMENTS[0];
}
