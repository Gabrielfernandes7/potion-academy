// Mandrágora, feiticeira do jardim (chefe): uma raiz de mandrágora viva, como na lenda (a raiz com forma
// de gente, que grita quando é arrancada). Sem chapéu e sem manto, para não se confundir com a Belladona
// (alta, chapéu pontudo, vestido): aqui é uma figura baixa e larga, cabeça e corpo num bulbo só, coroa de
// folhas largas no topo, pernas de raiz bifurcadas, braços finos de radicela e boca grande.
// Silhueta: copa de folhas redonda + bulbo + duas pernas abertas. Mesmo tamanho da Roo (tile + folga no topo).
//
// Poses: 'idle' (6 quadros: respira, folhas e radículas balançam com atraso, pisca), 'walk' (4 quadros: passo
//        com um pé de cada vez, corpo que sobe e desce, braços que balançam), 'cast' (grita de boca aberta, braço
//        erguido com o orbe), 'hurt' (olhos em X), 'talk' (2 quadros: boca abre e fecha),
//        'defeat' (vencida, calma: olhos fechados, folhas caídas, braços baixos).
// O contorno escuro de 1 px (legibilidade sobre o chão claro do jardim) é dado a todos os chefes em textures/index.ts.
import Phaser from 'phaser';
import { ROO_HEAD_ROOM, rooTextureHeight } from './rooGeometry';

type Gfx = Phaser.GameObjects.Graphics;
type Pt = readonly [number, number];
type MandrakePose = 'idle' | 'walk' | 'cast' | 'hurt' | 'talk' | 'defeat';
interface FrameOpts { t?: number; blink?: boolean; open?: boolean }

const TAU = Math.PI * 2;
export const MANDRAKE_IDLE_FRAMES = 6;
export const MANDRAKE_WALK_FRAMES = 4;

const ROOT = 0xdcc08e;        // raiz clara, cor de mandrágora
const ROOT_SHADE = 0xb08a58;
const ROOT_DARK = 0x5a3a1c;
const LEAF_DARK = 0x2f6b2a;
const LEAF = 0x5fb043;
const LEAF_LIGHT = 0xa5e060;
const ORB = 0xd9ff66;
const EYE = 0xffd54f;
const HOLE = 0x1d1008;

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

/** Uma folha larga: da base (bx, by) até a ponta (tx, ty), com a metade clara. */
function leaf(g: Gfx, bx: number, by: number, tx: number, ty: number, w: number): void {
  const mx = (bx + tx) / 2, my = (by + ty) / 2;
  const nx = -(ty - by), ny = tx - bx;           // normal da folha
  const len = Math.hypot(nx, ny) || 1;
  const ox = (nx / len) * w, oy = (ny / len) * w;
  poly(g, [[bx, by], [mx + ox, my + oy], [tx, ty], [mx - ox, my - oy]], LEAF);
  poly(g, [[bx, by], [mx + ox, my + oy], [tx, ty]], LEAF_LIGHT, 0.55);
  seg(g, [bx, by], [tx, ty], LEAF_DARK, 0.8, 0.8);
}

function drawMandrakeFrame(g: Gfx, T: number, pose: MandrakePose, o: FrameOpts = {}): void {
  g.clear();
  const t = o.t ?? 0;
  const defeat = pose === 'defeat';
  const casting = pose === 'cast';
  const hurt = pose === 'hurt';
  const walk = pose === 'walk';
  const talkOpen = pose === 'talk' && !!o.open;
  const calm = defeat || hurt || casting;          // poses fixas: nada balança
  const B = rooTextureHeight(T);
  const cx = T / 2;
  const s1 = calm ? 0 : Math.sin(TAU * t);          // balanço do corpo e das radículas
  const s2 = calm ? 0 : Math.sin(TAU * (t - 0.18)); // folhas: seguem o corpo com atraso
  const breath = calm || walk ? 0 : (1 - Math.cos(TAU * t)) / 2; // 0..1: o bulbo enche e sobe
  const stride = walk ? Math.sin(TAU * t) : 0;      // passo: um pé sobe de cada vez
  const liftL = Math.max(0, stride) * 3;
  const liftR = Math.max(0, -stride) * 3;
  const up = walk ? Math.abs(stride) * 1.2 : breath * 0.7; // corpo sobe a cada passo ou respiração
  const cy = T / 2 + 1 + ROO_HEAD_ROOM + (hurt ? 0.8 : defeat ? 1.4 : 0) - up;
  const droop = defeat ? 5 : 0; // folhas caem quando vencida

  // sombra larga (encolhe um pouco quando o corpo sobe)
  g.fillStyle(0x000000, 0.22);
  g.fillEllipse(cx, B - 2, 26 - up * 1.5, 4);

  // pernas de raiz, abertas e bifurcadas; no passo, uma sobe e a outra apoia
  for (const s of [-1, 1]) {
    const lift = s < 0 ? liftL : liftR;
    const yb = B - 2 - lift;
    const knee = cy + 12 - lift * 0.4;
    poly(g, [[cx + s * 1, cy + 4], [cx + s * 8, cy + 4], [cx + s * 9.5, knee], [cx + s * 11, yb], [cx + s * 6.5, yb - 0.5], [cx + s * 4.5, knee]], ROOT);
    poly(g, [[cx + s * 6, cy + 5], [cx + s * 8, cy + 5], [cx + s * 9.5, knee], [cx + s * 8.5, yb - 1]], ROOT_SHADE, 0.6);
    g.fillStyle(ROOT_DARK);
    g.fillTriangle(cx + s * 11, yb, cx + s * 14, yb + 0.5, cx + s * 10, yb - 4); // dedão de raiz
    g.fillTriangle(cx + s * 6.5, yb - 0.5, cx + s * 4, yb + 1, cx + s * 7.5, yb - 4);
  }

  // braços finos de radícula (atrás do bulbo); no passo balançam em oposição
  const armSwing = walk ? stride * 2.2 : s2 * 0.6;
  const rx = casting ? cx + 13 : cx + 15;
  const ry = casting ? cy - 10 : defeat ? cy + 9 : cy + 6 - armSwing;
  const lx = cx - 15, ly = defeat ? cy + 9 : cy + 6 + armSwing;
  seg(g, [cx - 10, cy - 2], [lx, ly], ROOT_SHADE, 2.4);
  seg(g, [cx + 10, cy - 2], [rx, ry], ROOT_SHADE, 2.4);
  g.fillStyle(ROOT);
  g.fillCircle(lx, ly, 2.4);
  g.fillCircle(rx, ry, 2.4);
  seg(g, [lx, ly], [lx - 2, ly + 2.4], ROOT_DARK, 1);
  seg(g, [rx, ry], [rx + 2, ry - 2.4 * (casting ? 1 : -1)], ROOT_DARK, 1);

  // orbe: flutua sobre a mão que ergue (só ao lançar); parado, a raiz carrega uma folha-orbe
  if (casting) {
    g.fillStyle(ORB, 0.22); g.fillCircle(rx, ry - 6, 8);
    g.fillStyle(ORB, 0.32); g.fillCircle(rx, ry - 6, 5.5);
  }
  const orbY = ry - (casting ? 6 : 4);
  g.fillStyle(defeat ? LEAF_DARK : LEAF_LIGHT);
  g.fillCircle(rx, orbY, 2.6);
  g.fillStyle(0xffffff, 0.75); g.fillCircle(rx - 0.8, orbY - 0.8, 0.8);

  // bulbo: cabeça e corpo numa raiz só, larga em cima e afinando para as pernas (enche ao respirar)
  const puff = breath * 0.9;
  poly(g, [[cx - 12, cy - 10], [cx - 8, cy - 15], [cx + 8, cy - 15], [cx + 12, cy - 10], [cx + 11, cy - 1], [cx + 7, cy + 7], [cx - 7, cy + 7], [cx - 11, cy - 1]], ROOT);
  g.fillStyle(ROOT);
  g.fillEllipse(cx, cy - 6, 25 + puff, 20 + puff * 0.6);
  g.fillStyle(ROOT_SHADE, 0.55);
  g.fillEllipse(cx + 5.5, cy - 3, 11, 14);
  // anéis da raiz (as rugas da mandrágora)
  g.lineStyle(1, ROOT_DARK, 0.5);
  g.beginPath(); g.arc(cx, cy + 3, 9, 0.35, 2.8, false); g.strokePath();
  g.beginPath(); g.arc(cx, cy - 1, 11, 0.5, 2.65, false); g.strokePath();
  seg(g, [cx + 8, cy - 11], [cx + 10, cy - 5], ROOT_DARK, 1, 0.45);
  // radículas penduradas dos lados (balançam)
  seg(g, [cx - 11.5, cy], [cx - 13 + s1 * 0.8, cy + 6], ROOT_DARK, 0.9, 0.8);
  seg(g, [cx - 10, cy + 3], [cx - 11 - s1 * 0.8, cy + 8], ROOT_DARK, 0.9, 0.8);
  seg(g, [cx + 11.5, cy], [cx + 13 - s1 * 0.8, cy + 6], ROOT_DARK, 0.9, 0.8);

  // saiote de folhinhas na cintura (ondula com o passo)
  g.fillStyle(LEAF);
  for (const dx of [-8, -4, 0, 4, 8]) {
    const w = s2 * 0.5 * (dx < 0 ? -1 : 1);
    g.fillTriangle(cx + dx - 2.2, cy + 5, cx + dx + 2.2, cy + 5, cx + dx + (dx < 0 ? -0.6 : 0.6) + w, cy + 9);
  }
  g.fillStyle(LEAF_LIGHT);
  for (const dx of [-6, 2, 6]) g.fillTriangle(cx + dx - 1.2, cy + 5, cx + dx + 1.2, cy + 5, cx + dx, cy + 7.6);

  // rosto grande
  if (hurt) {
    for (const ex of [cx - 4.4, cx + 4.4]) {
      seg(g, [ex - 2, cy - 10.5], [ex + 2, cy - 6.5], HOLE, 1.3);
      seg(g, [ex + 2, cy - 10.5], [ex - 2, cy - 6.5], HOLE, 1.3);
    }
  } else if (defeat || o.blink) {
    g.lineStyle(1.3, HOLE);
    for (const ex of [cx - 4.4, cx + 4.4]) {
      g.beginPath(); g.arc(ex, cy - (defeat ? 9 : 8.6), 2.4, 0.2, Math.PI - 0.2, false); g.strokePath();
    }
    if (o.blink) {
      seg(g, [cx - 8, cy - 12.6], [cx - 2.2, cy - 10.6], ROOT_DARK, 1.4);
      seg(g, [cx + 8, cy - 12.6], [cx + 2.2, cy - 10.6], ROOT_DARK, 1.4);
    }
  } else {
    const eh = casting ? 5.4 : 4.4;
    g.fillStyle(HOLE);
    g.fillEllipse(cx - 4.4, cy - 8.5, 5.6, eh + 0.8);
    g.fillEllipse(cx + 4.4, cy - 8.5, 5.6, eh + 0.8);
    g.fillStyle(EYE);
    g.fillEllipse(cx - 4.4, cy - 8.5, 3.6, eh - 0.8);
    g.fillEllipse(cx + 4.4, cy - 8.5, 3.6, eh - 0.8);
    g.fillStyle(HOLE);
    g.fillRect(cx - 4.9 + s1 * 0.5, cy - 9.2, 1, casting ? 2.6 : 1.8); // o olhar acompanha o balanço
    g.fillRect(cx + 3.9 + s1 * 0.5, cy - 9.2, 1, casting ? 2.6 : 1.8);
    // sobrancelhas de galho: franzidas
    seg(g, [cx - 8, cy - 12.6], [cx - 2.2, cy - 10.6], ROOT_DARK, 1.4);
    seg(g, [cx + 8, cy - 12.6], [cx + 2.2, cy - 10.6], ROOT_DARK, 1.4);
  }
  // nariz de tocão
  g.fillStyle(ROOT_SHADE);
  g.fillEllipse(cx, cy - 4.8, 2.6, 2.2);
  // boca: o grito da mandrágora (grande ao lançar)
  if (casting) {
    g.fillStyle(HOLE); g.fillEllipse(cx, cy - 0.6, 8, 6.6);
    g.fillStyle(0x7a2f2f); g.fillEllipse(cx, cy + 0.8, 4.6, 2.6);
  } else if (talkOpen) {
    g.fillStyle(HOLE); g.fillEllipse(cx, cy - 1, 5, 3.4);
  } else if (hurt) {
    seg(g, [cx - 3, cy], [cx, cy - 1.6], ROOT_DARK, 1.2);
    seg(g, [cx, cy - 1.6], [cx + 3, cy], ROOT_DARK, 1.2);
  } else if (defeat) {
    seg(g, [cx - 2.4, cy - 1.2], [cx + 2.4, cy - 1.2], ROOT_DARK, 1.2);
  } else {
    seg(g, [cx - 3, cy - 1.8], [cx, cy - 0.6], ROOT_DARK, 1.2);
    seg(g, [cx, cy - 0.6], [cx + 3, cy - 1.8], ROOT_DARK, 1.2);
  }

  // coroa de folhas largas brotando do topo; cada folha balança com um atraso próprio (efeito de mola)
  const top = cy - 14;
  const lag = (k: number): number => (calm ? 0 : Math.sin(TAU * (t - 0.18 - k * 0.07)));
  const bounce = walk ? Math.abs(stride) * -1.2 : breath * -0.8; // as pontas sobem na inspiração, caem no passo
  leaf(g, cx - 5, top + 1, cx - 14, top - 5 + droop + lag(0) * 0.7 + bounce * -0.4, 2.8);
  leaf(g, cx + 5, top + 1, cx + 14, top - 5 + droop - lag(0) * 0.7 + bounce * -0.4, 2.8);
  leaf(g, cx - 3, top, cx - 8 + lag(1) * 1.3, top - 12 + droop * 1.3 + bounce, 3.2);
  leaf(g, cx + 3, top, cx + 8 + lag(2) * 1.3, top - 12 + droop * 1.3 + bounce, 3.2);
  leaf(g, cx, top, cx + lag(3) * 1.6, top - 13 + droop * 1.6 + bounce * 1.3, 3.4);
}

/** Gera os quadros. Chaves: idle_0..5, walk_0..3, cast, hurt, talk_0/1, defeat. */
export function drawMandrakeTextures(g: Gfx, T: number): void {
  const H = rooTextureHeight(T);
  const make = (key: string, pose: MandrakePose, o?: FrameOpts): void => {
    drawMandrakeFrame(g, T, pose, o);
    g.generateTexture(key, T, H);
  };
  for (let i = 0; i < MANDRAKE_IDLE_FRAMES; i++) {
    make(`mandrake_idle_${i}`, 'idle', { t: i / MANDRAKE_IDLE_FRAMES, blink: i === 4 });
  }
  for (let i = 0; i < MANDRAKE_WALK_FRAMES; i++) make(`mandrake_walk_${i}`, 'walk', { t: i / MANDRAKE_WALK_FRAMES });
  make('mandrake_cast', 'cast');
  make('mandrake_hurt', 'hurt');
  for (let i = 0; i < 2; i++) make(`mandrake_talk_${i}`, 'talk', { t: i / 2, open: i === 1 });
  make('mandrake_defeat', 'defeat');
}
