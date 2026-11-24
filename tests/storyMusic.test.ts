import { describe, expect, it } from 'vitest';
import { bossTrackId, TRACKS, trackById } from '../src/audio/tracks';
import { PASSAGE_CARDS, BELLADONA_CARDS, CHIMERA_CARDS, ENDING_CARDS } from '../src/game/story';
import { STAGES, LAST_STAGE } from '../src/game/stages/index';

describe('trilha por fase', () => {
  it('cada capítulo mantém seu tema e cada chefe tem uma composição própria', () => {
    const chapters = [
      { range: [0, 3], theme: 'chapter-vale', boss: 'chimera' },
      { range: [4, 7], theme: 'chapter-torre', boss: 'belladonna' },
      { range: [8, 11], theme: 'chapter-biblioteca', boss: 'lion' },
      { range: [12, 15], theme: 'chapter-observatorio', boss: 'ouroboros' },
      { range: [16, 19], theme: 'chapter-retorno', boss: 'mandrake' },
    ] as const;

    for (const chapter of chapters) {
      const [first, last] = chapter.range;
      for (let i = first; i < last; i++) {
        const stage = STAGES[i];
        const expected = stage.boss ? bossTrackId(stage.boss) : chapter.theme;
        expect(stage.track).toBe(expected);
        expect(trackById(stage.track)).toBeDefined();
      }
      expect(STAGES[last].boss).toBe(chapter.boss);
      expect(STAGES[last].track).toBe(bossTrackId(chapter.boss));
    }
  });

  it('as cinco composições de chefe têm ids e arranjos distintos', () => {
    const ids = ['chimera', 'belladonna', 'lion', 'ouroboros', 'mandrake'].map(bossTrackId);
    expect(new Set(ids).size).toBe(5);
    const tracks = ids.map(id => trackById(id));
    expect(tracks.every(Boolean)).toBe(true);
    expect(new Set(tracks.map(t => t!.style)).size).toBeGreaterThanOrEqual(3);
  });

  it('a música de exploração tem contraste de andamento e densidade entre capítulos', () => {
    const ids = ['chapter-vale', 'chapter-torre', 'chapter-biblioteca', 'chapter-observatorio', 'chapter-retorno'];
    const tracks = ids.map(id => trackById(id)!);
    expect(new Set(tracks.map(t => t.bpm)).size).toBe(5);
    expect(Math.max(...tracks.map(t => t.bpm)) - Math.min(...tracks.map(t => t.bpm))).toBeGreaterThanOrEqual(25);
  });
});

describe('passagens entre fases', () => {
  it('há passagem depois de cada fase que tem porta, exceto a última', () => {
    for (let s = 1; s < LAST_STAGE; s++) {
      if (s === 4 || s === 8 || s === 12 || s === 16) continue;
      expect(PASSAGE_CARDS[s], `fase ${s}`).toBeDefined();
    }
  });

  it('cada cartão tem fala e texto, e a passagem não é vazia', () => {
    for (const cards of Object.values(PASSAGE_CARDS)) {
      expect(cards.length).toBeGreaterThan(0);
      for (const c of cards) {
        expect(c.speaker.trim()).not.toBe('');
        expect(c.text.trim().length).toBeGreaterThan(20);
      }
    }
  });

  it('o final e as despedidas da Belladona e da Quimera têm cartões', () => {
    expect(ENDING_CARDS.length).toBeGreaterThan(0);
    expect(BELLADONA_CARDS.length).toBeGreaterThan(0);
    expect(CHIMERA_CARDS.length).toBeGreaterThan(0);
  });
});
