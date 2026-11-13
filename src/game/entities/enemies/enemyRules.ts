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
