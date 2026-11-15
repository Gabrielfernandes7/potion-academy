// Capítulo O Observatório: a torre dos astrolábios, entre a Biblioteca e o Retorno. Quatro fases (o pátio, o salão
// dos relógios, a galeria das cartas e a cúpula). Os inimigos são os novos: lanterna viva (fogo), relógio de cobre
// e toupeira de sal (terra) e coruja do scriptorium (ar). Sem chefe: o desfecho é a cúpula, onde a Roo lê o céu.
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
      enemies: [{ kind: 'lantern', start: 2, max: 3, every: 9 }, { kind: 'frog', start: 1, max: 1 }],
    },
    {
      kind: 'crypt', name: 'O SALÃO DOS RELÓGIOS', place: 'Salão dos Relógios',
      story: 'Relógios de cobre contam horas diferentes na mesma parede. Os autômatos de ronda param por um instante a cada volta, como quem confere o tempo.',
      chest: CHEST_RICH, tip: 'O relógio de cobre trava por 2 s a cada volta. A água o enferruja; a terra não o toca.',
      time: 100000, blockChance: 0.5, door: true, theme: 'observatory', block: 'flasks', track: 'alambique',
      enemies: [{ kind: 'clock', start: 2, max: 3, every: 10 }, { kind: 'lantern', start: 1, max: 2, every: 12 }],
    },
    {
      kind: 'crypt', name: 'A GALERIA DAS CARTAS', place: 'Galeria das Cartas Celestes',
      story: 'Mapas de estrelas cobrem as paredes até o teto. Entre as vigas, uma coruja observa; no chão, a terra se mexe em montes pequenos.',
      chest: CHEST_RICH, tip: 'A coruja marca a sua casa com um círculo: saia dele. A toupeira deixa um monte onde vai brotar.',
      time: 110000, blockChance: 0.5, door: true, theme: 'observatory', block: 'scroll', track: 'ecos',
      enemies: [{ kind: 'owl', start: 2, max: 2 }, { kind: 'mole', start: 2, max: 3, every: 10 }],
    },
    {
      kind: 'crypt', name: 'A CÚPULA', place: 'Cúpula do Observatório',
      story: 'A fenda da cúpula se abre para o céu inteiro. Tudo o que vigiou a torre está aqui: bronze, chama, penas e terra. Ao fim, a porta dá para o caminho de volta.',
      chest: CHEST_RICH, tip: 'Aqui há de tudo. Leia os avisos no chão e use a poção que a criatura teme.',
      time: 120000, blockChance: 0.45, door: true, theme: 'observatory', block: 'brick', track: 'alambique',
      enemies: [
        { kind: 'lantern', start: 1, max: 2, every: 12 }, { kind: 'clock', start: 1, max: 2, every: 14 },
        { kind: 'mole', start: 1, max: 2, every: 12 }, { kind: 'owl', start: 1, max: 2 },
      ],
    },
  ],
};
