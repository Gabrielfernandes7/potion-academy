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
      story: 'A estrada desce do vale, cheia de gente a caminho da sopa do mosteiro, as viúvas à frente, com os órfãos pela mão. Roo leva o frasco vazio e pensa em Anselmo.',
      chest: CHEST_RICH, time: 100000, blockChance: 0.5, door: true, theme: 'garden', block: 'hay', track: 'jardim',
      enemies: [{ kind: 'frog', start: 2, max: 3, every: 10 }],
    },
    {
      kind: 'crypt', name: 'A PONTE', place: 'Ponte do Riacho',
      story: 'Uma ponte de pedra sobre o riacho. Os celeiros da margem estão trancados, e à porta de um deles alguém espera.',
      chest: CHEST_RICH, time: 90000, blockChance: 0.3, door: true, theme: 'garden', block: 'cairn', track: 'jardim',
      objective: { type: 'survive', ms: 60000, waveMs: 15000, waves: ['frog'] },
      enemies: [{ kind: 'frog', start: 2, max: 4 }, { kind: 'flower', start: 3, max: 4 }, { kind: 'rat', start: 1, max: 1 }],
    },
    {
      kind: 'crypt', name: 'OS MUROS', place: 'Muralha do Mosteiro',
      story: 'Os muros do mosteiro se aproximam. O portão está à vista, e há famílias à porta, esperando a sopa. As viúvas e os órfãos entram primeiro: é a regra do frei, e ele diz que é de Jesus.',
      chest: CHEST_RICH, time: 100000, blockChance: 0.5, door: true, theme: 'garden', block: 'brick', track: 'jardim',
      enemies: [{ kind: 'frog', start: 1, max: 2, every: 10 }, { kind: 'flower', start: 4, max: 5 }, { kind: 'rat', start: 1, max: 2 }],
    },
    {
      kind: 'garden', boss: 'mandrake', name: 'O JARDIM', place: 'Jardim do Mosteiro',
      story: 'A Mandrágora guarda o portão do mosteiro. Os monges a cultivavam para o remédio; Belladona a plantou à porta. O fogo a ameaça muito; a terra e a água quase não a ferem.',
      chest: CHEST_RICH, tip: 'Mandrágora: o fogo a fere muito; a terra e a água quase nada.',
      time: 120000, blockChance: 0.4, door: true, theme: 'garden', block: 'garden', track: 'jardim',
      // sem gemas: o portão abre quando ela cai. As flores só nascem por habilidade dela.
      enemies: [{ kind: 'flower', start: 0, max: 3 }],
    },
  ],
};
