// Capítulo O Retorno: três fases de estrada até o mosteiro e o jardim (4/4), com o chefe Mandrágora.
import { CHEST_RICH } from '../chests';
import type { ChapterSpec } from '../types';

export const RETORNO: ChapterSpec = {
  id: 'retorno',
  name: 'O RETORNO',
  place: 'Mosteiro de São Tomás',
  grouped: true,
  stages: [
    {
      kind: 'crypt', name: 'A ESTRADA', place: 'Estrada do Vale',
      story: 'A estrada desce do vale. Roo leva o frasco vazio e pensa em Anselmo.',
      chest: CHEST_RICH, time: 100000, blockChance: 0.5, door: true, theme: 'garden', track: 'jardim',
      enemies: [{ kind: 'frog', start: 2, max: 3, every: 10 }],
    },
    {
      kind: 'crypt', name: 'A PONTE', place: 'Ponte do Riacho',
      story: 'Uma ponte de pedra sobre o riacho. As flores crescem nas margens.',
      chest: CHEST_RICH, time: 100000, blockChance: 0.5, door: true, theme: 'garden', track: 'jardim',
      enemies: [{ kind: 'frog', start: 1, max: 2, every: 10 }, { kind: 'flower', start: 3, max: 4 }],
    },
    {
      kind: 'crypt', name: 'OS MUROS', place: 'Muralha do Mosteiro',
      story: 'Os muros do mosteiro se aproximam. O portão está à vista.',
      chest: CHEST_RICH, time: 100000, blockChance: 0.5, door: true, theme: 'garden', track: 'jardim',
      enemies: [{ kind: 'frog', start: 1, max: 2, every: 10 }, { kind: 'flower', start: 4, max: 5 }],
    },
    {
      kind: 'garden', boss: 'mandrake', name: 'O JARDIM', place: 'Jardim do Mosteiro',
      story: 'A Mandrágora guarda o portão do mosteiro. Só o fogo a ameaça; a água a fortalece.',
      chest: CHEST_RICH, tip: 'Mandrágora: o fogo a fere, a água a cura e a terra a ignora.',
      time: 120000, blockChance: 0.4, door: true, theme: 'garden', track: 'jardim',
      // sem gemas: o portão abre quando ela cai. As flores só nascem por habilidade dela.
      enemies: [{ kind: 'flower', start: 0, max: 3 }],
    },
  ],
};
