// Geometria dos sprites da Roo, sem dependência do Phaser (testável).

// Folga extra no topo da textura: orelhas e chapéu passam dos 40 px do tile e eram cortados.
export const ROO_HEAD_ROOM = 10;

// Origem vertical do sprite: o ponto da textura que coincide com o centro do tile.
export function rooOriginY(tile: number): number {
  return (tile / 2 + ROO_HEAD_ROOM) / (tile + ROO_HEAD_ROOM);
}

// Altura da textura da Roo.
export function rooTextureHeight(tile: number): number {
  return tile + ROO_HEAD_ROOM;
}

// Origem nos pés: serve para inclinar o corpo girando em torno do chão (menu).
export function rooFootOriginY(tile: number): number {
  const h = rooTextureHeight(tile);
  return (h - 3) / h;
}
