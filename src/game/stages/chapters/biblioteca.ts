// Capítulo A Biblioteca Proibida: o scriptorium do mosteiro, onde as escrituras estão presas por correntes.
// Quatro fases (3 de estantes e salas, e o Leão Verde no fim). Entre a Torre e o Retorno.
import { CHEST_RICH } from '../chests';
import type { ChapterSpec } from '../types';

export const BIBLIOTECA: ChapterSpec = {
  id: 'biblioteca',
  name: 'A BIBLIOTECA PROIBIDA',
  place: 'Scriptorium acorrentado',
  grouped: true,
  stages: [
    {
      kind: 'crypt', name: 'AS ESTANTES', place: 'Estantes da Biblioteca',
      story: 'Estantes de carvalho sobem até o teto. Os livros estão presos por correntes finas, mas alguém deixou as lâmpadas acesas: aqui ainda se lê.',
      chest: CHEST_RICH, time: 100000, blockChance: 0.5, door: true, theme: 'stone', block: 'books', track: 'chapter-biblioteca',
      enemies: [{ kind: 'frog', start: 1, max: 2, every: 10, chase: true }, { kind: 'lantern', start: 1, max: 2, every: 12 }],
    },
    {
      kind: 'crypt', name: 'O SCRIPTORIUM', place: 'Mesas dos copistas',
      story: 'Mesas de copistas, tinteiros cheios e páginas secando ao ar. Os monges copiavam aqui à luz de velas, e a cera ainda perfuma a sala.',
      chest: CHEST_RICH, time: 100000, blockChance: 0.5, door: true, theme: 'stone', block: 'scroll', track: 'chapter-biblioteca',
      objective: { type: 'hunt', kind: 'ghost' }, tip: 'Os espíritos do alambique temem a água e atravessam paredes. Derrote os dois.',
      enemies: [{ kind: 'frog', start: 1, max: 2, every: 9, chase: true }, { kind: 'ghost', start: 2, max: 2 }, { kind: 'owl', start: 1, max: 1 }],
    },
    {
      kind: 'crypt', name: 'O COFRE', place: 'Cofre das Escrituras',
      story: 'Aqui estão as escrituras que Belladona levou, presas a correntes com o selo do mestre. Frei Anselmo quer vê-las nas mãos dos pobres, e não nos cofres. Cada caixote quebrado solta um elo.',
      chest: CHEST_RICH, time: 110000, blockChance: 0.5, door: true, theme: 'crypt', block: 'books', track: 'chapter-biblioteca',
      enemies: [{ kind: 'ghost', start: 2, max: 3, every: 9 }, { kind: 'flower', start: 3, max: 3 }],
    },
    {
      kind: 'boss', boss: 'lion', name: 'O LEÃO VERDE', place: 'Salão dos Acorrentados',
      story: 'O Leão Verde dorme sobre as correntes. Ele dissolve o ouro, por isso guarda o que o ouro não compra. O ácido corre pelas linhas e pelas colunas.',
      chest: CHEST_RICH, tip: 'Leão Verde: o ar o fere muito; a terra não o toca. O ácido dissolve as suas poções.',
      time: 120000, blockChance: 0.4, door: false, theme: 'crypt', block: 'books', track: 'boss-lion',
      enemies: [],
    },
  ],
};
