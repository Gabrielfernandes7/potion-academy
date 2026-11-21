// O círculo alquímico que se abre sob os pés da Roo ao se transformar (uma textura por elemento, 40 px): dois anéis, doze
// marcas e, nos quatro pontos, o glifo do elemento. Sem cruz: os glifos são triângulos (fogo e ar para cima, água e terra
// para baixo; ar e terra com a barra) e as marcas são pontos. Chaves: fx_circle_fire|water|earth|air.
import type Phaser from 'phaser';
import type { ElementId } from '../config';
import type { MakeFn } from './make';

type Gfx = Phaser.GameObjects.Graphics;

const COLOR: Record<ElementId, [number, number]> = {
  fire: [0xff8a3c, 0xffd27a],
  water: [0x4aa8e8, 0xbfe6ff],
  earth: [0x9a7c44, 0xe0c27c],
  air: [0xcfe3f2, 0xffffff],
};

function circle(g: Gfx, T: number, el: ElementId): void {
  const c = T / 2;
  const [mid, hi] = COLOR[el];
  g.lineStyle(2, 0x1b120a, 0.9); g.strokeCircle(c, c, 18.5);
  g.lineStyle(2, mid, 1); g.strokeCircle(c, c, 18);
  g.lineStyle(1, hi, 0.9); g.strokeCircle(c, c, 13);
  // doze pontos entre os anéis, como as marcas de um relógio de sol
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    g.fillStyle(hi, 1); g.fillRect(Math.round(c + Math.cos(a) * 15.5) - 1, Math.round(c + Math.sin(a) * 15.5) - 1, 2, 2);
  }
  // o glifo do elemento no centro e um ponto em cada ponta
  const up = el === 'fire' || el === 'air';
  const s = 5;
  g.fillStyle(mid, 1);
  if (up) g.fillTriangle(c, c - s, c - s, c + s - 1, c + s, c + s - 1); else g.fillTriangle(c - s, c - s + 1, c + s, c - s + 1, c, c + s);
  if (el === 'earth' || el === 'air') { g.fillStyle(0x1b120a, 1); g.fillRect(c - s - 2, c, 2 * s + 4, 1); }
  g.fillStyle(hi, 1);
  for (const [dx, dy] of [[0, -18], [18, 0], [0, 18], [-18, 0]]) g.fillRect(c + dx - 1, c + dy - 1, 3, 3);
}

export function drawTransformCircles(make: MakeFn): void {
  for (const el of ['fire', 'water', 'earth', 'air'] as const) make(`fx_circle_${el}`, (g, T) => circle(g, T, el));
}
