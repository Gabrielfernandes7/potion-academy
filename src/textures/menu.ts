// Texturas auxiliares do menu (faísca, bolha, brilho), todas em pixels duros como o resto do jogo.
import Phaser from 'phaser';

type Gfx = Phaser.GameObjects.Graphics;

export function drawMenuTextures(g: Gfx): void {
  // faísca: losango pequeno
  g.clear();
  g.fillStyle(0xffffff);
  g.fillTriangle(4, 0, 8, 4, 4, 8);
  g.fillTriangle(4, 0, 0, 4, 4, 8);
  g.generateTexture('menu_spark', 8, 8);

  // bolha: anel de pixels com um brilho
  g.clear();
  g.fillStyle(0xffffff, 0.95);
  for (const [x, y] of [[4, 1], [5, 1], [6, 1], [7, 1], [2, 2], [3, 2], [8, 2], [9, 2], [1, 3], [10, 3], [1, 4], [10, 4],
    [1, 7], [10, 7], [1, 8], [10, 8], [2, 9], [3, 9], [8, 9], [9, 9], [4, 10], [5, 10], [6, 10], [7, 10]]) g.fillRect(x, y, 1, 1);
  g.fillStyle(0xffffff, 0.3);
  g.fillRect(3, 3, 6, 6);
  g.fillStyle(0xffffff, 0.9);
  g.fillRect(3, 3, 2, 2);
  g.generateTexture('menu_bubble', 12, 12);

  // brilho/fumaça em pixels: 16x16 células de 4 px, em quatro faixas de transparência (sem degradê suave)
  g.clear();
  const bands = [0.1, 0.2, 0.32, 0.45]; // da borda para o centro
  for (let cy = 0; cy < 16; cy++) {
    for (let cx = 0; cx < 16; cx++) {
      const d = Math.hypot(cx - 7.5, cy - 7.5) / 8; // 0 no centro, 1 na borda
      if (d >= 1) continue;
      const band = Math.min(bands.length - 1, Math.floor((1 - d) * bands.length));
      g.fillStyle(0xffffff, bands[band]);
      g.fillRect(cx * 4, cy * 4, 4, 4);
    }
  }
  g.generateTexture('menu_puff', 64, 64);
}
