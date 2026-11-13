// Diário da Roo: uma anotação liberada ao vencer cada fase (puro, testável).
// O progresso vem de `bombroo_stages_completed`; não há chave nova no localStorage.

export interface DiaryEntry {
  stage: number; // fase que libera a anotação (0 = sempre aberta)
  title: string;
  text: string;
}

export const DIARY: readonly DiaryEntry[] = [
  { stage: 0, title: 'Antes da viagem', text: 'Recebi uma carta de frei Anselmo e um frasco vazio, lacrado. Não sei o que ele espera que eu encontre. Levo as poções e a curiosidade.' },
  { stage: 1, title: 'O Chamado', text: 'Saí do laboratório com o caldeirão ainda quente. Aprendi a medir o fogo: um frasco por vez, e sempre longe de onde piso.' },
  { stage: 2, title: 'O Caminho', text: 'No salão, as vozes do mestre ainda ecoam entre as colunas. Ele não fugiu sozinho; alguém o chamou. Anselmo sabe mais do que contou.' },
  { stage: 3, title: 'A Névoa', text: 'Na charneca não se via um palmo adiante. Aprendi a andar devagar e a ouvir o que o frio dizia.' },
  { stage: 4, title: 'A Escadaria', text: 'A torre tem mais degraus do que parece. Os fantasmas não me tocam com as mãos, mas o frio fica na pele.' },
  { stage: 5, title: 'O Corredor', text: 'Cada porta tem um selo do mestre. Abri a que tinha a voz de Belladona, e ela não se assustou.' },
  { stage: 6, title: 'A Antecâmara', text: 'Os frascos brilham sem fogo. Não sei de onde vem esse pó, mas sei que ele não é de Anselmo.' },
  { stage: 7, title: 'O Duelo', text: 'Belladona queria fazer das escrituras um elixir. Não senti ódio quando ela caiu, só cansaço. Deixei-a ir.' },
  { stage: 8, title: 'A Estrada', text: 'Desço do vale com o frasco vazio. O caminho é o mesmo de ida, mas agora eu sei o que o mestre temia.' },
  { stage: 9, title: 'A Ponte', text: 'As flores de Belladona crescem até na beira do riacho. Não as toquei.' },
  { stage: 10, title: 'Os Muros', text: 'O portão do mosteiro está à vista. Anselmo espera do outro lado.' },
  { stage: 11, title: 'O Retorno', text: 'No portão, Anselmo confessou. O frasco vazio era para mim: o que importa não é o que cabe nele, mas o caminho até aqui.' },
];

// Anotações abertas para o conjunto de fases vencidas.
export function unlockedEntries(completed: readonly number[]): DiaryEntry[] {
  return DIARY.filter(e => e.stage === 0 || completed.includes(e.stage));
}
