// Texturas de inimigo e itens coletáveis.
import type { MakeFn } from './make';

export function drawEntities(make: MakeFn): void {
  make('enemy', (g, T) => {
    // Criatura alquímica (espírito da magia)
    g.fillStyle(0x3f6b5a); g.fillEllipse(T / 2, T / 2 + 4, T - 16, T - 12);
    g.fillStyle(0x8fc4a6); g.fillEllipse(T / 2, T / 2 + 2, T - 24, T - 20);
    g.fillStyle(0x23382f); g.fillRect(8, T - 10, 8, 4); g.fillRect(T - 16, T - 10, 8, 4);
    // olhos
    g.fillStyle(0xffffff); g.fillCircle(T / 2 - 6, T / 2 - 4, 5); g.fillCircle(T / 2 + 6, T / 2 - 4, 5);
    g.fillStyle(0x1f3a2c); g.fillCircle(T / 2 - 6, T / 2 - 4, 2.5); g.fillCircle(T / 2 + 6, T / 2 - 4, 2.5);
    // boca mágica
    g.fillStyle(0xd6f5e0); g.fillRect(T / 2 - 6, T / 2 + 8, 12, 3);
  });

  make('pickup_coin', (g, T) => {
    g.fillStyle(0xffd54f); g.fillCircle(T / 2, T / 2, T / 2 - 10);
    g.fillStyle(0xffb300); g.fillCircle(T / 2, T / 2, T / 2 - 14);
    g.lineStyle(2, 0xfff59d);
    g.beginPath(); g.moveTo(T / 2, T / 2 - 8); g.lineTo(T / 2, T / 2 + 8); g.strokePath();
  });

  make('pickup_gem', (g, T) => {
    g.fillStyle(0x4dd0e1); g.fillTriangle(T / 2, 6, T - 10, T / 2, T / 2, T - 6); g.fillTriangle(T / 2, 6, 10, T / 2, T / 2, T - 6);
    g.fillStyle(0xb2ebf2); g.fillTriangle(T / 2, 12, T - 14, T / 2, T / 2, T - 12);
  });

  make('pickup_chest', (g, T) => {
    g.fillStyle(0x8d6e63); g.fillRect(4, T / 2 - 4, T - 8, T / 2 - 4);
    g.fillStyle(0xa1887f); g.fillRect(4, T / 2 - 4, T - 8, 6);
    g.fillStyle(0xffd54f); g.fillRect(T / 2 - 4, T / 2, 8, 6);
  });

  make('pickup_heart', (g, T) => {
    g.fillStyle(0xff1744); g.fillCircle(T / 2, T / 2, T / 2 - 6);
    g.fillStyle(0xff8a80); g.fillCircle(T / 2 - 4, T / 2 - 4, 3);
  });

  make('pickup_bomb_up', (g, T) => {
    g.fillStyle(0x1b1f27); g.fillRect(0, 0, T, T);
    g.fillStyle(0x2c323d); g.fillCircle(T / 2, T / 2, T / 2 - 4);
    g.fillStyle(0x000000); g.fillCircle(T / 2, T / 2 + 1, T / 2 - 8);
    g.fillStyle(0x4caf50);
    g.fillRect(T / 2 - 2, 8, 4, T - 16);
    g.fillRect(8, T / 2 - 2, T - 16, 4);
  });

  make('pickup_fire_up', (g, T) => {
    g.fillStyle(0x1b1f27); g.fillRect(0, 0, T, T);
    g.fillStyle(0xff5722); g.fillTriangle(T / 2, 4, T - 6, T - 6, 6, T - 6);
    g.fillStyle(0xff9800); g.fillTriangle(T / 2, 12, T - 12, T - 8, 12, T - 8);
    g.fillStyle(0xffeb3b); g.fillTriangle(T / 2, 20, T - 16, T - 10, 16, T - 10);
  });

  make('pickup_speed_up', (g, T) => {
    g.fillStyle(0x1b1f27); g.fillRect(0, 0, T, T);
    g.fillStyle(0x00bcd4); g.fillTriangle(8, 8, T - 8, T / 2, 8, T - 8);
    g.fillStyle(0xb2ebf2); g.fillTriangle(14, 12, T - 14, T / 2, 14, T - 12);
  });

  make('pickup_time_up', (g, T) => {
    g.fillStyle(0x1b1f27); g.fillRect(0, 0, T, T);
    g.fillStyle(0xffeb3b); g.fillCircle(T / 2, T / 2, T / 2 - 6);
    g.fillStyle(0xffffff); g.fillCircle(T / 2, T / 2, T / 2 - 10);
    g.lineStyle(3, 0x111111);
    g.beginPath();
    g.moveTo(T / 2, T / 2); g.lineTo(T / 2, T / 2 - 8);
    g.moveTo(T / 2, T / 2); g.lineTo(T / 2 + 6, T / 2 + 2);
    g.strokePath();
  });
}
