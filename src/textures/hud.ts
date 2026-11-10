// Ícones novos da HUD (não alteram nenhum sprite existente).
import Phaser from 'phaser';

type Gfx = Phaser.GameObjects.Graphics;

function heartShape(g: Gfx, grow: number): void {
  g.fillCircle(5.5, 5.5, 4.5 + grow);
  g.fillCircle(12.5, 5.5, 4.5 + grow);
  g.fillTriangle(0.8 - grow, 7.2, 17.2 + grow, 7.2, 9, 16.5 + grow);
}

export function drawHudIcons(g: Gfx): void {
  // coração cheio
  g.clear();
  g.fillStyle(0x7a1f2b); heartShape(g, 0.8);
  g.fillStyle(0xe53950); heartShape(g, 0);
  g.fillStyle(0xff8a96); g.fillCircle(4.5, 4, 1.6);
  g.generateTexture('hud_heart', 18, 18);

  // coração vazio
  g.clear();
  g.fillStyle(0x5b4d36); heartShape(g, 0.8);
  g.fillStyle(0x23282a); heartShape(g, 0);
  g.generateTexture('hud_heart_empty', 18, 18);

  // ampulheta
  g.clear();
  g.fillStyle(0xd9a441); g.fillRect(1, 0, 14, 2); g.fillRect(1, 18, 14, 2);
  g.fillStyle(0x74b9ff, 0.4); g.fillTriangle(2.5, 2, 13.5, 2, 8, 10); g.fillTriangle(8, 10, 2.5, 18, 13.5, 18);
  g.fillStyle(0xf0c674); g.fillTriangle(5, 4, 11, 4, 8, 8); g.fillTriangle(5.5, 18, 10.5, 18, 8, 13.5);
  g.generateTexture('hud_hourglass', 16, 20);
}
