import { describe, expect, it } from 'vitest';
import { BLOCK, EMPTY, WALL } from '../src/config';
import {
  buildTiles, cellKey, doorCell, isPassable, isSpawnSafe, isWallCell, tileAt,
} from '../src/game/grid';

const COLS = 15;
const ROWS = 13;

describe('muralha', () => {
  it('a borda e as casas de coordenadas pares (ambas pares) são muralha', () => {
    expect(isWallCell(0, 5, COLS, ROWS)).toBe(true);
    expect(isWallCell(COLS - 1, 5, COLS, ROWS)).toBe(true);
    expect(isWallCell(4, 0, COLS, ROWS)).toBe(true);
    expect(isWallCell(4, ROWS - 1, COLS, ROWS)).toBe(true);
    expect(isWallCell(2, 4, COLS, ROWS)).toBe(true);
  });

  it('casas com uma coordenada ímpar no interior não são muralha', () => {
    expect(isWallCell(3, 3, COLS, ROWS)).toBe(false);
    expect(isWallCell(2, 3, COLS, ROWS)).toBe(false);
    expect(isWallCell(3, 2, COLS, ROWS)).toBe(false);
  });
});

describe('área de nascimento', () => {
  it('a Roo nasce com a rota de fuga livre no canto superior esquerdo', () => {
    expect(isSpawnSafe(1, 1, COLS, ROWS)).toBe(true);
    expect(isSpawnSafe(3, 1, COLS, ROWS)).toBe(true);
    expect(isSpawnSafe(1, 3, COLS, ROWS)).toBe(true);
    expect(isSpawnSafe(4, 1, COLS, ROWS)).toBe(false);
  });

  it('chefe embaixo: as casas ao redor do canto de baixo à direita ficam livres', () => {
    const r = ROWS - 2;
    const c = COLS - 2;
    expect(isSpawnSafe(c, r, COLS, ROWS, 'bottom')).toBe(true);
    expect(isSpawnSafe(c - 2, r, COLS, ROWS, 'bottom')).toBe(true);
    expect(isSpawnSafe(c, r - 2, COLS, ROWS, 'bottom')).toBe(true);
    expect(isSpawnSafe(c - 3, r, COLS, ROWS, 'bottom')).toBe(false);
  });

  it('chefe em cima: a área livre fica na linha 1, no canto de cima à direita', () => {
    const c = COLS - 2;
    expect(isSpawnSafe(c, 1, COLS, ROWS, 'top')).toBe(true);
    expect(isSpawnSafe(c, 3, COLS, ROWS, 'top')).toBe(true);
    expect(isSpawnSafe(c, ROWS - 2, COLS, ROWS, 'top')).toBe(false);
  });
});

describe('buildTiles', () => {
  it('sem caixotes (chance 0), a grade é só muralha e chão', () => {
    const { tiles, blockKeys } = buildTiles(COLS, ROWS, 0, () => false, () => 0.5);
    expect(blockKeys).toEqual([]);
    expect(tiles[0][0]).toBe(WALL);
    expect(tiles[3][3]).toBe(EMPTY);
  });

  it('com chance 1, todo chão fora da área segura vira caixote', () => {
    const safe = (x: number, y: number): boolean => isSpawnSafe(x, y, COLS, ROWS);
    const { tiles, blockKeys } = buildTiles(COLS, ROWS, 1, safe, () => 0);
    expect(tiles[3][3]).toBe(BLOCK);
    expect(tiles[1][1]).toBe(EMPTY); // área segura do nascimento
    expect(blockKeys).toContain(cellKey(3, 3));
    expect(blockKeys).not.toContain(cellKey(1, 1));
  });

  it('a chave de cada caixote bate com a posição na grade', () => {
    const { tiles, blockKeys } = buildTiles(COLS, ROWS, 0.5, () => false, () => 0.1);
    for (const key of blockKeys) {
      const [x, y] = key.split(',').map(Number);
      expect(tiles[y][x]).toBe(BLOCK);
    }
  });

  it('o sorteio é consumido uma vez por casa que não é muralha (ordem fixa)', () => {
    let calls = 0;
    buildTiles(COLS, ROWS, 0.5, () => false, () => { calls++; return 0.9; });
    const walls = (() => {
      let n = 0;
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (isWallCell(x, y, COLS, ROWS)) n++;
      return n;
    })();
    expect(calls).toBe(COLS * ROWS - walls);
  });
});

describe('porta e consultas', () => {
  it('a porta fica no canto de baixo à direita, dentro da muralha', () => {
    expect(doorCell(COLS, ROWS, true)).toEqual({ x: COLS - 2, y: ROWS - 2 });
  });

  it('sem porta (chefe), as coordenadas são -1, que nunca coincidem com uma casa', () => {
    expect(doorCell(COLS, ROWS, false)).toEqual({ x: -1, y: -1 });
  });

  it('tileAt devolve null fora da grade e o tipo dentro', () => {
    const { tiles } = buildTiles(COLS, ROWS, 0, () => false, () => 0.5);
    expect(tileAt(tiles, COLS, ROWS, -1, 0)).toBeNull();
    expect(tileAt(tiles, COLS, ROWS, COLS, 0)).toBeNull();
    expect(tileAt(tiles, COLS, ROWS, 0, 0)).toBe(WALL);
  });
});

describe('isPassable', () => {
  const free = { tile: EMPTY, bomb: false, doorClosed: false, rootedEnemy: false };

  it('chão livre é passável', () => {
    expect(isPassable(free)).toBe(true);
  });

  it('muralha, caixote, fora da grade, bomba, porta fechada e inimigo preso bloqueiam', () => {
    expect(isPassable({ ...free, tile: WALL })).toBe(false);
    expect(isPassable({ ...free, tile: BLOCK })).toBe(false);
    expect(isPassable({ ...free, tile: null })).toBe(false);
    expect(isPassable({ ...free, bomb: true })).toBe(false);
    expect(isPassable({ ...free, doorClosed: true })).toBe(false);
    expect(isPassable({ ...free, rootedEnemy: true })).toBe(false);
  });
});
