// Capítulo da Torre: três fases com fantasmas e, na quarta, o chefe Belladona (kind 'boss').
import { CHEST_RICH } from '../chests';
import type { ChapterSpec } from '../types';

export const TORRE: ChapterSpec = {
  id: 'torre',
  name: 'A TORRE / DUELO',
  place: 'Torre de Belladona',
  grouped: true,
  stages: [
    {
      kind: 'crypt', name: 'A ESCADARIA', place: 'Escadaria da Torre',
      story: 'Degraus de pedra subindo na escuridão. Os fantasmas daqui não têm cheiro, só frio.',
      chest: CHEST_RICH, tip: 'O fantasma só resiste à Poção Telúrica.',
      time: 100000, blockChance: 0.6, door: true, theme: 'crypt', block: 'slab', track: 'ecos',
      enemies: [{ kind: 'ghost', start: 2, max: 3, every: 8 }],
    },
    {
      kind: 'crypt', name: 'O CORREDOR', place: 'Corredor dos Selos',
      story: 'Portas com selos de cera. Atrás de uma delas, uma voz conhecida.',
      chest: CHEST_RICH, time: 100000, blockChance: 0.55, door: true, theme: 'crypt', block: 'wax', track: 'ecos',
      enemies: [{ kind: 'ghost', start: 2, max: 3, every: 8 }],
    },
    {
      kind: 'crypt', name: 'A ANTECÂMARA', place: 'Antecâmara da Torre',
      story: 'Frascos cheios de um pó que brilha e cheira a farinha. A próxima sala é a de Belladona.',
      chest: CHEST_RICH, time: 100000, blockChance: 0.5, door: true, theme: 'crypt', block: 'flasks', track: 'ecos',
      enemies: [{ kind: 'ghost', start: 2, max: 3, every: 8 }],
    },
    {
      kind: 'boss', boss: 'belladonna', name: 'O DUELO', place: 'Torre de Belladona',
      story: 'Belladona tem razão sobre a fome e errou no remédio. Vença-a, sem odiá-la.',
      chest: CHEST_RICH, time: 120000, blockChance: 0.35, door: false, theme: 'stone', block: 'scroll', track: 'duelo',
      enemies: [],
    },
  ],
};
