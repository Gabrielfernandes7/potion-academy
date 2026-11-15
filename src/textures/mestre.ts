// O mestre, em sombra (desenhado por código, 40 px): o alquimista que nasceu na história antes do jogo e que o jogo
// só mostra como silhueta e voz. Chapéu alto de ponta dobrada, capuz que esconde o rosto (só dois pontos de luz de vela),
// capa de barra rasgada com runas, livro no cinto, cajado com um cristal que pulsa e uma lanterna pendurada numa corrente.
// Está presente nas páginas dele, nunca em carne. Pixel art em retângulos de 1 px. Sem cruz (regra de conteúdo).
import type Phaser from 'phaser';
import type { MakeFn } from './make';

const OUT = 0x120c18;
const ROBE = 0x2c2140;
const ROBE_LIGHT = 0x3d2f58;
const ROBE_DARK = 0x1d1530;
const HAT = 0x1f1630;
const HAT_LIGHT = 0x2e2246;
const GOLD = 0xb58a2f;
const GOLD_LIGHT = 0xe0b955;
const WOOD = 0x6b4a30;
const CRYSTAL = 0x9a7cf0;
const FLAME = 0xffd27a;

export function drawMestre(make: MakeFn): void {
  const frame = (v: 0 | 1) => (g: Phaser.GameObjects.Graphics, T: number): void => {
    const c = T / 2;
    const px = (x: number, y: number, w: number, h: number, color: number, a = 1): void => {
      g.fillStyle(color, a); g.fillRect(Math.round(x), Math.round(y), w, h);
    };

    // chão: sombra
    g.fillStyle(0x000000, 0.28); g.fillEllipse(c, T - 3, 28, 5);

    // capa longa: degraus de 1 px, mais larga embaixo; contorno, tecido, luz à esquerda, dobras
    for (let y = 17; y <= 35; y++) {
      const half = 6 + Math.floor((y - 17) * 0.62);
      px(c - half - 1, y, half * 2 + 2, 1, OUT);
      px(c - half, y, half * 2, 1, ROBE);
      px(c - half, y, Math.max(2, Math.floor(half / 2.4)), 1, ROBE_LIGHT);
      px(c + half - 2, y, 2, 1, ROBE_DARK);
    }
    for (const dx of [-5, 1, 6]) px(c + dx, 27, 1, 8, ROBE_DARK); // dobras do pano
    // barra rasgada: dentes que balançam entre os dois quadros
    for (let i = -8; i <= 8; i += 3) {
      const down = (i + 8) % 6 === 0 ? 1 + v : 0;
      px(c + i - 1, 35, 3, 1 + down, OUT);
      px(c + i, 35, 1, down, ROBE_DARK);
    }
    // runas no fio da barra: pontinhos de ouro (nada de cruz)
    for (let i = -8; i <= 8; i += 4) px(c + i, 33, 1, 1, GOLD, 0.8);
    px(c - 6, 31, 1, 1, GOLD, 0.6); px(c + 5, 31, 1, 1, GOLD, 0.6);

    // cinto de cordão e o livro preso a ele
    px(c - 8, 24, 16, 2, OUT);
    px(c - 7, 24, 14, 1, GOLD);
    px(c - 7, 25, 14, 1, 0x7d5c1c);
    px(c + 4, 25, 5, 7, OUT);
    px(c + 5, 26, 3, 5, WOOD);
    px(c + 5, 26, 3, 1, 0x8c6240);
    px(c + 6, 28, 1, 1, GOLD_LIGHT); // fecho do livro

    // ombros
    px(c - 9, 17, 18, 3, OUT);
    px(c - 8, 17, 16, 3, ROBE);
    px(c - 8, 17, 4, 1, ROBE_LIGHT);

    // braço direito: manga ao cajado; mão de sombra
    px(c + 8, 18, 5, 8, OUT); px(c + 9, 18, 3, 7, ROBE);
    px(c + 9, 18, 1, 7, ROBE_LIGHT);
    px(c + 11, 24, 4, 3, OUT); px(c + 12, 25, 2, 1, 0x4a3a66);

    // capuz: contorno, pano, o buraco escuro do rosto e os dois pontos de luz
    g.fillStyle(OUT); g.fillEllipse(c, 16, 17, 13);
    g.fillStyle(ROBE); g.fillEllipse(c, 16, 15, 11);
    px(c - 6, 13, 3, 1, ROBE_LIGHT);
    g.fillStyle(0x0b0710); g.fillEllipse(c, 17, 9, 8);
    px(c - 3, 16, 2, 2, FLAME);
    if (v === 0) px(c + 2, 16, 2, 2, FLAME); else px(c + 2, 17, 2, 1, FLAME); // o segundo quadro pisca um olho
    px(c - 3, 16, 1, 1, 0xfff3c4);

    // chapéu: aba larga, cone alto com a ponta dobrada, fita de ouro com uma lua e estrelinhas
    g.fillStyle(OUT); g.fillEllipse(c, 11, 28, 6);
    g.fillStyle(HAT); g.fillEllipse(c, 11, 26, 4.4);
    px(c - 11, 11, 5, 1, HAT_LIGHT);
    for (let y = 2; y <= 10; y++) { // cone
      const half = 3 + Math.floor((y - 2) * 0.55);
      px(c - half - 1 - 1, y, half * 2 + 4, 1, OUT);
      px(c - half - 1, y, half * 2 + 2, 1, HAT);
      px(c - half - 1, y, 2, 1, HAT_LIGHT);
    }
    px(c + 1, 0, 4, 3, OUT); px(c + 2, 1, 3, 1, HAT); // ponta dobrada para a direita
    px(c + 5, 1, 2, 3, OUT); px(c + 5, 2, 1, 1, HAT);
    px(c - 7, 8, 14, 2, OUT); px(c - 6, 8, 12, 1, GOLD); px(c - 6, 9, 12, 1, 0x7d5c1c);
    px(c - 1, 8, 3, 2, GOLD_LIGHT); px(c + 1, 8, 1, 1, HAT); // lua minguante na fita
    px(c - 3, 5, 1, 1, GOLD_LIGHT, 0.9); px(c + 2, 4, 1, 1, GOLD_LIGHT, 0.7); px(c - 1, 6, 1, 1, GOLD_LIGHT, 0.6);

    // cajado à direita: haste, nó de ouro e cristal que pulsa
    px(c + 13, 9, 3, 28, OUT);
    px(c + 14, 9, 1, 28, WOOD);
    px(c + 13, 20, 3, 2, GOLD);
    g.fillStyle(CRYSTAL, 0.2 + 0.12 * v); g.fillCircle(c + 14.5, 5, 4.5);
    g.fillStyle(OUT); g.fillTriangle(c + 14.5, -1, c + 11, 5, c + 18, 5); g.fillTriangle(c + 14.5, 11, c + 11, 5, c + 18, 5);
    g.fillStyle(CRYSTAL); g.fillTriangle(c + 14.5, 0, c + 12, 5, c + 17, 5); g.fillTriangle(c + 14.5, 10, c + 12, 5, c + 17, 5);
    px(c + 13, 4, 1, 2, 0xe3d6ff);

    // braço esquerdo e a lanterna na corrente
    px(c - 14, 19, 6, 6, OUT); px(c - 13, 19, 4, 5, ROBE);
    px(c - 13, 19, 1, 5, ROBE_LIGHT);
    px(c - 15, 24, 4, 3, OUT); px(c - 14, 25, 2, 1, 0x4a3a66);
    px(c - 14, 27, 1, 3, GOLD); // corrente
    g.fillStyle(0xffa94d, 0.2 + 0.1 * v); g.fillCircle(c - 11, 32, 5);
    px(c - 17, 29, 7, 1, GOLD); // topo
    px(c - 17, 30, 7, 7, OUT);
    px(c - 16, 30, 5, 6, 0x6b4a30);
    px(c - 15, 31, 3, 4 + v, FLAME);
    px(c - 14, 32, 1, 2, 0xfff3c4);
    px(c - 17, 36, 7, 1, GOLD);
  };
  make('mestre_sombra_0', frame(0));
  make('mestre_sombra_1', frame(1));
}
