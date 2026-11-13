import { describe, expect, it } from 'vitest';
import { CHAPTERS, CHAPTER_LIST, LAST_STAGE, STAGES } from '../src/game/stages/index';
import { SEALED_MESSAGE, UPCOMING_CHAPTERS, isUpcoming } from '../src/game/stages/upcoming';

describe('capítulos selados no mapa', () => {
  it('são dois: a biblioteca proibida e o observatório', () => {
    expect(UPCOMING_CHAPTERS.map(c => c.id)).toEqual(['biblioteca', 'observatorio']);
    expect(UPCOMING_CHAPTERS.map(c => c.icon)).toEqual(['library', 'observatory']);
  });
  it('não dão acesso a nada: sem fases, fora de CHAPTER_LIST e de CHAPTERS, e não mudam o fim do jogo', () => {
    const real = new Set(CHAPTER_LIST.map(c => c.id));
    for (const c of UPCOMING_CHAPTERS) {
      expect(real.has(c.id), c.id).toBe(false);
      expect(CHAPTERS.some(x => x.id === c.id)).toBe(false);
      expect(isUpcoming(c.id)).toBe(true);
    }
    expect(STAGES.map(s => s.chapter ?? '').join('|')).not.toMatch(/BIBLIOTECA|OBSERVAT/);
    expect(LAST_STAGE).toBe(STAGES.length);
    expect(isUpcoming('vale')).toBe(false);
  });
  it('têm nome, lugar, dica e o aviso de selado', () => {
    for (const c of UPCOMING_CHAPTERS) {
      expect(c.name.trim()).not.toBe('');
      expect(c.place.trim()).not.toBe('');
      expect(c.hint.length).toBeGreaterThan(20);
    }
    expect(SEALED_MESSAGE).toContain('Selado');
  });
});
