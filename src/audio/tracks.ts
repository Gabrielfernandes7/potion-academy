// Músicas procedurais relaxantes (sem Phaser nem WebAudio: lógica pura, testável).
//
// Cada faixa define tom, escala, andamento e uma progressão de acordes. A cada compasso o
// gerador produz notas (pad, baixo, melodia, sinos) a partir de um sorteio com semente.
// A faixa é fixa por parte do jogo; a semente é nova a cada vez, então ela nunca soa igual.

type Voice = 'pad' | 'bass' | 'melody' | 'bell';
type Style = 'melody' | 'arp' | 'sparse';

export interface NoteEvent {
  step: number; // colcheia dentro do compasso (0 a 7)
  voice: Voice;
  midi: number;
  steps: number; // duração em colcheias
}

interface Chord {
  root: number; // semitons acima da tônica
  tones: number[]; // intervalos a partir da raiz do acorde
}

export interface Track {
  id: string;
  name: string;
  bpm: number;
  tonic: number; // nota MIDI da tônica
  scale: number[]; // semitons a partir da tônica (pentatônicas: soam bem sobre qualquer acorde da faixa)
  chords: Chord[]; // um acorde por compasso, em ciclo
  style: Style;
  density: number; // 0 a 1: quantas notas de melodia por compasso
}

export const STEPS_PER_BAR = 8;

// Uma faixa para cada parte do jogo (nada de sorteio): o clima muda com a história.
// Tudo em modos antigos (dórico, mixolídio, eólio) e pentatônicas, com andamento lento:
// soa como alaúde, harpa e sinos de mosteiro, aconchegante e medieval.
export const TRACKS: Track[] = [
  // Menu e carta: a lareira do Caldeirão. Maior, lenta, calorosa.
  {
    id: 'lareira', name: 'Lareira do Caldeirão', bpm: 62, tonic: 55, scale: [0, 2, 4, 7, 9], style: 'melody', density: 0.4,
    chords: [
      { root: 0, tones: [0, 4, 7] }, { root: 5, tones: [0, 4, 7] },
      { root: 9, tones: [0, 3, 7] }, { root: 7, tones: [0, 4, 7] },
    ],
  },
  // Fase 1, O Chamado: o laboratório à noite, ré dórico, harpa serena.
  {
    id: 'alambique', name: 'Noite no Alambique', bpm: 66, tonic: 50, scale: [0, 2, 3, 7, 9], style: 'arp', density: 0.5,
    chords: [
      { root: 0, tones: [0, 3, 7] }, { root: 5, tones: [0, 4, 7] },
      { root: 0, tones: [0, 3, 7] }, { root: 7, tones: [0, 3, 7] },
    ],
  },
  // Fase 2, O Caminho: o salão dos ecos. Sinos esparsos, sem susto.
  {
    id: 'ecos', name: 'Ecos no Salão', bpm: 54, tonic: 57, scale: [0, 3, 5, 7, 10], style: 'sparse', density: 0.3,
    chords: [
      { root: 0, tones: [0, 3, 7] }, { root: 8, tones: [0, 4, 7] },
      { root: 5, tones: [0, 3, 7] }, { root: 7, tones: [0, 4, 7] },
    ],
  },
  // Fase 3, O Duelo: mais firme, mas ainda macia (fora do duelo ninguém a toca).
  {
    id: 'duelo', name: 'Duelo na Torre', bpm: 78, tonic: 57, scale: [0, 3, 5, 7, 10], style: 'arp', density: 0.65,
    chords: [
      { root: 0, tones: [0, 3, 7] }, { root: 8, tones: [0, 4, 7] },
      { root: 3, tones: [0, 4, 7] }, { root: 10, tones: [0, 4, 7] },
    ],
  },
  // Fase 4, O Retorno: o jardim do mosteiro ao entardecer, com sinos de longe.
  {
    id: 'jardim', name: 'Jardim do Mosteiro', bpm: 68, tonic: 53, scale: [0, 2, 4, 7, 9], style: 'melody', density: 0.38,
    chords: [
      { root: 0, tones: [0, 4, 7] }, { root: 2, tones: [0, 4, 7] },
      { root: 9, tones: [0, 3, 7] }, { root: 0, tones: [0, 4, 7] },
    ],
  },
  // Confissão e final: vésperas, quase só sinos.
  {
    id: 'vesperas', name: 'Vésperas', bpm: 58, tonic: 62, scale: [0, 2, 4, 7, 9], style: 'sparse', density: 0.28,
    chords: [
      { root: 0, tones: [0, 4, 7] }, { root: 5, tones: [0, 4, 7] },
      { root: 9, tones: [0, 3, 7] }, { root: 7, tones: [0, 4, 7] },
    ],
  },
];

// Qual faixa toca em cada parte do jogo.
export const SCENE_TRACKS = {
  menu: 'lareira',
  letter: 'lareira',
  stage1: 'alambique',
  stage2: 'ecos',
  stage3: 'duelo',
  stage4: 'jardim',
  ending: 'vesperas',
} as const;

export function trackById(id: string): Track | undefined {
  return TRACKS.find(t => t.id === id);
}

// Gerador pseudoaleatório com semente (mulberry32): mesma semente, mesma música.
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function midiToHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Estado da melodia entre compassos (para ela andar por graus próximos, sem saltos bruscos).
export interface MelodyState {
  idx: number;
}

const pitchClass = (midi: number): number => ((midi % 12) + 12) % 12;

export function generateBar(track: Track, barIndex: number, rng: () => number, state: MelodyState): NoteEvent[] {
  const chord = track.chords[barIndex % track.chords.length];
  const chordMidi = chord.tones.map(t => track.tonic + chord.root + t);
  const chordClasses = new Set(chordMidi.map(pitchClass));
  const events: NoteEvent[] = [];

  // pad: o acorde inteiro, sustentado pelo compasso
  for (const m of chordMidi) events.push({ step: 0, voice: 'pad', midi: m, steps: STEPS_PER_BAR });

  // baixo: raiz no 1º tempo e, às vezes, a quinta no 3º (nunca abaixo de MIDI 36, que some em alto-falantes pequenos)
  const bassBase = chordMidi[0] - 24;
  const bass = bassBase < 36 ? bassBase + 12 : bassBase;
  events.push({ step: 0, voice: 'bass', midi: bass, steps: 4 });
  events.push({ step: 4, voice: 'bass', midi: rng() < 0.5 ? bass : bass + 7, steps: 4 });

  // alturas disponíveis para melodia: escala em duas oitavas acima da tônica
  const pitches = [
    ...track.scale.map(s => track.tonic + 12 + s),
    ...track.scale.map(s => track.tonic + 24 + s),
  ];
  state.idx = Math.max(0, Math.min(pitches.length - 1, state.idx));

  if (track.style === 'arp') {
    // harpa: sobe e desce pelas notas do acorde em duas oitavas
    const arp = [...chordMidi.map(m => m + 12), ...chordMidi.map(m => m + 24)];
    const order = [0, 1, 2, 3, 4, 5, 4, 3];
    for (let s = 0; s < STEPS_PER_BAR; s++) {
      if (rng() < track.density) {
        events.push({ step: s, voice: 'melody', midi: arp[order[s] % arp.length], steps: 2 });
      }
    }
  } else if (track.style === 'sparse') {
    // sinos esparsos, como gotas
    for (let s = 0; s < STEPS_PER_BAR; s++) {
      if (rng() < track.density) {
        state.idx = Math.floor(rng() * pitches.length);
        events.push({ step: s, voice: 'bell', midi: pitches[state.idx], steps: 3 });
      }
    }
  } else {
    // melodia: anda por graus próximos; nos tempos fortes prefere notas do acorde
    for (let s = 0; s < STEPS_PER_BAR; s++) {
      const strong = s % 4 === 0;
      const p = strong ? Math.min(0.95, track.density + 0.3) : track.density * 0.7;
      if (rng() >= p) continue;
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
      events.push({ step: s, voice: 'melody', midi: pitches[state.idx], steps: strong ? 3 : 2 });
    }
  }

  // brilho ocasional de sino agudo
  for (let s = 0; s < STEPS_PER_BAR; s++) {
    if (rng() < 0.06) {
      const m = track.tonic + 36 + track.scale[Math.floor(rng() * track.scale.length)];
      events.push({ step: s, voice: 'bell', midi: m, steps: 4 });
    }
  }

  return events;
}
