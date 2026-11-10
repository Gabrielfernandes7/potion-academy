// Texturas auxiliares do menu: faísca, bolha e fumaça/brilho suave.
import Phaser from 'phaser';

type Gfx = Phaser.GameObjects.Graphics;

export function drawMenuTextures(g: Gfx): void {
  // faísca: losango pequeno
  g.clear();
  g.fillStyle(0xffffff);
  g.fillTriangle(4, 0, 8, 4, 4, 8);
  g.fillTriangle(4, 0, 0, 4, 4, 8);
  g.generateTexture('menu_spark', 8, 8);

  // bolha: anel claro com brilho
  g.clear();
  g.lineStyle(1.6, 0xffffff, 0.95);
  g.strokeCircle(6, 6, 4.4);
  g.fillStyle(0xffffff, 0.35);
  g.fillCircle(6, 6, 4);
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(4.6, 4.6, 1);
  g.generateTexture('menu_bubble', 12, 12);

  // brilho/fumaça: círculo macio (camadas de baixa opacidade)
  g.clear();
  for (let r = 30; r > 0; r -= 2) {
    g.fillStyle(0xffffff, 0.035);
    g.fillCircle(32, 32, r);
  }
  g.generateTexture('menu_puff', 64, 64);
}
