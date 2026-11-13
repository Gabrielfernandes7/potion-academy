// Leão Verde, guardião da Biblioteca Proibida (chefe): o solvente universal da alquimia. Nos manuscritos ele
// aparece devorando o sol. Aqui: um leão sentado, de pelo verde, juba de espinhos escuros, olhos de ouro e
// um sol de ouro no peito; ao lançar, segura o sol entre as presas. Mesmo tamanho da Roo (tile + folga no topo).
//
// Poses: 'idle' (2 quadros: a cauda e a juba balançam), 'cast' (boca aberta com o sol entre as presas),
//        'hurt' (olhos em X), 'talk' (2 quadros: boca abre e fecha),
//        'defeat' (vencido: olhos fechados, cabeça baixa, juba caída).
import Phaser from 'phaser';
import { ROO_HEAD_ROOM, rooTextureHeight } from './rooGeometry';

type Gfx = Phaser.GameObjects.Graphics;
type Pt = readonly [number, number];
type LionPose = 'idle' | 'cast' | 'hurt' | 'talk' | 'defeat';

const FUR = 0x5f9e4a;
const FUR_LIGHT = 0x8fcf6a;
const FUR_SHADE = 0x3f7a35;
const MANE = 0x3a7a34;
const MANE_DARK = 0x214a20;
const MUZZLE = 0xb6dd8a;
const GOLD = 0xffd54f;
const GOLD_DARK = 0xc9962a;
const HOLE = 0x15200f;
const FANG = 0xf4f1dc;

function seg(g: Gfx, a: Pt, b: Pt, color: number, width: number, alpha = 1): void {
  g.lineStyle(width, color, alpha);
  g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.strokePath();
}

function sun(g: Gfx, x: number, y: number, r: number): void {
  g.fillStyle(GOLD, 0.3); g.fillCircle(x, y, r + 3);
  g.fillStyle(GOLD); g.fillCircle(x, y, r);
  g.fillStyle(0xfff3b0); g.fillCircle(x - r * 0.3, y - r * 0.3, r * 0.4);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    seg(g, [x + Math.cos(a) * (r + 1), y + Math.sin(a) * (r + 1)], [x + Math.cos(a) * (r + 3.2), y + Math.sin(a) * (r + 3.2)], GOLD_DARK, 1);
  }
}

function drawLionFrame(g: Gfx, T: number, frame: number, pose: LionPose): void {
  g.clear();
  const f = frame % 2;
  const defeat = pose === 'defeat';
  const casting = pose === 'cast';
  const hurt = pose === 'hurt';
  const talkOpen = pose === 'talk' && f === 1;
  const B = rooTextureHeight(T);
  const cx = T / 2;
  const wob = defeat ? 0 : f === 0 ? -0.8 : 0.8;
  const cy = T / 2 + 1 + ROO_HEAD_ROOM + (hurt ? 0.8 : defeat ? 4 : 0);

  // sombra
  g.fillStyle(0x000000, 0.22);
  g.fillEllipse(cx, B - 2, 28, 4);

  // cauda: sobe pela direita, com um tufo escuro na ponta
  if (!defeat) {
    const tail: Pt[] = [[cx + 10, B - 8], [cx + 15 + wob, B - 14], [cx + 17 + wob * 1.5, B - 21], [cx + 14 + wob * 2, B - 26]];
    for (let i = 0; i < tail.length - 1; i++) seg(g, tail[i], tail[i + 1], FUR_SHADE, 3.4 - i * 0.4);
    for (let i = 0; i < tail.length - 1; i++) seg(g, tail[i], tail[i + 1], FUR, 2 - i * 0.3);
    g.fillStyle(MANE_DARK); g.fillEllipse(tail[3][0], tail[3][1] - 1, 6, 7);
    g.fillStyle(MANE); g.fillEllipse(tail[3][0] - 0.6, tail[3][1] - 1.6, 3.6, 4.6);
  }

  // corpo sentado: patas de trás, tronco, peito e patas da frente
  g.fillStyle(FUR_SHADE);
  g.fillEllipse(cx - 9, B - 10, 12, 14); g.fillEllipse(cx + 9, B - 10, 12, 14);
  g.fillStyle(FUR);
  g.fillEllipse(cx, cy + 9 + (defeat ? 1 : 0), 22, 24);
  g.fillStyle(FUR_LIGHT, 0.75);
  g.fillEllipse(cx - 4, cy + 7, 5, 10);
  g.fillStyle(MUZZLE, 0.8);
  g.fillEllipse(cx, cy + 12, 11, 14);
  sun(g, cx, cy + 11, 2.6); // o sol que ele devora, de ouro, no peito
  g.fillStyle(FUR);
  g.fillEllipse(cx - 7, B - 6, 8, 9); g.fillEllipse(cx + 7, B - 6, 8, 9);
  g.fillStyle(FUR_SHADE);
  g.fillRect(cx - 10, B - 3.5, 6, 1.6); g.fillRect(cx + 4, B - 3.5, 6, 1.6);
  g.fillStyle(FANG);
  for (const dx of [-9, -7, 5, 7]) g.fillRect(cx + dx, B - 2.2, 1, 1.6);

  // juba: espinhos escuros em volta do rosto
  const hcy = cy - 8 + (casting ? -1 : 0) + (defeat ? 3 : 0);
  const spikes = 14;
  for (let i = 0; i < spikes; i++) {
    const a = (i / spikes) * Math.PI * 2;
    const r1 = 7.5;
    const r2 = 14 + (i % 2 === 0 ? 1.6 : 0) + (i % 3 === 0 ? wob * 0.5 : 0) - (defeat ? 2 : 0);
    const px = Math.cos(a), py = Math.sin(a);
    g.fillStyle(i % 2 === 0 ? MANE_DARK : MANE);
    g.fillTriangle(cx + px * r1 - py * 2.8, hcy + py * r1 + px * 2.8, cx + px * r1 + py * 2.8, hcy + py * r1 - px * 2.8, cx + px * r2, hcy + py * r2);
  }
  g.fillStyle(MANE); g.fillCircle(cx, hcy, 11);

  // orelhas
  g.fillStyle(FUR_SHADE);
  g.fillCircle(cx - 7.5, hcy - 8, 2.8); g.fillCircle(cx + 7.5, hcy - 8, 2.8);
  g.fillStyle(MUZZLE); g.fillCircle(cx - 7.5, hcy - 8, 1.3); g.fillCircle(cx + 7.5, hcy - 8, 1.3);

  // rosto
  g.fillStyle(FUR); g.fillCircle(cx, hcy, 8.4);
  g.fillStyle(FUR_LIGHT, 0.7); g.fillEllipse(cx - 3, hcy - 4.6, 5, 3);
  if (hurt) {
    for (const ex of [cx - 3.4, cx + 3.4]) {
      seg(g, [ex - 1.6, hcy - 3.4], [ex + 1.6, hcy - 0.8], HOLE, 1.2);
      seg(g, [ex + 1.6, hcy - 3.4], [ex - 1.6, hcy - 0.8], HOLE, 1.2);
    }
  } else if (defeat) {
    g.lineStyle(1.2, HOLE);
    for (const ex of [cx - 3.4, cx + 3.4]) { g.beginPath(); g.arc(ex, hcy - 2, 1.9, 0.2, Math.PI - 0.2, false); g.strokePath(); }
  } else {
    g.fillStyle(HOLE); g.fillEllipse(cx - 3.4, hcy - 2.4, 4.4, casting ? 4 : 3); g.fillEllipse(cx + 3.4, hcy - 2.4, 4.4, casting ? 4 : 3);
    g.fillStyle(GOLD); g.fillEllipse(cx - 3.4, hcy - 2.4, 2.8, casting ? 3 : 2); g.fillEllipse(cx + 3.4, hcy - 2.4, 2.8, casting ? 3 : 2);
    g.fillStyle(HOLE); g.fillRect(cx - 3.9, hcy - 3, 1, 1.4); g.fillRect(cx + 2.9, hcy - 3, 1, 1.4);
    seg(g, [cx - 6.6, hcy - 5.2], [cx - 1.8, hcy - 3.6], MANE_DARK, 1.3);
    seg(g, [cx + 6.6, hcy - 5.2], [cx + 1.8, hcy - 3.6], MANE_DARK, 1.3);
  }
  // focinho e nariz
  g.fillStyle(MUZZLE); g.fillEllipse(cx, hcy + 3, 9, 6);
  g.fillStyle(HOLE); g.fillTriangle(cx - 1.8, hcy + 0.6, cx + 1.8, hcy + 0.6, cx, hcy + 2.6);
  // boca
  if (casting) {
    g.fillStyle(HOLE); g.fillEllipse(cx, hcy + 5.4, 6, 4.4);
    g.fillStyle(FANG);
    g.fillTriangle(cx - 2.8, hcy + 3.6, cx - 1.2, hcy + 3.6, cx - 2, hcy + 6);
    g.fillTriangle(cx + 1.2, hcy + 3.6, cx + 2.8, hcy + 3.6, cx + 2, hcy + 6);
    sun(g, cx, hcy + 10, 3.6); // o sol entre as presas
  } else if (talkOpen) {
    g.fillStyle(HOLE); g.fillEllipse(cx, hcy + 5.2, 4, 3);
  } else if (hurt) {
    seg(g, [cx - 2.4, hcy + 6], [cx, hcy + 4.6], HOLE, 1.1); seg(g, [cx, hcy + 4.6], [cx + 2.4, hcy + 6], HOLE, 1.1);
  } else if (defeat) {
    seg(g, [cx - 2, hcy + 5], [cx + 2, hcy + 5], HOLE, 1.1);
  } else {
    seg(g, [cx - 2.4, hcy + 4.8], [cx, hcy + 5.8], HOLE, 1.1); seg(g, [cx, hcy + 5.8], [cx + 2.4, hcy + 4.8], HOLE, 1.1);
    g.fillStyle(FANG); g.fillRect(cx - 2.2, hcy + 5.4, 1, 1.6); g.fillRect(cx + 1.2, hcy + 5.4, 1, 1.6);
  }
}

export function drawLionTextures(g: Gfx, T: number): void {
  const H = rooTextureHeight(T);
  for (let fi = 0; fi < 2; fi++) {
    drawLionFrame(g, T, fi, 'idle');
    g.generateTexture(`lion_idle_${fi}`, T, H);
  }
  drawLionFrame(g, T, 0, 'cast');
  g.generateTexture('lion_cast', T, H);
  drawLionFrame(g, T, 0, 'hurt');
  g.generateTexture('lion_hurt', T, H);
  for (let fi = 0; fi < 2; fi++) {
    drawLionFrame(g, T, fi, 'talk');
    g.generateTexture(`lion_talk_${fi}`, T, H);
  }
  drawLionFrame(g, T, 0, 'defeat');
  g.generateTexture('lion_defeat', T, H);
}
