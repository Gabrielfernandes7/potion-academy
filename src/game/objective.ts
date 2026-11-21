// O objetivo de uma fase comum (puro, sem Phaser): o que abre a porta. Antes toda fase era "3 gemas e porta"; agora há
// quatro jeitos, todos reaproveitando regras que o jogo já tem (explosões, fogo, inimigos e o relógio):
//   gems     : quebrar caixotes e pegar as 3 gemas escondidas (o padrão)
//   braziers : acender os braseiros com uma explosão de FOGO (água, terra e ar não acendem)
//   survive  : resistir o tempo da fase enquanto chegam ondas de inimigos
//   hunt     : derrotar todos os inimigos de um tipo (cada um tem a sua fraqueza: veja o selo sobre ele)
import type { Cell, Tiles } from './grid';
import { isWallCell } from './grid';
import type { EnemyKind } from './entities/enemies/defs';
import { ENEMY_TYPES } from './entities/enemies/defs';

export type Objective =
  | { type: 'gems' }
  | { type: 'braziers'; count: number }
  | { type: 'survive'; ms: number; waveMs: number; waves: EnemyKind[] }
  | { type: 'hunt'; kind: EnemyKind };

export const GEMS_OBJECTIVE: Objective = { type: 'gems' };

export function objectiveOf(def: { objective?: Objective }): Objective {
  return def.objective ?? GEMS_OBJECTIVE;
}

// O plural de cada inimigo que uma fase pode mandar caçar (o nome do perfil está no singular).
const PLURAL: Partial<Record<EnemyKind, string>> = { lantern: 'lanternas vivas', clock: 'relógios de cobre', sentinel: 'sentinelas de cera', owl: 'corujas' };
const plural = (k: EnemyKind): string => PLURAL[k] ?? `${ENEMY_TYPES[k].name.toLowerCase()}s`;

/** A frase do objetivo, em português (a dica do cartão de entrada da fase). */
export function goalText(o: Objective): string {
  switch (o.type) {
    case 'gems': return 'pegue as 3 gemas e chegue à porta';
    case 'braziers': return `acenda os ${o.count} braseiros com fogo; a porta abre quando todos estiverem acesos`;
    case 'survive': return `resista ${Math.round(o.ms / 1000)} s; a porta abre quando o tempo acabar`;
    case 'hunt': return `derrote todos os ${plural(o.kind)}; a porta abre quando não restar nenhum`;
  }
}

/** A dica do cartão de entrada: o objetivo (só quando não é o de sempre) e a dica da fase. */
export function introTip(def: { objective?: Objective; tip?: string }): string | undefined {
  const o = objectiveOf(def);
  if (o.type === 'gems') return def.tip;
  const goal = `OBJETIVO: ${goalText(o)}.`;
  return def.tip ? `${goal} ${def.tip}` : goal;
}

/** O que a HUD mostra do objetivo: o tipo e quanto já foi feito de quanto (em segundos, no sobreviver). */
export interface GoalView {
  kind: Objective['type'];
  done: number;
  total: number;
}

export interface Progress {
  gems: number;
  gemsNeeded: number;
  lit: number;
  surviveMs: number;
  huntAlive: number;
  huntTotal: number;
}

export function goalView(o: Objective, p: Progress): GoalView {
  switch (o.type) {
    case 'gems': return { kind: 'gems', done: Math.min(p.gems, p.gemsNeeded), total: p.gemsNeeded };
    case 'braziers': return { kind: 'braziers', done: Math.min(p.lit, o.count), total: o.count };
    case 'survive': return { kind: 'survive', done: Math.min(Math.floor(p.surviveMs / 1000), Math.round(o.ms / 1000)), total: Math.round(o.ms / 1000) };
    case 'hunt': return { kind: 'hunt', done: Math.max(0, Math.min(p.huntTotal - p.huntAlive, p.huntTotal)), total: p.huntTotal };
  }
}

export function isComplete(o: Objective, p: Progress): boolean {
  switch (o.type) {
    case 'gems': return p.gems >= p.gemsNeeded;
    case 'braziers': return p.lit >= o.count;
    case 'survive': return p.surviveMs >= o.ms;
    case 'hunt': return p.huntTotal > 0 && p.huntAlive === 0;
  }
}

/** Quantas ondas novas já deviam ter chegado (uma a cada `waveMs`, sem passar do fim do tempo) e ainda não vieram. */
export function wavesDue(o: Objective, surviveMs: number, spawned: number): number {
  if (o.type !== 'survive') return 0;
  const total = Math.floor(Math.min(surviveMs, o.ms) / o.waveMs);
  return Math.max(0, total - spawned);
}

/** O tipo de inimigo da onda de número `n` (começando em 0): os tipos se revezam. */
export function waveKind(o: Objective, n: number): EnemyKind | null {
  return o.type === 'survive' && o.waves.length ? o.waves[n % o.waves.length] : null;
}

/**
 * Onde ficam os braseiros: casas de coordenadas ímpares (os corredores, sempre alcançados por uma explosão em linha),
 * longe do começo da Roo e da porta, e afastadas entre si. `roll` torna o sorteio repetível com semente.
 */
export function pickBrazierCells(tiles: Tiles, count: number, door: Cell, roll: () => number): Cell[] {
  const rows = tiles.length;
  const cols = tiles[0].length;
  const far = (a: Cell, b: Cell, d: number): boolean => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) >= d;
  const all: Cell[] = [];
  for (let y = 1; y < rows - 1; y++) {
    for (let x = 1; x < cols - 1; x++) {
      if (x % 2 === 1 && y % 2 === 1 && !isWallCell(x, y, cols, rows)) all.push({ x, y });
    }
  }
  const start: Cell = { x: 1, y: 1 };
  const chosen: Cell[] = [];
  for (const spacing of [5, 4, 3, 2]) {
    const pool = all.filter(c => far(c, start, 5) && far(c, door, 3) && !chosen.some(o => !far(c, o, spacing)));
    while (chosen.length < count && pool.length) {
      const c = pool.splice(Math.floor(roll() * pool.length), 1)[0];
      if (!chosen.some(o => !far(c, o, spacing))) chosen.push(c);
    }
    if (chosen.length >= count) break;
  }
  return chosen;
}
