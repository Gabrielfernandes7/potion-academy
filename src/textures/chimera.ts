// Quimera de Mercúrio, chefe do Vale: uma criatura de prata líquida com cabeça de leão (juba, chifres),
// uma segunda cabeça de bode saindo das costas e cauda de serpente (as três partes do mito grego). O corpo é uma poça que se ergue; pinga e brilha em azul pálido.
// Mesmo tamanho da Roo (tile + folga no topo).
//
// Poses: 'idle' (2 quadros: a cauda e a poça ondulam), 'cast' (boca aberta, brilho azul, cabeça erguida),
//        'hurt' (olhos em X), 'talk' (2 quadros: boca abre e fecha),
//        'defeat' (vencida: já quase só poça, olhos fechados, cabeça baixa).
import Phaser from 'phaser';
import { ROO_HEAD_ROOM, rooTextureHeight } from './rooGeometry';

type Gfx = Phaser.GameObjects.Graphics;
type Pt = readonly [number, number];
type ChimeraPose = 'idle' | 'cast' | 'hurt' | 'talk' | 'defeat';

const SILVER = 0xb0bec5;
const SILVER_LIGHT = 0xeceff1;
const SILVER_SHADE = 0x78909c;
const SILVER_DARK = 0x37474f;
const BLUE = 0x90caf9;
const BLUE_DEEP = 0x1e88e5;
const HORN = 0xcfd8dc;
const HOLE = 0x1c2a33;

function poly(g: Gfx, pts: Pt[], color: number, alpha = 1): void {
  g.fillStyle(color, alpha);
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath();
  g.fillPath();
}

function seg(g: Gfx, a: Pt, b: Pt, color: number, width: number, alpha = 1): void {
  g.lineStyle(width, color, alpha);
  g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.strokePath();
}

function drawChimeraFrame(g: Gfx, T: number, frame: number, pose: ChimeraPose): void {
  g.clear();
  const f = frame % 2;
  const defeat = pose === 'defeat';
  const casting = pose === 'cast';
  const hurt = pose === 'hurt';
  const talkOpen = pose === 'talk' && f === 1;
  const B = rooTextureHeight(T);
  const cx = T / 2;
  const wob = defeat ? 0 : f === 0 ? -0.8 : 0.8;
  const cy = T / 2 + 1 + ROO_HEAD_ROOM + (hurt ? 0.8 : defeat ? 5 : 0);

  // sombra
  g.fillStyle(0x000000, 0.22);
  g.fillEllipse(cx, B - 2, 28, 4);

  // poça de mercúrio na base, com pingos
  g.fillStyle(SILVER_SHADE);
  g.fillEllipse(cx, B - 5, defeat ? 32 : 26, defeat ? 8 : 7);
  g.fillStyle(SILVER);
  g.fillEllipse(cx - 1, B - 6, defeat ? 28 : 22, defeat ? 6 : 5);
  g.fillStyle(SILVER_LIGHT, 0.8);
  g.fillEllipse(cx - 5, B - 7, 7, 1.6);
  if (!defeat) {
    g.fillStyle(SILVER);
    g.fillTriangle(cx + 10, B - 7, cx + 13, B - 7, cx + 11.5 + wob * 0.3, B - 3);
    g.fillTriangle(cx - 13, B - 7, cx - 10, B - 7, cx - 11.5 - wob * 0.3, B - 3.5);
  }

  // cauda de serpente: sai da poça, sobe curvando e termina numa cabecinha com língua
  if (!defeat) {
    const tail: Pt[] = [
      [cx + 10, B - 8], [cx + 15 + wob, B - 14], [cx + 17 + wob * 1.6, B - 21], [cx + 14 + wob * 2, B - 27],
    ];
    for (let i = 0; i < tail.length - 1; i++) seg(g, tail[i], tail[i + 1], SILVER_SHADE, 3.6 - i * 0.7);
    for (let i = 0; i < tail.length - 1; i++) seg(g, tail[i], tail[i + 1], SILVER, 2.2 - i * 0.4);
    const [hx, hy] = tail[3];
    g.fillStyle(SILVER); g.fillEllipse(hx, hy - 1, 5, 4);
    g.fillStyle(BLUE_DEEP); g.fillCircle(hx + 0.8, hy - 1.6, 0.8);
    seg(g, [hx + 2, hy - 0.4], [hx + 4.2, hy + 0.4 + wob * 0.2], 0xff5252, 0.8);
  }

  // corpo: massa de prata erguida da poça
  const bodyTop = cy - 2 + (defeat ? 3 : 0);
  poly(g, [
    [cx - 11, B - 8], [cx - 9, bodyTop + 4 + wob * 0.3], [cx - 5, bodyTop - 1],
    [cx + 5, bodyTop - 1], [cx + 9, bodyTop + 4 - wob * 0.3], [cx + 11, B - 8],
  ], SILVER_SHADE);
  g.fillStyle(SILVER);
  g.fillEllipse(cx, bodyTop + 8, 19, 17);
  g.fillStyle(SILVER_LIGHT, 0.7);
  g.fillEllipse(cx - 4.5, bodyTop + 5, 4.5, 8);
  g.fillStyle(BLUE, 0.35);
  g.fillEllipse(cx + 4, bodyTop + 11, 6, 6);
  // patas de leão (duas pontas arredondadas saindo do corpo)
  g.fillStyle(SILVER);
  g.fillEllipse(cx - 7, B - 8.5, 6, 5);
  g.fillEllipse(cx + 7, B - 8.5, 6, 5);
  g.fillStyle(SILVER_DARK, 0.7);
  for (const dx of [-8.5, -6.5, 5.5, 7.5]) g.fillRect(cx + dx, B - 7.4, 0.9, 1.4);

  // segunda cabeça, de bode, saindo das costas pelo ombro esquerdo (como no mito da Quimera)
  const gx = cx - 14 + (defeat ? 1 : wob * 0.4);
  const gy = cy + (defeat ? 7 : 2);
  seg(g, [cx - 8, bodyTop + 6], [gx + 1, gy + 3], SILVER_SHADE, 4.2);
  g.fillStyle(SILVER_SHADE); g.fillEllipse(gx, gy, 8.4, 8);
  g.fillStyle(SILVER); g.fillEllipse(gx - 0.4, gy - 0.4, 7, 6.6);
  seg(g, [gx - 1, gy - 3], [gx - 3.6, gy - 8], HORN, 1.9);
  seg(g, [gx - 3.6, gy - 8], [gx - 1.6, gy - 10.4], HORN, 1.4);
  g.fillStyle(SILVER_LIGHT, 0.85); g.fillEllipse(gx - 0.6, gy + 2.4, 4.2, 2.8);
  seg(g, [gx - 0.6, gy + 3.8], [gx - 1, gy + 6.6], SILVER_LIGHT, 1);
  if (hurt) {
    seg(g, [gx - 3, gy - 1.6], [gx - 0.6, gy + 0.6], HOLE, 1);
    seg(g, [gx - 0.6, gy - 1.6], [gx - 3, gy + 0.6], HOLE, 1);
  } else if (defeat) {
    seg(g, [gx - 3, gy - 0.6], [gx - 0.6, gy - 0.6], HOLE, 1);
  } else {
    g.fillStyle(BLUE_DEEP); g.fillCircle(gx - 1.8, gy - 0.8, 1.1);
    g.fillStyle(0xffffff); g.fillCircle(gx - 2.1, gy - 1.1, 0.4);
  }

  // juba: pontas de prata em volta do rosto
  const hcy = cy - 8 + (casting ? -1 : 0) + (defeat ? 5 : 0);
  g.fillStyle(SILVER_SHADE);
  const mane = 10;
  for (let i = 0; i < mane; i++) {
    const a = (i / mane) * Math.PI * 2;
    const r1 = 7;
    const r2 = 12.2 + (i % 2 === 0 ? 1.2 : 0) + (i % 3 === 0 ? wob * 0.4 : 0);
    const px = Math.cos(a);
    const py = Math.sin(a);
    g.fillTriangle(
      cx + px * r1 - py * 2.6, hcy + py * r1 + px * 2.6,
      cx + px * r1 + py * 2.6, hcy + py * r1 - px * 2.6,
      cx + px * r2, hcy + py * r2,
    );
  }
  g.fillStyle(SILVER);
  g.fillCircle(cx, hcy, 9);
  g.fillStyle(SILVER_LIGHT, 0.75);
  g.fillEllipse(cx - 3.5, hcy - 4, 5, 3);

  // chifres de bode: curvam para trás e para cima
  const horn = (s: number): void => {
    const base: Pt = [cx + s * 6, hcy - 6.5];
    const mid: Pt = [cx + s * 10, hcy - 11];
    const tip: Pt = [cx + s * 7.5, hcy - 17 + (defeat ? 3 : 0)];
    seg(g, base, mid, HORN, 3);
    seg(g, mid, tip, HORN, 2);
    seg(g, base, mid, SILVER_SHADE, 1, 0.6);
    seg(g, mid, [tip[0] - s * 0.4, tip[1] + 0.6], SILVER_SHADE, 1, 0.5);
  };
  horn(-1); horn(1);

  // rosto
  if (hurt) {
    for (const ex of [cx - 3.4, cx + 3.4]) {
      seg(g, [ex - 1.6, hcy - 3.6], [ex + 1.6, hcy - 1.2], HOLE, 1.2);
      seg(g, [ex + 1.6, hcy - 3.6], [ex - 1.6, hcy - 1.2], HOLE, 1.2);
    }
  } else if (defeat) {
    g.lineStyle(1.2, HOLE);
    for (const ex of [cx - 3.4, cx + 3.4]) {
      g.beginPath(); g.arc(ex, hcy - 2.4, 1.9, 0.2, Math.PI - 0.2, false); g.strokePath();
    }
  } else {
    g.fillStyle(HOLE);
    g.fillEllipse(cx - 3.4, hcy - 2.6, 4.2, casting ? 4 : 3);
    g.fillEllipse(cx + 3.4, hcy - 2.6, 4.2, casting ? 4 : 3);
    g.fillStyle(casting ? 0xffffff : BLUE);
    g.fillEllipse(cx - 3.4, hcy - 2.6, 2.6, casting ? 2.8 : 1.8);
    g.fillEllipse(cx + 3.4, hcy - 2.6, 2.6, casting ? 2.8 : 1.8);
    seg(g, [cx - 6.4, hcy - 5.4], [cx - 1.8, hcy - 4], SILVER_DARK, 1.2);
    seg(g, [cx + 6.4, hcy - 5.4], [cx + 1.8, hcy - 4], SILVER_DARK, 1.2);
  }
  // focinho e nariz de leão
  g.fillStyle(SILVER_SHADE);
  g.fillEllipse(cx, hcy + 2.6, 8, 5);
  poly(g, [[cx - 1.8, hcy], [cx + 1.8, hcy], [cx, hcy + 2]], SILVER_DARK);
  // boca
  if (casting) {
    g.fillStyle(BLUE, 0.35); g.fillCircle(cx, hcy + 5.4, 7);
    g.fillStyle(BLUE, 0.5); g.fillCircle(cx, hcy + 5.4, 4.2);
    g.fillStyle(HOLE); g.fillEllipse(cx, hcy + 5, 4.4, 3.8);
    g.fillStyle(0xffffff); g.fillTriangle(cx - 1.8, hcy + 3.4, cx - 0.6, hcy + 3.4, cx - 1.2, hcy + 5);
    g.fillTriangle(cx + 0.6, hcy + 3.4, cx + 1.8, hcy + 3.4, cx + 1.2, hcy + 5);
  } else if (talkOpen) {
    g.fillStyle(HOLE); g.fillEllipse(cx, hcy + 5, 3.8, 2.6);
  } else if (hurt) {
    seg(g, [cx - 2.4, hcy + 5.8], [cx, hcy + 4.4], SILVER_DARK, 1.1);
    seg(g, [cx, hcy + 4.4], [cx + 2.4, hcy + 5.8], SILVER_DARK, 1.1);
  } else if (defeat) {
    seg(g, [cx - 2, hcy + 5], [cx + 2, hcy + 5], SILVER_DARK, 1.1);
  } else {
    seg(g, [cx - 2.6, hcy + 4.8], [cx, hcy + 5.6], SILVER_DARK, 1.1);
    seg(g, [cx, hcy + 5.6], [cx + 2.6, hcy + 4.8], SILVER_DARK, 1.1);
  }
  // gotas de mercúrio escorrendo do queixo
  if (!defeat && !casting) {
    g.fillStyle(SILVER_LIGHT);
    g.fillCircle(cx - 4.2 + wob * 0.2, hcy + 9.8 + (f === 0 ? 0 : 1), 0.9);
  }
}

export function drawChimeraTextures(g: Gfx, T: number): void {
  const H = rooTextureHeight(T);
  for (let fi = 0; fi < 2; fi++) {
    drawChimeraFrame(g, T, fi, 'idle');
    g.generateTexture(`chimera_idle_${fi}`, T, H);
  }
  drawChimeraFrame(g, T, 0, 'cast');
  g.generateTexture('chimera_cast', T, H);
  drawChimeraFrame(g, T, 0, 'hurt');
  g.generateTexture('chimera_hurt', T, H);
  for (let fi = 0; fi < 2; fi++) {
    drawChimeraFrame(g, T, fi, 'talk');
    g.generateTexture(`chimera_talk_${fi}`, T, H);
  }
  drawChimeraFrame(g, T, 0, 'defeat');
  g.generateTexture('chimera_defeat', T, H);
}
