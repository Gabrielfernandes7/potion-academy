// Poções (bombas): um frasco de formato diferente para cada elemento, para se reconhecer de longe.
//   bomb_normal (fogo)  : balão de fundo redondo, líquido vermelho com brasas
//   bomb_mega   (água)  : tubo alto, líquido azul com onda e gotas
//   bomb_pierce (terra) : pote largo com cristais verdes
//   bomb_remote (éter)  : frasco em losango com névoa lilás e estrelas
import type { DrawFn, MakeFn } from './make';

type Gfx = Parameters<DrawFn>[0];

const GLASS = 0xe8f1f2;
const OUTLINE = 0xcfd8dc;

function cork(g: Gfx, x: number, y: number, w: number, h: number, color = 0x8b6f47): void {
  g.fillStyle(color); g.fillRect(x, y, w, h);
  g.fillStyle(0xffffff, 0.25); g.fillRect(x, y, w, 1.2);
  g.fillStyle(0x000000, 0.2); g.fillRect(x, y + h - 1.2, w, 1.2);
}

function fire(g: Gfx): void {
  // balão de fundo redondo
  g.fillStyle(GLASS, 0.92); g.fillRect(17, 10, 6, 10);
  g.fillCircle(20, 27, 11);
  // líquido: segmento circular abaixo da corda y = 24
  g.fillStyle(0xff6b6b);
  g.beginPath(); g.arc(20, 27.5, 9.6, -0.373, Math.PI + 0.373, false); g.closePath(); g.fillPath();
  g.fillStyle(0xffa94d);
  g.beginPath(); g.arc(20, 29, 7, -0.2, Math.PI + 0.2, false); g.closePath(); g.fillPath();
  g.lineStyle(1.4, 0xffd8a8); g.lineBetween(11.4, 24, 28.6, 24);
  // brasas e chama dentro do vidro
  g.fillStyle(0xffd54f); g.fillCircle(17, 27, 1.1); g.fillCircle(23.5, 29.5, 1); g.fillCircle(21, 26, 0.8);
  g.fillStyle(0xffe082); g.fillTriangle(20, 19, 18, 23.5, 22, 23.5);
  // contorno e brilho
  g.lineStyle(1.4, OUTLINE); g.strokeCircle(20, 27, 11);
  g.lineBetween(17, 10, 17, 17); g.lineBetween(23, 10, 23, 17);
  g.fillStyle(0xdfe9ee); g.fillRect(15.5, 8, 9, 2.5);
  cork(g, 17, 4, 6, 5);
  g.fillStyle(0xffffff, 0.75); g.fillEllipse(14.8, 23, 2.6, 6);
  g.lineStyle(1, 0x8a2b2b); g.strokeTriangle(20, 28, 17.6, 32, 22.4, 32); // runa do fogo
}

function water(g: Gfx): void {
  // tubo alto
  g.fillStyle(GLASS, 0.92); g.fillRect(17.5, 8, 5, 8);
  g.fillRoundedRect(13, 14, 14, 22, 5);
  g.fillStyle(0x4aa8ff); g.fillRoundedRect(14.5, 20.5, 11, 14, 4);
  g.fillStyle(0xa8e6f5); g.fillEllipse(20, 20.8, 11, 3.2); // crista da onda
  g.fillStyle(0x7cc4ff); g.fillRoundedRect(14.5, 27, 11, 7.5, 3);
  // bolhas e gotas
  g.fillStyle(0xffffff, 0.85); g.fillCircle(17.6, 26, 1.2); g.fillCircle(22.4, 29, 1); g.fillCircle(19.5, 31.8, 0.8);
  g.lineStyle(1, 0xffffff, 0.8); g.strokeCircle(22.2, 24.4, 1.3);
  // contorno e brilho
  g.lineStyle(1.4, OUTLINE); g.strokeRoundedRect(13, 14, 14, 22, 5);
  g.lineBetween(17.5, 8, 17.5, 14.5); g.lineBetween(22.5, 8, 22.5, 14.5);
  cork(g, 17, 4.5, 6, 4, 0x9aa5ad);
  g.lineStyle(1.6, 0xffffff, 0.7); g.lineBetween(15.7, 17.5, 15.7, 31);
  g.lineStyle(1, 0x1f5fa8); g.strokeTriangle(17.8, 27, 22.2, 27, 20, 31); // runa da água (▽)
}

function earth(g: Gfx): void {
  // pote largo com tampa
  g.fillStyle(GLASS, 0.92); g.fillRoundedRect(9, 17, 22, 18, 4);
  g.fillRect(12.5, 14, 15, 5);
  g.fillStyle(0x6bb36f); g.fillRoundedRect(10.5, 21.5, 19, 12, 3);
  g.fillStyle(0x8fcf92); g.fillRect(10.8, 21.5, 18.4, 2);
  // cristais
  g.fillStyle(0xc8e6c9); g.fillTriangle(15, 33, 17.5, 25, 20, 33);
  g.fillStyle(0x9ccc65); g.fillTriangle(20, 33, 23, 24, 26, 33);
  g.fillStyle(0xe8f5e9); g.fillTriangle(15, 33, 17.5, 25, 17.5, 33);
  g.fillStyle(0x2e6b32, 0.5); g.fillCircle(13, 30, 0.9); g.fillCircle(27.5, 29, 0.9); g.fillCircle(22, 27, 0.7);
  // contorno, tampa e brilho
  g.lineStyle(1.4, OUTLINE); g.strokeRoundedRect(9, 17, 22, 18, 4);
  cork(g, 11.5, 9.5, 17, 5.5, 0x6d4c41);
  g.fillStyle(0x4e342e); g.fillRect(11.5, 12, 17, 1.4);
  g.lineStyle(1.6, 0xffffff, 0.7); g.lineBetween(11.4, 20, 11.4, 31);
  g.lineStyle(1, 0x2e6b32); g.strokeTriangle(20, 18.2, 17.8, 20.4, 22.2, 20.4); // runa da terra
}

function air(g: Gfx): void {
  // frasco em losango com gargalo prateado
  g.fillStyle(GLASS, 0.92);
  g.fillTriangle(20, 13, 31, 25, 20, 36);
  g.fillTriangle(20, 13, 9, 25, 20, 36);
  g.fillRect(18, 8, 4, 6);
  // névoa
  g.fillStyle(0xc5b3ff, 0.9);
  g.fillTriangle(20, 17, 27.5, 25, 20, 32.5);
  g.fillTriangle(20, 17, 12.5, 25, 20, 32.5);
  g.fillStyle(0xffffff, 0.75);
  g.fillTriangle(20, 20.5, 24, 25, 20, 29.5);
  g.fillTriangle(20, 20.5, 16, 25, 20, 29.5);
  // estrelinhas
  g.fillStyle(0xffffff);
  g.fillRect(15.4, 22.2, 2.6, 0.9); g.fillRect(16.25, 21.4, 0.9, 2.6);
  g.fillRect(23.4, 27.2, 2.2, 0.8); g.fillRect(24.1, 26.5, 0.8, 2.2);
  // contorno
  g.lineStyle(1.4, OUTLINE);
  g.lineBetween(20, 13, 31, 25); g.lineBetween(31, 25, 20, 36);
  g.lineBetween(20, 36, 9, 25); g.lineBetween(9, 25, 20, 13);
  g.lineBetween(18, 8, 18, 13.5); g.lineBetween(22, 8, 22, 13.5);
  // rolha prateada
  g.fillStyle(0xb0bec5); g.fillCircle(20, 6, 3.2);
  g.fillStyle(0xeceff1); g.fillCircle(19, 5, 1.2);
  g.lineStyle(1.6, 0xffffff, 0.7); g.lineBetween(13.2, 23.5, 17.4, 18.5);
  g.lineStyle(1, 0x7e57c2); g.strokeCircle(20, 25, 3.6); // runa do éter
}

export function drawPotions(make: MakeFn): void {
  make('bomb_normal', fire);
  make('bomb_mega', water);
  make('bomb_pierce', earth);
  make('bomb_remote', air);
}
