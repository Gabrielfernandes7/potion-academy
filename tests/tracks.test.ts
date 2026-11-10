import { describe, expect, it } from 'vitest';
import {
  STEPS_PER_BAR, TRACKS, generateBar, midiToHz, mulberry32, pickNextTrack,
} from '../src/audio/tracks';

const pc = (m: number): number => ((m % 12) + 12) % 12;

describe('faixas', () => {
  it('há faixas suficientes, com ids únicos e andamento calmo', () => {
    expect(TRACKS.length).toBeGreaterThanOrEqual(5);
    expect(new Set(TRACKS.map(t => t.id)).size).toBe(TRACKS.length);
    for (const t of TRACKS) {
      expect(t.bpm).toBeGreaterThanOrEqual(50);
      expect(t.bpm).toBeLessThanOrEqual(85);
    }
  });

  it('nunca repete a faixa anterior ao sortear a próxima', () => {
    const rng = mulberry32(7);
    let last: string | null = null;
    for (let i = 0; i < 200; i++) {
      const next = pickNextTrack(last, rng);
      expect(next.id).not.toBe(last);
      last = next.id;
    }
  });

  it('com várias partidas, todas as faixas aparecem', () => {
    const seen = new Set<string>();
    let last: string | null = null;
    for (let i = 0; i < 100; i++) {
      last = pickNextTrack(last).id;
      seen.add(last);
    }
    expect(seen.size).toBe(TRACKS.length);
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
          if (ev.voice === 'melody' || ev.voice === 'bell') expect(allowed.has(pc(ev.midi))).toBe(true);
        }
      }
    }
  });

  it('todo compasso tem pad com o acorde inteiro e baixo audível (MIDI >= 36)', () => {
    for (const track of TRACKS) {
      const events = generateBar(track, 0, mulberry32(3), { idx: 3 });
      expect(events.filter(e => e.voice === 'pad')).toHaveLength(track.chords[0].tones.length);
      for (const e of events.filter(e => e.voice === 'bass')) expect(e.midi).toBeGreaterThanOrEqual(36);
    }
  });
});

describe('midiToHz', () => {
  it('lá central = 440 Hz', () => {
    expect(midiToHz(69)).toBeCloseTo(440, 6);
    expect(midiToHz(81)).toBeCloseTo(880, 6);
  });
});
