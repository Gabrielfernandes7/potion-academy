import { describe, expect, it } from 'vitest';
import { BOMB_ORDER } from '../src/config';
import { BOMB_TYPES } from '../src/config';
import { FORMS } from '../src/game/forms';
import { FORM_LESSONS, LEARNED_AFTER_STAGE, LESSON_FORMS, formLearned, learnedAfter, lessonReached, lessonsAtStart, lessonsForHit } from '../src/game/learning';
import { STAGES } from '../src/game/stages/index';

describe('poções aprendidas na jornada', () => {
  it('o fogo é o primeiro elemento: a inicial não precisa ser aprendida', () => {
    expect(BOMB_ORDER[0]).toBe('normal');
    expect(Object.values(LEARNED_AFTER_STAGE)).not.toContain('normal');
  });

  it('cada poção de elemento é aprendida uma única vez, numa fase que existe', () => {
    const learned = Object.values(LEARNED_AFTER_STAGE);
    expect(new Set(learned).size).toBe(learned.length);
    expect(new Set(learned)).toEqual(new Set(['mega', 'pierce', 'remote']));
    for (const s of Object.keys(LEARNED_AFTER_STAGE)) expect(STAGES.length).toBeGreaterThanOrEqual(Number(s));
  });

  it('a água vem antes do fogo da Torre, a terra antes do Poço e o ar depois do Poço', () => {
    expect(learnedAfter(1)).toBe('mega');
    expect(learnedAfter(3)).toBe('pierce');
    expect(learnedAfter(4)).toBe('remote');
    expect(learnedAfter(2)).toBeUndefined();
  });
});

describe('transformações: lições na jornada', () => {
  const none = (): boolean => false;
  const only = (...ids: string[]) => (f: string): boolean => ids.includes(f);

  it('o fogo está liberado desde o começo; na Arena, tudo', () => {
    expect(formLearned('fire', none, false)).toBe(true);
    for (const f of ['water', 'earth', 'air'] as const) {
      expect(formLearned(f, none, false)).toBe(false);
      expect(formLearned(f, none, true)).toBe(true);
    }
  });

  it('as outras formas só valem depois da lição', () => {
    expect(formLearned('water', only('water') as never, false)).toBe(true);
    expect(formLearned('earth', only('water') as never, false)).toBe(false);
  });

  it('cada forma vem na fase seguinte à da poção (ou antes do chefe), nunca junto com a poção', () => {
    for (const f of LESSON_FORMS) {
      const lesson = FORM_LESSONS[f];
      const potionStage = Number(Object.entries(LEARNED_AFTER_STAGE).find(([, p]) => p === lesson.potion)![0]);
      expect(lesson.stage, f).toBeGreaterThan(potionStage);
      expect(lesson.stage, f).toBeLessThanOrEqual(STAGES.length);
      expect(BOMB_TYPES[lesson.potion].element).toBe(FORMS[f].element);
    }
  });

  it('água no meio da fase 2, terra ao entrar na fase 4 (antes da Quimera) e ar no meio da fase 5', () => {
    expect(FORM_LESSONS.water).toMatchObject({ stage: 2, trigger: 'hits' });
    expect(FORM_LESSONS.earth).toMatchObject({ stage: 4, trigger: 'start' });
    expect(FORM_LESSONS.air).toMatchObject({ stage: 5, trigger: 'hits' });
    expect(STAGES[3].boss).toBe('chimera');
    expect(STAGES[1].boss).toBeUndefined();
    expect(STAGES[4].boss).toBeUndefined();
  });

  it('só as lições "ao começar" vêm de graça, na fase certa', () => {
    expect(lessonsAtStart(4)).toEqual(['earth']);
    expect(lessonsAtStart(2)).toEqual([]);
    expect(lessonsAtStart(5)).toEqual([]);
  });

  it('um golpe do elemento ensina a forma da fase, e só depois de golpes suficientes', () => {
    expect(lessonsForHit(2, 'water')).toEqual(['water']);
    expect(lessonsForHit(2, 'fire')).toEqual([]);
    expect(lessonsForHit(3, 'water')).toEqual([]);
    expect(lessonsForHit(5, 'air')).toEqual(['air']);
    expect(lessonReached('water', 2)).toBe(false);
    expect(lessonReached('water', 3)).toBe(true);
  });
});
