// O selo da fraqueza: um selinho de pergaminho com o glifo alquímico do elemento que fere o inimigo, que fica sobre ele
// na partida (game/entities/badge.ts diz qual). Fogo e ar são triângulos para cima; água e terra, para baixo; ar e
// terra têm a barra. Sem ☿: o glifo do Mercúrio tem uma cruz, e a cruz não vai em inimigo (regra de fé do CLAUDE.md).
// Texturas: badge_fire, badge_water, badge_earth, badge_air (15 x 15 px).
import type Phaser from 'phaser';
import type { ElementId } from '../config';

type Gfx = Phaser.GameObjects.Graphics;

export const BADGE_SIZE = 15;
export const badgeKey = (el: ElementId): string => `badge_${el}`;

const UP = ['....#....', '...###...', '..#####..', '.#######.', '#########'];
const DOWN = ['#########', '.#######.', '..#####..', '...###...', '....#....'];
const GLYPH: Record<ElementId, { rows: string[]; bar: number | null; color: number }> = {
  fire: { rows: UP, bar: null, color: 0xd6452f },
  water: { rows: DOWN, bar: null, color: 0x2f6fa8 },
  earth: { rows: DOWN, bar: 1, color: 0x4d7a2e },
  air: { rows: UP, bar: 3, color: 0x6b7b8c },
};
const INK = 0x2a1a0e;

function drawBadge(g: Gfx, el: ElementId): void {
  const { rows, bar, color } = GLYPH[el];
  const mid = BADGE_SIZE / 2;
  g.fillStyle(0x3a2a1a); g.fillCircle(mid, mid, mid);
  g.fillStyle(0xf3e3b8); g.fillCircle(mid, mid, mid - 1);
  const ox = 3, oy = 5;
  // contorno escuro de 1 px em volta do triângulo, para ele se destacar do pergaminho
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch !== '#') return;
    g.fillStyle(INK);
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) g.fillRect(ox + x + dx, oy + y + dy, 1, 1);
  }));
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch !== '#') return;
    g.fillStyle(color);
    g.fillRect(ox + x, oy + y, 1, 1);
  }));
  // a barra do símbolo (terra e ar) atravessa o triângulo e passa das bordas
  if (bar !== null) { g.fillStyle(INK); g.fillRect(ox - 1, oy + bar, 11, 1); }
}

export function drawWeaknessBadges(scene: Phaser.Scene): void {
  const g = scene.make.graphics({}, false);
  for (const el of ['fire', 'water', 'earth', 'air'] as const) {
    g.clear();
    drawBadge(g, el);
    g.generateTexture(badgeKey(el), BADGE_SIZE, BADGE_SIZE);
  }
  g.destroy();
}
