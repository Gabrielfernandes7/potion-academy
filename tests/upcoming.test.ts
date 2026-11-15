import { describe, expect, it } from 'vitest';
import { CHAPTERS, CHAPTER_LIST, LAST_STAGE, STAGES } from '../src/game/stages/index';
import { SEALED_MESSAGE, UPCOMING_CHAPTERS, isUpcoming } from '../src/game/stages/upcoming';

describe('capítulos selados no mapa', () => {
  it('nenhum no momento: a Biblioteca e o Observatório já são capítulos da campanha', () => {
    expect(UPCOMING_CHAPTERS).toHaveLength(0);
    const ids = CHAPTER_LIST.map(c => c.id);
    expect(ids).toContain('biblioteca');
    expect(ids).toContain('observatorio');
    expect(STAGES.map(s => s.chapter ?? '').join('|')).toMatch(/OBSERVAT/);
  });
  it('o Observatório fica entre a Biblioteca e o Retorno, com 4 fases consecutivas (13 a 16)', () => {
    const ids = CHAPTER_LIST.map(c => c.id);
    expect(ids.indexOf('observatorio')).toBe(ids.indexOf('biblioteca') + 1);
    expect(ids.indexOf('retorno')).toBe(ids.indexOf('observatorio') + 1);
    expect(CHAPTERS.find(c => c.id === 'observatorio')).toMatchObject({ first: 13, last: 16 });
    expect(LAST_STAGE).toBe(STAGES.length);
  });
  it('qualquer capítulo que voltar a ficar selado precisa de aviso e fora da campanha', () => {
    for (const c of UPCOMING_CHAPTERS) expect(isUpcoming(c.id)).toBe(true);
    expect(isUpcoming('vale')).toBe(false);
    expect(SEALED_MESSAGE).toContain('Selado');
  });
});
