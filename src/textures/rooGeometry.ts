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

// Pontos da pose 'stir' em px da textura: ombro e mão em repouso. O braço não está no sprite:
// a cena do menu o desenha ligando o ombro à mão, que acompanha a varinha.
export function rooStirPoints(tile: number): { shoulder: { x: number; y: number }; hand: { x: number; y: number } } {
  const cx = tile / 2;
  const cy = tile / 2 + 1 + ROO_HEAD_ROOM;
  return { shoulder: { x: cx + 5, y: cy + 1 }, hand: { x: cx + 15.5, y: cy + 4 } };
}
