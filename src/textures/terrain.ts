// Texturas do cenário: chão, muralha, bloco, porta e explosão.
import type { MakeFn } from './make';

export function drawTerrain(make: MakeFn): void {
  make('floor1', (g, T) => {
    // Lajota de pedra úmida com musgo
    g.fillStyle(0x3b4a42); g.fillRect(0, 0, T, T);
    g.fillStyle(0x2b3731); g.fillRect(0, T / 2 - 1, T, 2); g.fillRect(T / 2 - 1, 0, 2, T / 2);
    g.fillStyle(0x4f6a58); g.fillCircle(T * 0.3, T * 0.75, 2); g.fillCircle(T * 0.7, T * 0.85, 1.5);
  });

  make('floor2', (g, T) => {
    g.fillStyle(0x33413a); g.fillRect(0, 0, T, T);
    g.fillStyle(0x27302b); g.fillRect(T / 2 - 1, T / 2, 2, T / 2); g.fillRect(T / 4, T / 2 - 1, T / 2, 2);
    g.fillStyle(0x44574c); g.fillCircle(T * 0.8, T * 0.25, 2);
  });

  make('wall', (g, T) => {
    // Muralha de pedra de castelo antigo
    g.fillStyle(0x3d3e47); g.fillRect(0, 0, T, T);
    g.fillStyle(0x2a2b33);
    for (let r = 0; r < 4; r++) {
      const y = r * (T / 4), off = (r % 2) * (T / 4);
      g.fillRect(0, y, T, 2);
      g.fillRect(off, y, 2, T / 4);
      g.fillRect(off + T / 2, y, 2, T / 4);
    }
    g.fillStyle(0x55576a); g.fillRect(2, 2, T - 4, 2);
    // runa esverdeada sutil
    g.fillStyle(0x8fc49a, 0.6); g.fillCircle(T / 2, T / 2, T / 10);
  });

  make('block', (g, T) => {
    // Bloco de madeira/magia (destrutível)
    g.fillStyle(0x8b7355); g.fillRect(0, 0, T, T);
    g.fillStyle(0xa89968); g.fillRect(3, 3, T - 6, T - 6);
    g.lineStyle(2, 0xc9d6df);
    g.beginPath(); g.moveTo(3, T / 2); g.lineTo(T - 3, T / 2);
    g.moveTo(T / 2, 3); g.lineTo(T / 2, T - 3); g.strokePath();
    g.fillStyle(0x6b5a3e);
    g.fillCircle(T / 2, T / 2, 2);
  });

  make('door_closed', (g, T) => {
    g.fillStyle(0x3a3a4a); g.fillRect(2, 2, T - 4, T - 4);
    g.fillStyle(0x2a2a3a); g.fillRect(4, 4, T - 8, T - 8);
    g.fillStyle(0x4a4a5a); g.fillRect(7, 7, T - 14, T - 14);
    g.fillStyle(0x3a3a4a); g.fillRect(T / 2 - 4, 7, 8, T - 14);
    g.fillStyle(0xc9d6df); g.fillCircle(T / 2 + 8, T / 2, 3);
  });

  make('door_open', (g, T) => {
    g.fillStyle(0x3a5a4a); g.fillRect(2, 2, T - 4, T - 4);
    g.fillStyle(0x2a4a3a); g.fillRect(4, 4, T - 8, T - 8);
    g.fillStyle(0x4a7a5a); g.fillRect(7, 7, T - 14, T - 14);
    g.fillStyle(0xc9d6df); g.fillCircle(T / 2, T / 2, 8);
    g.fillStyle(0xeef4f8); g.fillCircle(T / 2, T / 2, 4);
  });

  make('explosion', (g, T) => {
    g.fillStyle(0xe0e0e0); g.fillCircle(T / 2, T / 2, T / 2 - 2);
    g.fillStyle(0xf7f7f7); g.fillCircle(T / 2, T / 2, T / 2 - 8);
    g.fillStyle(0xffffff); g.fillCircle(T / 2, T / 2, T / 2 - 14);
  });
}
