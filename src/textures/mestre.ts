// O mestre, em sombra (desenhado por código, 40 px): o alquimista que nasceu na história antes do jogo e que o jogo
// só mostra como silhueta e voz. Capa e chapéu escuros, o rosto escondido na sombra da aba, um cajado e uma lanterna
// de luz quente na mão: está presente nas páginas dele, nunca em carne. Sem cruz (regra de conteúdo).
import type Phaser from 'phaser';
import type { MakeFn } from './make';

const OUT = 0x120c18;
const ROBE = 0x2c2140;
const ROBE_LIGHT = 0x3d2f58;
const HAT = 0x1f1630;

export function drawMestre(make: MakeFn): void {
  const frame = (v: 0 | 1) => (g: Phaser.GameObjects.Graphics, T: number): void => {
    const c = T / 2;
    g.fillStyle(0x000000, 0.25); g.fillEllipse(c, T - 3, 26, 5);
    // capa longa
    g.fillStyle(OUT); g.fillTriangle(c, 12, c - 15, T - 3, c + 15, T - 3);
    g.fillStyle(ROBE); g.fillTriangle(c, 13, c - 13.5, T - 4, c + 13.5, T - 4);
    g.fillStyle(ROBE_LIGHT); g.fillTriangle(c, 14, c - 3, T - 5, c - 12, T - 5);
    // cinto de cordão
    g.fillStyle(OUT); g.fillRect(c - 7, 25, 14, 2);
    g.fillStyle(0xb58a2f); g.fillRect(c - 6, 25.4, 12, 1);
    // ombros e capuz sobre o rosto
    g.fillStyle(OUT); g.fillCircle(c, 14, 8);
    g.fillStyle(ROBE); g.fillCircle(c, 14, 7);
    g.fillStyle(0x0b0710); g.fillEllipse(c, 15, 8, 6); // a sombra onde estaria o rosto
    // olhos: dois pontinhos de luz de vela (o segundo quadro pisca um deles)
    g.fillStyle(0xffd27a); g.fillRect(c - 3, 14, 1.6, 1.6); if (v === 0) g.fillRect(c + 1.6, 14, 1.6, 1.6);
    // chapéu alto de aba larga
    g.fillStyle(OUT); g.fillEllipse(c, 9, 24, 5); g.fillTriangle(c, -2, c - 8, 9, c + 8, 9);
    g.fillStyle(HAT); g.fillEllipse(c, 9, 22, 3.6); g.fillTriangle(c, -1, c - 7, 9, c + 7, 9);
    g.fillStyle(0xb58a2f); g.fillRect(c - 7, 7, 14, 1.4);
    // cajado à direita
    g.fillStyle(OUT); g.fillRect(c + 12, 12, 3, 25);
    g.fillStyle(0x6b4a30); g.fillRect(c + 12.6, 12, 1.8, 25);
    g.fillStyle(0xb58a2f); g.fillCircle(c + 13.5, 11, 2.2);
    // lanterna de luz quente na outra mão
    g.fillStyle(0xffa94d, 0.22 + 0.1 * v); g.fillCircle(c - 14, 28, 7);
    g.fillStyle(OUT); g.fillRect(c - 17, 24, 6, 8);
    g.fillStyle(0xffd27a); g.fillRect(c - 16, 25, 4, 6);
    g.fillStyle(0xfff3c4); g.fillRect(c - 15, 26, 2, 3);
    g.fillStyle(0xb58a2f); g.fillRect(c - 17, 23, 6, 1.5);
  };
  make('mestre_sombra_0', frame(0));
  make('mestre_sombra_1', frame(1));
}
