// Capítulo O Observatório: a torre dos astrolábios, entre a Biblioteca e o Retorno. Quatro fases (o pátio, o salão
// dos relógios, a galeria das cartas e a cúpula). Os inimigos são os novos: lanterna viva (fogo), relógio de cobre
// e toupeira de sal (terra) e coruja do scriptorium (ar). Na cúpula, o chefe Ouroboros, a serpente do ciclo.
import { CHEST_RICH } from '../chests';
import type { ChapterSpec } from '../types';

export const OBSERVATORIO: ChapterSpec = {
  id: 'observatorio',
  name: 'O OBSERVATÓRIO',
  place: 'Torre dos Astrolábios',
  grouped: true,
  stages: [
    {
      kind: 'crypt', name: 'O PÁTIO', place: 'Pátio dos Astrolábios',
      story: 'Astrolábios de bronze repousam entre as lajes, apontando para estrelas que já mudaram de lugar. Lanternas acesas andam de um lado a outro, como se ainda vigiassem o céu.',
      chest: CHEST_RICH, tip: 'A lanterna viva anda em linha reta e volta ao bater. A água a apaga; o fogo não a fere.',
      time: 100000, blockChance: 0.5, door: true, theme: 'observatory', block: 'slab', track: 'ecos',
      objective: { type: 'hunt', kind: 'lantern' },
      enemies: [{ kind: 'lantern', start: 3, max: 3 }, { kind: 'frog', start: 1, max: 1, chase: true }],
    },
    {
      kind: 'crypt', name: 'O SALÃO DOS RELÓGIOS', place: 'Salão dos Relógios',
      story: 'Relógios de cobre contam horas diferentes na mesma parede. Os autômatos de ronda param por um instante a cada volta, como quem confere o tempo. O tempo de uma viúva com fome, porém, não espera a roda.',
      chest: CHEST_RICH, tip: 'O relógio de cobre trava por 2 s a cada volta. A água o enferruja; a terra não o toca. Mantenha-se vivo e em movimento.',
      time: 90000, blockChance: 0.3, door: true, theme: 'observatory', block: 'flasks', track: 'alambique',
      objective: { type: 'survive', ms: 60000, waveMs: 12000, waves: ['clock', 'lantern'] },
      enemies: [{ kind: 'clock', start: 2, max: 4 }, { kind: 'lantern', start: 1, max: 3 }],
    },
    {
      kind: 'crypt', name: 'A GALERIA DAS CARTAS', place: 'Galeria das Cartas Celestes',
      story: 'Mapas de estrelas cobrem as paredes até o teto. Entre as vigas, uma coruja observa; no chão, a terra se mexe em montes pequenos.',
      chest: CHEST_RICH, tip: 'A coruja marca a sua casa com um círculo: saia dele. A toupeira deixa um monte onde vai brotar.',
      time: 110000, blockChance: 0.5, door: true, theme: 'observatory', block: 'scroll', track: 'ecos',
      enemies: [{ kind: 'owl', start: 2, max: 2 }, { kind: 'mole', start: 2, max: 3, every: 10 }],
    },
    {
      kind: 'boss', boss: 'ouroboros', name: 'A CÚPULA', place: 'Cúpula do Observatório',
      story: 'A fenda da cúpula se abre para o céu inteiro. No centro, uma serpente de escamas verdes morde a própria cauda e gira devagar, como o céu em volta dela.',
      chest: CHEST_RICH, tip: 'Ouroboros: a fraqueza gira a cada ciclo. O brilho em volta dele mostra o elemento que o fere agora; o oposto ele devora.',
      time: 120000, blockChance: 0.4, door: false, theme: 'observatory', block: 'brick', track: 'duelo',
      enemies: [],
    },
  ],
};
