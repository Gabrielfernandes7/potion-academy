// Texturas do jardim (fase 4): grama, sebe, canteiro de flores e portão.
// Mesmas regras do cenário do castelo: 40 x 40 px, desenhadas em camadas, sem imagens prontas.
import type { MakeFn } from './make';

// Pontos fixos (sem sorteio): o desenho é sempre igual, e o catálogo mostra o mesmo que o jogo.
const BLADES_A: Array<[number, number]> = [[5, 9], [14, 28], [24, 6], [31, 19], [9, 34], [35, 33], [20, 21]];
const BLADES_B: Array<[number, number]> = [[8, 16], [18, 5], [28, 30], [34, 10], [12, 36], [4, 26], [26, 18]];

export function drawGarden(make: MakeFn): void {
  const grass = (base: number, blade: number, light: number, points: Array<[number, number]>): ((g: Parameters<Parameters<MakeFn>[1]>[0], T: number) => void) =>
    (g, T) => {
      g.fillStyle(base); g.fillRect(0, 0, T, T);
      g.fillStyle(blade);
      for (const [x, y] of points) g.fillTriangle(x, y, x + 2, y, x + 1, y - 5);
      g.fillStyle(light);
      for (const [x, y] of points.slice(0, 4)) g.fillTriangle(x + 3, y + 1, x + 5, y + 1, x + 4, y - 3);
    };

  make('g_floor1', (g, T) => {
    grass(0x4e8a3a, 0x356b2a, 0x6fae52, BLADES_A)(g, T);
    g.fillStyle(0xffffff); g.fillCircle(T * 0.72, T * 0.7, 1.4);
    g.fillStyle(0xffeb3b); g.fillCircle(T * 0.2, T * 0.45, 1.2);
  });

  make('g_floor2', (g, T) => {
    grass(0x477f35, 0x2f6226, 0x65a24c, BLADES_B)(g, T);
    g.fillStyle(0xf8bbd0); g.fillCircle(T * 0.35, T * 0.82, 1.4);
  });

  make('g_wall', (g, T) => {
    // sebe alta e densa, de folhagem em camadas
    g.fillStyle(0x1b4527); g.fillRect(0, 0, T, T);
    const puffs: Array<[number, number, number]> = [
      [9, 9, 9], [23, 8, 9], [33, 14, 8], [8, 24, 9], [21, 22, 10], [33, 29, 9], [12, 35, 8], [27, 36, 8],
    ];
    g.fillStyle(0x2e7d32);
    for (const [x, y, r] of puffs) g.fillCircle(x, y, r);
    g.fillStyle(0x388e3c);
    for (const [x, y, r] of puffs) g.fillCircle(x - 1.5, y - 1.5, r * 0.62);
    g.fillStyle(0x66bb6a, 0.8);
    for (const [x, y, r] of puffs) g.fillCircle(x - 3, y - 3, r * 0.22);
    g.fillStyle(0xd81b60); g.fillCircle(30, 20, 1.6); g.fillCircle(14, 30, 1.4);
  });

  make('g_block', (g, T) => {
    // canteiro de madeira com flores (destrutível)
    g.fillStyle(0x3e2723); g.fillRect(2, 15, T - 4, T - 17);
    g.fillStyle(0x8d6e63); g.fillRect(4, 17, T - 8, T - 21);
    g.fillStyle(0xa1887f); g.fillRect(4, 17, T - 8, 3);
    g.fillStyle(0x5d4037); g.fillRect(T / 2 - 1, 20, 2, T - 24);
    // terra e folhagem
    g.fillStyle(0x4e342e); g.fillRect(4, 12, T - 8, 6);
    g.fillStyle(0x388e3c);
    g.fillCircle(11, 12, 5); g.fillCircle(20, 9, 6); g.fillCircle(29, 12, 5);
    // flores
    const flowers: Array<[number, number, number]> = [[11, 9, 0xf48fb1], [20, 5, 0xfff176], [29, 9, 0xce93d8]];
    for (const [x, y, color] of flowers) {
      g.fillStyle(color); g.fillCircle(x, y, 3.4);
      g.fillStyle(0xfff59d); g.fillCircle(x, y, 1.3);
    }
  });

  make('gate_closed', (g, T) => {
    // portão de madeira com ferragens, preso por um cadeado
    g.fillStyle(0x3e2723); g.fillRect(2, 2, T - 4, T - 4);
    g.fillStyle(0x6d4c41); g.fillRect(4, 4, T - 8, T - 8);
    g.fillStyle(0x4e342e);
    for (const x of [12, 19, 26]) g.fillRect(x, 4, 1.5, T - 8);
    g.fillStyle(0x455a64); g.fillRect(4, 10, T - 8, 3); g.fillRect(4, T - 14, T - 8, 3);
    g.fillStyle(0xffd54f); g.fillRoundedRect(T / 2 - 4, T / 2 - 3, 8, 7, 1.5);
    g.lineStyle(1.6, 0xffd54f); g.beginPath(); g.arc(T / 2, T / 2 - 3, 3, Math.PI, 0, false); g.strokePath();
  });

  make('gate_open', (g, T) => {
    // portão aberto: luz verde-clara no vão
    g.fillStyle(0x3e2723); g.fillRect(2, 2, T - 4, T - 4);
    g.fillStyle(0x2e7d32); g.fillRect(4, 4, T - 8, T - 8);
    g.fillStyle(0x81c784); g.fillRect(7, 7, T - 14, T - 14);
    g.fillStyle(0xc5e1a5); g.fillCircle(T / 2, T / 2, 8);
    g.fillStyle(0xf1f8e9); g.fillCircle(T / 2, T / 2, 4);
    g.fillStyle(0x6d4c41); g.fillRect(2, 2, 5, T - 4); g.fillRect(T - 7, 2, 5, T - 4); // folhas abertas
  });
}
