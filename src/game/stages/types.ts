// Tipos das fases e dos capítulos (sem dados nem lógica).
import type { EnemyKind } from '../entities/enemies/defs';

export type StageKind = 'lab' | 'crypt' | 'boss' | 'garden';
export type StageTheme = 'stone' | 'crypt' | 'garden';
export type BossId = 'belladonna' | 'mandrake';

// Quantos inimigos de um tipo: `start` no início; se houver `every`, mais um a cada N caixotes quebrados, até `max`.
export interface EnemyRule {
  kind: EnemyKind;
  start: number;
  max: number;
  every?: number;
}

// Quantas moedas um baú pode trazer, com a chance de cada valor (as chances somam 1).
// Regra: quanto maior a recompensa, menor a chance.
export interface ChestOdd { chance: number; coins: number }

// O que se escreve na definição de uma fase (capítulo e posição vêm do capítulo, ver chapters).
export interface StageSpec {
  kind: StageKind;
  name: string; // nome da fase na história (O CHAMADO...)
  boss?: BossId; // chefe da fase (ver game/entities/bosses/BossBase.ts)
  place: string; // lugar onde ela acontece (aparece no mapa e no cartão de entrada)
  story: string; // uma frase de história, mostrada ao entrar
  tip?: string; // dica mostrada ao entrar na fase
  fog?: { radius: number }; // névoa: a Roo só enxerga `radius` casas ao redor (ver game/effects/Fog.ts)
  time: number; // ms
  blockChance: number;
  door: boolean; // fase de gemas e porta (o chefe não tem porta)
  enemies: EnemyRule[];
  theme: StageTheme;
  track: string; // faixa de música da fase (ver SCENE_TRACKS em audio/tracks.ts)
  chest: ReadonlyArray<ChestOdd>; // sorteio do baú (moedas) nesta fase
}

// A fase como o jogo a usa: a definição mais o capítulo e a posição nele (preenchidos em stages/index.ts).
export interface StageDef extends StageSpec {
  chapter?: string; // capítulo a que a fase pertence (A TORRE / DUELO...)
  part?: string; // posição no capítulo (1/4, 2/4, 3/4, chefe)
}

// Um capítulo: um grupo de fases em ordem. Os agrupados aparecem no mapa do vale como um lugar só
// (ao tocar abre o mapa do capítulo); os não agrupados aparecem como fases soltas.
export interface ChapterSpec {
  id: string;
  name: string;
  place: string;
  grouped: boolean;
  stages: StageSpec[];
}

// O capítulo no mapa: as fases dele são first..last (números de fase, a partir de 1).
export interface ChapterDef { id: string; name: string; place: string; first: number; last: number }
