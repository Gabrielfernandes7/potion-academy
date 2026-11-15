// O que a Roo aprende no decorrer da jornada (puro). Nada se compra: as poções vêm ao concluir uma fase e as
// transformações vêm como lição, na fase seguinte, depois de a Roo ter usado a poção. O fogo é o primeiro
// elemento e a primeira lição do mestre: desde o começo.
import { BOMB_TYPES, type BombId, type ElementId } from '../config';
import type { FormId } from './forms/types';

// Fase concluída -> poção aprendida. Os números são os da numeração atual (stages/index.ts).
export const LEARNED_AFTER_STAGE: Readonly<Record<number, BombId>> = {
  1: 'mega', // O Chamado: a água do laboratório (Poção de Água)
  3: 'pierce', // A Névoa: o sal que prende (Poção de Terra)
  4: 'remote', // O Poço: o sopro que a Quimera deixa (Poção de Ar)
};

export function learnedAfter(stage: number): BombId | undefined {
  return LEARNED_AFTER_STAGE[stage];
}

export type LessonForm = Exclude<FormId, 'fire'>;

// A lição de cada forma: em que fase vem e o que a dispara.
//   'hits'  : no meio da fase, depois de `hits` golpes da poção do elemento em inimigos (se a Roo vencer a fase
//             sem chegar lá, aprende mesmo assim: a lição nunca se perde);
//   'start' : ao começar a fase (a Terra vem antes do chefe que ela prende, a Quimera).
export interface FormLesson {
  stage: number;
  trigger: 'hits' | 'start';
  hits: number;
  potion: BombId; // a poção do elemento da forma (já aprendida antes da fase da lição)
}

export const FORM_LESSONS: Readonly<Record<LessonForm, FormLesson>> = {
  water: { stage: 2, trigger: 'hits', hits: 3, potion: 'mega' }, // Salão dos Ecos, depois da Poção de Água
  earth: { stage: 4, trigger: 'start', hits: 0, potion: 'pierce' }, // O Poço: antes da Quimera
  air: { stage: 5, trigger: 'hits', hits: 3, potion: 'remote' }, // Escadaria da Torre, depois da Poção de Ar
};

export const LESSON_FORMS = Object.keys(FORM_LESSONS) as LessonForm[];

/** As formas que se aprendem ao começar a fase. */
export function lessonsAtStart(stage: number): LessonForm[] {
  return LESSON_FORMS.filter(f => FORM_LESSONS[f].stage === stage && FORM_LESSONS[f].trigger === 'start');
}

/** As formas que um golpe do elemento ensina nesta fase (as que se aprendem por golpes e usam esse elemento). */
export function lessonsForHit(stage: number, element: ElementId): LessonForm[] {
  return LESSON_FORMS.filter(f => {
    const l = FORM_LESSONS[f];
    return l.stage === stage && l.trigger === 'hits' && BOMB_TYPES[l.potion].element === element;
  });
}

/** A lição já tem golpes suficientes? */
export function lessonReached(form: LessonForm, hitCount: number): boolean {
  return hitCount >= FORM_LESSONS[form].hits;
}

/** A forma está liberada? O fogo, sempre; as outras, depois da lição (`knows`); na Arena, tudo. */
export function formLearned(form: FormId, knows: (f: FormId) => boolean, arena: boolean): boolean {
  if (arena || form === 'fire') return true;
  return knows(form);
}
