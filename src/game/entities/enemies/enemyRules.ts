// Regras puras dos inimigos (sem Phaser, testáveis). Ver game/entities/enemies/EnemySystem.ts.
import { DIRS, EMPTY } from '../../../config';
import { EnemyKind } from './defs';

// Quantos inimigos de um tipo existem.
export function countKind(enemies: ReadonlyArray<{ kind: EnemyKind }>, kind: EnemyKind): number {
  return enemies.filter(e => e.kind === kind).length;
}

export interface SpawnContext {
  tile: number; // conteúdo da casa na grade
  door: { x: number; y: number };
  player: { x: number; y: number };
  enemyAt: boolean; // já há outro inimigo na casa
  bombAt: boolean; // há uma poção na casa
}

// Distância mínima (em casas, Manhattan) entre a Roo e um inimigo recém-nascido.
export const MIN_SPAWN_DISTANCE = 5;

// Casa válida para um inimigo nascer: livre, longe da porta e da Roo, sem outro inimigo nem poção.
export function canSpawnEnemyAt(x: number, y: number, c: SpawnContext): boolean {
  if (c.tile !== EMPTY) return false;
  if (x === c.door.x && y === c.door.y) return false;
  if (Math.abs(x - c.player.x) + Math.abs(y - c.player.y) < MIN_SPAWN_DISTANCE) return false;
  if (c.enemyAt) return false;
  if (c.bombAt) return false;
  return true;
}

export interface MoveContext {
  from: { x: number; y: number };
  passWalls: boolean; // fantasma: atravessa muralhas, caixotes e poções, mas não sai da sala
  door: { x: number; y: number };
  cols: number;
  rows: number;
  isFree: (x: number, y: number) => boolean;
  occupied: (x: number, y: number) => boolean; // outro inimigo vivo na casa
}

// Direções para onde o inimigo pode dar o próximo passo (a escolha entre elas é sorteada pelo sistema).
export function enemyMoveOptions(c: MoveContext): Array<readonly [number, number]> {
  const valid: Array<readonly [number, number]> = [];
  for (const [dx, dy] of DIRS) {
    const nx = c.from.x + dx;
    const ny = c.from.y + dy;
    if (nx === c.door.x && ny === c.door.y) continue;
    if (c.passWalls) {
      if (nx < 1 || ny < 1 || nx > c.cols - 2 || ny > c.rows - 2) continue;
    } else if (!c.isFree(nx, ny)) {
      continue;
    }
    if (c.occupied(nx, ny)) continue;
    valid.push([dx, dy]);
  }
  return valid;
}

// ---------- patrulha (lanterna viva, relógio de cobre) ----------

export interface Dir2 { x: number; y: number }

/**
 * A direção do próximo passo de quem patrulha: segue em frente; se a casa não é livre, volta; se atrás também não,
 * tenta as laterais. Null se estiver cercado.
 */
export function patrolDir(
  from: { x: number; y: number }, dir: Dir2, canEnter: (x: number, y: number) => boolean,
): Dir2 | null {
  const neg = (n: number): number => (n === 0 ? 0 : -n); // sem -0
  const tries: Dir2[] = [dir, { x: neg(dir.x), y: neg(dir.y) }, { x: dir.y, y: dir.x }, { x: neg(dir.y), y: neg(dir.x) }];
  for (const d of tries) {
    if (d.x === 0 && d.y === 0) continue;
    if (canEnter(from.x + d.x, from.y + d.y)) return d;
  }
  return null;
}

/** Os passos do relógio de cobre entre as pausas: a cada volta completa, ele trava. */
export const CLOCK_STEPS_BETWEEN_PAUSES = 8;
export const CLOCK_PAUSE_MS = 2000;

// ---------- toupeira de sal ----------

export const MOLE_WALK_MS = 5000; // tempo andando antes de afundar
export const MOLE_BURROW_MS = 1400; // tempo debaixo da terra (o monte avisa o lugar onde ela vai brotar)

/**
 * Onde a toupeira brota: uma casa livre a 2 ou 3 passos (Manhattan) da Roo, nunca a dela nem uma vizinha (o aviso
 * precisa de tempo para a Roo reagir). Escolhe pelo sorteio `pick` (0 a 1). Null se não houver lugar.
 */
export function moleSpot(
  player: { x: number; y: number }, canEnter: (x: number, y: number) => boolean, cols: number, rows: number, pick: number,
): { x: number; y: number } | null {
  const options: Array<{ x: number; y: number }> = [];
  for (let y = 1; y < rows - 1; y++) {
    for (let x = 1; x < cols - 1; x++) {
      const d = Math.abs(x - player.x) + Math.abs(y - player.y);
      if (d >= 2 && d <= 3 && canEnter(x, y)) options.push({ x, y });
    }
  }
  if (options.length === 0) return null;
  return options[Math.min(options.length - 1, Math.floor(pick * options.length))];
}

// ---------- coruja do scriptorium ----------

export const OWL_CYCLE_MS = 6000; // de tempos em tempos, a coruja marca a casa da Roo
export const OWL_AIM_MS = 1000; // o círculo avisa por 1 s; quem sair da casa não é atingido
