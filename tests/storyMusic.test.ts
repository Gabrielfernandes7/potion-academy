import { describe, expect, it } from 'vitest';
import { TRACKS } from '../src/audio/tracks';
import { PASSAGE_CARDS, BELLADONA_CARDS, CHIMERA_CARDS, ENDING_CARDS } from '../src/game/story';
import { STAGES, LAST_STAGE } from '../src/game/stages/index';

describe('trilha por fase', () => {
  it('Chamado, Caminho, Duelo e Estrada têm faixas próprias; a Névoa e as três da Torre dividem a do salão; o Poço usa a do duelo', () => {
    const tracks = [0, 1, 7, 8].map(i => STAGES[i].track);
    for (const i of [2, 4, 5, 6]) expect(STAGES[i].track).toBe(STAGES[1].track);
    expect(STAGES[3].track).toBe(STAGES[7].track);
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
      if (s === 4 || s === 8) continue; // os chefes têm a própria despedida (CHIMERA_CARDS, BELLADONA_CARDS)
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
