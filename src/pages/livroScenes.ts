// As 12 gravuras animadas do Livro de Roo (uma por abertura de src/game/livro.ts). Cada cena é uma função
// (contexto, tempo em segundos, sprites do jogo) que pinta o quadro inteiro num canvas de W x H em pixel art.
// Os personagens são os do próprio jogo (texturas de generateTextures); o resto é desenhado aqui, em blocos inteiros.
// Nenhuma cena põe cruz em objeto, criatura ou ficha (CLAUDE.md, "Respeito à fé"): a única, minúscula, está na torre do
// sino do mosteiro, onde a regra a permite.
import type { CenaId } from '../game/livro';
import {
  COR, H, IRIS, W, bolha, brilho, chamaDeVela, disco, estrelas, faixas, moldura, rect, sorteio, sprite, subindo, vela,
  type Ctx, type Sprites,
} from './livroDraw';

export type Cena = (c: Ctx, t: number, s: Sprites) => void;

const frame = (t: number, n: number, fps: number): number => Math.floor(t * fps) % n;

// ---------------------------------------------------------------- peças do laboratório (usadas em várias cenas)

function paredeDeTijolos(c: Ctx, y1: number): void {
  rect(c, 0, 0, W, y1, COR.tijolo);
  for (let y = 0; y < y1; y += 8) {
    for (let x = (y / 8) % 2 === 0 ? 0 : -8; x < W; x += 16) {
      rect(c, x, y, 15, 7, COR.tijoloClaro, 0.45);
      rect(c, x + 1, y + 1, 13, 1, '#7a4a30', 0.3);
    }
  }
}

function chaoDeTabuas(c: Ctx, y0: number): void {
  rect(c, 0, y0, W, H - y0, '#2a1a12');
  for (let i = 0; i < 6; i++) rect(c, 0, y0 + 4 + i * 6, W, 1, '#1a100a');
  for (let x = 0; x < W; x += 22) rect(c, x, y0, 1, H - y0, '#1a100a', 0.6);
}

function frasco(c: Ctx, x: number, y: number, cor: string, t: number, bolhas = false): void {
  rect(c, x - 1, y - 9, 3, 3, '#d9c9a0'); // gargalo
  rect(c, x - 4, y - 6, 9, 7, '#bfd7e0', 0.35);
  rect(c, x - 4, y - 3, 9, 4, cor, 0.9);
  rect(c, x - 3, y - 5, 1, 5, '#ffffff', 0.5);
  if (bolhas) rect(c, x + Math.round(Math.sin(t * 3 + x) * 1), y - 3 - Math.round((t * 4 + x) % 4), 1, 1, '#ffffff', 0.7);
}

function prateleira(c: Ctx, y: number, t: number): void {
  rect(c, 8, y, W - 16, 3, COR.madeira);
  rect(c, 8, y, W - 16, 1, COR.madeiraClara);
  const cores = ['#e2573b', '#4fb0e8', '#7fc55a', '#c9a0ff', '#ffd14d'];
  for (let i = 0; i < 9; i++) frasco(c, 20 + i * 20, y, cores[i % cores.length], t, i % 3 === 0);
}

function alambique(c: Ctx, x: number, y: number, t: number): void {
  rect(c, x - 10, y, 20, 3, '#4a3a2a'); // o fogareiro
  disco(c, x, y - 10, 9, '#6a4a30');
  disco(c, x, y - 10, 8, '#c27a3a');
  rect(c, x - 8, y - 12, 16, 6, '#4fdc8a', 0.85); // o líquido
  for (let i = 0; i < 4; i++) rect(c, x - 6 + i * 4 + Math.round(Math.sin(t * 5 + i) * 1), y - 13 - ((t * 7 + i * 3) % 5), 1, 1, '#c8ffe0', 0.9);
  rect(c, x - 2, y - 24, 4, 8, '#9a6a3a'); // o pescoço
  rect(c, x + 2, y - 26, 14, 3, '#9a6a3a'); // o tubo
  rect(c, x + 14, y - 26, 3, 14, '#9a6a3a');
  frasco(c, x + 16, y - 8, '#9ff0ff', t, true);
  subindo(c, x, y - 24, t, 6, 12, '#d8f3ff', 4, 2.5);
  chamaDeVela(c, x, y + 1, t, 0.6, false);
}

function laboratorio(c: Ctx, t: number, velas: ReadonlyArray<readonly [number, number, number]>): void {
  faixas(c, 0, 4, [COR.noite0]);
  paredeDeTijolos(c, 104);
  prateleira(c, 40, t);
  chaoDeTabuas(c, 104);
  rect(c, 0, 100, W, 5, COR.madeira); // rodapé
  for (const [x, y, alt] of velas) vela(c, x, y, t, alt);
  // a luz das velas na parede
  for (const [x, y, alt] of velas) brilho(c, x, y - alt, 48, COR.chama, 0.035, 4);
}

// ---------------------------------------------------------------- as cenas

const capa: Cena = (c, t) => {
  faixas(c, 0, H, [COR.noite0, COR.noite1, COR.noite1, COR.noite2, COR.noite2, '#1d3047']);
  estrelas(c, t, 11, 46, 90);
  const cx = W / 2;
  // a serpente do ciclo: um anel de escamas que gira, mordendo a própria cauda
  const n = 44;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + t * 0.35;
    const x = cx + Math.cos(a) * 52;
    const y = 66 + Math.sin(a) * 52;
    rect(c, x - 2, y - 2, 5, 5, i % 2 ? '#2c7d70' : COR.verde);
    rect(c, x - 1, y - 1, 3, 3, i % 3 ? COR.ouroClaro : '#e0c070', 0.9);
  }
  const ha = t * 0.35; // a cabeça
  disco(c, cx + Math.cos(ha) * 52, 66 + Math.sin(ha) * 52, 4, COR.verde);
  rect(c, cx + Math.cos(ha) * 52 - 1, 66 + Math.sin(ha) * 52 - 1, 2, 2, COR.ouroClaro);
  // os quatro elementos nos pontos cardeais (fogo, água, terra, ar): triângulos de ouro
  const gl = (x: number, y: number, up: boolean, barra: boolean): void => {
    for (let i = 0; i < 6; i++) rect(c, x - i, up ? y - 6 + i : y + 6 - i, i * 2 + 1, 1, COR.ouro);
    if (barra) rect(c, x - 7, y, 15, 1, COR.ouroClaro);
  };
  gl(cx, 16, true, false); gl(cx, 118, false, false); gl(cx - 66, 67, false, true); gl(cx + 66, 67, true, true);
  // a vela e a bolha que sobe dela
  vela(c, cx, 134, t, 14, 1.4);
  const fase = (t / 7) % 1;
  bolha(c, cx + Math.sin(t * 1.4) * 5, 116 - fase * 58, 13 + fase * 10, t);
  moldura(c);
};

const fome: Cena = (c, t, s) => {
  faixas(c, 0, 96, ['#1a1830', '#2a2040', '#4a2a48', '#7a3a4a', '#b8584a', '#e08a4a']);
  disco(c, 150, 38, 12, '#f6e6b8');
  disco(c, 154, 35, 11, '#f0d8a0', 0.5);
  // colinas e o mosteiro ao longe, com uma única janela acesa
  rect(c, 0, 82, W, 20, '#2a1a28');
  for (let x = 0; x < W; x += 2) rect(c, x, 78 + Math.round(Math.sin(x / 19) * 4 + Math.sin(x / 7) * 1.5), 2, 12, '#34202e');
  rect(c, 30, 62, 26, 20, '#1c1220');
  rect(c, 36, 54, 6, 10, '#1c1220');
  rect(c, 38, 50, 2, 6, '#1c1220'); rect(c, 36, 52, 6, 2, '#1c1220'); // a cruz da torre do sino
  rect(c, 43, 68, 3, 4, '#ffd27a', 0.8 + 0.2 * Math.sin(t * 4)); // a janela acesa
  subindo(c, 51, 62, t, 5, 14, '#8a7a8a', 3, 4);
  // o trigo seco: hastes que balançam e espigas caídas
  const r = sorteio(5);
  rect(c, 0, 102, W, 48, '#3a2a1a');
  for (let i = 0; i < 90; i++) {
    const x = Math.floor(r() * W);
    const h = 14 + Math.floor(r() * 16);
    const base = 104 + Math.floor(r() * 36);
    const sway = Math.round(Math.sin(t * 1.3 + x * 0.3) * 1.5);
    rect(c, x, base - h, 1, h, '#8a6a30');
    rect(c, x + sway, base - h - 3, 2, 4, '#a88a40');
    rect(c, x + sway + 1, base - h - 1, 2, 2, '#6a5020'); // a espiga tombada
  }
  // um pão pequeno sobre um pano, e uma sombra comprida: a fome tem rosto
  rect(c, 150, 128, 30, 3, '#d9c9a0');
  disco(c, 165, 126, 5, '#a9703a'); rect(c, 160, 126, 11, 3, '#a9703a'); rect(c, 162, 123, 6, 1, '#d9a45a');
  void s;
  moldura(c);
};

const laboratorioCena: Cena = (c, t, s) => {
  laboratorio(c, t, [[24, 96, 9], [172, 96, 12], [100, 72, 8]]);
  // a mesa com o caderno e o alambique que borbulha
  rect(c, 70, 94, 100, 6, COR.madeiraClara);
  rect(c, 70, 99, 100, 14, COR.madeira);
  rect(c, 76, 112, 5, 14, '#3a2414'); rect(c, 160, 112, 5, 14, '#3a2414');
  alambique(c, 138, 94, t);
  rect(c, 86, 90, 18, 4, '#e9d9b0'); rect(c, 88, 88, 14, 2, '#cdb07a'); // o caderno aberto
  rect(c, 90, 91, 10, 1, COR.tinta, 0.5);
  vela(c, 114, 94, t, 6);
  // o mestre, em sombra, com a lanterna, debruçado
  const bob = Math.round(Math.sin(t * 1.6));
  sprite(c, s[`mestre_sombra_${frame(t, 4, 1.3)}`], 30, 44 + bob, 2);
  brilho(c, 40, 120 + bob, 20, COR.chama, 0.06, 4);
  moldura(c);
};

const bolhaCena: Cena = (c, t, s) => {
  laboratorio(c, t, [[20, 98, 9], [176, 98, 11], [62, 98, 6], [140, 98, 7]]);
  // a capa pendurada num gancho, à direita
  rect(c, 168, 32, 2, 4, '#7a6a50');
  rect(c, 160, 36, 18, 36, '#3a1a60'); rect(c, 160, 36, 18, 3, '#d9a441'); rect(c, 164, 44, 8, 6, '#4a2878');
  // a bolha com a Roo bebê dentro (a mesma do jogo, 16 quadros em laço), flutuando à luz das velas
  const bob = Math.sin(t * 1.5) * 3;
  const img = s[`roo_bubble_fetal_${frame(t, 16, 10)}`];
  brilho(c, 100, 66 + bob, 60, IRIS[Math.floor(t) % IRIS.length], 0.03, 5);
  sprite(c, img, 100 - 56, 66 + bob - 56, 1);
  // as velas refletidas na película: pontinhos de chama sobre a bolha
  for (const [vx] of [[20], [176], [62], [140]]) {
    const ang = Math.atan2(0, vx - 100);
    rect(c, 100 + Math.cos(ang) * 38 + (vx < 100 ? 0 : -2), 52 + bob + (vx % 5), 2, 2, COR.chamaClara, 0.8);
  }
  // o mestre, ao fundo, soprando o tubo: só a silhueta e o brilho da lanterna
  sprite(c, s[`mestre_sombra_${frame(t, 4, 1.2)}`], 4, 46, 2);
  // pozinhos de Prima Materia caindo da mesa
  subindo(c, 92, 114, t, 8, 18, '#ffe9a8', 10, 3);
  moldura(c);
};

const belladonaCena: Cena = (c, t, s) => {
  laboratorio(c, t, [[24, 98, 8], [176, 98, 10], [130, 80, 6]]);
  // a janela, com a palidez da manhã
  rect(c, 84, 44, 26, 30, '#c8d4e0', 0.55); rect(c, 96, 44, 2, 30, '#3a2a1c'); rect(c, 84, 58, 26, 2, '#3a2a1c');
  // a mesa, a massa e o rolo
  rect(c, 60, 98, 120, 5, COR.madeiraClara); rect(c, 60, 102, 120, 18, COR.madeira);
  disco(c, 118, 94, 9, '#e8cfa0'); rect(c, 109, 94, 19, 4, '#e8cfa0'); rect(c, 112, 88, 8, 2, '#f5e4bc');
  const sway = Math.round(Math.sin(t * 2.2) * 6);
  rect(c, 100 + sway, 90, 18, 4, '#a9703a'); rect(c, 98 + sway, 91, 2, 2, '#7a4a26'); rect(c, 118 + sway, 91, 2, 2, '#7a4a26'); // o rolo
  subindo(c, 118, 90, t, 10, 22, '#fff6e0', 14, 2.4); // a farinha no ar
  // uma bolha pequena, a que ela viu, flutuando sobre a massa: a ideia que ela não largou
  const fase = (t / 6) % 1;
  bolha(c, 140 + Math.sin(t * 1.2) * 4, 82 - fase * 28, 7 + fase * 3, t);
  // Belladona, de pé à esquerda, olhando a massa
  const bob = Math.round(Math.sin(t * 1.4));
  sprite(c, s[`witch_idle_${frame(t, 2, 1.5)}`], 22, 44 + bob, 2);
  brilho(c, 62, 116, 28, COR.chama, 0.04, 3);
  // um caderno aberto, com a frase riscada
  rect(c, 150, 94, 22, 4, '#e9d9b0'); rect(c, 152, 92, 18, 2, '#cdb07a'); rect(c, 153, 93, 12, 1, COR.vermelho);
  moldura(c);
};

const paesCena: Cena = (c, t, s) => {
  faixas(c, 0, 90, ['#3a2a58', '#6a3a6a', '#a8506a', '#d8805a', '#f0b060', '#f8d890']);
  disco(c, 100, 84, 16, '#fff0c0', 0.5);
  disco(c, 100, 84, 11, '#fff8d8');
  // os raios, em degraus, que descem sobre o menino
  for (let i = -3; i <= 3; i++) rect(c, 100 + i * 9 - 2, 10, 4, 74, '#fff0c0', 0.06);
  rect(c, 0, 90, W, 60, '#7a5a30'); rect(c, 0, 90, W, 2, '#a07a40');
  // a multidão sentada: fileiras de silhuetas (cabeça e corpo) que respiram
  const r = sorteio(9);
  for (let row = 0; row < 4; row++) {
    for (let i = 0; i < 20; i++) {
      const x = i * 11 + (row % 2) * 5 + Math.floor(r() * 3);
      const y = 100 + row * 10;
      const resp = Math.round(Math.sin(t * 1.2 + i + row) * 0.6);
      rect(c, x, y + resp, 5, 6, ['#3a2a1a', '#4a3020', '#2a1c14', '#5a3a28'][(i + row) % 4]);
      disco(c, x + 2, y - 2 + resp, 2, '#c8905a');
    }
  }
  // o menino, de pé, com a cesta: os pães passam de mão em mão em arcos
  const bx = 96;
  rect(c, bx, 78, 8, 14, '#6a4a2a'); disco(c, bx + 4, 74, 4, '#e0a870');
  rect(c, bx - 6, 92, 20, 8, '#8a5a2a'); rect(c, bx - 6, 92, 20, 2, '#a97a3a'); // a cesta
  for (let i = 0; i < 5; i++) { const lx = bx - 4 + i * 3; rect(c, lx, 88, 3, 3, '#d8a04a'); rect(c, lx, 88, 3, 1, '#f0c470'); }
  for (let k = 0; k < 8; k++) {
    const fase = (t / 4 + k / 8) % 1;
    const lado = k % 2 ? 1 : -1;
    const x = bx + 4 + lado * fase * 84;
    const y = 90 - Math.sin(fase * Math.PI) * 30 + fase * 14;
    rect(c, x - 2, y, 5, 3, '#d8a04a'); rect(c, x - 2, y, 5, 1, '#f5cf80'); rect(c, x - 1, y + 1, 1, 1, '#a9703a');
  }
  void s;
  moldura(c);
};

const mosteiroCena: Cena = (c, t, s) => {
  faixas(c, 0, 100, [COR.noite0, COR.noite1, COR.noite2, '#1d3047', '#2a3a58', '#3a4a68']);
  estrelas(c, t, 21, 50, 70);
  disco(c, 34, 22, 8, '#f6e6b8'); disco(c, 37, 20, 7, '#101c26', 0.55);
  // a colina e o mosteiro com as janelas acesas
  for (let x = 0; x < W; x++) rect(c, x, 78 + Math.round(Math.sin(x / 31) * 6 + (x > 100 ? (x - 100) / 14 : 0)), 1, 80, '#142030');
  rect(c, 112, 40, 72, 44, '#1c2a3c'); rect(c, 112, 40, 72, 2, '#2a3a50');
  rect(c, 150, 20, 14, 24, '#1c2a3c'); rect(c, 154, 14, 6, 8, '#1c2a3c'); // a torre do sino
  rect(c, 156, 8, 2, 8, '#1c2a3c'); rect(c, 154, 11, 6, 2, '#1c2a3c'); // a cruz, só aqui (mosteiro)
  for (let i = 0; i < 7; i++) {
    const on = 0.65 + 0.35 * Math.sin(t * 3 + i * 1.9);
    rect(c, 118 + i * 9, 54, 4, 7, '#ffd27a', on); rect(c, 118 + i * 9, 68, 4, 7, '#ffd27a', 0.45 + 0.3 * Math.sin(t * 2 + i));
  }
  rect(c, 160, 66, 8, 18, '#0b1218'); rect(c, 162, 58, 4, 8, '#0b1218'); // o portão em arco
  brilho(c, 148, 60, 50, '#ffd27a', 0.025, 4);
  // o caminho e frei Anselmo descendo com a lanterna e a carta
  for (let i = 0; i < 40; i++) rect(c, 150 - i * 3 + Math.round(Math.sin(i / 4) * 2), 84 + i * 1.5, 7, 2, '#3a3a48', 0.8);
  const fase = (t / 14) % 1;
  const px = 146 - fase * 98;
  const py = 84 + fase * 48 + Math.sin(t * 6) * 0.8;
  sprite(c, s[`anselmo_side`] ?? s['anselmo_front_0'], px, py - 30, 1, true);
  brilho(c, px + 4, py - 6, 16, COR.chama, 0.07, 3);
  rect(c, px - 6, py - 14, 3, 4, COR.chamaClara); // a lanterna na mão
  moldura(c);
};

const jornadaCena: Cena = (c, t, s) => {
  rect(c, 0, 0, W, H, '#dcc794');
  const r = sorteio(33);
  for (let i = 0; i < 120; i++) rect(c, Math.floor(r() * W), Math.floor(r() * H), 2, 1, '#bfa56a', 0.5);
  c.strokeStyle = COR.tintaSuave; c.lineWidth = 1;
  // o caminho: uma linha tracejada que passa pelos quatro lugares
  const pts: Array<[number, number]> = [[22, 118], [50, 92], [78, 108], [104, 70], [128, 96], [152, 54], [176, 78]];
  const lugares = [{ i: 0, nome: 'vale' }, { i: 2, nome: 'torre' }, { i: 4, nome: 'biblioteca' }, { i: 6, nome: 'observatorio' }];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i]; const [x1, y1] = pts[i + 1];
    for (let k = 0; k < 14; k++) if (k % 2 === 0) rect(c, x0 + (x1 - x0) * (k / 14), y0 + (y1 - y0) * (k / 14), 2, 2, COR.vermelho);
  }
  // a Roo anda pelo mapa em laço; cada lugar se acende quando ela passa
  const total = pts.length - 1;
  const pos = (t / 3.2) % total;
  const seg = Math.floor(pos);
  const f = pos - seg;
  const rx = pts[seg][0] + (pts[seg + 1][0] - pts[seg][0]) * f;
  const ry = pts[seg][1] + (pts[seg + 1][1] - pts[seg][1]) * f;
  // os quatro lugares, em ícones de tinta
  const [vx, vy] = pts[0], [tx, ty] = pts[2], [bx, by] = pts[4], [ox, oy] = pts[6];
  const luz = (idx: number): number => Math.max(0, 1 - Math.abs(pos - idx) / 1.6);
  // vale: colinas e névoa
  for (let k = 0; k < 3; k++) rect(c, vx - 10 + k * 6, vy - 4 - k, 9, 3, '#7a8a50');
  rect(c, vx - 12, vy - 8, 24, 2, '#c8d0c0', 0.8); brilho(c, vx, vy - 4, 16, '#fff0b0', 0.1 * luz(0), 3);
  // torre
  rect(c, tx - 4, ty - 20, 9, 22, '#6a6a80'); rect(c, tx - 6, ty - 22, 13, 3, '#4a4a60'); rect(c, tx - 1, ty - 14, 3, 4, '#ffd27a', 0.5 + 0.5 * luz(2));
  brilho(c, tx, ty - 12, 18, '#fff0b0', 0.1 * luz(2), 3);
  // biblioteca: livros empilhados
  for (let k = 0; k < 4; k++) rect(c, bx - 8, by - 4 - k * 4, 16 - k, 4, ['#8c3b52', '#3a6a8c', '#c9812a', '#4d8a7a'][k]);
  brilho(c, bx, by - 8, 16, '#fff0b0', 0.1 * luz(4), 3);
  // observatório: a cúpula e a serpente
  rect(c, ox - 9, oy - 6, 18, 8, '#7a86a8'); for (let k = 0; k < 8; k++) rect(c, ox - 8 + k, oy - 8 - Math.round(Math.sqrt(64 - (k - 4) * (k - 4))), 1, 3, '#56648a');
  disco(c, ox, oy - 12, 5, '#56648a'); rect(c, ox - 1, oy - 18, 2, 6, '#1c2238');
  brilho(c, ox, oy - 10, 18, '#fff0b0', 0.1 * luz(6), 3);
  // os nomes, em escrita ilegível (letras de tinta): quatro tracinhos sob cada lugar
  for (const l of lugares) for (let k = 0; k < 5; k++) rect(c, pts[l.i][0] - 9 + k * 4, pts[l.i][1] + 6, 3, 1, COR.tinta, 0.6);
  // a Roo
  sprite(c, s[`roo_side_${frame(t, 4, 8)}`], rx - 20, ry - 40, 1, pts[seg + 1][0] < pts[seg][0]);
  rect(c, rx - 4, ry + 1, 9, 2, '#000000', 0.25);
  // a rosa dos ventos
  rect(c, 22, 30, 1, 14, COR.tinta); rect(c, 15, 37, 15, 1, COR.tinta); disco(c, 22, 37, 3, COR.vermelho, 0.6);
  moldura(c);
};

const dueloCena: Cena = (c, t, s) => {
  faixas(c, 0, 100, ['#0e0a18', '#1a1230', '#2a1a48', '#3a2058', '#4a2868', '#5a3078']);
  estrelas(c, t, 41, 30, 60);
  // o relâmpago de vez em quando, que ilumina as pedras da torre
  const flash = Math.max(0, Math.sin(t * 0.9 + 1.2) - 0.92) * 12;
  rect(c, 0, 0, W, H, '#c8c0ff', Math.min(0.4, flash));
  // o topo da torre: ameias e o piso de pedra
  rect(c, 0, 124, W, 26, '#2a2438'); for (let x = 0; x < W; x += 14) rect(c, x, 120, 9, 6, '#3a3450');
  for (let x = 0; x < W; x += 14) rect(c, x + 1, 130, 12, 1, '#1a1628');
  rect(c, 0, 116, W, 3, '#3a3450');
  // as poções cruzando, em arcos de luz: fogo (da Belladona) e água (da Roo)
  for (let k = 0; k < 4; k++) {
    const fase = (t / 2.2 + k / 4) % 1;
    const dir = k % 2 ? 1 : -1;
    const x = dir > 0 ? 50 + fase * 100 : 150 - fase * 100;
    const y = 100 - Math.sin(fase * Math.PI) * 56;
    const cor = dir > 0 ? '#4fc3f7' : '#ff7043';
    brilho(c, x, y, 9, cor, 0.18, 3);
    sprite(c, s[dir > 0 ? 'bomb_mega' : 'bomb_normal'], x - 10, y - 10, 1);
    for (let tr = 1; tr < 7; tr++) rect(c, x - dir * tr * 3, y + tr * (fase < 0.5 ? 1.5 : -1.5), 2, 2, cor, 0.5 - tr * 0.06);
  }
  // as duas figuras
  const bob = Math.round(Math.sin(t * 2));
  sprite(c, s[`roo_side_${frame(t, 4, 6)}`], 10, 26 + bob, 2);
  sprite(c, s['witch_cast'] ?? s['witch_idle_0'], 112, 24 - bob, 2);
  // a poça de luz onde cai uma poção
  const f2 = (t / 2.2) % 1;
  if (f2 > 0.92 || f2 < 0.08) brilho(c, 150, 110, 20, '#ff7043', 0.22, 4);
  moldura(c);
};

const cicloCena: Cena = (c, t) => {
  faixas(c, 0, H, ['#070a18', '#0a1028', '#10183a', '#16224a', '#1a2a58', '#16224a']);
  // o céu inteiro, girando devagar em volta do centro
  const r = sorteio(77);
  for (let i = 0; i < 90; i++) {
    const ang = r() * 6.28 + t * 0.05;
    const dist = 10 + r() * 130;
    const x = W / 2 + Math.cos(ang) * dist;
    const y = 72 + Math.sin(ang) * dist * 0.75;
    if (x < 3 || x > W - 3 || y < 3 || y > H - 3) continue;
    rect(c, x, y, 1, 1, '#fff6d8', 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 2 + i)));
  }
  // anéis do astrolábio
  c.strokeStyle = COR.ouro; c.globalAlpha = 0.45;
  for (const rr of [62, 46]) { c.beginPath(); c.arc(W / 2, 72, rr, 0, Math.PI * 2); c.stroke(); }
  c.globalAlpha = 1;
  // a serpente gigante, de escamas, mordendo a cauda; gira devagar
  const n = 60;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + t * 0.25;
    const x = W / 2 + Math.cos(a) * 40;
    const y = 72 + Math.sin(a) * 40;
    rect(c, x - 3, y - 3, 6, 6, i % 2 ? '#2c7d70' : COR.verde);
    rect(c, x - 1, y - 1, 3, 3, '#e0c070', 0.9);
  }
  const ha = t * 0.25;
  const hx = W / 2 + Math.cos(ha) * 40; const hy = 72 + Math.sin(ha) * 40;
  disco(c, hx, hy, 6, COR.verde); rect(c, hx - 2, hy - 2, 3, 3, COR.ouroClaro); rect(c, hx + 1, hy + 1, 3, 1, '#f6f2e2');
  // os quatro elementos nos pontos cardeais: a fraqueza da vez brilha, e a roda gira para o seguinte
  const vez = Math.floor(t / 2.4) % 4;
  const cor = ['#ff7043', '#8bc34a', '#4fc3f7', '#e3f0fa'];
  const pos: Array<[number, number]> = [[W / 2, 24], [W / 2 + 48, 72], [W / 2, 120], [W / 2 - 48, 72]];
  pos.forEach(([x, y], i) => {
    const on = i === vez;
    if (on) brilho(c, x, y, 18, cor[i], 0.2, 4);
    disco(c, x, y, on ? 5 : 3, cor[i], on ? 1 : 0.55);
  });
  // a estrela de oito pontas no centro
  const rot = t * 0.4;
  for (let i = 0; i < 8; i++) {
    const a = rot + (i / 8) * Math.PI * 2; const len = i % 2 ? 7 : 12;
    for (let k = 2; k < len; k++) rect(c, W / 2 + Math.cos(a) * k, 72 + Math.sin(a) * k, 1, 1, COR.ouroClaro);
  }
  rect(c, W / 2 - 1, 71, 3, 3, '#fff3b0');
  moldura(c);
};

const retornoCena: Cena = (c, t, s) => {
  faixas(c, 0, 92, ['#2a2048', '#4a2a58', '#8a4060', '#c8625a', '#e8904a', '#f8c070']);
  // o muro, o portão em arco aberto e as sebes
  rect(c, 0, 66, W, 54, '#5a4a40'); for (let y = 66; y < 120; y += 6) for (let x = (y / 6) % 2 ? 0 : -6; x < W; x += 12) rect(c, x, y, 11, 5, '#6a5a4c', 0.7);
  rect(c, 70, 40, 60, 80, '#4a3a30'); rect(c, 78, 52, 44, 68, '#2a1c18'); // o arco
  for (let i = 0; i < 22; i++) rect(c, 78 + i, 52 - Math.round(Math.sqrt(Math.max(0, 22 * 22 - (i - 22) * (i - 22))) * 0.25), 2, 3, '#2a1c18');
  disco(c, 100, 62, 18, '#ffd27a', 0.18); brilho(c, 100, 90, 40, '#ffd27a', 0.05, 4); // a luz de dentro
  rect(c, 0, 120, W, 30, '#7a5a30'); rect(c, 0, 120, W, 2, '#a07a40');
  // as famílias à porta, de pé, em fila
  const r = sorteio(51);
  for (let i = 0; i < 11; i++) {
    const x = 10 + i * 9 + (i > 5 ? 82 : 0);
    const h = 9 + Math.floor(r() * 7);
    const resp = Math.round(Math.sin(t * 1.4 + i) * 0.5);
    rect(c, x, 118 - h + resp, 5, h, ['#3a2a1a', '#4a3020', '#5a3a28', '#2a1c14'][i % 4]);
    disco(c, x + 2, 116 - h + resp, 2, '#c8905a');
  }
  // frei Anselmo ao centro, partindo o pão; a Roo recebe; a panela de sopa solta vapor
  const pull = Math.sin(t * 1.6);
  sprite(c, s[`anselmo_front_${frame(t, 2, 1)}`], 82, 62, 1);
  rect(c, 98 - 2 - pull * 2, 90, 6, 3, '#d8a04a'); rect(c, 102 + 2 + pull * 2, 90, 6, 3, '#d8a04a'); // o pão, em duas metades
  for (let k = 0; k < 6; k++) {
    const fase = (t / 3 + k / 6) % 1;
    const x = 100 + (k % 2 ? 1 : -1) * fase * 70;
    const y = 90 - Math.sin(fase * Math.PI) * 18 + fase * 24;
    rect(c, x, y, 5, 3, '#d8a04a'); rect(c, x, y, 5, 1, '#f5cf80');
  }
  sprite(c, s[`roo_down_${frame(t, 4, 3)}`], 34, 70, 1);
  // Belladona, ao fundo, de capa verde, esperando atrás das famílias (a luz do portão a alcança aos poucos)
  sprite(c, s[`witch_idle_${frame(t, 2, 1)}`], 138, 76, 1);
  rect(c, 146, 108, 16, 10, '#2a2a30'); rect(c, 144, 106, 20, 3, '#3a3a42'); rect(c, 148, 107, 12, 2, '#9ad08a');
  subindo(c, 154, 106, t, 8, 18, '#e8e8f0', 8, 2.2);
  moldura(c);
};

const frascoCena: Cena = (c, t, s) => {
  laboratorio(c, t, [[24, 98, 10], [176, 98, 12], [58, 98, 7], [100, 98, 9]]);
  // a mesa com o frasco vazio, em destaque, e o brilho que ele guarda
  rect(c, 96, 90, 58, 5, COR.madeiraClara); rect(c, 96, 94, 58, 14, COR.madeira);
  const flask = s['hud_flask_empty'];
  brilho(c, 125, 78, 26, '#ffe9a8', 0.07 + 0.03 * Math.sin(t * 1.6), 4);
  sprite(c, flask, 125 - (flask ? flask.width * 1.5 : 0), 88 - (flask ? flask.height * 3 : 0), 3);
  // o caldeirão, morno, com o líquido verde, e a bolha que sobe sem que ninguém a tenha soprado
  disco(c, 178, 112, 26, '#23252b'); rect(c, 152, 96, 52, 16, '#23252b'); rect(c, 150, 94, 56, 6, '#2e3037'); rect(c, 154, 95, 46, 3, '#4fdc8a', 0.8);
  rect(c, 162, 132, 32, 3, '#ff7043', 0.25 + 0.1 * Math.sin(t * 5));
  subindo(c, 178, 92, t, 5, 12, '#b8ffd0', 18, 2);
  const fase = (t / 9) % 1;
  bolha(c, 174 + Math.sin(t * 1.1) * 7, 90 - fase * 70, 5 + fase * 10, t);
  // a Roo, sentada diante da mesa, olhando a bolha
  sprite(c, s['roo_down_1'], 14, 44 + Math.round(Math.sin(t * 1.5) * 0.6), 2);
  moldura(c);
};

const primaveraCena: Cena = (c, t, s) => {
  faixas(c, 0, 80, ['#a8c8e0', '#c8dce8', '#e8e4d0', '#f4e8c0', '#f8e8b0']);
  disco(c, 168, 26, 9, '#fff2b8'); disco(c, 168, 26, 6, '#ffffff', 0.5);
  // o muro do mosteiro ao fundo, com uma janela onde arde uma vela, para o mestre
  rect(c, 0, 44, W, 40, '#8a7a68'); for (let y = 44; y < 84; y += 7) for (let x = (y / 7) % 2 ? 0 : -6; x < W; x += 12) rect(c, x, y, 11, 6, '#9a8a76', 0.7);
  rect(c, 14, 52, 14, 20, '#2a2018'); rect(c, 20, 52, 2, 20, '#6a5a44');
  vela(c, 21, 71, t, 6, 0.7);
  brilho(c, 21, 62, 18, COR.chama, 0.07, 3);
  // o trigo novo, verde, crescendo em fileiras
  rect(c, 0, 84, W, 66, '#6a8a40');
  for (let row = 0; row < 3; row++) {
    for (let x = 0; x < W; x += 5) {
      const h = 4 + row * 2 + Math.round(Math.sin(t * 1.2 + x * 0.4 + row) * 1);
      rect(c, x, 90 + row * 8 - h, 1, h, '#4a7a2a'); rect(c, x + 2, 90 + row * 8 - h + 1, 1, h - 1, '#8aba4a');
    }
  }
  rect(c, 0, 118, W, 32, '#7a5a30'); rect(c, 0, 118, W, 2, '#a07a40');
  // o Caldeirão ao centro, fervendo sopa, e muitas mãos em volta mexendo
  disco(c, 60, 112, 22, '#23252b'); rect(c, 38, 96, 44, 16, '#23252b'); rect(c, 36, 94, 48, 6, '#2e3037'); rect(c, 40, 95, 40, 3, '#d9a45a', 0.9);
  subindo(c, 60, 92, t, 9, 22, '#f4f4ec', 22, 2.2);
  const fase = (t / 8) % 1;
  bolha(c, 66 + Math.sin(t) * 4, 88 - fase * 36, 4 + fase * 4, t);
  // as pessoas em fila (famílias e monges): silhuetas que respiram, com uma concha que vai e vem
  const r = sorteio(61);
  for (let i = 0; i < 9; i++) {
    const x = i < 3 ? 4 + i * 9 : 92 + (i - 3) * 9;
    const h = 9 + Math.floor(r() * 6);
    const resp = Math.round(Math.sin(t * 1.4 + i) * 0.5);
    rect(c, x, 122 - h + resp, 5, h, ['#4a3020', '#5a3a28', '#3a2a1a', '#6a4a30'][i % 4]);
    rect(c, x + 1, 119 - h + resp, 3, 3, '#c8905a');
  }
  const conc = Math.sin(t * 2) * 6;
  rect(c, 56 + conc, 88, 10, 2, '#9a6a3a'); rect(c, 64 + conc, 89, 4, 3, '#6a4a2a');
  // Belladona de pé à direita, ao lado do alambique, sem a bruxaria: destila a febre
  sprite(c, s[`witch_idle_${frame(t, 2, 1.2)}`], 112, 44, 2);
  rect(c, 90, 118, 22, 3, COR.madeiraClara); rect(c, 94, 104, 8, 14, '#9a6a3a'); rect(c, 96, 98, 4, 7, '#9a6a3a');
  frasco(c, 104, 118, '#9ff0ff', t, true); frasco(c, 109, 118, '#a8ffd0', t);
  subindo(c, 98, 98, t, 4, 14, '#d8f3ff', 4, 2.4);
  moldura(c);
};

export const CENAS: Record<CenaId, Cena> = {
  capa, fome, laboratorio: laboratorioCena, bolha: bolhaCena, belladona: belladonaCena, paes: paesCena, mosteiro: mosteiroCena,
  jornada: jornadaCena, duelo: dueloCena, ciclo: cicloCena, retorno: retornoCena, primavera: primaveraCena, frasco: frascoCena,
};

/** As texturas do jogo que as cenas usam (o carregador copia só estas). */
export const SPRITES_DAS_CENAS: readonly string[] = [
  ...Array.from({ length: 16 }, (_, i) => `roo_bubble_fetal_${i}`),
  ...Array.from({ length: 4 }, (_, i) => `roo_side_${i}`),
  ...Array.from({ length: 4 }, (_, i) => `roo_down_${i}`),
  'witch_idle_0', 'witch_idle_1', 'witch_cast', 'anselmo_front_0', 'anselmo_front_1', 'anselmo_side',
  'mestre_sombra_0', 'mestre_sombra_1', 'mestre_sombra_2', 'mestre_sombra_3', 'bomb_normal', 'bomb_mega', 'hud_flask_empty',
];

void chamaDeVela;
