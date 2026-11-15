// As gravuras de lugar que abrem cada fase, além das 13 do livro (livroScenes.ts): o Poço de prata, a Torre, a Biblioteca
// Proibida e o Observatório. Cada uma tem variantes (qual parte do lugar). Mesma regra de desenho do livro: pixel art em
// blocos inteiros, sem cruz em figura nenhuma.
import type { PlacaId } from '../game/stageArt';
import {
  COR, H, W, bolha, brilho, chamaDeVela, disco, estrelas, faixas, moldura, rect, sorteio, sprite, subindo, vela,
  type Ctx, type Sprites,
} from './livroDraw';
import { CENAS } from './livroScenes';

/** Uma gravura de lugar: o contexto, o tempo em segundos, os sprites do jogo e a variante. */
export type Placa = (c: Ctx, t: number, s: Sprites, v: number) => void;

const frame = (t: number, n: number, fps: number): number => Math.floor(t * fps) % n;

// O Poço de prata: a boca de pedra com mercúrio, gotas que sobem e caem, e a Quimera que se insinua no reflexo.
const poco: Placa = (c, t, s) => {
  faixas(c, 0, 100, [COR.noite0, COR.noite1, COR.noite2, '#1d3047', '#2a3a58', '#3a4a68']);
  estrelas(c, t, 31, 40, 70);
  disco(c, 36, 24, 9, '#e8eef8'); disco(c, 39, 22, 8, COR.noite1, 0.45);
  rect(c, 0, 96, W, 54, '#1c2430');
  // a névoa baixa, em faixas que andam
  for (let i = 0; i < 4; i++) rect(c, ((t * (4 + i) + i * 40) % (W + 60)) - 60, 90 + i * 8, 60, 3, '#c8d4e4', 0.12);
  // a boca do poço: um anel de pedra e a prata viva dentro
  disco(c, 100, 112, 38, '#4a5468'); disco(c, 100, 112, 33, '#2a3040');
  disco(c, 100, 112, 28, '#b9c6d6');
  for (let i = 0; i < 7; i++) {
    const a = t * 0.8 + i * 0.9;
    rect(c, 100 + Math.cos(a) * (6 + i * 3), 112 + Math.sin(a) * (3 + i * 1.6), 6, 2, i % 2 ? '#ffffff' : '#8fa0b4', 0.7);
  }
  for (let k = 0; k < 7; k++) { // gotas de prata que sobem e voltam
    const fase = (t / 2.4 + k / 7) % 1;
    const x = 78 + k * 7;
    const y = 112 - Math.sin(fase * Math.PI) * 30;
    rect(c, x, y, 2, 3, '#dfe8f4', 0.9);
  }
  brilho(c, 100, 112, 44, '#9fc0e8', 0.05, 4);
  // a Quimera, no reflexo: aparece e some, transparente
  const a = 0.18 + 0.14 * Math.sin(t * 0.9);
  c.globalAlpha = a;
  sprite(c, s['chimera_idle_0'], 80, 70, 1);
  c.globalAlpha = 1;
  moldura(c);
};

// A Torre: v0 a escadaria em caracol (a Roo sobe, uma vela em cada patamar); v1 o corredor dos selos de cera.
const torre: Placa = (c, t, s, v) => {
  if (v === 0) {
    faixas(c, 0, H, ['#0e0a18', '#150f24', '#1c1430', '#241a3c', '#2a2044', '#2a2044']);
    rect(c, 0, 0, 50, H, '#2a2438'); rect(c, 150, 0, 50, H, '#2a2438');
    for (let y = 0; y < H; y += 9) for (const x0 of [0, 150]) rect(c, x0 + ((y / 9) % 2 ? 6 : 0), y, 40, 1, '#1a1628');
    rect(c, 86, 16, 28, 40, '#0a0a1a'); // a janela alta, com estrelas
    estrelas(c, t, 5, 12, 40);
    // os degraus, subindo em zigue-zague
    for (let i = 0; i < 9; i++) {
      const x = 48 + (i % 2 ? 56 : 0);
      rect(c, x, 132 - i * 13, 48, 5, '#4a4264'); rect(c, x, 132 - i * 13, 48, 1, '#6a6288');
      if (i % 3 === 1) vela(c, x + (i % 2 ? 44 : 4), 132 - i * 13, t, 6, 0.9);
    }
    const pos = (t / 6) % 1; // a Roo sobe devagar
    const k = Math.min(8, Math.floor(pos * 9));
    const x = 56 + (k % 2 ? 56 : 0) + (pos * 9 - k) * (k % 2 ? -40 : 40) * 0.5;
    sprite(c, s[`roo_side_${frame(t, 4, 8)}`], x - 14, 132 - k * 13 - 44, 1, k % 2 === 1);
  } else {
    faixas(c, 0, 104, ['#1a1428', '#241c36', '#2e2444']);
    rect(c, 0, 104, W, 46, '#2a2438');
    for (let x = 0; x < W; x += 20) rect(c, x, 104, 1, 46, '#1a1628');
    // três portas, cada uma com o selo de cera vermelho e o mesmo símbolo; a última deixa passar uma luz
    for (let i = 0; i < 3; i++) {
      const x = 22 + i * 62;
      rect(c, x, 36, 36, 68, '#4a3020'); rect(c, x + 2, 38, 32, 64, '#5a3a24');
      rect(c, x + 15, 66, 6, 6, '#8f2d1f'); rect(c, x + 16, 67, 4, 4, '#b8402c'); rect(c, x + 17, 68, 2, 2, '#ffd0a0', 0.8);
      if (i === 2) { rect(c, x + 2, 100, 32, 3, '#ffd27a', 0.5 + 0.3 * Math.sin(t * 3)); brilho(c, x + 18, 100, 30, '#ffd27a', 0.06, 3); }
      vela(c, x + 44, 68, t, 7, 0.8);
    }
    sprite(c, s[`roo_side_${frame(t, 4, 6)}`], 10 + (t * 4) % 20, 62, 2);
  }
  moldura(c);
};

// A Biblioteca Proibida, em quatro partes: v0 as estantes com livros presos por correntes e lâmpadas acesas;
// v1 o scriptorium (mesas de copistas, velas, penas); v2 o cofre das escrituras; v3 o Leão Verde dormindo sobre as correntes.
const biblioteca: Placa = (c, t, s, v) => {
  rect(c, 0, 0, W, H, '#2a1a10');
  const cores = ['#8c3b52', '#3a6a8c', '#c9812a', '#4d8a7a', '#7a2f22', '#d9a21b', '#6b5232'];
  const estante = (x: number, w: number): void => {
    rect(c, x, 6, w, 120, '#4a2c18'); rect(c, x + 2, 8, w - 4, 116, '#2a180c');
    for (let r = 0; r < 5; r++) {
      const y = 14 + r * 22;
      rect(c, x + 2, y + 18, w - 4, 3, '#6a4020');
      const rnd = sorteio(x * 7 + r);
      for (let k = 0; k < Math.floor((w - 6) / 5); k++) rect(c, x + 3 + k * 5, y + 18 - 12 - Math.floor(rnd() * 6), 4, 12 + Math.floor(rnd() * 6), cores[Math.floor(rnd() * cores.length)]);
    }
    // as correntes finas, em diagonal, com os elos
    for (let i = 0; i < 24; i++) rect(c, x + 3 + (i * (w - 8)) / 24, 10 + i * 4.6, 2, 2, '#9aa0aa', 0.9);
  };
  if (v === 0) {
    estante(4, 52); estante(74, 52); estante(144, 52);
    for (const x of [64, 134]) { rect(c, x, 60, 2, 12, '#7a5a30'); chamaDeVela(c, x + 1, 58, t, 1, true); }
  } else if (v === 1) {
    rect(c, 0, 90, W, 60, '#3a2414');
    for (const x of [14, 82, 150]) { // mesas de copista, com o livro, a pena e a vela
      rect(c, x, 96, 40, 4, '#7a5230'); rect(c, x + 2, 100, 4, 26, '#4a2c18'); rect(c, x + 34, 100, 4, 26, '#4a2c18');
      rect(c, x + 8, 90, 20, 6, '#e9d9b0'); rect(c, x + 10, 91, 16, 1, COR.tinta, 0.5); rect(c, x + 10, 93, 12, 1, COR.tinta, 0.5);
      const pena = Math.round(Math.sin(t * 3 + x) * 2);
      rect(c, x + 26 + pena, 84, 2, 12, '#f0f0e0'); rect(c, x + 26 + pena, 96, 1, 2, '#1a1a1a');
      vela(c, x + 34, 96, t, 8, 0.9);
      rect(c, x + 12, 66, 14, 22, '#3a2a1a'); disco(c, x + 19, 62, 4, '#c8905a'); // o copista, curvado
    }
    rect(c, 0, 0, W, 44, '#3a2414'); for (let i = 0; i < 12; i++) rect(c, 6 + i * 16, 8, 12, 28, '#2a180c', 0.8);
  } else if (v === 2) {
    rect(c, 0, 0, W, H, '#1a0f08');
    // o cofre: um arco de pedra, e as escrituras presas por correntes, brilhando
    rect(c, 40, 20, 120, 110, '#3a2a20'); rect(c, 48, 28, 104, 102, '#1a1008');
    for (let i = 0; i < 5; i++) {
      const x = 56 + i * 20;
      brilho(c, x + 7, 80, 18, '#ffd27a', 0.06 + 0.02 * Math.sin(t * 2 + i), 3);
      rect(c, x, 60, 14, 40, '#e9d9b0'); rect(c, x + 2, 64, 10, 1, COR.tinta, 0.5); rect(c, x + 2, 68, 10, 1, COR.tinta, 0.5); rect(c, x, 58, 14, 3, '#c9a05a');
      for (let k = 0; k < 8; k++) rect(c, x + 2 + (k % 2) * 7, 56 + k * 6, 3, 3, '#9aa0aa'); // a corrente que prende cada rolo
    }
    for (let i = 0; i < 4; i++) rect(c, 60 + i * 24, 34, 3, 24, '#9aa0aa', 0.6); // correntes do teto
  } else {
    rect(c, 0, 0, W, H, '#1a1a10');
    for (let i = 0; i < 10; i++) rect(c, 14 + i * 18, 30 + (i % 3) * 3, 14, 100, '#2a2a18', 0.8);
    // livros acorrentados empilhados e o Leão Verde dormindo sobre eles
    rect(c, 30, 106, 140, 18, '#4a2c18'); for (let k = 0; k < 9; k++) rect(c, 32 + k * 15, 100 - (k % 3) * 3, 13, 12 + (k % 3) * 3, cores[k % cores.length]);
    for (let i = 0; i < 18; i++) rect(c, 30 + i * 8, 112 + (i % 2) * 2, 4, 2, '#9aa0aa'); // as correntes no chão
    c.save(); c.globalAlpha = 1;
    sprite(c, s['lion_idle_0'], 66, 40 + Math.round(Math.sin(t * 1.2)), 2);
    c.restore();
    subindo(c, 106, 52, t, 3, 18, '#cfe8c0', 6, 3.6); // a respiração
    brilho(c, 100, 88, 50, '#9be564', 0.03, 4);
  }
  moldura(c);
};

// O Observatório: v0 o pátio dos astrolábios (a lanterna viva patrulha); v1 o salão dos relógios; v2 a galeria das cartas.
const observatorio: Placa = (c, t, s, v) => {
  faixas(c, 0, H, ['#0b1028', '#10183a', '#16224a', '#1a2a58', '#16224a', '#101c3a']);
  estrelas(c, t, 91, 40, 70);
  if (v === 0) {
    rect(c, 0, 110, W, 40, '#2a3250');
    for (let x = 0; x < W; x += 18) rect(c, x, 110, 1, 40, '#1a2038');
    // astrolábios de bronze no chão: anéis e raios
    for (const [x, y] of [[40, 128], [100, 120], [160, 130]] as Array<[number, number]>) {
      c.strokeStyle = COR.ouro; c.globalAlpha = 0.8; c.beginPath(); c.arc(x, y, 14, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.arc(x, y, 8, 0, Math.PI * 2); c.stroke(); c.globalAlpha = 1;
      for (let i = 0; i < 6; i++) rect(c, x + Math.cos(t * 0.3 + i) * 12, y + Math.sin(t * 0.3 + i) * 12, 1, 1, COR.ouroClaro);
    }
    const x = 20 + ((t * 18) % 160); // a lanterna viva patrulha de um lado a outro
    sprite(c, s['enemy_lantern'], x < 100 ? x : 220 - x, 74, 2);
  } else if (v === 1) {
    rect(c, 0, 0, W, H, '#2a2a3a');
    for (let i = 0; i < 6; i++) { // a parede de relógios de cobre, cada um com a sua hora
      const x = 28 + (i % 3) * 56; const y = 38 + Math.floor(i / 3) * 52;
      disco(c, x, y, 18, '#5a3a22'); disco(c, x, y, 15, '#e8dcb8');
      const a1 = t * (0.6 + i * 0.15); const a2 = t * (0.05 + i * 0.02);
      for (let k = 2; k < 12; k++) rect(c, x + Math.cos(a1) * k, y + Math.sin(a1) * k, 1, 1, COR.tinta);
      for (let k = 2; k < 8; k++) rect(c, x + Math.cos(a2) * k, y + Math.sin(a2) * k, 2, 1, COR.vermelho);
    }
    sprite(c, s['enemy_clock'], 150 + Math.round(Math.sin(t) * 2), 84, 2);
  } else {
    rect(c, 0, 0, W, H, '#1a1a38');
    // os mapas de estrelas na parede, como manuscritos, e a coruja nas vigas
    for (let i = 0; i < 4; i++) {
      const x = 12 + i * 46;
      rect(c, x, 28, 38, 56, '#e9d9b0', 0.9); rect(c, x + 2, 30, 34, 52, '#cdb07a', 0.6);
      const rnd = sorteio(x);
      for (let k = 0; k < 9; k++) rect(c, x + 4 + Math.floor(rnd() * 30), 34 + Math.floor(rnd() * 44), 1, 1, COR.tinta);
      for (let k = 0; k < 4; k++) rect(c, x + 6 + k * 7, 70, 5, 1, COR.tinta, 0.5);
    }
    rect(c, 0, 96, W, 6, '#4a2c18'); // a viga
    sprite(c, s['enemy_owl'], 100 + Math.round(Math.sin(t * 0.7) * 3), 56, 2);
    for (let k = 0; k < 3; k++) rect(c, 30 + k * 58, 128, 14, 5, '#5d4228'); // os montes da toupeira, no chão
  }
  moldura(c);
};

/** Toda gravura que pode abrir uma fase: as do livro e as de lugar. */
export const PLACAS: Record<PlacaId, Placa> = {
  ...Object.fromEntries(Object.entries(CENAS).map(([k, f]) => [k, (c: Ctx, t: number, s: Sprites): void => f(c, t, s)])),
  poco, torre, biblioteca, observatorio,
} as Record<PlacaId, Placa>;

/** As texturas do jogo que as gravuras de lugar usam, além das do livro. */
export const SPRITES_DAS_PLACAS: readonly string[] = ['chimera_idle_0', 'lion_idle_0', 'enemy_lantern', 'enemy_clock', 'enemy_owl'];

void bolha; void H;
