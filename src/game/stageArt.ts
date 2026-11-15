// Qual gravura animada do Livro de Roo abre cada fase (puro, testado). Antes de cada fase, o cartão de entrada mostra a
// gravura do lugar: a mesma arte do livro (src/pages/livroScenes.ts) ou uma das cenas de lugar (src/pages/placas.ts).
// `variante` escolhe, dentro de uma cena, qual parte do lugar (a Biblioteca tem quatro: estantes, scriptorium, cofre e o
// Leão Verde). A Arena e o duelo têm a sua.
import type { CenaId } from './livro';

export type PlacaId = CenaId | 'poco' | 'torre' | 'biblioteca' | 'observatorio';

export interface PlacaDeFase { placa: PlacaId; variante: number }

/** A gravura de cada fase da campanha (1 a 20), na ordem de STAGES. */
export const PLACAS_DAS_FASES: readonly PlacaDeFase[] = [
  { placa: 'laboratorio', variante: 0 }, // 1 O Chamado
  { placa: 'bolha', variante: 0 }, //       2 O Caminho: as páginas do mestre e a bolha
  { placa: 'fome', variante: 0 }, //        3 A Névoa: a charneca onde o trigo apodreceu
  { placa: 'poco', variante: 0 }, //        4 O Poço: a prata do mestre
  { placa: 'torre', variante: 0 }, //       5 A Escadaria
  { placa: 'torre', variante: 1 }, //       6 O Corredor dos selos
  { placa: 'belladona', variante: 0 }, //   7 A Antecâmara: Belladona e a massa
  { placa: 'duelo', variante: 0 }, //       8 O Duelo
  { placa: 'biblioteca', variante: 0 }, //  9 As Estantes
  { placa: 'biblioteca', variante: 1 }, // 10 O Scriptorium
  { placa: 'biblioteca', variante: 2 }, // 11 O Cofre
  { placa: 'biblioteca', variante: 3 }, // 12 O Leão Verde
  { placa: 'observatorio', variante: 0 }, // 13 O Pátio
  { placa: 'observatorio', variante: 1 }, // 14 O Salão dos Relógios
  { placa: 'observatorio', variante: 2 }, // 15 A Galeria das Cartas
  { placa: 'ciclo', variante: 0 }, //       16 A Cúpula: o Ouroboros
  { placa: 'jornada', variante: 0 }, //     17 A Estrada: o caminho de volta
  { placa: 'paes', variante: 0 }, //        18 A Ponte: as famílias à espera
  { placa: 'mosteiro', variante: 0 }, //    19 Os Muros
  { placa: 'retorno', variante: 0 }, //     20 O Jardim: o portão
];

/** A gravura de uma fase (1 a 20). Fora do intervalo (a Arena, o duelo), a do duelo. */
export function placaDaFase(stage: number): PlacaDeFase {
  return PLACAS_DAS_FASES[stage - 1] ?? { placa: 'duelo', variante: 0 };
}
