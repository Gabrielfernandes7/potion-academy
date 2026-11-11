import { describe, expect, it } from 'vitest';
import { STAGES, LAST_STAGE } from '../src/config';
import { TRACKS } from '../src/audio/tracks';
import { PASSAGE_CARDS, BELLADONA_CARDS, ENDING_CARDS } from '../src/game/story';

describe('trilha por fase', () => {
  it('cada fase tem uma faixa própria (nenhuma repetida entre as quatro)', () => {
    const tracks = STAGES.map(s => s.track);
    expect(new Set(tracks).size).toBe(tracks.length);
  });

  it('o duelo é a faixa mais rápida e mais densa das fases', () => {
    const phases = STAGES.map(s => TRACKS.find(t => t.id === s.track)!);
    const duel = phases.find(t => t.id === 'duelo')!;
    for (const t of phases) {
      expect(duel.bpm).toBeGreaterThanOrEqual(t.bpm);
      expect(duel.density).toBeGreaterThanOrEqual(t.density);
    }
  });
});

describe('passagens entre fases', () => {
  it('há passagem depois de cada fase que tem porta, exceto a última', () => {
    for (let s = 1; s < LAST_STAGE; s++) {
      if (s === 3) continue; // o chefe tem a própria despedida (BELLADONA_CARDS)
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

  it('o final e a despedida da Belladona continuam com cartões', () => {
    expect(ENDING_CARDS.length).toBeGreaterThan(0);
    expect(BELLADONA_CARDS.length).toBeGreaterThan(0);
  });
});
