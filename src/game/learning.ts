// Poções que a Roo aprende no decorrer da jornada (puro). Não se compram: ao concluir a fase indicada,
// a poção passa a ser da Roo. O fogo é o primeiro elemento, desde o começo.
import type { BombId } from '../config';

// Fase concluída -> poção aprendida. Os números são os da numeração atual (stages/index.ts).
export const LEARNED_AFTER_STAGE: Readonly<Record<number, BombId>> = {
  1: 'mega', // O Chamado: a água do laboratório (Poção de Água)
  3: 'pierce', // A Névoa: o sal que prende (Poção de Terra)
  4: 'remote', // O Poço: o sopro que a Quimera deixa (Poção de Ar)
};

export function learnedAfter(stage: number): BombId | undefined {
  return LEARNED_AFTER_STAGE[stage];
}
