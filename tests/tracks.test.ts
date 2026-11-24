import { describe, expect, it } from 'vitest';
import {
  bossTrackId, SCENE_TRACKS, STEPS_PER_BAR, TRACKS, generateBar, midiToHz, mulberry32, trackById,
} from '../src/audio/tracks';
import { STAGES } from '../src/game/stages/index';

const pc = (m: number): number => ((m % 12) + 12) % 12;

describe('identidade musical', () => {
  it('mantém ids únicos e diferencia exploração de temas de chefes', () => {
    expect(TRACKS).toHaveLength(16);
    expect(new Set(TRACKS.map(t => t.id)).size).toBe(TRACKS.length);
    expect(TRACKS.some(t => t.bpm >= 100)).toBe(true);
    expect(TRACKS.some(t => t.style === 'sparse' && t.bpm < 80)).toBe(true);
    for (const t of TRACKS) {
      expect(t.bpm).toBeGreaterThanOrEqual(50);
      expect(t.bpm).toBeLessThanOrEqual(125);
    }
  });

  it('cada cena e cada chefe aponta para uma faixa existente', () => {
    for (const id of Object.values(SCENE_TRACKS)) expect(trackById(id), id).toBeDefined();
    for (const id of ['chimera', 'belladonna', 'lion', 'ouroboros', 'mandrake']) {
      expect(trackById(bossTrackId(id)), id).toBeDefined();
    }
  });

  it('cada fase usa o tema do seu chefe ou o tema de capítulo esperado', () => {
    const chapterTracks = [
      'chapter-vale', 'chapter-vale', 'chapter-vale', 'boss-chimera',
      'chapter-torre', 'chapter-torre', 'chapter-torre', 'boss-belladonna',
      'chapter-biblioteca', 'chapter-biblioteca', 'chapter-biblioteca', 'boss-lion',
      'chapter-observatorio', 'chapter-observatorio', 'chapter-observatorio', 'boss-ouroboros',
      'chapter-retorno', 'chapter-retorno', 'chapter-retorno', 'boss-mandrake',
    ];
    STAGES.forEach((stage, index) => {
      const expected = stage.boss ? bossTrackId(stage.boss) : chapterTracks[index];
      expect(stage.track).toBe(expected);
      expect(trackById(stage.track), `fase ${index + 1}: ${stage.track}`).toBeDefined();
    });
  });
});

describe('generateBar', () => {
  it('mesma semente gera a mesma música; sementes diferentes variam', () => {
    const track = TRACKS[0];
    const run = (seed: number) => {
      const rng = mulberry32(seed);
      const state = { idx: 3 };
      return Array.from({ length: 8 }, (_, b) => generateBar(track, b, rng, state));
    };
    expect(run(1)).toEqual(run(1));
    expect(run(1)).not.toEqual(run(2));
  });

  it('melodia e sinos usam só notas da escala ou do acorde, dentro do compasso', () => {
    for (const track of TRACKS) {
      const rng = mulberry32(42);
      const state = { idx: 3 };
      for (let b = 0; b < 16; b++) {
        const chord = track.chords[b % track.chords.length];
        const allowed = new Set([
          ...track.scale.map(s => pc(track.tonic + s)),
          ...chord.tones.map(t => pc(track.tonic + chord.root + t)),
        ]);
        for (const ev of generateBar(track, b, rng, state)) {
          expect(ev.step).toBeGreaterThanOrEqual(0);
          expect(ev.step).toBeLessThan(STEPS_PER_BAR);
          if (ev.voice === 'melody' || ev.voice === 'flute' || ev.voice === 'bell') {
            expect(allowed.has(pc(ev.midi))).toBe(true);
          }
        }
      }
    }
  });

  it('a fase de fúria acrescenta acentos rítmicos sem alterar a harmonia', () => {
    for (const track of TRACKS.filter(t => t.id.startsWith('boss-'))) {
      const normal = generateBar(track, 0, mulberry32(7), { idx: 3 }, 1);
      const furious = generateBar(track, 0, mulberry32(7), { idx: 3 }, 2);
      expect(furious.filter(e => e.voice === 'pulse').length)
        .toBeGreaterThan(normal.filter(e => e.voice === 'pulse').length);
      expect(furious.filter(e => e.voice === 'pad')).toEqual(normal.filter(e => e.voice === 'pad'));
    }
  });

  it('todo compasso tem acorde sustentado e baixo audível', () => {
    for (const track of TRACKS) {
      const events = generateBar(track, 0, mulberry32(3), { idx: 3 });
      expect(events.filter(e => e.voice === 'pad')).toHaveLength(track.chords[0].tones.length);
      for (const e of events.filter(e => e.voice === 'bass' || e.voice === 'pulse')) {
        expect(e.midi).toBeGreaterThanOrEqual(36);
      }
    }
  });
});

describe('midiToHz', () => {
  it('lá central = 440 Hz', () => {
    expect(midiToHz(69)).toBeCloseTo(440, 6);
    expect(midiToHz(81)).toBeCloseTo(880, 6);
  });
});
