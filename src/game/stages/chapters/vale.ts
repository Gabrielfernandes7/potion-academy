// Capítulo 1, o Vale: do Caldeirão à charneca. Três fases (a terceira tem névoa); falta o chefe do capítulo.
// Para uma fase nova: acrescente um objeto em `stages` (a numeração segue a ordem dos capítulos em index.ts).
import { CHEST_COMMON, CHEST_RICH } from '../chests';
import type { ChapterSpec } from '../types';

export const VALE: ChapterSpec = {
  id: 'vale',
  name: 'O VALE',
  place: 'Vale das Fórmulas',
  grouped: true,
  stages: [
    {
      kind: 'lab', name: 'O CHAMADO', place: 'Laboratório do Caldeirão',
      story: 'Uma carta, um frasco vazio e um monge que pede ajuda. Roo sai do laboratório.',
      chest: CHEST_COMMON, time: 90000, blockChance: 0.7, door: true, theme: 'stone', track: 'alambique',
      enemies: [{ kind: 'frog', start: 2, max: 5, every: 8 }],
    },
    {
      kind: 'crypt', name: 'O CAMINHO', place: 'Salão dos Ecos',
      story: 'Vozes do mestre desaparecido ainda ecoam entre as colunas.',
      chest: CHEST_RICH, tip: 'Poção Aqua apaga poções de Fogo. Fantasmas atravessam paredes.',
      time: 100000, blockChance: 0.6, door: true, theme: 'crypt', track: 'ecos',
      enemies: [{ kind: 'ghost', start: 2, max: 4, every: 10 }, { kind: 'frog', start: 1, max: 1 }],
    },
    {
      kind: 'crypt', name: 'A NÉVOA', place: 'Charneca do Vale',
      story: 'Uma névoa baixa cobre a charneca. Só se vê o que está por perto.',
      chest: CHEST_RICH, tip: 'Na névoa só se vê o que está perto. Os fantasmas chegam sem aviso: ande devagar.',
      time: 110000, blockChance: 0.55, door: true, theme: 'stone', track: 'ecos', fog: { radius: 3 },
      enemies: [{ kind: 'ghost', start: 2, max: 3, every: 9 }, { kind: 'frog', start: 1, max: 2, every: 12 }],
    },
  ],
};
