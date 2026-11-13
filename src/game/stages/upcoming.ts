// Capítulos que já aparecem no mapa do vale, mas ainda estão selados: não têm fases, não entram em
// STAGES nem em CHAPTER_LIST, e tocá-los só mostra o aviso de selado. Quando um deles for criado de
// verdade, vire um `ChapterSpec` em chapters/<nome>.ts, acrescente em CHAPTER_LIST e tire-o daqui.
export interface UpcomingChapter {
  id: string;
  name: string;
  place: string; // nome do lugar (o mapa mostra-o em escrita ilegível enquanto estiver selado)
  icon: 'library' | 'observatory'; // ícone desenhado em MapScene
  hint: string; // do que trata
}

export const UPCOMING_CHAPTERS: readonly UpcomingChapter[] = [
  {
    id: 'biblioteca', name: 'A BIBLIOTECA PROIBIDA', place: 'Scriptorium acorrentado', icon: 'library',
    hint: 'Livros acorrentados e manuscritos que ninguém deveria ler.',
  },
  {
    id: 'observatorio', name: 'O OBSERVATÓRIO', place: 'Torre dos Astrolábios', icon: 'observatory',
    hint: 'Astrolábios, mapas celestes e cartas de estrelas, desenhados como manuscritos antigos.',
  },
];

export const SEALED_MESSAGE = 'Selado. Este capítulo ainda não pode ser visitado.';

/** Capítulo selado: nenhum dos de aqui pode ser aberto por enquanto. */
export function isUpcoming(id: string): boolean {
  return UPCOMING_CHAPTERS.some(c => c.id === id);
}
