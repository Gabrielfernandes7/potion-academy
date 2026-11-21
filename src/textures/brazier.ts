// Braseiro das fases de braseiros (game/objective.ts): uma bacia de bronze sobre um pé de pedra, com carvão. Apagado,
// o carvão é escuro; aceso (brazier_on e brazier_on_1, que tremem), tem chama e um brilho no chão. 40 px.
import type Phaser from 'phaser';
import type { MakeFn } from './make';

type Gfx = Phaser.GameObjects.Graphics;

function brazier(g: Gfx, T: number, lit: 0 | 1 | 2): void {
  const c = T / 2;
  const OUT = 0x2a1a10;
  if (lit) { g.fillStyle(0xffa94d, 0.16); g.fillCircle(c, c + 2, 19); g.fillStyle(0xffd27a, 0.2); g.fillCircle(c, c + 2, 13); }
  g.fillStyle(0x000000, 0.28); g.fillEllipse(c, T - 4, 26, 6);
  // pé de pedra
  g.fillStyle(OUT); g.fillRect(c - 9, T - 9, 18, 6); g.fillRect(c - 4, 24, 8, 10);
  g.fillStyle(0x8a8a94); g.fillRect(c - 8, T - 8, 16, 4); g.fillStyle(0x6a6a76); g.fillRect(c - 3, 25, 6, 9);
  // bacia de bronze
  g.fillStyle(OUT); g.fillEllipse(c, 21, 28, 13);
  g.fillStyle(0xb58a2f); g.fillEllipse(c, 21, 26, 11);
  g.fillStyle(0xe6c15a); g.fillRect(c - 11, 19, 6, 2);
  g.fillStyle(0x7a5a1c); g.fillEllipse(c + 5, 24, 14, 4);
  // carvão
  g.fillStyle(lit ? 0xd6452f : 0x2b2b2f); g.fillEllipse(c, 18, 20, 6);
  g.fillStyle(lit ? 0xffa94d : 0x45454c); g.fillCircle(c - 4, 18, 1.6); g.fillCircle(c + 3, 17.5, 1.4);
  if (lit) {
    const w = lit === 1 ? 0 : 1.5; // a chama treme
    g.fillStyle(0xd6452f); g.fillTriangle(c - 7, 18, c + 7, 18, c + w, 3);
    g.fillStyle(0xffa94d); g.fillTriangle(c - 5, 18, c + 5, 18, c - w, 6);
    g.fillStyle(0xffe08a); g.fillTriangle(c - 2.5, 18, c + 2.5, 18, c + w * 0.5, 10);
  }
}

export function drawBraziers(make: MakeFn): void {
  make('brazier_off', (g, T) => brazier(g, T, 0));
  make('brazier_on', (g, T) => brazier(g, T, 1));
  make('brazier_on_1', (g, T) => brazier(g, T, 2));
}
