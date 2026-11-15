// Ouroboros, a serpente do ciclo (chefe do Observatório): um anel de escamas verde-azuladas com a barriga dourada, a
// cabeça de olho de ouro mordendo a ponta da própria cauda e uma estrela de oito pontas no meio do anel. Mesmo tamanho
// da Roo (tile + folga no topo).
//
// Poses: 'idle' (2 quadros: as escamas cintilam e a estrela gira), 'cast' (o anel brilha em ouro e o olho abre),
//        'hurt' (olho em X, anel pálido), 'talk' (2 quadros: a boca solta e prende a cauda),
//        'defeat' (vencido: o anel se abre, a cauda solta, olhos fechados).
import Phaser from 'phaser';
import { ROO_HEAD_ROOM, rooTextureHeight } from './rooGeometry';

type Gfx = Phaser.GameObjects.Graphics;
type OuroPose = 'idle' | 'cast' | 'hurt' | 'talk' | 'defeat';

const OUT = 0x10261f;
const SCALE_A = 0x3fa58f;
const SCALE_B = 0x2c7d70;
const BELLY = 0xe0c070;
const GOLD = 0xffd54f;
const FANG = 0xf6f2e2;

const TAU = Math.PI * 2;

function arc(g: Gfx, cx: number, cy: number, r: number, a0: number, a1: number, color: number, width: number, alpha = 1): void {
  g.lineStyle(width, color, alpha);
  g.beginPath(); g.arc(cx, cy, r, a0, a1, false); g.strokePath();
}

// Estrela de oito pontas: quatro raios longos e quatro curtos (sem nada em forma de cruz: são raios de estrela).
function star(g: Gfx, x: number, y: number, rot: number, long: number): void {
  for (let i = 0; i < 8; i++) {
    const a = rot + (i / 8) * TAU;
    const len = i % 2 === 0 ? long : long * 0.55;
    g.lineStyle(1.2, GOLD, 0.95);
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); g.strokePath();
  }
  g.fillStyle(0xfff3b0); g.fillCircle(x, y, 1.6);
}

function drawOuroFrame(g: Gfx, T: number, frame: number, pose: OuroPose): void {
  g.clear();
  const f = frame % 2;
  const defeat = pose === 'defeat';
  const casting = pose === 'cast';
  const hurt = pose === 'hurt';
  const talkOpen = pose === 'talk' && f === 1;
  const B = rooTextureHeight(T);
  const cx = T / 2;
  const cy = ROO_HEAD_ROOM + (B - ROO_HEAD_ROOM) / 2 + (defeat ? 3 : 0);
  const R = 12.5;

  // sombra
  g.fillStyle(0x000000, 0.22);
  g.fillEllipse(cx, B - 2, 30, 4);

  // brilho de ouro quando lança
  if (casting) {
    g.fillStyle(GOLD, 0.22); g.fillCircle(cx, cy, R + 8);
    g.fillStyle(GOLD, 0.14); g.fillCircle(cx, cy, R + 11);
  }

  // o anel: contorno escuro, escamas alternadas e a barriga dourada por dentro. Vencido, o anel se abre (sem o trecho
  // da boca) e a cauda cai.
  const headA = -Math.PI * 0.72; // a cabeça, no alto à esquerda
  const start = defeat ? headA + 0.9 : headA + 0.42; // o corpo começa logo depois da boca e dá a volta
  const end = defeat ? headA + TAU - 0.5 : headA + TAU - 0.05;
  arc(g, cx, cy, R, start, end, OUT, 9);
  const n = 26;
  const span = end - start;
  for (let i = 0; i < n; i++) {
    const a0 = start + (i / n) * span;
    const a1 = start + ((i + 1) / n) * span + 0.04;
    const shimmer = (i + f) % 2 === 0;
    const color = hurt ? (shimmer ? 0x7fb5a8 : 0x6aa093) : defeat ? (shimmer ? 0x5c8f84 : 0x4a7a70) : (shimmer ? SCALE_A : SCALE_B);
    arc(g, cx, cy, R, a0, a1, color, 6.4);
  }
  arc(g, cx, cy, R - 2.5, start, end, BELLY, 1.6, defeat ? 0.55 : 0.95); // a barriga, por dentro do anel

  // a ponta da cauda, afilada, entrando na boca (ou caída no chão, vencido)
  const tailA = end;
  const tx = cx + Math.cos(tailA) * R;
  const ty = cy + Math.sin(tailA) * R;
  if (defeat) {
    g.fillStyle(OUT); g.fillTriangle(tx - 1, ty - 3, tx + 6, ty + 3, tx - 3, ty + 4);
    g.fillStyle(SCALE_B); g.fillTriangle(tx - 0.5, ty - 2, tx + 4.5, ty + 2.6, tx - 2.4, ty + 3);
  } else {
    g.fillStyle(OUT); g.fillTriangle(tx + 4.4, ty - 3.4, tx - 1, ty + 3.8, tx + 3.4, ty + 5);
    g.fillStyle(SCALE_A); g.fillTriangle(tx + 3.8, ty - 2.4, tx - 0.2, ty + 3, tx + 3, ty + 4);
  }

  // a cabeça
  const hx = cx + Math.cos(headA) * R;
  const hy = cy + Math.sin(headA) * R;
  const open = casting || talkOpen;
  g.fillStyle(OUT); g.fillCircle(hx, hy, 6.4);
  g.fillStyle(hurt ? 0x7fb5a8 : SCALE_A); g.fillCircle(hx, hy, 5.4);
  g.fillStyle(hurt ? 0x9ccbbf : 0x5cc5ac, 0.8); g.fillEllipse(hx - 1.4, hy - 2.2, 4, 2.2);
  // focinho voltado para a cauda
  g.fillStyle(OUT); g.fillEllipse(hx + 4.2, hy + 2.6, 6.6, 4.6);
  g.fillStyle(hurt ? 0x7fb5a8 : SCALE_B); g.fillEllipse(hx + 4.2, hy + 2.6, 5.4, 3.6);
  if (open) {
    g.fillStyle(0x23100c); g.fillEllipse(hx + 4.6, hy + 4, 4.2, 2.6);
  }
  g.fillStyle(FANG); g.fillTriangle(hx + 2.4, hy + 3.6, hx + 3.8, hy + 3.6, hx + 3.1, hy + 5.6);
  g.fillTriangle(hx + 5.6, hy + 3.8, hx + 7, hy + 3.4, hx + 6.6, hy + 5.4);
  // olho
  if (hurt) {
    g.lineStyle(1.2, OUT);
    g.beginPath(); g.moveTo(hx - 3.2, hy - 2.6); g.lineTo(hx - 0.2, hy + 0.2); g.moveTo(hx - 0.2, hy - 2.6); g.lineTo(hx - 3.2, hy + 0.2); g.strokePath();
  } else if (defeat) {
    g.lineStyle(1.2, OUT);
    g.beginPath(); g.arc(hx - 1.6, hy - 1.2, 1.8, 0.2, Math.PI - 0.2, false); g.strokePath();
  } else {
    g.fillStyle(OUT); g.fillCircle(hx - 1.6, hy - 1.2, casting ? 3.2 : 2.6);
    g.fillStyle(GOLD); g.fillCircle(hx - 1.6, hy - 1.2, casting ? 2.4 : 1.8);
    g.fillStyle(OUT); g.fillRect(hx - 2.1, hy - 2.6, 1, casting ? 2.8 : 2.2); // pupila de fenda
  }

  // a estrela no meio do anel
  if (!defeat) star(g, cx, cy, f === 0 ? 0 : Math.PI / 8, casting ? 6.2 : 5);
  else { g.fillStyle(GOLD, 0.5); g.fillCircle(cx, cy, 1.6); }
}

export function drawOuroborosTextures(g: Gfx, T: number): void {
  const H = rooTextureHeight(T);
  for (let fi = 0; fi < 2; fi++) {
    drawOuroFrame(g, T, fi, 'idle');
    g.generateTexture(`ouro_idle_${fi}`, T, H);
  }
  drawOuroFrame(g, T, 0, 'cast');
  g.generateTexture('ouro_cast', T, H);
  drawOuroFrame(g, T, 0, 'hurt');
  g.generateTexture('ouro_hurt', T, H);
  for (let fi = 0; fi < 2; fi++) {
    drawOuroFrame(g, T, fi, 'talk');
    g.generateTexture(`ouro_talk_${fi}`, T, H);
  }
  drawOuroFrame(g, T, 0, 'defeat');
  g.generateTexture('ouro_defeat', T, H);
}
