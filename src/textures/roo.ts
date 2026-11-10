// Broomstick Roo: canguru bruxa com chapéu, varinha e manto.
// Poses:
// - 'awake': 4 frames de caminhada por direção (idle usa frames 0 e 1).
// - 'sleep': 2 frames de respiração com olhos fechados e cabeça caída.
// Lado direito é o original; a versão esquerda é um flipX feito em MainScene.
import Phaser from 'phaser';

export type RooDir = 'down' | 'up' | 'side';
export type RooPose = 'awake' | 'sleep';

type Pt = readonly [number, number];

const CAPE_BASE = 0x4a148c;
const CAPE_DARK = 0x2e0a5c;
const CAPE_LIGHT = 0x7e3fd0;
const GOLD = 0xffd54f;
const GOLD_TRIM = 0xd9a441;

// Barra de baixo do manto com "dentes" que alternam de altura e ondulam com o passo.
function hemPoints(xs: number[], baseY: number, flutter: number): Pt[] {
  return xs.map((x, i) => {
    const scallop = i % 2 === 0 ? 0 : 2.2;
    const wave = flutter * 0.9 * (i / (xs.length - 1) + 0.25);
    return [x, baseY + scallop + wave] as const;
  });
}

function fillPoly(g: Phaser.GameObjects.Graphics, pts: Pt[], color: number, alpha = 1): void {
  g.fillStyle(color, alpha);
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath();
  g.fillPath();
}

function strokeLine(g: Phaser.GameObjects.Graphics, pts: Pt[], color: number, width: number, alpha = 1): void {
  g.lineStyle(width, color, alpha);
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.strokePath();
}

// Fivela dourada com um brilho, no ponto de encaixe do manto.
function drawClasp(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
  g.fillStyle(GOLD_TRIM);
  g.fillCircle(x, y, 2);
  g.fillStyle(GOLD);
  g.fillCircle(x, y, 1.5);
  g.fillStyle(0xffffff, 0.8);
  g.fillCircle(x - 0.5, y - 0.6, 0.5);
}

function drawCapeSide(g: Phaser.GameObjects.Graphics, cx: number, cy: number, flutter: number): void {
  const hem = hemPoints([cx + 14, cx + 8, cx + 2, cx - 4, cx - 10], cy + 14, flutter);
  // corpo do manto: topo colado no ombro, barra ondulada embaixo
  fillPoly(g, [[cx - 8, cy + 1], [cx + 12, cy + 1], ...hem], CAPE_BASE);
  // faixa de luz sobre o ombro
  fillPoly(g, [[cx - 6, cy + 1], [cx + 5, cy + 1], [cx + 2, cy + 6], [cx - 8, cy + 6]], CAPE_LIGHT, 0.55);
  // dobras
  strokeLine(g, [[cx + 3, cy + 3], hem[1]], CAPE_DARK, 1, 0.7);
  strokeLine(g, [[cx - 2, cy + 4], hem[3]], CAPE_DARK, 1, 0.7);
  // barra dourada na borda
  strokeLine(g, hem, GOLD_TRIM, 1.2, 0.9);
}

function drawCapeBack(g: Phaser.GameObjects.Graphics, cx: number, cy: number, flutter: number): void {
  const hem = hemPoints([cx + 12, cx + 6, cx, cx - 6, cx - 12], cy + 14, flutter);
  fillPoly(g, [[cx - 10, cy + 1], [cx + 10, cy + 1], ...hem], CAPE_BASE);
  // dobras verticais que descem em leque
  strokeLine(g, [[cx - 5, cy + 3], [cx - 7, cy + 13]], CAPE_DARK, 1, 0.6);
  strokeLine(g, [[cx + 5, cy + 3], [cx + 7, cy + 13]], CAPE_DARK, 1, 0.6);
  // luz no centro das costas
  fillPoly(g, [[cx - 3, cy + 2], [cx + 3, cy + 2], [cx + 2, cy + 9], [cx - 2, cy + 9]], CAPE_LIGHT, 0.35);
  strokeLine(g, hem, GOLD_TRIM, 1.2, 0.9);
}

function drawCapeFront(g: Phaser.GameObjects.Graphics, cx: number, cy: number, flutter: number): void {
  // só as abas laterais aparecem por trás do corpo
  const leftHem = hemPoints([cx - 6, cx - 9, cx - 11], cy + 14, flutter * 1.2);
  const rightHem = hemPoints([cx + 11, cx + 9, cx + 6], cy + 14, -flutter * 1.2);
  fillPoly(g, [[cx - 6, cy + 1], [cx - 11, cy + 2], ...leftHem], CAPE_BASE);
  fillPoly(g, [[cx + 6, cy + 1], [cx + 11, cy + 2], ...rightHem], CAPE_BASE);
  strokeLine(g, leftHem, GOLD_TRIM, 1.2, 0.9);
  strokeLine(g, rightHem, GOLD_TRIM, 1.2, 0.9);
}

export function drawRooFrame(
  g: Phaser.GameObjects.Graphics,
  T: number,
  frame: number,
  dir: RooDir,
  pose: RooPose = 'awake',
): void {
  g.clear();
  const sleep = pose === 'sleep';
  const f = frame % 4;
  // Em repouso o corpo não balança nem as pernas se mexem.
  const walkBob = sleep ? 0 : [0, 1.2, 0, -1.2][f];
  const droop = sleep ? 1.5 : 0; // cabeça cai um pouco
  const breath = sleep ? (f % 2 === 1 ? 1.4 : 0) : ((f === 1 || f === 3) ? 1 : 0);
  const earTwitch = sleep ? 0 : (f === 1 ? -1.5 : (f === 3 ? 1 : 0));
  const legPhase = (f === 0 || f === 1) ? 1 : -1;
  const legL = sleep ? 0 : legPhase * (f % 2 === 0 ? 3.2 : 1.8);
  const legR = sleep ? 0 : -legPhase * (f % 2 === 0 ? 3.2 : 1.8);
  const wandWave = sleep ? 0 : Math.sin(f * Math.PI / 2) * 2;
  // o manto ondula com o passo; parado, fica assentado
  const flutter = sleep ? 0 : [0, 1, 0, -1][f];
  const cx = T / 2;
  const cy = T / 2 + 1 + walkBob + droop;

  // sombra
  g.fillStyle(0x000000, 0.2);
  g.fillEllipse(cx, T - 2, 16, 3.5);

  // olho fechado: arco para baixo ("∪")
  const closedEye = (ex: number, ey: number, r: number): void => {
    g.lineStyle(1.2, 0x1a1a1a);
    g.beginPath();
    g.arc(ex, ey, r, 0.2, Math.PI - 0.2, false);
    g.strokePath();
  };

  // orelha alta (marca registrada)
  const drawEar = (ex: number, ey: number, flip: boolean): void => {
    const s = flip ? -1 : 1;
    g.fillStyle(0xe07820);
    g.fillEllipse(ex, ey - 2 + earTwitch * 0.3, 5, 11);
    g.fillEllipse(ex + s * 0.5, ey - 8 + earTwitch, 4, 5);
    g.fillStyle(0xffd8a0);
    g.fillEllipse(ex, ey - 1 + earTwitch * 0.2, 2.6, 7);
    g.fillStyle(0xc06018);
    g.fillCircle(ex + s * 0.3, ey - 11 + earTwitch, 1.8);
  };

  // chapéu de bruxa, base comum às três direções
  const drawHatBrim = (x: number, y: number, w: number): void => {
    g.fillStyle(0x4a148c);
    g.fillEllipse(x, y, w, 3);
    g.fillStyle(GOLD);
    g.fillEllipse(x, y - 0.3, w - 0.5, 1.5);
  };

  if (dir === 'side') {
    drawSide();
  } else if (dir === 'up') {
    drawBack();
  } else {
    drawFront();
  }

  function drawSide(): void {
    // cauda
    g.fillStyle(0xd07020);
    g.fillEllipse(cx - 13, cy + 8, 11, 5);
    g.fillStyle(0xb05818);
    g.fillCircle(cx - 18, cy + 7.5, 3.2);
    g.fillStyle(0xffc070);
    g.fillCircle(cx - 16.5, cy + 6.5, 1.3);

    // perna de trás
    g.fillStyle(0xe89040);
    g.fillEllipse(cx - 3 + legL * 0.2, cy + 9, 6.5, 5.5);
    g.fillStyle(0xd07828);
    g.fillRect(cx - 4 + legL * 0.35, cy + 12, 5, 6);
    g.fillStyle(0xa85814);
    g.fillEllipse(cx - 2 + legL * 0.35, T - 3, 9, 3.5);
    g.fillStyle(0x6d3a0c);
    g.fillRect(cx - 5 + legL * 0.35, T - 3.5, 1.8, 1.8);
    g.fillRect(cx - 2.5 + legL * 0.35, T - 3, 1.8, 1.8);

    drawCapeSide(g, cx, cy, flutter);

    // corpo com bolsa
    g.fillStyle(0xff9a3a);
    g.fillEllipse(cx + 1, cy + 2 + breath * 0.4, 15, 17);
    g.fillStyle(0xffe4b0);
    g.fillEllipse(cx + 4, cy + 5 + breath * 0.3, 9, 10);
    g.fillStyle(0xf5c888);
    g.fillEllipse(cx + 4, cy + 7 + breath * 0.2, 6, 5);

    // perna da frente
    g.fillStyle(0xe89040);
    g.fillEllipse(cx + 3 + legR * 0.2, cy + 10, 6, 5);
    g.fillStyle(0xd07828);
    g.fillRect(cx + 2 + legR * 0.35, cy + 13, 4.5, 5);
    g.fillStyle(0xa85814);
    g.fillEllipse(cx + 4 + legR * 0.35, T - 3, 8, 3.2);

    // cabeça e focinho
    g.fillStyle(0xffa448);
    g.fillEllipse(cx + 2, cy - 10, 12, 12);
    g.fillStyle(0xffe4b0);
    g.fillEllipse(cx + 7, cy - 8, 7, 5.5);
    g.fillStyle(0x5d3a28);
    g.fillEllipse(cx + 10, cy - 8.5, 2.6, 2);

    drawEar(cx - 1, cy - 16, false);

    // olho: aberto (acordado) ou fechado (dormindo)
    if (sleep) {
      closedEye(cx + 4.5, cy - 11, 1.8);
    } else {
      g.fillStyle(0x1a1a1a);
      g.fillCircle(cx + 4.5, cy - 11, 2.1);
      g.fillStyle(0xffffff);
      g.fillCircle(cx + 5.1, cy - 11.5, 0.9);
    }
    g.fillStyle(0xc06018);
    g.fillRect(cx + 2, cy - 13.5, 5, 1.3);

    // chapéu
    g.fillStyle(0x4a148c);
    g.fillTriangle(cx + 2, cy - 22, cx - 2, cy - 12, cx + 6, cy - 12);
    drawHatBrim(cx + 2, cy - 11.5, 11);
    g.fillStyle(GOLD);
    g.fillCircle(cx + 2, cy - 21, 1.2);

    // braço de trás (oculto pela capa)
    g.fillStyle(0xff9a3a);
    g.fillCircle(cx - 5, cy + 2, 3.5);

    // braço da frente + varinha (em repouso, a varinha cai para baixo)
    g.fillStyle(0xff9a3a);
    g.fillCircle(cx + 8, cy + 3, 4);
    g.lineStyle(2.5, 0x8b6f47);
    g.beginPath();
    g.moveTo(cx + 12 + wandWave, cy - 2);
    g.lineTo(cx + (sleep ? 15 : 16) + wandWave, cy - (sleep ? 6 : 12));
    g.strokePath();
    g.fillStyle(GOLD);
    g.fillCircle(cx + (sleep ? 15 : 16) + wandWave, cy - (sleep ? 7 : 13), 2);
    g.fillStyle(0xffeb3b);
    g.fillCircle(cx + (sleep ? 15 : 16) + wandWave, cy - (sleep ? 7 : 13), 1);

    drawClasp(g, cx + 1, cy - 0.5);
  }

  function drawBack(): void {
    // cauda (pequena, atrás)
    g.fillStyle(0xd07020);
    g.fillEllipse(cx, T - 3.5, 7, 4);

    drawCapeBack(g, cx, cy, flutter);

    // braços
    g.fillStyle(0xff9a3a);
    g.fillCircle(cx - 10, cy + 2, 4);
    g.fillCircle(cx + 10, cy + 2, 4);

    // pernas
    g.fillStyle(0xe89040);
    g.fillEllipse(cx - 5 + legL * 0.55, cy + 10 + Math.max(0, -legL) * 0.35, 6.5, 5.5);
    g.fillEllipse(cx + 5 + legR * 0.55, cy + 10 + Math.max(0, -legR) * 0.35, 6.5, 5.5);
    g.fillStyle(0xd07828);
    g.fillRect(cx - 7 + legL * 0.55, cy + 12 + Math.max(0, -legL) * 0.35, 4, 5);
    g.fillRect(cx + 3 + legR * 0.55, cy + 12 + Math.max(0, -legR) * 0.35, 4, 5);
    g.fillStyle(0xa85814);
    g.fillEllipse(cx - 5 + legL * 0.55, T - 3 + Math.max(0, -legL) * 0.45, 9, 3.5);
    g.fillEllipse(cx + 5 + legR * 0.55, T - 3 + Math.max(0, -legR) * 0.45, 9, 3.5);

    // corpo
    g.fillStyle(0xff9a3a);
    g.fillEllipse(cx, cy + 2 + breath * 0.3, 15, 17);
    g.fillStyle(0xe87828);
    g.fillEllipse(cx, cy + 3, 9, 10);

    // gola do manto (aparece por cima dos ombros)
    g.fillStyle(CAPE_BASE);
    g.fillEllipse(cx, cy - 4, 14, 4);
    g.fillStyle(CAPE_DARK);
    g.fillEllipse(cx, cy - 3.5, 12, 1.5);

    g.fillStyle(0xffa448);
    g.fillEllipse(cx, cy - 10, 12, 12);
    drawEar(cx - 6.5, cy - 16, true);
    drawEar(cx + 6.5, cy - 16, false);

    // chapéu (de costas)
    g.fillStyle(0x4a148c);
    g.fillTriangle(cx, cy - 22, cx - 3, cy - 12, cx + 3, cy - 12);
    drawHatBrim(cx, cy - 11.5, 11);
    g.fillStyle(GOLD);
    g.fillCircle(cx, cy - 21, 1.2);

    // varinha para trás (levantada; em repouso, pendurada)
    g.lineStyle(2.5, 0x8b6f47);
    g.beginPath();
    g.moveTo(cx + wandWave, cy - 2);
    g.lineTo(cx + wandWave, cy - (sleep ? 8 : 14));
    g.strokePath();
    g.fillStyle(GOLD);
    g.fillCircle(cx + wandWave, cy - (sleep ? 9 : 15), 2);
    g.fillStyle(0xffeb3b);
    g.fillCircle(cx + wandWave, cy - (sleep ? 9 : 15), 1);

    drawClasp(g, cx, cy - 2.5);
  }

  function drawFront(): void {
    drawCapeFront(g, cx, cy, flutter);

    // braços
    g.fillStyle(0xff9a3a);
    g.fillCircle(cx - 10, cy + 2, 4);
    g.fillCircle(cx + 10, cy + 2, 4);

    // pés grandes de canguru
    g.fillStyle(0xe89040);
    g.fillEllipse(cx - 5.5 + legL * 0.22, cy + 10, 6.5, 5.5);
    g.fillEllipse(cx + 5.5 + legR * 0.22, cy + 10, 6.5, 5.5);
    g.fillStyle(0xd07828);
    g.fillRect(cx - 6.5 + legL * 0.22, cy + 13, 5, 5);
    g.fillRect(cx + 1.5 + legR * 0.22, cy + 13, 5, 5);
    g.fillStyle(0xa85814);
    g.fillEllipse(cx - 5.5 + legL * 0.22, T - 3, 10, 3.5);
    g.fillEllipse(cx + 5.5 + legR * 0.22, T - 3, 10, 3.5);
    g.fillStyle(0x6d3a0c);
    g.fillRect(cx - 9 + legL * 0.22, T - 3.5, 1.8, 1.8);
    g.fillRect(cx - 6.5 + legL * 0.22, T - 3, 1.8, 1.8);
    g.fillRect(cx + 5 + legR * 0.22, T - 3.5, 1.8, 1.8);
    g.fillRect(cx + 7.5 + legR * 0.22, T - 3, 1.8, 1.8);

    // corpo com bolsa
    g.fillStyle(0xff9a3a);
    g.fillEllipse(cx, cy + 2 + breath * 0.5, 15, 17);
    g.fillStyle(0xffe4b0);
    g.fillEllipse(cx, cy + 5 + breath * 0.4, 11, 11);
    g.fillStyle(0xf5c888);
    g.fillEllipse(cx, cy + 7 + breath * 0.3, 7, 6);

    // gola do manto por cima do peito
    g.fillStyle(CAPE_BASE);
    g.fillEllipse(cx, cy - 4, 15, 4.5);
    strokeLine(g, [[cx - 6.5, cy - 4.5], [cx + 6.5, cy - 4.5]], GOLD_TRIM, 0.8, 0.9);

    // cabeça
    g.fillStyle(0xffa448);
    g.fillEllipse(cx, cy - 10, 12, 12);
    g.fillStyle(0xffe4b0);
    g.fillEllipse(cx, cy - 6, 8, 6);
    g.fillStyle(0x5d3a28);
    g.fillEllipse(cx, cy - 6.5, 3, 2.2);

    // boca: sorriso acordado, ou pequeno "o" ressonando
    if (sleep) {
      g.fillStyle(0x5d3a28);
      g.fillEllipse(cx + 1, cy - 4, 1.8, 1.2);
    } else {
      g.lineStyle(1.3, 0x5d4037);
      g.beginPath();
      g.arc(cx, cy - 4.2, 2.5, 0.15, Math.PI - 0.15, false);
      g.strokePath();
    }

    drawEar(cx - 6.5, cy - 16, true);
    drawEar(cx + 6.5, cy - 16, false);

    // olhos: abertos ou fechados
    if (sleep) {
      closedEye(cx - 3.5, cy - 11, 1.8);
      closedEye(cx + 3.5, cy - 11, 1.8);
    } else {
      g.fillStyle(0x1a1a1a);
      g.fillCircle(cx - 3.5, cy - 11, 2.2);
      g.fillCircle(cx + 3.5, cy - 11, 2.2);
      g.fillStyle(0xffffff);
      g.fillCircle(cx - 2.9, cy - 11.6, 1);
      g.fillCircle(cx + 4.1, cy - 11.6, 1);
    }

    // chapéu (de frente)
    g.fillStyle(0x4a148c);
    g.fillTriangle(cx, cy - 23, cx - 4, cy - 12, cx + 4, cy - 12);
    drawHatBrim(cx, cy - 11.5, 11);
    g.fillStyle(GOLD);
    g.fillCircle(cx, cy - 22, 1.3);

    // blush
    g.fillStyle(0xffab91, 0.4);
    g.fillCircle(cx - 6.5, cy - 7.5, 2);
    g.fillCircle(cx + 6.5, cy - 7.5, 2);

    // varinha com brilho (em repouso, baixa ao lado do corpo)
    g.lineStyle(2.5, 0x8b6f47);
    g.beginPath();
    g.moveTo(cx + wandWave, cy - 1);
    g.lineTo(cx + wandWave + (sleep ? 3 : 2), cy - (sleep ? 9 : 16));
    g.strokePath();
    g.fillStyle(GOLD);
    g.fillCircle(cx + wandWave + (sleep ? 3 : 2), cy - (sleep ? 10 : 17), 2.2);
    g.fillStyle(0xffeb3b);
    g.fillCircle(cx + wandWave + (sleep ? 3 : 2), cy - (sleep ? 10 : 17), 1.2);
    if (!sleep) {
      // estrelinhas mágicas (só acordada)
      g.fillStyle(GOLD);
      g.fillCircle(cx + wandWave - 2, cy - 14, 0.8);
      g.fillCircle(cx + wandWave + 5, cy - 12, 0.8);
    }

    drawClasp(g, cx, cy - 4);
  }
}

// Gera as texturas: 12 de caminhada (4 frames x 3 direções) e 6 de sono (2 frames x 3 direções).
export function drawRooTextures(g: Phaser.GameObjects.Graphics, T: number): void {
  const dirs: RooDir[] = ['down', 'up', 'side'];
  for (let fi = 0; fi < 4; fi++) {
    for (const dir of dirs) {
      drawRooFrame(g, T, fi, dir, 'awake');
      g.generateTexture(`roo_${dir}_${fi}`, T, T);
    }
  }
  for (let fi = 0; fi < 2; fi++) {
    for (const dir of dirs) {
      drawRooFrame(g, T, fi, dir, 'sleep');
      g.generateTexture(`roo_sleep_${dir}_${fi}`, T, T);
    }
  }
}
