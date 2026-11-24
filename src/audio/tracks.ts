// Identidade musical de Potion Academy: temas compostos por capítulo e por chefe.
// A semente varia a interpretação, não a identidade: harmonia, ritmo e motivo continuam reconhecíveis.

type Voice = 'pad' | 'bass' | 'melody' | 'flute' | 'bell' | 'pulse';
type Style = 'melody' | 'arp' | 'sparse' | 'nocturne' | 'march' | 'clockwork' | 'ritual' | 'organic';

export interface NoteEvent {
  step: number;
  voice: Voice;
  midi: number;
  steps: number;
}

interface Chord {
  root: number;
  tones: number[];
}

export interface Track {
  id: string;
  name: string;
  bpm: number;
  tonic: number;
  scale: number[];
  chords: Chord[];
  style: Style;
  density: number;
  drive?: number;
}

export const STEPS_PER_BAR = 8;

export const TRACKS: Track[] = [
  {
    id: 'nocturno', name: 'Nocturno com Flauta', bpm: 60, tonic: 51,
    scale: [0, 2, 4, 5, 7, 9, 11], style: 'nocturne', density: 0.55,
    chords: [
      { root: 0, tones: [0, 4, 7] }, { root: 9, tones: [0, 3, 7] },
      { root: 8, tones: [0, 4, 7] }, { root: 7, tones: [0, 4, 7] },
    ],
  },
  {
    id: 'alambique', name: 'Noite no Alambique', bpm: 84, tonic: 50,
    scale: [0, 2, 3, 7, 9], style: 'arp', density: 0.72,
    chords: [
      { root: 0, tones: [0, 3, 7] }, { root: 5, tones: [0, 4, 7] },
      { root: 3, tones: [0, 3, 7] }, { root: 7, tones: [0, 3, 7] },
    ],
  },
  {
    id: 'ecos', name: 'Ecos no Salão', bpm: 72, tonic: 57,
    scale: [0, 3, 5, 7, 10], style: 'sparse', density: 0.34,
    chords: [
      { root: 0, tones: [0, 3, 7] }, { root: 8, tones: [0, 4, 7] },
      { root: 5, tones: [0, 3, 7] }, { root: 10, tones: [0, 3, 7] },
    ],
  },
  {
    id: 'duelo', name: 'Duelo na Torre', bpm: 104, tonic: 57,
    scale: [0, 2, 3, 5, 7, 8, 10], style: 'march', density: 0.72, drive: 0.7,
    chords: [
      { root: 0, tones: [0, 3, 7] }, { root: 8, tones: [0, 4, 7] },
      { root: 3, tones: [0, 3, 7] }, { root: 10, tones: [0, 4, 7] },
    ],
  },
  {
    id: 'jardim', name: 'Jardim do Mosteiro', bpm: 92, tonic: 53,
    scale: [0, 2, 4, 7, 9], style: 'organic', density: 0.58,
    chords: [
      { root: 0, tones: [0, 4, 7] }, { root: 2, tones: [0, 4, 7] },
      { root: 9, tones: [0, 3, 7] }, { root: 7, tones: [0, 4, 7] },
    ],
  },
  {
    id: 'vesperas', name: 'Vésperas', bpm: 64, tonic: 62,
    scale: [0, 2, 4, 7, 9], style: 'sparse', density: 0.28,
    chords: [
      { root: 0, tones: [0, 4, 7] }, { root: 5, tones: [0, 4, 7] },
      { root: 9, tones: [0, 3, 7] }, { root: 7, tones: [0, 4, 7] },
    ],
  },

  // Temas dos cinco capítulos: uma paleta harmônica e um groove que acompanham cada ambiente.
  {
    id: 'chapter-vale', name: 'O Vale — A Primeira Descoberta', bpm: 88, tonic: 50,
    scale: [0, 2, 3, 7, 9], style: 'arp', density: 0.68,
    chords: [
      { root: 0, tones: [0, 3, 7] }, { root: 5, tones: [0, 4, 7] },
      { root: 3, tones: [0, 3, 7] }, { root: 7, tones: [0, 3, 7] },
    ],
  },
  {
    id: 'chapter-torre', name: 'A Torre — Ecos e Ameaças', bpm: 102, tonic: 57,
    scale: [0, 2, 3, 5, 7, 8, 10], style: 'march', density: 0.62, drive: 0.52,
    chords: [
      { root: 0, tones: [0, 3, 7] }, { root: 8, tones: [0, 3, 7] },
      { root: 5, tones: [0, 3, 7] }, { root: 10, tones: [0, 4, 7] },
    ],
  },
  {
    id: 'chapter-biblioteca', name: 'Biblioteca — Segredos nas Páginas', bpm: 78, tonic: 55,
    scale: [0, 2, 3, 5, 7, 9, 10], style: 'sparse', density: 0.62,
    chords: [
      { root: 0, tones: [0, 3, 7] }, { root: 3, tones: [0, 4, 7] },
      { root: 8, tones: [0, 3, 7] }, { root: 5, tones: [0, 4, 7] },
    ],
  },
  {
    id: 'chapter-observatorio', name: 'Observatório — Cartas Celestes', bpm: 98, tonic: 60,
    scale: [0, 2, 4, 6, 7, 9, 11], style: 'clockwork', density: 0.78, drive: 0.38,
    chords: [
      { root: 0, tones: [0, 4, 7] }, { root: 6, tones: [0, 4, 7] },
      { root: 7, tones: [0, 4, 7] }, { root: 11, tones: [0, 3, 7] },
    ],
  },
  {
    id: 'chapter-retorno', name: 'O Retorno — A Luz do Mosteiro', bpm: 110, tonic: 53,
    scale: [0, 2, 4, 5, 7, 9, 11], style: 'organic', density: 0.86, drive: 0.7,
    chords: [
      { root: 0, tones: [0, 4, 7] }, { root: 5, tones: [0, 4, 7] },
      { root: 9, tones: [0, 3, 7] }, { root: 7, tones: [0, 4, 7] },
    ],
  },

  // Temas dos chefes: motivos, centros tonais e padrões rítmicos próprios.
  {
    id: 'boss-chimera', name: 'Quimera — Prata que Devora', bpm: 116, tonic: 45,
    scale: [0, 1, 3, 5, 7, 8, 10], style: 'march', density: 0.8, drive: 0.95,
    chords: [
      { root: 0, tones: [0, 3, 7] }, { root: 1, tones: [0, 3, 7] },
      { root: 8, tones: [0, 3, 7] }, { root: 3, tones: [0, 4, 7] },
    ],
  },
  {
    id: 'boss-belladonna', name: 'Belladona — O Duelo das Sombras', bpm: 108, tonic: 54,
    scale: [0, 2, 3, 6, 7, 8, 11], style: 'arp', density: 0.9, drive: 0.72,
    chords: [
      { root: 0, tones: [0, 3, 7] }, { root: 6, tones: [0, 3, 7] },
      { root: 3, tones: [0, 4, 7] }, { root: 10, tones: [0, 3, 7] },
    ],
  },
  {
    id: 'boss-lion', name: 'Leão Verde — Correntes de Ferro', bpm: 120, tonic: 48,
    scale: [0, 2, 3, 5, 7, 9, 10], style: 'march', density: 0.62, drive: 1,
    chords: [
      { root: 0, tones: [0, 3, 7] }, { root: 5, tones: [0, 3, 7] },
      { root: 3, tones: [0, 3, 7] }, { root: 7, tones: [0, 4, 7] },
    ],
  },
  {
    id: 'boss-ouroboros', name: 'Ouroboros — O Ciclo Eterno', bpm: 96, tonic: 60,
    scale: [0, 2, 4, 6, 7, 9, 11], style: 'clockwork', density: 0.82, drive: 0.55,
    chords: [
      { root: 0, tones: [0, 4, 7] }, { root: 4, tones: [0, 3, 7] },
      { root: 7, tones: [0, 4, 7] }, { root: 11, tones: [0, 3, 7] },
    ],
  },
  {
    id: 'boss-mandrake', name: 'Mandrágora — Raízes Despertas', bpm: 112, tonic: 52,
    scale: [0, 2, 3, 5, 7, 9, 10], style: 'organic', density: 0.78, drive: 0.82,
    chords: [
      { root: 0, tones: [0, 3, 7] }, { root: 5, tones: [0, 4, 7] },
      { root: 10, tones: [0, 3, 7] }, { root: 3, tones: [0, 4, 7] },
    ],
  },
];

export const SCENE_TRACKS = {
  menu: 'nocturno',
  letter: 'nocturno',
  stage1: 'alambique',
  stage2: 'ecos',
  stage3: 'duelo',
  stage4: 'jardim',
  ending: 'vesperas',
} as const;

export type BossTrackId = 'boss-chimera' | 'boss-belladonna' | 'boss-lion' | 'boss-ouroboros' | 'boss-mandrake';

export function bossTrackId(id: string): BossTrackId {
  return `boss-${id}` as BossTrackId;
}

export function trackById(id: string): Track | undefined {
  return TRACKS.find(t => t.id === id);
}

export { mulberry32 } from '../game/rng';

export function midiToHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export interface MelodyState {
  idx: number;
}

const pitchClass = (midi: number): number => ((midi % 12) + 12) % 12;

export function generateBar(
  track: Track,
  barIndex: number,
  rng: () => number,
  state: MelodyState,
  intensity: 1 | 2 = 1,
): NoteEvent[] {
  const chord = track.chords[barIndex % track.chords.length];
  const chordMidi = chord.tones.map(t => track.tonic + chord.root + t);
  const chordClasses = new Set(chordMidi.map(pitchClass));
  const events: NoteEvent[] = [];

  for (const m of chordMidi) events.push({ step: 0, voice: 'pad', midi: m, steps: STEPS_PER_BAR });

  const bassBase = chordMidi[0] - 24;
  let bass = bassBase;
  while (bass < 36) bass += 12;
  const pulsePitch = Math.max(36, bass - 7);
  events.push({ step: 0, voice: 'bass', midi: bass, steps: 4 });
  events.push({ step: 4, voice: 'bass', midi: rng() < 0.5 ? bass : bass + 7, steps: 4 });

  const pitches = [
    ...track.scale.map(s => track.tonic + 12 + s),
    ...track.scale.map(s => track.tonic + 24 + s),
  ];
  state.idx = Math.max(0, Math.min(pitches.length - 1, state.idx));

  if (track.style === 'arp') {
    const arp = [...chordMidi.map(m => m + 12), ...chordMidi.map(m => m + 24)];
    const order = [0, 1, 2, 3, 4, 5, 4, 3];
    for (let s = 0; s < STEPS_PER_BAR; s++) {
      if (rng() < track.density) events.push({ step: s, voice: 'melody', midi: arp[order[s] % arp.length], steps: 1 });
    }
  } else if (track.style === 'sparse') {
    const sparseSteps = [1, 5, 7];
    for (const s of sparseSteps) {
      if (rng() < track.density) {
        state.idx = Math.floor(rng() * pitches.length);
        events.push({ step: s, voice: 'bell', midi: pitches[state.idx], steps: 3 });
      }
    }
  } else if (track.style === 'march' || track.style === 'clockwork' || track.style === 'ritual') {
    const pattern = track.style === 'march' ? [0, 2, 4, 6] : track.style === 'clockwork' ? [0, 3, 5, 7] : [0, 3, 6];
    const lead: Voice = track.style === 'clockwork' ? 'bell' : 'melody';
    for (const s of pattern) {
      if (rng() > track.density) continue;
      const candidates = pitches.filter(m => chordClasses.has(pitchClass(m)));
      const pick = candidates[Math.floor(rng() * candidates.length)] ?? pitches[0];
      events.push({ step: s, voice: lead, midi: pick, steps: track.style === 'clockwork' ? 2 : 1 });
    }
    for (const s of [0, 2, 4, 6]) {
      if (rng() < (track.drive ?? 0.5)) {
        events.push({ step: s, voice: 'pulse', midi: pulsePitch, steps: 1 });
      }
    }
  } else if (track.style === 'organic') {
    const pattern = [0, 1, 3, 4, 6, 7];
    for (const s of pattern) {
      if (rng() > track.density) continue;
      const move = [-2, -1, 1, 2][Math.floor(rng() * 4)];
      state.idx = Math.max(0, Math.min(pitches.length - 1, state.idx + move));
      events.push({ step: s, voice: s % 3 === 0 ? 'flute' : 'melody', midi: pitches[state.idx], steps: 1 });
    }
    for (const s of [0, 4]) events.push({ step: s, voice: 'pulse', midi: bass - 12, steps: 1 });
  } else {
    const voice: Voice = track.style === 'nocturne' ? 'flute' : 'melody';
    for (let s = 0; s < STEPS_PER_BAR; s++) {
      const strong = s % 4 === 0;
      const probability = strong ? Math.min(0.95, track.density + 0.3) : track.density * 0.7;
      if (rng() >= probability) continue;
      if (strong) {
        let best = state.idx;
        let bestDist = Infinity;
        pitches.forEach((m, i) => {
          if (!chordClasses.has(pitchClass(m))) return;
          const d = Math.abs(i - state.idx);
          if (d < bestDist) { best = i; bestDist = d; }
        });
        state.idx = best;
      } else {
        const move = [-2, -1, 1, 2][Math.floor(rng() * 4)];
        state.idx = Math.max(0, Math.min(pitches.length - 1, state.idx + move));
      }
      events.push({ step: s, voice, midi: pitches[state.idx], steps: strong ? 3 : 2 });
    }
  }

  if (intensity === 2) {
    for (const s of [2, 6]) {
      events.push({ step: s, voice: 'pulse', midi: bass - 12, steps: 1 });
    }
    if (rng() < 0.7) {
      const note = chordMidi[1 % chordMidi.length] + 12;
      events.push({ step: 7, voice: 'bell', midi: note, steps: 1 });
    }
  }

  return events;
}
