// Fases e capítulos do jogo. A ordem dos capítulos em CHAPTER_LIST define a numeração das fases
// (1, 2, 3...) e, para os capítulos agrupados, o intervalo `first..last` usado pelo mapa.
// Para um capítulo novo: crie chapters/<nome>.ts e acrescente-o em CHAPTER_LIST.
import { VALE } from './chapters/vale';
import { RETORNO } from './chapters/retorno';
import { TORRE } from './chapters/torre';
import type { ChapterDef, ChapterSpec, StageDef } from './types';

export type { ChapterDef, ChapterSpec, StageDef, StageKind, StageTheme, StageSpec, BossId, ChestOdd, EnemyRule } from './types';

export const CHAPTER_LIST: readonly ChapterSpec[] = [VALE, TORRE, RETORNO];

// Capítulo e posição de cada fase de um capítulo agrupado: "1/4", "2/4"... e "chefe" na fase de chefe.
export function buildStages(chapters: readonly ChapterSpec[]): StageDef[] {
  return chapters.flatMap(c => c.stages.map((s, i) => (
    c.grouped
      ? { ...s, chapter: c.name, part: s.kind === 'boss' ? 'chefe' : `${i + 1}/${c.stages.length}` }
      : { ...s }
  )));
}

// Os capítulos agrupados com o intervalo de fases (a partir de 1).
export function buildChapters(chapters: readonly ChapterSpec[]): ChapterDef[] {
  const out: ChapterDef[] = [];
  let n = 0;
  for (const c of chapters) {
    const first = n + 1;
    n += c.stages.length;
    if (c.grouped) out.push({ id: c.id, name: c.name, place: c.place, first, last: n });
  }
  return out;
}

export const STAGES: StageDef[] = buildStages(CHAPTER_LIST);
export const CHAPTERS: readonly ChapterDef[] = buildChapters(CHAPTER_LIST);
export const LAST_STAGE = STAGES.length;

// Fase de 1 a LAST_STAGE (valores fora do intervalo são ajustados).
export function stageDef(stage: number): StageDef {
  return STAGES[Math.min(LAST_STAGE, Math.max(1, Math.floor(stage))) - 1];
}
