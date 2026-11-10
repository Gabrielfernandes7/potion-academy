// Texturas de inimigo e itens coletáveis.
//
// Os 4 power-ups (+frasco, +raio, +velocidade, +tempo) são "fichas" redondas com aro colorido e um
// símbolo no centro; moeda, gema, coração e baú são itens soltos. Assim, de longe, dá para
// distinguir o que melhora a personagem do que é só recompensa.
import type { DrawFn, MakeFn } from './make';
import { GARDEN_PALETTE as P } from './gardenPalette';

type Gfx = Parameters<DrawFn>[0];

export const POWERUP_COLORS = {
  bomb_up: 0xb39ddb, // lilás
  fire_up: 0xff8a65, // laranja
  speed_up: 0x4dd0e1, // ciano
  time_up: 0xfff59d, // amarelo claro
} as const;

// Ficha redonda: sombra, aro colorido, miolo escuro e um reflexo de vidro.
function token(g: Gfx, rim: number): void {
  g.fillStyle(0x000000, 0.28);
  g.fillCircle(20, 22.5, 16);
  g.fillStyle(rim, 1);
  g.fillCircle(20, 20, 16);
  g.fillStyle(0x1b211f, 1);
  g.fillCircle(20, 20, 13.5);
  g.fillStyle(rim, 0.16);
  g.fillCircle(20, 20, 13.5);
  g.fillStyle(0xffffff, 0.13);
  g.fillEllipse(15.5, 12.5, 12, 5.5);
}

function heart(g: Gfx, cx: number, cy: number, s: number, fill: number): void {
  g.fillStyle(fill, 1);
  g.fillCircle(cx - 6 * s, cy - 3 * s, 6.2 * s);
  g.fillCircle(cx + 6 * s, cy - 3 * s, 6.2 * s);
  g.fillTriangle(cx - 12 * s, cy - 0.5 * s, cx + 12 * s, cy - 0.5 * s, cx, cy + 13 * s);
}

export function drawEntities(make: MakeFn): void {
  // Sapo mago (inimigo da fase 1): corpo verde com contorno escuro, olhos saltados, chapéu roxo
  // com faixa dourada e estrela, e um cajado com orbe. Desenhado em 40 px (T).
  make('enemy', (g, T) => {
    const c = T / 2;
    const OUT = 0x1b3d1f; // contorno escuro: dá leitura de longe
    g.fillStyle(0x000000, 0.25); g.fillEllipse(c, T - 4, 24, 6);
    // pernas traseiras, com contorno
    g.fillStyle(OUT); g.fillEllipse(9, T - 7, 9, 6); g.fillEllipse(T - 9, T - 7, 9, 6);
    g.fillStyle(0x2e7d32); g.fillEllipse(9, T - 7, 7.5, 4.5); g.fillEllipse(T - 9, T - 7, 7.5, 4.5);
    // corpo: contorno, pele e sombra na lateral
    g.fillStyle(OUT); g.fillEllipse(c, c + 5, 28, 22);
    g.fillStyle(0x4caf50); g.fillEllipse(c, c + 5, 26, 20);
    g.fillStyle(0x388e3c); g.fillEllipse(c + 7, c + 8, 10, 12);
    // barriga clara
    g.fillStyle(0xc5e1a5); g.fillEllipse(c, c + 9, 16, 10);
    // manchinhas
    g.fillStyle(0x2e7d32); g.fillCircle(11, c + 1, 1.5); g.fillCircle(29, c + 3, 1.5); g.fillCircle(21, c + 12, 1.2);
    // olhos saltados, com contorno e brilho
    g.fillStyle(OUT); g.fillCircle(13, 18, 6.5); g.fillCircle(27, 18, 6.5);
    g.fillStyle(0x7cb342); g.fillCircle(13, 18, 5.5); g.fillCircle(27, 18, 5.5);
    g.fillStyle(0xffffff); g.fillCircle(13, 17.5, 4); g.fillCircle(27, 17.5, 4);
    g.fillStyle(0x1b1b1b); g.fillCircle(14, 18, 2); g.fillCircle(28, 18, 2);
    g.fillStyle(0xffffff); g.fillCircle(12.5, 16.5, 0.9); g.fillCircle(26.5, 16.5, 0.9);
    // boca com sorriso
    g.fillStyle(OUT); g.fillRect(14, c + 9, 12, 2);
    // chapéu de mago: aba, cone, faixa dourada e estrela
    g.fillStyle(OUT); g.fillEllipse(c, 13, 26, 6);
    g.fillStyle(0x4a148c); g.fillEllipse(c, 13, 24, 4);
    g.fillStyle(0x6a1b9a); g.fillTriangle(c, 0, c - 9, 13, c + 9, 13);
    g.fillStyle(0x4a148c); g.fillTriangle(c + 3, 0, c + 9, 13, c + 4, 13);
    g.fillStyle(0xffd54f); g.fillRect(c - 8, 11, 16, 2);
    g.fillStyle(0xffd54f); g.fillCircle(c + 1, 7, 1.8);
    g.fillStyle(0xffffff, 0.8); g.fillCircle(c - 3, 4, 0.9);
    // cajado com orbe na mão direita
    g.fillStyle(OUT); g.fillRect(T - 6, 17, 3.5, 20);
    g.fillStyle(0x8d6e63); g.fillRect(T - 5.5, 17, 2.5, 20);
    g.fillStyle(0x4dd0e1); g.fillCircle(T - 4.2, 15, 3);
    g.fillStyle(0xe0f7fa); g.fillCircle(T - 5, 14, 1);
  });

  // Fantasma (inimigo de fases avançadas): atravessa obstáculos, mas se move devagar.
  // Meio transparente, com a barra de baixo ondulada.
  make('enemy_ghost', (g, T) => {
    const c = T / 2;
    g.fillStyle(0x9fa8da, 0.35); g.fillCircle(c, c - 2, T / 2 - 1);
    g.fillStyle(0xe8eaf6, 0.9); g.fillEllipse(c, 16, 26, 24); g.fillRect(7, 16, 26, 15);
    // barra ondulada
    g.fillCircle(9, 31, 4); g.fillCircle(c, 32, 4); g.fillCircle(31, 31, 4);
    g.fillStyle(0xe8eaf6, 0.9); g.fillRect(9, 26, 22, 6);
    // olhos e boca
    g.fillStyle(0x263238); g.fillEllipse(15, 16, 4, 5.5); g.fillEllipse(25, 16, 4, 5.5);
    g.fillStyle(0xffffff); g.fillCircle(15.8, 14.8, 1); g.fillCircle(25.8, 14.8, 1);
    g.fillStyle(0x263238); g.fillEllipse(c, 23, 4, 3);
  });

  // Flor do mal (inimigo do jardim): fixa no chão, pétalas escuras, olhos vermelhos e dentes.
  make('enemy_flower', (g, T) => {
    const c = T / 2;
    const hy = 14; // centro da cabeça
    g.fillStyle(0x000000, 0.25); g.fillEllipse(c, T - 4, 22, 5);
    g.fillStyle(0x4e342e); g.fillEllipse(c, T - 6, 20, 8); // monte de terra
    // caule com espinhos e duas folhas
    g.fillStyle(P.stemDark); g.fillRect(c - 3, hy + 6, 6, T - hy - 12);
    g.fillStyle(P.stem); g.fillRect(c - 2, hy + 6, 4, T - hy - 12);
    g.fillStyle(P.stemDark);
    g.fillTriangle(c - 3, 26, c - 8, 24, c - 3, 29);
    g.fillTriangle(c + 3, 30, c + 8, 28, c + 3, 33);
    g.fillStyle(P.stem); g.fillEllipse(c - 9, 30, 11, 5); g.fillEllipse(c + 9, 27, 11, 5);
    // pétalas (8), alternando dois tons
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      g.fillStyle(P.petalOutline); g.fillCircle(c + Math.cos(a) * 9, hy + Math.sin(a) * 9, 5.4);
      g.fillStyle(i % 2 === 0 ? P.petalA : P.petalB); g.fillCircle(c + Math.cos(a) * 9, hy + Math.sin(a) * 9, 4.4);
    }
    // miolo escuro com cara brava
    g.fillStyle(P.petalOutline); g.fillCircle(c, hy, 7.6);
    g.fillStyle(P.petalCore); g.fillCircle(c, hy, 6.4);
    g.fillStyle(0xff1744); g.fillCircle(c - 2.8, hy - 1.6, 1.9); g.fillCircle(c + 2.8, hy - 1.6, 1.9);
    g.fillStyle(0xffffff); g.fillCircle(c - 2.4, hy - 2, 0.6); g.fillCircle(c + 3.2, hy - 2, 0.6);
    g.lineStyle(1.3, 0x2a0a2e);
    g.beginPath(); g.moveTo(c - 5, hy - 4.8); g.lineTo(c - 1, hy - 2.6);
    g.moveTo(c + 5, hy - 4.8); g.lineTo(c + 1, hy - 2.6); g.strokePath();
    // boca com dentes
    g.fillStyle(0x1a0a1a); g.fillRect(c - 3.6, hy + 2.2, 7.2, 2.6);
    g.fillStyle(0xffffff);
    g.fillTriangle(c - 3.4, hy + 2.2, c - 1.6, hy + 2.2, c - 2.5, hy + 4.4);
    g.fillTriangle(c - 0.9, hy + 2.2, c + 0.9, hy + 2.2, c, hy + 4.4);
    g.fillTriangle(c + 1.6, hy + 2.2, c + 3.4, hy + 2.2, c + 2.5, hy + 4.4);
  });

  // ------------------------------------------------------------ itens soltos

  make('pickup_coin', g => {
    // moeda de POÇÃO: ouro com um frasco gravado
    g.fillStyle(0x000000, 0.25); g.fillCircle(20, 22, 12.5);
    g.fillStyle(0xb8862b); g.fillCircle(20, 20, 12.5);
    g.fillStyle(0xffd54f); g.fillCircle(20, 20, 10.5);
    g.fillStyle(0xffe58a); g.fillEllipse(16, 15, 9, 4);
    g.fillStyle(0xb8862b);
    g.fillRect(18.6, 12, 2.8, 3.5);
    g.fillTriangle(18.6, 15, 21.4, 15, 25, 25);
    g.fillTriangle(18.6, 15, 15, 25, 25, 25);
    g.fillStyle(0xffd54f);
    g.fillTriangle(18.4, 20.5, 21.6, 20.5, 23.5, 24.2);
    g.fillTriangle(18.4, 20.5, 16.5, 24.2, 23.5, 24.2);
  });

  make('pickup_gem', g => {
    // gema facetada
    g.fillStyle(0x000000, 0.25); g.fillEllipse(20, 33, 18, 4);
    g.fillStyle(0x4dd0e1); g.fillTriangle(20, 6, 31, 16, 9, 16);
    g.fillStyle(0x80deea); g.fillTriangle(20, 6, 9, 16, 20, 16);
    g.fillStyle(0x26c6da); g.fillTriangle(20, 6, 31, 16, 20, 16);
    g.fillStyle(0x00acc1); g.fillTriangle(9, 16, 20, 16, 20, 33);
    g.fillStyle(0x00838f); g.fillTriangle(31, 16, 20, 16, 20, 33);
    g.fillStyle(0xe0f7fa); g.fillTriangle(15, 11, 18, 9, 16.5, 14);
    g.fillStyle(0xffffff, 0.9); g.fillCircle(14.5, 12.5, 1.1);
  });

  make('pickup_chest', g => {
    // baú de tesouro com cinta de metal e fechadura dourada
    g.fillStyle(0x000000, 0.25); g.fillEllipse(20, 33, 28, 4.5);
    g.fillStyle(0x6b4a3b); g.fillRect(7, 19, 26, 13);
    g.fillStyle(0x8d6e63); g.fillRect(8, 20, 24, 11);
    g.fillStyle(0x6b4a3b); g.fillRect(8, 24.5, 24, 1.3);
    g.fillStyle(0x6b4a3b); g.fillRect(7, 11, 26, 9);
    g.fillStyle(0xa1887f); g.fillRect(8, 12, 24, 7);
    g.fillStyle(0xc4a99b); g.fillRect(8, 12, 24, 2);
    g.fillStyle(0x5d5f6a); g.fillRect(11, 11, 3.5, 21); g.fillRect(25.5, 11, 3.5, 21);
    g.fillStyle(0x8a8c98); g.fillRect(11, 11, 1.2, 21); g.fillRect(25.5, 11, 1.2, 21);
    g.fillStyle(0xb8862b); g.fillRect(17, 17.5, 6, 6.5);
    g.fillStyle(0xffd54f); g.fillRect(17.8, 18.3, 4.4, 5);
    g.fillStyle(0x4a3a28); g.fillRect(19.3, 19.8, 1.4, 2.6);
  });

  make('pickup_heart', g => {
    // coração brilhante (mesmo desenho do coração da HUD)
    g.fillStyle(0x000000, 0.25); g.fillEllipse(20, 34, 18, 4);
    heart(g, 20, 17, 1.18, 0x7a1f2b);
    heart(g, 20, 17, 1.05, 0xe53950);
    g.fillStyle(0xff8a96); g.fillEllipse(13.5, 11.5, 6.5, 4.5);
    g.fillStyle(0xffffff, 0.85); g.fillCircle(12.5, 10.8, 1.2);
  });

  // ------------------------------------------------------------ power-ups

  make('pickup_bomb_up', g => {
    // +frasco: frasco Erlenmeyer lilás com um selo de "+"
    token(g, POWERUP_COLORS.bomb_up);
    g.fillStyle(0x8b6f47); g.fillRect(16.8, 9.5, 4.4, 2.6);
    g.fillStyle(0xdfe6e9); g.fillRect(17.6, 11.6, 2.8, 4.2);
    g.fillStyle(0xdfe6e9);
    g.fillTriangle(17.6, 15, 20.4, 15, 27, 29.5);
    g.fillTriangle(17.6, 15, 11, 29.5, 27, 29.5);
    g.fillStyle(0xb39ddb);
    g.fillTriangle(14.2, 23.5, 23.8, 23.5, 27, 29.5);
    g.fillTriangle(14.2, 23.5, 11.8, 29.5, 27, 29.5);
    g.fillStyle(0xffffff, 0.8); g.fillCircle(17, 27, 1); g.fillCircle(21, 25.5, 0.8);
    // selo "+"
    g.fillStyle(0x2e7d32); g.fillCircle(30, 10.5, 5.2);
    g.fillStyle(0x66bb6a); g.fillCircle(30, 10.5, 4.2);
    g.fillStyle(0xffffff); g.fillRect(27.5, 9.7, 5, 1.7); g.fillRect(29.15, 8, 1.7, 5);
  });

  make('pickup_fire_up', g => {
    // +raio: chama de três camadas
    token(g, POWERUP_COLORS.fire_up);
    g.fillStyle(0xff5722);
    g.fillTriangle(20, 7.5, 28.5, 24, 11.5, 24);
    g.fillCircle(20, 24, 8.5);
    g.fillStyle(0xff9800);
    g.fillTriangle(20, 13, 26, 25, 14, 25);
    g.fillCircle(20, 25, 6);
    g.fillStyle(0xffeb3b);
    g.fillTriangle(20, 18, 23.8, 27, 16.2, 27);
    g.fillCircle(20, 26.5, 3.6);
    g.fillStyle(0xffffff, 0.9); g.fillCircle(20, 27.2, 1.6);
    // faíscas
    g.fillStyle(0xffd54f); g.fillCircle(11, 11, 1.1); g.fillCircle(29.5, 14, 1); g.fillCircle(27, 8.5, 0.8);
  });

  make('pickup_speed_up', g => {
    // +velocidade: raio com linhas de movimento
    token(g, POWERUP_COLORS.speed_up);
    g.fillStyle(0x4dd0e1, 0.55);
    g.fillRect(7.5, 15, 6, 1.7); g.fillRect(9, 20, 6, 1.7); g.fillRect(7.5, 25, 6, 1.7);
    g.fillStyle(0x00acc1);
    g.fillTriangle(24, 7.5, 14.5, 21.5, 20, 21.5);
    g.fillTriangle(20, 21.5, 17.5, 33, 27.5, 17.5);
    g.fillTriangle(27.5, 17.5, 21.5, 17.5, 20, 21.5);
    g.fillStyle(0xb2ebf2);
    g.fillTriangle(23.4, 9.5, 16.5, 20.3, 20.8, 20.3);
    g.fillTriangle(20.8, 21, 19, 30, 26, 18.7);
    g.fillStyle(0xffffff, 0.85); g.fillCircle(21.5, 12.5, 1);
  });

  make('pickup_time_up', g => {
    // +tempo: ampulheta dourada (igual à da HUD)
    token(g, POWERUP_COLORS.time_up);
    g.fillStyle(0xd9a441); g.fillRect(12.5, 8.5, 15, 2.8); g.fillRect(12.5, 28.7, 15, 2.8);
    g.fillStyle(0xf0c674); g.fillRect(12.5, 8.5, 15, 1.1); g.fillRect(12.5, 28.7, 15, 1.1);
    g.fillStyle(0x74b9ff, 0.45);
    g.fillTriangle(14.5, 11.3, 25.5, 11.3, 20, 19.7);
    g.fillTriangle(20, 20.3, 14.5, 28.7, 25.5, 28.7);
    g.fillStyle(0xf0c674);
    g.fillTriangle(16.5, 12.5, 23.5, 12.5, 20, 17);
    g.fillTriangle(20, 21.5, 16, 28.5, 24, 28.5);
    g.fillRect(19.4, 18, 1.2, 3.5);
    g.fillStyle(0xffffff, 0.35); g.fillRect(15.5, 12.6, 1.2, 4);
  });
}
