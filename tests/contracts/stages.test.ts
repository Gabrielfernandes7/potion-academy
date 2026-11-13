// Contrato das fases e dos capítulos: cada fase só aponta para coisas que existem.
import { describe, expect, it } from 'vitest';
import { TRACKS } from '../../src/audio/tracks';
import { BOSS_DEFS } from '../../src/game/entities/bosses/defs';
import { ENEMY_TYPES } from '../../src/game/entities/enemies/defs';
import { BLOCK_TEXTURE, blockStyleOf } from '../../src/game/stages/blockStyles';
import { CHAPTER_LIST, STAGES } from '../../src/game/stages/index';
import { UPCOMING_CHAPTERS } from '../../src/game/stages/upcoming';
import { PASSAGE_CARDS } from '../../src/game/story';

describe('contrato das fases', () => {
  it.each(STAGES.map((s, i) => [i + 1, s] as const))('fase %i: só aponta para o que existe', (_n, s) => {
    expect(TRACKS.map(t => t.id), `a faixa ${s.track} não existe em audio/tracks.ts`).toContain(s.track);
    expect(BLOCK_TEXTURE[blockStyleOf(s)], 'o bloco da fase precisa existir em blockStyles.ts').toBeTruthy();
    for (const e of s.enemies) expect(ENEMY_TYPES[e.kind], `o inimigo ${e.kind} não existe em enemies/defs.ts`).toBeDefined();
    if (s.boss) expect(BOSS_DEFS[s.boss], `o chefe ${s.boss} não está em bosses/defs.ts`).toBeDefined();
    expect(s.story.trim().length).toBeGreaterThan(20);
    expect(s.place.trim()).not.toBe('');
    expect(s.chest.reduce((n, c) => n + c.chance, 0)).toBeCloseTo(1);
  });

  it('uma fase de chefe não tem porta nem inimigos comuns; as outras têm porta', () => {
    for (const s of STAGES) {
      if (s.kind === 'boss') { expect(s.door).toBe(false); expect(s.enemies).toHaveLength(0); }
      else expect(s.door || !!s.boss, s.name).toBe(true);
    }
  });

  it('as passagens só existem para fases que há (números de 1 até a última)', () => {
    for (const k of Object.keys(PASSAGE_CARDS)) expect(Number(k)).toBeGreaterThanOrEqual(1);
    for (const k of Object.keys(PASSAGE_CARDS)) expect(Number(k)).toBeLessThan(STAGES.length);
  });

  it('os ids de capítulo e de capítulo selado não se repetem', () => {
    const ids = [...CHAPTER_LIST.map(c => c.id), ...UPCOMING_CHAPTERS.map(c => c.id)];
    expect(new Set(ids).size).toBe(ids.length);
  });
});
