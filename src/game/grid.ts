// Regras da grade (puro, sem Phaser): que casa é muralha, onde nasce o caixote, onde fica a porta
// e quando a Roo pode entrar numa casa. A MainScene desenha o que estes valores decidem.
import { BLOCK, EMPTY, WALL } from '../config';
import { random } from './rng';

export type Tiles = number[][];
export type BossSpawn = 'top' | 'bottom';

export interface Cell {
  x: number;
  y: number;
}

// Muralha: a borda e as casas de coordenadas pares (x e y pares), como nos jogos de bomba clássicos.
export function isWallCell(x: number, y: number, cols: number, rows: number): boolean {
  return x === 0 || y === 0 || x === cols - 1 || y === rows - 1 || (x % 2 === 0 && y % 2 === 0);
}

// Área livre em volta do nascimento, para sempre haver rota de fuga.
// Com chefe, o canto dele também fica livre (Belladona embaixo, Mandrágora em cima).
export function isSpawnSafe(
  x: number,
  y: number,
  cols: number,
  rows: number,
  bossSpawn?: BossSpawn,
): boolean {
  if (bossSpawn) {
    const r = bossSpawn === 'top' ? 1 : rows - 2;
    const c = cols - 2;
    if ((y === r && x >= c - 2) || (x === c && Math.abs(y - r) <= 2)) return true;
  }
  return (y === 1 && x <= 3) || (x === 1 && y <= 3);
}

export interface BuiltTiles {
  tiles: Tiles;
  // chaves "x,y" dos caixotes gerados (a MainScene cria um sprite para cada uma)
  blockKeys: string[];
}

// Monta a grade. `roll` devolve um número em [0, 1): injetável para o teste ser determinístico.
export function buildTiles(
  cols: number,
  rows: number,
  blockChance: number,
  safe: (x: number, y: number) => boolean,
  roll: () => number = random,
): BuiltTiles {
  const tiles: Tiles = [];
  const blockKeys: string[] = [];
  for (let y = 0; y < rows; y++) {
    tiles[y] = [];
    for (let x = 0; x < cols; x++) {
      if (isWallCell(x, y, cols, rows)) {
        tiles[y][x] = WALL;
      } else if (roll() < blockChance && !safe(x, y)) {
        tiles[y][x] = BLOCK;
        blockKeys.push(cellKey(x, y));
      } else {
        tiles[y][x] = EMPTY;
      }
    }
  }
  return { tiles, blockKeys };
}

// Casa da porta (canto de baixo à direita, dentro da muralha). Sem porta, devolve -1,-1.
export function doorCell(cols: number, rows: number, hasDoor: boolean): Cell {
  return hasDoor ? { x: cols - 2, y: rows - 2 } : { x: -1, y: -1 };
}

export function isInside(x: number, y: number, cols: number, rows: number): boolean {
  return x >= 0 && x < cols && y >= 0 && y < rows;
}

// Tipo da casa, ou null fora da grade.
export function tileAt(tiles: Tiles, cols: number, rows: number, x: number, y: number): number | null {
  if (!isInside(x, y, cols, rows)) return null;
  return tiles[y][x];
}

// O que pode impedir a Roo de entrar numa casa (já resolvido pela cena: são fatos, não geometria).
export interface Occupancy {
  tile: number | null; // tipo da casa (null = fora)
  bomb: boolean; // há uma bomba na casa
  doorClosed: boolean; // é a porta e ela ainda está fechada
  rootedEnemy: boolean; // há um inimigo preso ao chão (flor, sapo parado) na casa
}

export function isPassable(o: Occupancy): boolean {
  if (o.tile !== EMPTY) return false;
  return !o.bomb && !o.doorClosed && !o.rootedEnemy;
}

// Chave "x,y" usada nos mapas de caixotes e de sprites.
export function cellKey(x: number, y: number): string {
  return `${x},${y}`;
}
