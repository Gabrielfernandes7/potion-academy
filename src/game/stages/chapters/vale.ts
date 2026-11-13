// Capítulo 1, o Vale: do Caldeirão à charneca. Três fases (a terceira tem névoa) e, na quarta, o chefe Quimera.
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
      story: 'O laboratório do mestre agora é de Belladona, e as gemas que fixam as transformações estão trancadas nos caixotes. Lá fora, o vale passa fome.',
      chest: CHEST_COMMON, time: 90000, blockChance: 0.7, door: true, theme: 'stone', block: 'wood', track: 'alambique',
      enemies: [{ kind: 'frog', start: 2, max: 5, every: 8 }],
    },
    {
      kind: 'crypt', name: 'O CAMINHO', place: 'Salão dos Ecos',
      story: 'Ecos de experimentos antigos. Entre as colunas, as páginas do mestre ainda falam.',
      chest: CHEST_RICH, tip: 'Poção Aqua apaga poções de Fogo. Fantasmas atravessam paredes.',
      time: 100000, blockChance: 0.6, door: true, theme: 'crypt', block: 'salt', track: 'ecos',
      enemies: [{ kind: 'ghost', start: 2, max: 4, every: 10 }, { kind: 'frog', start: 1, max: 1 }],
    },
    {
      kind: 'crypt', name: 'A NÉVOA', place: 'Charneca do Vale',
      story: 'Uma névoa baixa cobre a charneca, onde o trigo apodreceu em pé. Só se vê o que está por perto.',
      chest: CHEST_RICH, tip: 'Na névoa só se vê o que está perto. Os fantasmas chegam sem aviso: ande devagar.',
      time: 110000, blockChance: 0.55, door: true, theme: 'stone', block: 'moss', track: 'ecos', fog: { radius: 3 },
      enemies: [{ kind: 'ghost', start: 2, max: 3, every: 9 }, { kind: 'frog', start: 1, max: 2, every: 12 }],
    },
    {
      kind: 'boss', boss: 'chimera', name: 'O POÇO', place: 'Poço de Prata',
      story: 'No fim da charneca, uma poça de prata respira. Dizem que o mestre derramou ali o que não soube guardar.',
      chest: CHEST_RICH, tip: 'Quimera: a água escorre por ela; a Poção Telúrica a prende.',
      time: 120000, blockChance: 0.4, door: false, theme: 'stone', block: 'barrel', track: 'duelo',
      enemies: [],
    },
  ],
};
