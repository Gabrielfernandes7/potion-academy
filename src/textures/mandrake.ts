// Mandrágora, feiticeira do jardim (chefe): uma árvore humanoide. Pele de madeira (veios, nós),
// folhas brotando do cabelo e do chapéu, chapéu pontudo de bruxa, manto verde-musgo, galho-cajado
// com orbe e pés de raiz. Mesmo tamanho da Roo (tile + folga no topo).
//
// Poses: 'idle' (2 quadros: manto e folhas balançam), 'cast' (boca aberta, braço erguido, orbe brilhando),
//        'hurt' (olhos em X), 'talk' (2 quadros: boca abre e fecha),
//        'defeat' (vencida, calma: olhos fechados, chapéu torto, cajado baixo).
import Phaser from 'phaser';
import { ROO_HEAD_ROOM, rooTextureHeight } from './rooGeometry';

type Gfx = Phaser.GameObjects.Graphics;
type Pt = readonly [number, number];
type MandrakePose = 'idle' | 'cast' | 'hurt' | 'talk' | 'defeat';

const WOOD = 0xb88a54;        // pele de madeira clara
const WOOD_SHADE = 0x8c6238;
const WOOD_DARK = 0x4a3018;
const ROBE = 0x2f5a2c;        // manto verde-musgo
const ROBE_LIGHT = 0x4a8038;
const ROBE_DARK = 0x1c3a1d;
const HAT = 0x3b2a52;         // chapéu roxo-escuro
const HAT_LIGHT = 0x5a3f7a;
const LEAF = 0x5fb043;
const LEAF_LIGHT = 0xa5e060;
const ORB = 0xd9ff66;
const EYE = 0xffd54f;
const HOLE = 0x1d1008;
const GOLD = 0xffd54f;

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

function drawMandrakeFrame(g: Gfx, T: number, frame: number, pose: MandrakePose): void {
  g.clear();
  const f = frame % 2;
  const defeat = pose === 'defeat';
  const casting = pose === 'cast';
  const hurt = pose === 'hurt';
  const talkOpen = pose === 'talk' && f === 1;
  const B = rooTextureHeight(T);
  const cx = T / 2;
  const sway = defeat ? 0 : f === 0 ? -0.8 : 0.8;
  const breath = pose === 'talk' ? 0 : f === 1 ? 0.6 : 0;
  const cy = T / 2 + 1 + ROO_HEAD_ROOM + (hurt ? 0.8 : defeat ? 1.4 : 0);

  // sombra
  g.fillStyle(0x000000, 0.22);
  g.fillEllipse(cx, B - 2, 24, 4);

  // pés de raiz
  g.fillStyle(WOOD_DARK);
  g.fillTriangle(cx - 9, B - 2, cx - 5, B - 8, cx - 2, B - 5);
  g.fillTriangle(cx + 9, B - 2, cx + 5, B - 8, cx + 2, B - 5);
  g.fillTriangle(cx - 3, B - 1.5, cx + 3, B - 1.5, cx, B - 8);

  // manto com barra de folhas que balança
  const hemY = cy + 15 + breath;
  const hem: Pt[] = [14, 9, 3.5, -3.5, -9, -14].map((dx, i) => [
    cx + dx + sway * (i % 2 === 0 ? 1 : -0.6),
    hemY + (i % 2 === 0 ? 0 : 2.2) + (casting ? -0.6 : 0),
  ] as const);
  poly(g, [[cx - 8, cy - 3], [cx + 8, cy - 3], [cx + 11, cy + 6], ...hem, [cx - 11, cy + 6]], ROBE);
  poly(g, [[cx - 3, cy - 3], [cx + 3, cy - 3], [cx + 5, cy + 10], [cx - 5, cy + 10]], ROBE_LIGHT, 0.55);
  seg(g, [cx - 4, cy], [cx - 7, cy + 13], ROBE_DARK, 1, 0.8);
  seg(g, [cx + 4, cy], [cx + 7, cy + 13], ROBE_DARK, 1, 0.8);
  // folhinhas na barra
  g.fillStyle(LEAF_LIGHT);
  hem.forEach(([hx, hy], i) => g.fillTriangle(hx - 1.4, hy, hx + 1.4, hy, hx + (i % 2 ? -0.6 : 0.6), hy + 2.8));

  // braço esquerdo (na cintura): manga e mão de madeira
  g.fillStyle(ROBE);
  g.fillEllipse(cx - 9.5, cy + 4, 5, 9);
  g.fillStyle(WOOD); g.fillCircle(cx - 10, cy + 9, 2.5);
  seg(g, [cx - 10, cy + 9], [cx - 12, cy + 12], WOOD_DARK, 1);

  // braço direito: segura o cajado (erguido ao lançar, baixo quando vencida)
  const hx = casting ? cx + 14 : cx + 12.5;
  const hy = casting ? cy - 12 : defeat ? cy + 10 : cy + 8.5;
  if (casting) {
    poly(g, [[cx + 7, cy - 2], [cx + 11, cy - 3.5], [cx + 15, cy - 11], [cx + 12, cy - 12.5]], ROBE);
  } else {
    g.fillStyle(ROBE); g.fillEllipse(cx + 9.5, cy + 4, 5, 9);
  }
  seg(g, [hx, hy + (defeat ? 5 : 11)], [hx, hy - 13], WOOD_SHADE, 2.2); // cajado: galho
  seg(g, [hx, hy - 8], [hx + 2.6, hy - 11], WOOD_SHADE, 1.2);
  g.fillStyle(WOOD); g.fillCircle(hx, hy, 2.5);
  const orbY = hy - 15;
  if (casting) {
    g.fillStyle(ORB, 0.22); g.fillCircle(hx, orbY, 8);
    g.fillStyle(ORB, 0.32); g.fillCircle(hx, orbY, 5.5);
  }
  g.fillStyle(defeat ? ROBE_DARK : LEAF_LIGHT); g.fillCircle(hx, orbY, 3);
  g.fillStyle(0xffffff, 0.75); g.fillCircle(hx - 0.8, orbY - 0.8, 0.9);

  // gola de folhas
  g.fillStyle(ROBE);
  g.fillEllipse(cx, cy - 4, 16, 5.5);
  g.fillStyle(LEAF);
  for (const dx of [-6, -3, 0, 3, 6]) g.fillTriangle(cx + dx - 1.6, cy - 5, cx + dx + 1.6, cy - 5, cx + dx, cy - 1.8);

  // cabeça de madeira: veios, anel de tronco e nó
  g.fillStyle(WOOD);
  g.fillEllipse(cx, cy - 10, 13, 14);
  g.fillStyle(WOOD_SHADE, 0.55);
  g.fillEllipse(cx + 2.8, cy - 7, 5, 7);
  g.lineStyle(1, WOOD_DARK, 0.55);
  g.beginPath(); g.arc(cx - 3.5, cy - 12.5, 2.2, 0.3, 3.4, false); g.strokePath(); // anel de madeira
  seg(g, [cx + 4, cy - 15], [cx + 3.4, cy - 10], WOOD_DARK, 1, 0.5);
  g.fillStyle(WOOD_DARK, 0.7); g.fillEllipse(cx + 4.4, cy - 6.4, 1.8, 2.4); // nó

  // folhas brotando dos lados da cabeça (cabelo)
  g.fillStyle(LEAF);
  g.fillTriangle(cx - 6.5, cy - 12, cx - 6, cy - 7, cx - 11, cy - 6 + (defeat ? 2 : sway * 0.4));
  g.fillTriangle(cx + 6.5, cy - 12, cx + 6, cy - 7, cx + 11, cy - 6 + (defeat ? 2 : -sway * 0.4));
  g.fillStyle(LEAF_LIGHT);
  g.fillTriangle(cx - 6.5, cy - 10, cx - 6.2, cy - 7, cx - 9.4, cy - 5.6);

  // rosto
  if (hurt) {
    g.lineStyle(1.2, HOLE);
    for (const ex of [cx - 3.2, cx + 3.2]) {
      seg(g, [ex - 1.6, cy - 11.2], [ex + 1.6, cy - 8.8], HOLE, 1.2);
      seg(g, [ex + 1.6, cy - 11.2], [ex - 1.6, cy - 8.8], HOLE, 1.2);
    }
  } else if (defeat) {
    g.lineStyle(1.2, HOLE);
    for (const ex of [cx - 3.2, cx + 3.2]) {
      g.beginPath(); g.arc(ex, cy - 10.4, 2, 0.2, Math.PI - 0.2, false); g.strokePath();
    }
  } else {
    g.fillStyle(HOLE);
    g.fillEllipse(cx - 3.2, cy - 10, 4.2, casting ? 4 : 3);
    g.fillEllipse(cx + 3.2, cy - 10, 4.2, casting ? 4 : 3);
    g.fillStyle(EYE);
    g.fillEllipse(cx - 3.2, cy - 10, 2.6, casting ? 2.8 : 1.8);
    g.fillEllipse(cx + 3.2, cy - 10, 2.6, casting ? 2.8 : 1.8);
    seg(g, [cx - 6, cy - 12.6], [cx - 1.8, cy - 11.4], WOOD_DARK, 1.2);
    seg(g, [cx + 6, cy - 12.6], [cx + 1.8, cy - 11.4], WOOD_DARK, 1.2);
  }
  // nariz de graveto
  poly(g, [[cx - 0.8, cy - 9.4], [cx - 1.3, cy - 6.4], [cx + 1.8, cy - 6.8]], WOOD_SHADE);
  // boca
  if (casting) { g.fillStyle(HOLE); g.fillEllipse(cx, cy - 4.2, 3.6, 3.2); }
  else if (talkOpen) { g.fillStyle(HOLE); g.fillEllipse(cx, cy - 4.4, 3.2, 2.2); }
  else if (hurt) seg(g, [cx - 2.4, cy - 3.8], [cx, cy - 5], WOOD_DARK, 1.1), seg(g, [cx, cy - 5], [cx + 2.4, cy - 3.8], WOOD_DARK, 1.1);
  else if (defeat) seg(g, [cx - 2, cy - 4.4], [cx + 2, cy - 4.4], WOOD_DARK, 1.1);
  else seg(g, [cx - 2.6, cy - 4.8], [cx + 2.6, cy - 4.8], WOOD_DARK, 1.1);

  // chapéu de bruxo: aba larga, copa pontuda torta (ponta cai quando vencida), fita e folhas brotando
  const tipDx = defeat ? -2 : f === 0 ? 0.5 : -0.5;
  g.fillStyle(HAT);
  g.fillEllipse(cx, cy - 14.6, 24, 4.8);
  seg(g, [cx - 11, cy - 14.2], [cx - 5, cy - 12.6], HAT_LIGHT, 1, 0.9);
  poly(g, [[cx - 6.5, cy - 15], [cx + 6.5, cy - 15], [cx + 1 + tipDx, cy - 28]], HAT);
  poly(g, [[cx + 1 + tipDx, cy - 28], [cx - 1.6 + tipDx, cy - 24.5], [cx + 8 + tipDx + (defeat ? -3 : 0), cy - 27 + (defeat ? 3 : 0)]], HAT_LIGHT);
  poly(g, [[cx - 6.5, cy - 15], [cx + 6.5, cy - 15], [cx + 5.4, cy - 18], [cx - 5.4, cy - 18]], ROBE);
  g.fillStyle(GOLD); g.fillRect(cx - 1.6, cy - 18.1, 3.6, 3.4);
  g.fillStyle(0x6d4c41); g.fillRect(cx - 0.6, cy - 17.1, 1.6, 1.4);
  // folhas brotando da aba e da ponta do chapéu
  g.fillStyle(LEAF);
  g.fillTriangle(cx + 8, cy - 15, cx + 12, cy - 17 + (defeat ? 2 : 0), cx + 10.5, cy - 13);
  g.fillTriangle(cx - 9, cy - 15, cx - 12.5, cy - 16.5 + (defeat ? 2 : 0), cx - 11, cy - 13);
  g.fillStyle(LEAF_LIGHT);
  g.fillTriangle(cx + 1 + tipDx, cy - 28, cx - 1.6 + tipDx, cy - 30.4, cx + 2.8 + tipDx, cy - 30.6);
}

export function drawMandrakeTextures(g: Gfx, T: number): void {
  const H = rooTextureHeight(T);
  for (let fi = 0; fi < 2; fi++) {
    drawMandrakeFrame(g, T, fi, 'idle');
    g.generateTexture(`mandrake_idle_${fi}`, T, H);
  }
  drawMandrakeFrame(g, T, 0, 'cast');
  g.generateTexture('mandrake_cast', T, H);
  drawMandrakeFrame(g, T, 0, 'hurt');
  g.generateTexture('mandrake_hurt', T, H);
  for (let fi = 0; fi < 2; fi++) {
    drawMandrakeFrame(g, T, fi, 'talk');
    g.generateTexture(`mandrake_talk_${fi}`, T, H);
  }
  drawMandrakeFrame(g, T, 0, 'defeat');
  g.generateTexture('mandrake_defeat', T, H);
}
