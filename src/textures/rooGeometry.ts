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

// Posição da mão na pose 'stir', relativa ao ponto de origem do sprite (em px da textura).
export const ROO_STIR_HAND = { x: 15.5, y: 5 };
