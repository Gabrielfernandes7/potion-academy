// Blocos destrutíveis de cada fase, desenhados por código (40x40, pixel art sem degradê). Cada fase usa um
// estilo próprio (ver game/stages/blockStyles.ts): o caixote de madeira ('block') e o canteiro do jardim
// ('g_block') ficam em terrain.ts e garden.ts; aqui estão os outros nove.
import type { MakeFn } from './make';

export function drawBlocks(make: MakeFn): void {
  // sal: cristais rosados, da fase do Salão dos Ecos
  make('block_salt', (g, T) => {
    g.fillStyle(0xb9aab5); g.fillRect(0, 0, T, T);
    g.fillStyle(0xe9e0e4); g.fillRect(3, 3, T - 6, T - 6);
    g.fillStyle(0xf8f2f5);
    g.fillTriangle(5, T - 5, 13, 8, 21, T - 5);
    g.fillTriangle(17, T - 5, 26, 12, 35, T - 5);
    g.fillStyle(0xcfc1cb);
    g.fillTriangle(13, 8, 21, T - 5, 13, T - 5);
    g.fillTriangle(26, 12, 35, T - 5, 26, T - 5);
    g.fillStyle(0xffffff); g.fillRect(12, 12, 2, 2); g.fillRect(27, 16, 2, 2); g.fillRect(20, 28, 2, 2);
  });

  // madeira com musgo, da charneca úmida
  make('block_moss', (g, T) => {
    g.fillStyle(0x5d5a3c); g.fillRect(0, 0, T, T);
    g.fillStyle(0x8a8556); g.fillRect(3, 3, T - 6, T - 6);
    g.fillStyle(0x4b4a30); g.fillRect(3, T / 3 + 1, T - 6, 2); g.fillRect(3, (2 * T) / 3 - 1, T - 6, 2);
    g.fillStyle(0x5f8a3c);
    g.fillRect(3, 3, 14, 5); g.fillRect(22, 3, 10, 4); g.fillRect(3, 8, 6, 5); g.fillRect(28, 28, 9, 6); g.fillRect(8, 30, 8, 4);
    g.fillStyle(0x9bc86b); g.fillRect(6, 4, 4, 2); g.fillRect(24, 4, 4, 2);
  });

  // barril de azougue (mercúrio), do poço da Quimera
  make('block_barrel', (g, T) => {
    g.fillStyle(0x37474f); g.fillRect(0, 0, T, T);
    g.fillStyle(0x78909c); g.fillRoundedRect(4, 2, T - 8, T - 4, 9);
    g.fillStyle(0xb0bec5); g.fillRoundedRect(8, 4, 10, T - 8, 5);
    g.fillStyle(0x455a64); g.fillRect(4, 10, T - 8, 3); g.fillRect(4, T - 13, T - 8, 3);
    g.fillStyle(0xe3f2fd); g.fillCircle(T - 12, T - 8, 3); g.fillTriangle(T - 15, T - 9, T - 9, T - 9, T - 12, T - 16);
    g.fillStyle(0xffffff); g.fillRect(11, 7, 2, 4);
  });

  // laje de pedra com runa, da Torre
  make('block_slab', (g, T) => {
    g.fillStyle(0x4a4e5e); g.fillRect(0, 0, T, T);
    g.fillStyle(0x7d8397); g.fillRect(3, 3, T - 6, T - 6);
    g.fillStyle(0x969cb0); g.fillRect(3, 3, T - 6, 4);
    g.lineStyle(1.5, 0x4a4e5e);
    g.beginPath(); g.moveTo(9, T - 4); g.lineTo(15, 20); g.lineTo(12, 14); g.strokePath();
    // brasão alquímico: círculo com um triângulo dentro (nada em forma de cruz)
    g.lineStyle(2, 0x8fd0ff); g.strokeCircle(T / 2, T / 2 + 1, 8);
    g.strokeTriangle(T / 2, T / 2 - 4, T / 2 - 4.5, T / 2 + 5, T / 2 + 4.5, T / 2 + 5);
  });

  // caixote lacrado com cera vermelha, do Corredor dos Selos
  make('block_wax', (g, T) => {
    g.fillStyle(0x6b5a3e); g.fillRect(0, 0, T, T);
    g.fillStyle(0xa08c5e); g.fillRect(3, 3, T - 6, T - 6);
    g.fillStyle(0x6b5a3e); g.fillRect(3, T / 3 + 1, T - 6, 2); g.fillRect(3, (2 * T) / 3 - 1, T - 6, 2);
    g.fillStyle(0xd9cfa8); g.fillRect(5, T / 2 - 1, T - 10, 2); // cordão
    g.fillStyle(0x8e1b14); g.fillCircle(T / 2, T / 2, 8);
    g.fillStyle(0xc0352b); g.fillCircle(T / 2 - 1, T / 2 - 1, 6.5);
    g.lineStyle(1.5, 0x8e1b14); g.strokeCircle(T / 2 - 1, T / 2 - 1, 3.6); // selo: anel e ponto
    g.fillStyle(0x8e1b14); g.fillCircle(T / 2 - 1, T / 2 - 1, 1.2);
  });

  // caixa de frascos que brilham, da Antecâmara
  make('block_flasks', (g, T) => {
    g.fillStyle(0x3d2f24); g.fillRect(0, 0, T, T);
    g.fillStyle(0x5a4636); g.fillRect(3, 3, T - 6, T - 6);
    g.fillStyle(0x2b2119); g.fillRect(5, 18, T - 10, 2);
    const flasks: Array<[number, number, number]> = [[12, 13, 0x80d8ff], [20, 11, 0xffd54f], [28, 13, 0x9be564], [12, 30, 0xff8a80], [20, 28, 0xce93d8], [28, 30, 0x80d8ff]];
    for (const [x, y, c] of flasks) {
      g.fillStyle(c); g.fillCircle(x, y + 3, 4);
      g.fillStyle(0xe8f1f2); g.fillRect(x - 1, y - 5, 2, 5);
      g.fillStyle(0xffffff); g.fillRect(x - 2, y + 1, 1, 2);
    }
  });

  // pilha de pergaminhos enrolados, do duelo (as páginas que Belladona rasurou)
  make('block_scroll', (g, T) => {
    g.fillStyle(0x6b5a3e); g.fillRect(0, 0, T, T);
    g.fillStyle(0x8c7a52); g.fillRect(3, 3, T - 6, T - 6);
    // fitas vermelhas em posições diferentes em cada rolo: nenhuma coluna que cruze os rolos
    for (const [y, c, rx] of [[6, 0xe8d6a8, 13], [16, 0xdcc994, 26], [26, 0xe8d6a8, 18]] as Array<[number, number, number]>) {
      g.fillStyle(c); g.fillRoundedRect(5, y, T - 10, 9, 4);
      g.fillStyle(0xb89f66); g.fillCircle(8, y + 4.5, 3.4); g.fillCircle(T - 8, y + 4.5, 3.4);
      g.fillStyle(0xc0392b); g.fillRect(rx, y, 3, 9);
    }
  });

  // pilha de livros acorrentados, da Biblioteca Proibida (por ora só na Arena)
  make('block_books', (g, T) => {
    g.fillStyle(0x3b2a1e); g.fillRect(0, 0, T, T);
    g.fillStyle(0x5a4030); g.fillRect(3, 3, T - 6, T - 6);
    const rows: Array<[number, number, number]> = [[5, 0x7a2f22, 0xc9962a], [15, 0x2f5d6b, 0xe8d6a8], [25, 0x4d6b2f, 0xc9962a]];
    for (const [y, c, trim] of rows) {
      g.fillStyle(c); g.fillRoundedRect(5, y, T - 10, 9, 2);
      g.fillStyle(trim); g.fillRect(8, y, 2, 9); g.fillRect(T - 11, y, 2, 9);
      g.fillStyle(0xe8d6a8); g.fillRect(6, y + 8, T - 12, 1.5);
    }
    // uma corrente horizontal com cadeado (nada cruzado)
    g.fillStyle(0x2a2a38);
    for (let x = 4; x < T - 4; x += 6) g.fillRoundedRect(x, T / 2 - 1.5, 5, 3, 1.5);
    g.fillStyle(0xc9962a); g.fillRoundedRect(T / 2 - 4, T / 2 - 2, 8, 7, 1.5);
    g.lineStyle(1.6, 0xc9962a); g.beginPath(); g.arc(T / 2, T / 2 - 2, 2.8, Math.PI, 0, false); g.strokePath();
  });

  // fardo de feno, da estrada
  make('block_hay', (g, T) => {
    g.fillStyle(0x8c6d1f); g.fillRect(0, 0, T, T);
    g.fillStyle(0xe0c25a); g.fillRect(3, 3, T - 6, T - 6);
    g.fillStyle(0xb8942e);
    for (const y of [8, 14, 20, 26, 32]) g.fillRect(5 + (y % 12), y, 14, 1.5);
    for (const y of [11, 17, 23, 29]) g.fillRect(18 + (y % 7), y, 14, 1.5);
    g.fillStyle(0x7a5a2a); g.fillRect(11, 3, 3, T - 6); g.fillRect(T - 14, 3, 3, T - 6);
  });

  // pilha de pedras do riacho, da ponte
  make('block_cairn', (g, T) => {
    g.fillStyle(0x4f4f49); g.fillRect(0, 0, T, T);
    g.fillStyle(0x76766e); g.fillRect(3, 3, T - 6, T - 6);
    const rocks: Array<[number, number, number, number, number]> = [[12, 30, 18, 11, 0x9a9a90], [28, 31, 15, 9, 0x8a8a80], [20, 20, 16, 10, 0xa8a89c], [20, 11, 10, 8, 0xb5b5a8]];
    for (const [x, y, w, h, c] of rocks) {
      g.fillStyle(0x3c3c37); g.fillEllipse(x, y + 1, w + 2, h + 2);
      g.fillStyle(c); g.fillEllipse(x, y, w, h);
    }
    g.fillStyle(0xdadacb); g.fillRect(17, 8, 3, 2);
  });

  // tijolos do mosteiro, dos muros
  make('block_brick', (g, T) => {
    g.fillStyle(0xd7c9a8); g.fillRect(0, 0, T, T);
    for (let row = 0; row < 5; row++) {
      const y = 2 + row * 7.2;
      const off = row % 2 === 0 ? 0 : 9;
      for (let x = -off; x < T; x += 18) {
        g.fillStyle(row % 2 === 0 ? 0xa0522d : 0x8f4a2a);
        g.fillRect(Math.max(2, x + 1), y, Math.min(T - 2, x + 17) - Math.max(2, x + 1), 6);
        g.fillStyle(0xbf6a3c); g.fillRect(Math.max(2, x + 1), y, Math.min(T - 2, x + 17) - Math.max(2, x + 1), 1.5);
      }
    }
  });
}
