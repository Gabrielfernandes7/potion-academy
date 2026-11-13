import { describe, expect, it } from 'vitest';
import { CHAPTERS, CHAPTER_LIST, LAST_STAGE, STAGES, buildChapters, buildStages } from '../../src/game/stages';
import type { ChapterSpec, StageSpec } from '../../src/game/stages';

const stub = (name: string, kind: StageSpec['kind'] = 'crypt'): StageSpec => ({
  kind, name, place: 'p', story: 's', time: 1, blockChance: 0.5, door: kind !== 'boss',
  enemies: [], theme: 'stone', track: 'ecos', chest: [{ chance: 1, coins: 1 }],
});

describe('capítulos', () => {
  const specs: ChapterSpec[] = [
    { id: 'a', name: 'A', place: 'pa', grouped: false, stages: [stub('1'), stub('2')] },
    { id: 'b', name: 'B', place: 'pb', grouped: true, stages: [stub('3'), stub('4'), stub('5', 'boss')] },
  ];

  it('a numeração segue a ordem dos capítulos e o intervalo first..last é calculado', () => {
    expect(buildChapters(specs)).toEqual([{ id: 'b', name: 'B', place: 'pb', first: 3, last: 5 }]);
  });

  it('capítulo agrupado marca "i/N" e "chefe"; o solto não marca nada', () => {
    const st = buildStages(specs);
    expect(st.map(s => s.part)).toEqual([undefined, undefined, '1/3', '2/3', 'chefe']);
    expect(st[0].chapter).toBeUndefined();
    expect(st[2].chapter).toBe('B');
  });

  it('o jogo real: os capítulos agrupados cobrem fases consecutivas, sem sobrepor, e as fases batem', () => {
    expect(STAGES).toHaveLength(CHAPTER_LIST.reduce((n, c) => n + c.stages.length, 0));
    expect(LAST_STAGE).toBe(STAGES.length);
    for (const c of CHAPTERS) {
      expect(c.first).toBeLessThanOrEqual(c.last);
      for (let s = c.first; s <= c.last; s++) expect(STAGES[s - 1].chapter).toBe(c.name);
    }
    for (let i = 1; i < CHAPTERS.length; i++) expect(CHAPTERS[i].first).toBeGreaterThan(CHAPTERS[i - 1].last);
  });

  it('ids de capítulo são únicos e cada fase de chefe tem um chefe', () => {
    expect(new Set(CHAPTER_LIST.map(c => c.id)).size).toBe(CHAPTER_LIST.length);
    for (const s of STAGES) if (s.kind === 'boss') expect(s.boss).toBeDefined();
  });
});
