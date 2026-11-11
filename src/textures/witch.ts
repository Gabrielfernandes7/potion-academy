// Belladona, a alquimista rival (chefe). Roupa verde-escura com detalhes em verde-limão,
// cabelo carmim e olhos brilhantes. Mesmo tamanho da Roo (tile + folga no topo).
//
// Poses:  'idle' (2 frames: balança o manto e o chapéu), 'cast' (braço levantado com a poção),
//         'hurt' (olhos fechados, sobrancelhas caídas), 'talk' (2 frames: boca abre e fecha, parada),
//         'defeat' (vencida, sem humilhação: olhos fechados em calma, cabeça baixa, poção abaixada).
import Phaser from 'phaser';
import { ROO_HEAD_ROOM, rooTextureHeight } from './rooGeometry';

type Gfx = Phaser.GameObjects.Graphics;
type Pt = readonly [number, number];
type WitchPose = 'idle' | 'cast' | 'hurt' | 'talk' | 'defeat';

const ROBE = 0x143d36;
const ROBE_DARK = 0x0b2420;
const ROBE_LIGHT = 0x1f5c50;
const LIME = 0x9be564;
const SKIN = 0xe6d8f2;
const SKIN_SHADE = 0xcdbadf;
const HAIR = 0x8e1b4a;
const BAND = 0xd81b60;
const GOLD = 0xffd54f;

function poly(g: Gfx, pts: Pt[], color: number, alpha = 1): void {
  g.fillStyle(color, alpha);
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath();
  g.fillPath();
}

function line(g: Gfx, pts: Pt[], color: number, width: number, alpha = 1): void {
  g.lineStyle(width, color, alpha);
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.strokePath();
}

function flask(g: Gfx, x: number, y: number, glow: boolean): void {
  if (glow) {
    g.fillStyle(LIME, 0.22); g.fillCircle(x, y, 8);
    g.fillStyle(LIME, 0.3); g.fillCircle(x, y, 5.5);
  }
  g.fillStyle(0x8b6f47); g.fillRect(x - 1.2, y - 6, 2.4, 2);
  g.fillStyle(0xe8f1f2); g.fillRect(x - 1.4, y - 4.2, 2.8, 3);
  g.fillTriangle(x - 1.4, y - 1.4, x + 1.4, y - 1.4, x + 4.2, y + 4.2);
  g.fillTriangle(x - 1.4, y - 1.4, x - 4.2, y + 4.2, x + 4.2, y + 4.2);
  g.fillStyle(0x76d83a);
  g.fillTriangle(x - 2.6, y + 1.2, x + 2.6, y + 1.2, x + 4.2, y + 4.2);
  g.fillTriangle(x - 2.6, y + 1.2, x - 4.2, y + 4.2, x + 4.2, y + 4.2);
}

function drawWitchFrame(g: Gfx, T: number, frame: number, pose: WitchPose): void {
  g.clear();
  const f = frame % 2;
  const defeat = pose === 'defeat';
  const B = rooTextureHeight(T);
  const cx = T / 2;
  const sway = defeat ? 0 : f === 0 ? -0.8 : 0.8;
  const breath = pose === 'talk' ? 0 : f === 1 ? 0.6 : 0;
  const cy = T / 2 + 1 + ROO_HEAD_ROOM + (pose === 'hurt' ? 0.8 : defeat ? 1 : 0);
  const casting = pose === 'cast';
  const hurt = pose === 'hurt';
  const talkOpen = pose === 'talk' && f === 1;

  // sombra
  g.fillStyle(0x000000, 0.22);
  g.fillEllipse(cx, B - 2, 22, 4);

  // botas
  g.fillStyle(0x1b1b24);
  g.fillEllipse(cx - 5, B - 3.5, 7, 3.5);
  g.fillEllipse(cx + 5, B - 3.5, 7, 3.5);

  // cabelo de trás (cai sobre os ombros)
  g.fillStyle(HAIR);
  g.fillEllipse(cx - 6.5, cy - 5, 6, 14);
  g.fillEllipse(cx + 6.5, cy - 5, 6, 14);
  g.fillStyle(0x6e1038, 0.6);
  g.fillEllipse(cx - 7, cy - 1, 3, 8);
  g.fillEllipse(cx + 7, cy - 1, 3, 8);

  // vestido com barra em "dentes" que balança
  const hemY = cy + 15 + breath;
  const hem: Pt[] = [14, 9, 3.5, -3.5, -9, -14].map((dx, i) => [
    cx + dx + sway * (i % 2 === 0 ? 1 : -0.6),
    hemY + (i % 2 === 0 ? 0 : 2.2) + (casting ? -0.6 : 0),
  ] as const);
  poly(g, [[cx - 8, cy - 3], [cx + 8, cy - 3], [cx + 11, cy + 6], ...hem, [cx - 11, cy + 6]], ROBE);
  poly(g, [[cx - 3, cy - 3], [cx + 3, cy - 3], [cx + 5, cy + 10], [cx - 5, cy + 10]], ROBE_LIGHT, 0.55);
  line(g, [[cx - 4, cy], [cx - 7, cy + 13]], ROBE_DARK, 1, 0.8);
  line(g, [[cx + 4, cy], [cx + 7, cy + 13]], ROBE_DARK, 1, 0.8);
  line(g, hem, LIME, 1.3, 0.95);

  // braço esquerdo (na cintura) e direito (segura a poção)
  g.fillStyle(ROBE);
  g.fillEllipse(cx - 9.5, cy + 4, 5, 9);
  g.fillStyle(SKIN);
  g.fillCircle(cx - 10, cy + 9, 2.5);
  if (casting) {
    poly(g, [[cx + 7, cy - 2], [cx + 11, cy - 3.5], [cx + 15, cy - 11], [cx + 12, cy - 12.5]], ROBE);
    g.fillStyle(SKIN); g.fillCircle(cx + 14, cy - 12, 2.5);
    flask(g, cx + 14, cy - 18, true);
  } else {
    g.fillStyle(ROBE);
    g.fillEllipse(cx + 9.5, cy + 4, 5, 9);
    g.fillStyle(SKIN); g.fillCircle(cx + 10, cy + 9, 2.5);
    flask(g, cx + 12.5, cy + 8.5, false);
  }

  // gola alta
  g.fillStyle(ROBE);
  g.fillEllipse(cx, cy - 4, 16, 5.5);
  line(g, [[cx - 7.5, cy - 4.5], [cx + 7.5, cy - 4.5]], LIME, 0.9, 0.95);
  g.fillStyle(LIME); g.fillCircle(cx, cy - 2.4, 1.6); // broche
  g.fillStyle(0xffffff, 0.8); g.fillCircle(cx - 0.5, cy - 2.9, 0.5);

  // cabeça
  g.fillStyle(SKIN);
  g.fillEllipse(cx, cy - 10, 12, 13);
  g.fillStyle(SKIN_SHADE, 0.55);
  g.fillEllipse(cx + 2.5, cy - 7, 5, 6);

  // franja
  poly(g, [[cx - 6, cy - 14.5], [cx + 6, cy - 14.5], [cx + 5.5, cy - 11], [cx + 1, cy - 12.6], [cx - 3, cy - 11.2], [cx - 5.8, cy - 11.5]], HAIR);

  // rosto
  if (hurt) {
    line(g, [[cx - 4.8, cy - 11], [cx - 1.8, cy - 8.8]], 0x2a0a1a, 1.2);
    line(g, [[cx - 1.8, cy - 11], [cx - 4.8, cy - 8.8]], 0x2a0a1a, 1.2);
    line(g, [[cx + 1.8, cy - 11], [cx + 4.8, cy - 8.8]], 0x2a0a1a, 1.2);
    line(g, [[cx + 4.8, cy - 11], [cx + 1.8, cy - 8.8]], 0x2a0a1a, 1.2);
  } else if (defeat) {
    // olhos fechados em arco suave e sobrancelhas relaxadas: ela aceita a derrota
    g.lineStyle(1.2, 0x2a0a1a);
    for (const ex of [cx - 3.2, cx + 3.2]) {
      g.beginPath(); g.arc(ex, cy - 10.4, 2, 0.2, Math.PI - 0.2, false); g.strokePath();
    }
    line(g, [[cx - 5.6, cy - 12.4], [cx - 1.6, cy - 12]], 0x4a0f2a, 1);
    line(g, [[cx + 5.6, cy - 12.4], [cx + 1.6, cy - 12]], 0x4a0f2a, 1);
  } else {
    g.fillStyle(0xd9ff66);
    g.fillEllipse(cx - 3.2, cy - 10, 3.8, casting ? 3.6 : 2.6);
    g.fillEllipse(cx + 3.2, cy - 10, 3.8, casting ? 3.6 : 2.6);
    g.fillStyle(0x2a3a0a);
    g.fillRect(cx - 3.6, cy - 11, 0.9, casting ? 2.6 : 2);
    g.fillRect(cx + 2.8, cy - 11, 0.9, casting ? 2.6 : 2);
    // sobrancelhas franzidas
    line(g, [[cx - 5.8, cy - 12.8], [cx - 1.4, cy - 11.4]], 0x4a0f2a, 1.2);
    line(g, [[cx + 5.8, cy - 12.8], [cx + 1.4, cy - 11.4]], 0x4a0f2a, 1.2);
  }
  // nariz pontudo
  g.fillStyle(0xd1bfe0);
  g.fillTriangle(cx - 0.8, cy - 9.2, cx - 1.4, cy - 6.4, cx + 1.9, cy - 6.9);
  // boca
  if (hurt) {
    line(g, [[cx - 2.4, cy - 3.8], [cx, cy - 5], [cx + 2.4, cy - 3.8]], 0x5a1a3a, 1.1);
  } else if (defeat) {
    line(g, [[cx - 2, cy - 4.4], [cx + 2, cy - 4.4]], 0x5a1a3a, 1.1);
  } else if (casting || talkOpen) {
    g.fillStyle(0x5a1a3a); g.fillEllipse(cx, cy - 4.4, 3.4, talkOpen ? 2.2 : 2.8);
    g.fillStyle(0xffffff); g.fillRect(cx - 1.2, cy - 5.5, 0.9, 1);
  } else {
    line(g, [[cx - 2.8, cy - 4.8], [cx - 0.5, cy - 3.6], [cx + 1.6, cy - 4], [cx + 3, cy - 5.4]], 0x5a1a3a, 1.1);
  }
  // blush
  g.fillStyle(0xff8fb1, 0.35);
  g.fillCircle(cx - 4.8, cy - 6.4, 1.5);
  g.fillCircle(cx + 4.8, cy - 6.4, 1.5);

  // chapéu torto de bruxa
  const tipDx = defeat ? -1.4 : f === 0 ? 0.4 : -0.4;
  g.fillStyle(ROBE);
  g.fillEllipse(cx, cy - 14.6, 22, 4.6);
  line(g, [[cx - 10.5, cy - 14.2], [cx - 5, cy - 12.6], [cx + 5, cy - 12.6], [cx + 10.5, cy - 14.2]], LIME, 1, 0.9);
  poly(g, [[cx - 6.5, cy - 15], [cx + 6.5, cy - 15], [cx + 1 + tipDx, cy - 28]], ROBE);
  poly(g, [[cx + 1 + tipDx, cy - 28], [cx - 1.6 + tipDx, cy - 24.5], [cx + 8 + tipDx, cy - 27.5]], ROBE_LIGHT);
  poly(g, [[cx - 6.5, cy - 15], [cx + 6.5, cy - 15], [cx + 5.4, cy - 18], [cx - 5.4, cy - 18]], BAND);
  g.fillStyle(GOLD); g.fillRect(cx - 1.6, cy - 18.1, 3.6, 3.4);
  g.fillStyle(0x6d4c41); g.fillRect(cx - 0.6, cy - 17.1, 1.6, 1.4);
}

export function drawWitchTextures(g: Gfx, T: number): void {
  const H = rooTextureHeight(T);
  for (let fi = 0; fi < 2; fi++) {
    drawWitchFrame(g, T, fi, 'idle');
    g.generateTexture(`witch_idle_${fi}`, T, H);
  }
  drawWitchFrame(g, T, 0, 'cast');
  g.generateTexture('witch_cast', T, H);
  drawWitchFrame(g, T, 0, 'hurt');
  g.generateTexture('witch_hurt', T, H);
  for (let fi = 0; fi < 2; fi++) {
    drawWitchFrame(g, T, fi, 'talk');
    g.generateTexture(`witch_talk_${fi}`, T, H);
  }
  drawWitchFrame(g, T, 0, 'defeat');
  g.generateTexture('witch_defeat', T, H);
}
