// Broomstick Roo: canguru bruxa com chapéu, varinha e manto.
//
// Poses:
// - 'awake': 4 frames de caminhada por direção (idle usa frames 0 e 1).
// - 'sleep': 2 frames de respiração com olhos fechados e cabeça caída.
// - 'stir' : 2 frames de lado, braço estendido e sem varinha (a varinha é desenhada pela cena
//            do menu, que a move sobre o caldeirão).
// - 'maestro': a pose 'stir' de casaca e cabelo de Beethoven (usada na Sala de Música).
// - 'read'  : de frente (dir 'down'), lendo; quem olha vê a capa do livro, a Roo vê as páginas; 9 quadros, a folha vira do 1 ao 7.
//
// O lado direito é o desenhado; a versão esquerda é um flipX feito em MainScene.
//
// A textura tem ROO_HEAD_ROOM px a mais em cima do tile: orelhas e chapéu passam de 40 px e antes
// eram cortados. O sprite usa rooOriginY() para continuar alinhado ao centro do tile.
import Phaser from 'phaser';
import { ROO_HEAD_ROOM, rooTextureHeight } from './rooGeometry';

type RooDir = 'down' | 'up' | 'side';
type RooPose = 'awake' | 'sleep' | 'stir' | 'maestro' | 'read';


type Pt = readonly [number, number];

const CAPE_BASE = 0x4a148c;
const CAPE_DARK = 0x2e0a5c;
const CAPE_LIGHT = 0x7e3fd0;
const GOLD = 0xffd54f;
const GOLD_TRIM = 0xd9a441;
const FUR = 0xff9a3a;

type Gfx = Phaser.GameObjects.Graphics;

// Barra de baixo do manto com "dentes" que alternam de altura e ondulam com o passo.
// `center` faz a ondulação crescer para as bordas (manto simétrico, de costas).
function hemPoints(xs: number[], baseY: number, flutter: number, center?: number): Pt[] {
  return xs.map((x, i) => {
    const scallop = i % 2 === 0 ? 0 : 2.2;
    const k = center === undefined ? i / (xs.length - 1) + 0.25 : 0.25 + 0.75 * Math.min(1, Math.abs(x - center) / 13);
    return [x, baseY + scallop + flutter * 0.9 * k] as const;
  });
}

function fillPoly(g: Gfx, pts: Pt[], color: number, alpha = 1): void {
  g.fillStyle(color, alpha);
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath();
  g.fillPath();
}

function strokeLine(g: Gfx, pts: Pt[], color: number, width: number, alpha = 1): void {
  g.lineStyle(width, color, alpha);
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.strokePath();
}

// Fivela dourada com um brilho, no ponto de encaixe do manto.
function drawClasp(g: Gfx, x: number, y: number): void {
  g.fillStyle(GOLD_TRIM);
  g.fillCircle(x, y, 2);
  g.fillStyle(GOLD);
  g.fillCircle(x, y, 1.5);
  g.fillStyle(0xffffff, 0.8);
  g.fillCircle(x - 0.5, y - 0.6, 0.5);
}

function drawWand(g: Gfx, x0: number, y0: number, x1: number, y1: number): void {
  g.lineStyle(2.5, 0x8b6f47);
  g.beginPath();
  g.moveTo(x0, y0);
  g.lineTo(x1, y1);
  g.strokePath();
  g.fillStyle(GOLD);
  g.fillCircle(x1, y1 - 1, 2);
  g.fillStyle(0xffeb3b);
  g.fillCircle(x1, y1 - 1, 1);
}

function drawRooFrame(g: Gfx, T: number, frame: number, dir: RooDir, pose: RooPose = 'awake'): void {
  g.clear();
  const sleep = pose === 'sleep';
  const maestro = pose === 'maestro';
  const reading = pose === 'read'; // parada, com um livro aberto diante do rosto (frames viram a página)
  const stir = pose === 'stir' || maestro; // maestro é a pose "mexer" de casaca e cabelo de Beethoven
  const still = sleep || stir || reading; // sem balanço de passo
  const f = frame % 4;
  const B = T + ROO_HEAD_ROOM; // base do quadro (chão)

  const walkBob = still ? 0 : [0, 1.2, 0, -1.2][f];
  const droop = sleep ? 1.5 : 0; // cabeça cai um pouco
  const breath = reading ? (frame >= 3 && frame <= 6 ? 1 : 0) : sleep ? (f % 2 === 1 ? 1.4 : 0) : stir ? (f % 2 === 1 ? 1 : 0) : ((f === 1 || f === 3) ? 1 : 0);
  const earTwitch = still ? 0 : (f === 1 ? -1.5 : (f === 3 ? 1 : 0));
  const legPhase = (f === 0 || f === 1) ? 1 : -1;
  const legL = still ? 0 : legPhase * (f % 2 === 0 ? 3.2 : 1.8);
  const legR = still ? 0 : -legPhase * (f % 2 === 0 ? 3.2 : 1.8);
  const wandWave = still ? 0 : Math.sin(f * Math.PI / 2) * 2;
  // o manto ondula com o passo; parado, fica assentado
  const flutter = still ? 0 : [0, 1, 0, -1][f];
  const cx = T / 2;
  const cy = T / 2 + 1 + walkBob + droop + ROO_HEAD_ROOM;

  // sombra
  g.fillStyle(0x000000, 0.2);
  g.fillEllipse(cx, B - 2, 16, 3.5);

  // olho fechado: arco para baixo
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

  const drawHatBrim = (x: number, y: number, w: number): void => {
    g.fillStyle(CAPE_BASE);
    g.fillEllipse(x, y, w, 3);
    g.fillStyle(GOLD);
    g.fillEllipse(x, y - 0.3, w - 0.5, 1.5);
  };

  if (dir === 'side') drawSide();
  else if (dir === 'up') drawBack();
  else drawFront();

  // ---------------------------------------------------------------- de lado (olhando à direita)
  function drawSide(): void {
    // perna de trás
    g.fillStyle(0xe89040);
    g.fillEllipse(cx - 3 + legL * 0.2, cy + 9, 6.5, 5.5);
    g.fillStyle(0xd07828);
    g.fillRect(cx - 4 + legL * 0.35, cy + 12, 5, 6);
    g.fillStyle(0xa85814);
    g.fillEllipse(cx - 2 + legL * 0.35, B - 3, 9, 3.5);
    g.fillStyle(0x6d3a0c);
    g.fillRect(cx - 5 + legL * 0.35, B - 3.5, 1.8, 1.8);
    g.fillRect(cx - 2.5 + legL * 0.35, B - 3, 1.8, 1.8);

    // corpo com bolsa
    g.fillStyle(FUR);
    g.fillEllipse(cx + 1, cy + 2 + breath * 0.4, 15, 17);
    g.fillStyle(0xffe4b0);
    g.fillEllipse(cx + 4, cy + 5 + breath * 0.3, 9, 10);
    g.fillStyle(0xf5c888);
    g.fillEllipse(cx + 4, cy + 7 + breath * 0.2, 6, 5);

    // manto: cai dos ombros cobrindo as costas e flui para trás (por cima do corpo)
    const hem = hemPoints([cx + 3, cx - 2, cx - 7, cx - 12], cy + 14, flutter);
    fillPoly(g, [
      [cx - 5, cy - 4], [cx + 3, cy - 3.5], [cx + 4.5, cy + 5], ...hem,
      [cx - 12.5 - flutter * 0.6, cy + 8], [cx - 8.5, cy + 1],
    ], CAPE_BASE);
    fillPoly(g, [[cx - 5, cy - 4], [cx + 3, cy - 3.5], [cx + 3.8, cy + 1], [cx - 7, cy + 1]], CAPE_LIGHT, 0.5);
    strokeLine(g, [[cx - 1, cy - 1.5], hem[1]], CAPE_DARK, 1, 0.7);
    strokeLine(g, [[cx - 5, cy], hem[2]], CAPE_DARK, 1, 0.7);
    strokeLine(g, [[cx + 3, cy - 3.5], [cx + 4.5, cy + 5], ...hem], GOLD_TRIM, 1.2, 0.9);

    // gola
    g.fillStyle(CAPE_BASE);
    g.fillEllipse(cx - 0.5, cy - 4, 10, 4);
    strokeLine(g, [[cx - 5, cy - 3.2], [cx + 4, cy - 2.8]], GOLD_TRIM, 0.8, 0.9);

    // cauda: sai por baixo do manto
    g.fillStyle(0xd07020);
    g.fillEllipse(cx - 13, cy + 8, 11, 5);
    g.fillStyle(0xb05818);
    g.fillCircle(cx - 18, cy + 7.5, 3.2);
    g.fillStyle(0xffc070);
    g.fillCircle(cx - 16.5, cy + 6.5, 1.3);

    // perna da frente (por cima do manto)
    g.fillStyle(0xe89040);
    g.fillEllipse(cx + 3 + legR * 0.2, cy + 10, 6, 5);
    g.fillStyle(0xd07828);
    g.fillRect(cx + 2 + legR * 0.35, cy + 13, 4.5, 5);
    g.fillStyle(0xa85814);
    g.fillEllipse(cx + 4 + legR * 0.35, B - 3, 8, 3.2);

    // cabeça e focinho
    g.fillStyle(0xffa448);
    g.fillEllipse(cx + 2, cy - 10, 12, 12);
    g.fillStyle(0xffe4b0);
    g.fillEllipse(cx + 7, cy - 8, 7, 5.5);
    g.fillStyle(0x5d3a28);
    g.fillEllipse(cx + 10, cy - 8.5, 2.6, 2);

    drawEar(cx - 1, cy - 16, false);

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
    g.fillStyle(CAPE_BASE);
    g.fillTriangle(cx + 2, cy - 22, cx - 2, cy - 12, cx + 6, cy - 12);
    drawHatBrim(cx + 2, cy - 11.5, 11);
    g.fillStyle(GOLD);
    g.fillCircle(cx + 2, cy - 21, 1.2);

    if (maestro) drawMaestroOutfit();

    if (stir) {
      // pose "mexer": sem braço e sem varinha no sprite; a cena do menu os desenha em movimento
    } else {
      // braço da frente + varinha (em repouso a varinha cai)
      g.fillStyle(FUR);
      g.fillCircle(cx + 8, cy + 3, 4);
      drawWand(g, cx + 12 + wandWave, cy - 2, cx + (sleep ? 15 : 16) + wandWave, cy - (sleep ? 6 : 12));
    }

    drawClasp(g, cx + 3.5, cy - 2);
  }

  // ---------------------------------------------------------------- livro de leitura (de frente)
  // A Roo lê: as páginas ficam voltadas para ela e quem olha vê a CAPA (roxa, com ornamentos dourados),
  // sobre o peito e abaixo do queixo. Só a borda das páginas aparece acima da capa. Quadros 1 a 7: a mão
  // direita puxa a folha, que passa por cima do livro da direita para a esquerda. Quadros 0 e 8: parado.
  function drawReadingBook(): void {
    const COVER = 0x6a1b9a;
    const COVER_DARK = 0x4a148c;
    const top = cy - 3;
    const bottom = cy + 9;
    const flipping = frame > 0 && frame < 8;
    const theta = (frame / 8) * Math.PI;
    const w = flipping ? 9.5 * Math.cos(theta) : 9.5; // posição da ponta da folha em relação à lombada
    const lift = flipping ? Math.sin(theta) * 5.2 : 0; // a folha se curva para cima ao virar

    // borda das páginas, logo acima da capa
    g.fillStyle(0xfff3d6);
    g.fillRect(cx - 9.5, top - 2.2, 19, 2.4);
    g.fillStyle(0xd9c7a0);
    g.fillRect(cx - 9.5, top - 0.6, 19, 0.7);
    // folha em voo: aparece só como um arco claro acima da capa
    if (flipping) {
      const pts: Array<[number, number]> = [
        [cx, top + 0.5], [cx + w * 0.3, top - 2 - lift], [cx + w * 0.75, top - 1.5 - lift * 0.85],
        [cx + w, top - 0.5 - lift * 0.35], [cx + w, top + 0.5],
      ];
      fillPoly(g, pts, w >= 0 ? 0xfffaf0 : 0xeadcb8);
      strokeLine(g, pts.slice(0, 4), 0xc9b48a, 1, 1);
    }

    // capa de trás: duas metades unidas pela lombada, com acabamento dourado
    g.fillStyle(COVER_DARK);
    g.fillRoundedRect(cx - 11.5, top - 0.5, 23, bottom - top + 2, 1.8);
    g.fillStyle(COVER);
    g.fillRoundedRect(cx - 11, top, 22, bottom - top + 1, 1.5);
    g.fillStyle(0x3a0f70);
    g.fillRect(cx - 0.7, top, 1.4, bottom - top + 1); // lombada
    g.lineStyle(0.8, GOLD_TRIM, 0.95);
    g.strokeRect(cx - 10, top + 1, 9, bottom - top - 1);
    g.strokeRect(cx + 1, top + 1, 9, bottom - top - 1);
    // losango dourado em cada metade
    g.fillStyle(GOLD);
    for (const ox of [-5.5, 5.5]) {
      g.fillTriangle(cx + ox, cy + 0.2, cx + ox + 2.2, cy + 3, cx + ox, cy + 5.8);
      g.fillTriangle(cx + ox, cy + 0.2, cx + ox - 2.2, cy + 3, cx + ox, cy + 5.8);
    }

    // mãos: a esquerda segura a borda; a direita segura a borda e, ao virar, sobe e acompanha a folha
    g.fillStyle(FUR);
    g.fillCircle(cx - 11.5, bottom - 1.5, 2.6);
    const hx = flipping ? cx + w + (w >= 0 ? 1.4 : -1.4) : cx + 11.5;
    const hy = flipping ? top + 0.5 - lift * 0.4 : bottom - 1.5;
    g.fillCircle(hx, hy, 2.3);
  }

  // ---------------------------------------------------------------- traje de maestro (sobre o lado)
  // Cabelo grisalho e revolto (Beethoven), gravata branca e casaca preta com botões dourados.
  function drawMaestroOutfit(): void {
    const COAT = 0x1d1b22;
    const HAIR = 0xd3cdc4;
    const HAIR_SHADE = 0x9c958c;
    // casaca: do colarinho até as abas, por cima do manto
    fillPoly(g, [
      [cx - 5, cy - 3], [cx + 4.5, cy - 3], [cx + 5.5, cy + 5], [cx + 1, cy + 7],
      [cx - 2, cy + 14], [cx - 10, cy + 15], [cx - 8, cy + 4],
    ], COAT);
    // peitilho branco e gravata
    fillPoly(g, [[cx + 0.5, cy - 3], [cx + 4.5, cy - 3], [cx + 3.5, cy + 4]], 0xffffff);
    g.fillStyle(0xffffff);
    g.fillEllipse(cx + 2.5, cy - 3.8, 5.5, 2.6);
    g.fillStyle(0x1a1a1a);
    g.fillCircle(cx + 2.5, cy - 3.8, 0.8);
    // botões dourados
    g.fillStyle(GOLD);
    g.fillCircle(cx + 2.5, cy + 1.5, 0.9);
    g.fillCircle(cx + 2.8, cy + 5.5, 0.9);
    // cabelo: massa grisalha atrás e acima da cabeça, sem tocar os olhos
    g.fillStyle(HAIR);
    g.fillEllipse(cx + 0.5, cy - 16, 15, 9);
    g.fillEllipse(cx - 4, cy - 12, 5.5, 8);
    g.fillEllipse(cx + 6, cy - 19, 7, 4);
    g.fillStyle(HAIR_SHADE);
    g.fillEllipse(cx - 1, cy - 13.5, 8, 2.5);
    g.fillEllipse(cx + 4, cy - 18.5, 6, 1.6);
    // a orelha fica por cima do cabelo
    drawEar(cx - 1, cy - 16, false);
  }

  // ---------------------------------------------------------------- de costas
  function drawBack(): void {
    // cauda (aparece abaixo da barra do manto)
    g.fillStyle(0xd07020);
    g.fillEllipse(cx, B - 3.5, 7, 4);

    // pernas
    g.fillStyle(0xe89040);
    g.fillEllipse(cx - 5 + legL * 0.55, cy + 10 + Math.max(0, -legL) * 0.35, 6.5, 5.5);
    g.fillEllipse(cx + 5 + legR * 0.55, cy + 10 + Math.max(0, -legR) * 0.35, 6.5, 5.5);
    g.fillStyle(0xd07828);
    g.fillRect(cx - 7 + legL * 0.55, cy + 12 + Math.max(0, -legL) * 0.35, 4, 5);
    g.fillRect(cx + 3 + legR * 0.55, cy + 12 + Math.max(0, -legR) * 0.35, 4, 5);
    g.fillStyle(0xa85814);
    g.fillEllipse(cx - 5 + legL * 0.55, B - 3 + Math.max(0, -legL) * 0.45, 9, 3.5);
    g.fillEllipse(cx + 5 + legR * 0.55, B - 3 + Math.max(0, -legR) * 0.45, 9, 3.5);

    // corpo
    g.fillStyle(FUR);
    g.fillEllipse(cx, cy + 2 + breath * 0.3, 15, 17);

    // manto cobrindo todas as costas, ombros e braços
    const hem = hemPoints([cx + 13, cx + 8, cx + 2.5, cx - 2.5, cx - 8, cx - 13], cy + 14, flutter, cx);
    fillPoly(g, [[cx - 8, cy - 4.5], [cx + 8, cy - 4.5], [cx + 11, cy + 3], ...hem, [cx - 11, cy + 3]], CAPE_BASE);
    fillPoly(g, [[cx - 3, cy - 4], [cx + 3, cy - 4], [cx + 4, cy + 11], [cx - 4, cy + 11]], CAPE_LIGHT, 0.3);
    strokeLine(g, [[cx - 5.5, cy - 2], [cx - 8, cy + 13]], CAPE_DARK, 1, 0.6);
    strokeLine(g, [[cx + 5.5, cy - 2], [cx + 8, cy + 13]], CAPE_DARK, 1, 0.6);
    strokeLine(g, [[cx, cy - 3], [cx, cy + 13]], CAPE_DARK, 1, 0.45);
    strokeLine(g, hem, GOLD_TRIM, 1.2, 0.9);

    // gola
    g.fillStyle(CAPE_BASE);
    g.fillEllipse(cx, cy - 4.5, 16, 4.5);
    strokeLine(g, [[cx - 7, cy - 4], [cx + 7, cy - 4]], GOLD_TRIM, 0.8, 0.9);

    // cabeça
    g.fillStyle(0xffa448);
    g.fillEllipse(cx, cy - 10, 12, 12);
    drawEar(cx - 6.5, cy - 16, true);
    drawEar(cx + 6.5, cy - 16, false);

    // chapéu (de costas)
    g.fillStyle(CAPE_BASE);
    g.fillTriangle(cx, cy - 22, cx - 3, cy - 12, cx + 3, cy - 12);
    drawHatBrim(cx, cy - 11.5, 11);
    g.fillStyle(GOLD);
    g.fillCircle(cx, cy - 21, 1.2);

    // mãos saindo do manto; varinha ao lado (não cobre mais a cabeça)
    g.fillStyle(FUR);
    g.fillCircle(cx - 11, cy + 6, 3);
    g.fillCircle(cx + 11, cy + 5, 3);
    drawWand(g, cx + 11.5 + wandWave * 0.5, cy + 3, cx + (sleep ? 13.5 : 14) + wandWave * 0.5, cy - (sleep ? 3 : 11));
  }

  // ---------------------------------------------------------------- de frente
  function drawFront(): void {
    // pés grandes de canguru
    g.fillStyle(0xe89040);
    g.fillEllipse(cx - 5.5 + legL * 0.22, cy + 10, 6.5, 5.5);
    g.fillEllipse(cx + 5.5 + legR * 0.22, cy + 10, 6.5, 5.5);
    g.fillStyle(0xd07828);
    g.fillRect(cx - 6.5 + legL * 0.22, cy + 13, 5, 5);
    g.fillRect(cx + 1.5 + legR * 0.22, cy + 13, 5, 5);
    g.fillStyle(0xa85814);
    g.fillEllipse(cx - 5.5 + legL * 0.22, B - 3, 10, 3.5);
    g.fillEllipse(cx + 5.5 + legR * 0.22, B - 3, 10, 3.5);
    g.fillStyle(0x6d3a0c);
    g.fillRect(cx - 9 + legL * 0.22, B - 3.5, 1.8, 1.8);
    g.fillRect(cx - 6.5 + legL * 0.22, B - 3, 1.8, 1.8);
    g.fillRect(cx + 5 + legR * 0.22, B - 3.5, 1.8, 1.8);
    g.fillRect(cx + 7.5 + legR * 0.22, B - 3, 1.8, 1.8);

    // corpo com bolsa
    g.fillStyle(FUR);
    g.fillEllipse(cx, cy + 2 + breath * 0.5, 15, 17);
    g.fillStyle(0xffe4b0);
    g.fillEllipse(cx, cy + 5 + breath * 0.4, 11, 11);
    g.fillStyle(0xf5c888);
    g.fillEllipse(cx, cy + 7 + breath * 0.3, 7, 6);

    // manto: duas abas que cobrem ombros, braços e laterais; abertura na frente mostra a bolsa
    const leftHem = hemPoints([cx - 4.5, cx - 8.5, cx - 13], cy + 14, flutter * 1.2);
    const rightHem = hemPoints([cx + 4.5, cx + 8.5, cx + 13], cy + 14, -flutter * 1.2);
    fillPoly(g, [[cx - 8, cy - 4], [cx - 3.5, cy - 3.5], [cx - 4.5, cy + 6], ...leftHem, [cx - 12.5, cy + 3]], CAPE_BASE);
    fillPoly(g, [[cx + 8, cy - 4], [cx + 3.5, cy - 3.5], [cx + 4.5, cy + 6], ...rightHem, [cx + 12.5, cy + 3]], CAPE_BASE);
    fillPoly(g, [[cx - 8, cy - 4], [cx - 3.5, cy - 3.5], [cx - 4, cy + 1], [cx - 10.5, cy + 1]], CAPE_LIGHT, 0.45);
    fillPoly(g, [[cx + 8, cy - 4], [cx + 3.5, cy - 3.5], [cx + 4, cy + 1], [cx + 10.5, cy + 1]], CAPE_LIGHT, 0.45);
    strokeLine(g, [[cx - 8, cy - 1.5], leftHem[1]], CAPE_DARK, 1, 0.6);
    strokeLine(g, [[cx + 8, cy - 1.5], rightHem[1]], CAPE_DARK, 1, 0.6);
    strokeLine(g, [[cx - 3.5, cy - 3.5], [cx - 4.5, cy + 6], ...leftHem], GOLD_TRIM, 1.2, 0.9);
    strokeLine(g, [[cx + 3.5, cy - 3.5], [cx + 4.5, cy + 6], ...rightHem], GOLD_TRIM, 1.2, 0.9);

    // gola alta
    g.fillStyle(CAPE_BASE);
    g.fillEllipse(cx, cy - 4, 17, 5);
    strokeLine(g, [[cx - 7.5, cy - 4.5], [cx + 7.5, cy - 4.5]], GOLD_TRIM, 0.8, 0.9);

    // cabeça
    g.fillStyle(0xffa448);
    g.fillEllipse(cx, cy - 10, 12, 12);
    g.fillStyle(0xffe4b0);
    g.fillEllipse(cx, cy - 6, 8, 6);
    g.fillStyle(0x5d3a28);
    g.fillEllipse(cx, cy - 6.5, 3, 2.2);

    // boca: sorriso acordada, pequeno "o" dormindo
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

    if (sleep) {
      closedEye(cx - 3.5, cy - 11, 1.8);
      closedEye(cx + 3.5, cy - 11, 1.8);
    } else if (reading) {
      // olhando para baixo, para o livro: pupilas descidas, pálpebra caída e olhar que segue a folha
      const gaze = frame > 0 && frame < 8 ? (Math.cos((frame / 8) * Math.PI) >= 0 ? 0.6 : -0.6) : 0;
      g.fillStyle(0x1a1a1a);
      g.fillCircle(cx - 3.5 + gaze, cy - 10.4, 2.2);
      g.fillCircle(cx + 3.5 + gaze, cy - 10.4, 2.2);
      g.fillStyle(0xffffff);
      g.fillCircle(cx - 2.9 + gaze, cy - 10.9, 0.8);
      g.fillCircle(cx + 4.1 + gaze, cy - 10.9, 0.8);
      g.fillStyle(0xffa448);
      g.fillRect(cx - 6, cy - 13.6, 5, 1.2);
      g.fillRect(cx + 1, cy - 13.6, 5, 1.2);
    } else {
      g.fillStyle(0x1a1a1a);
      g.fillCircle(cx - 3.5, cy - 11, 2.2);
      g.fillCircle(cx + 3.5, cy - 11, 2.2);
      g.fillStyle(0xffffff);
      g.fillCircle(cx - 2.9, cy - 11.6, 1);
      g.fillCircle(cx + 4.1, cy - 11.6, 1);
    }

    // chapéu (de frente)
    g.fillStyle(CAPE_BASE);
    g.fillTriangle(cx, cy - 23, cx - 4, cy - 12, cx + 4, cy - 12);
    drawHatBrim(cx, cy - 11.5, 11);
    g.fillStyle(GOLD);
    g.fillCircle(cx, cy - 22, 1.3);

    // blush
    g.fillStyle(0xffab91, 0.4);
    g.fillCircle(cx - 6.5, cy - 7.5, 2);
    g.fillCircle(cx + 6.5, cy - 7.5, 2);

    if (reading) {
      drawReadingBook(); // as mãos ficam no livro
      return;
    }

    // mãos saindo do manto; varinha ao lado (não cobre mais o rosto)
    g.fillStyle(FUR);
    g.fillCircle(cx - 10.5, cy + 7.5, 3);
    g.fillCircle(cx + 11, cy + 6.5, 3);
    drawWand(g, cx + 11.5 + wandWave * 0.5, cy + 4.5, cx + (sleep ? 14 : 14.5) + wandWave * 0.5, cy - (sleep ? 3 : 11));
    if (!sleep) {
      // estrelinhas mágicas (só acordada)
      g.fillStyle(GOLD);
      g.fillCircle(cx + 17, cy - 8, 0.8);
      g.fillCircle(cx + 12, cy - 15, 0.8);
    }

    drawClasp(g, cx, cy - 2.4);
  }
}

// Gera as texturas: 12 de caminhada (4 frames x 3 direções), 6 de sono (2 x 3), 2 de "mexer a poção", 2 de maestro e 9 de leitura.
export function drawRooTextures(g: Gfx, T: number): void {
  const H = rooTextureHeight(T);
  const dirs: RooDir[] = ['down', 'up', 'side'];
  for (let fi = 0; fi < 4; fi++) {
    for (const dir of dirs) {
      drawRooFrame(g, T, fi, dir, 'awake');
      g.generateTexture(`roo_${dir}_${fi}`, T, H);
    }
  }
  // leitura: 9 quadros (0 e 8 são páginas paradas; 1 a 7, a página virando)
  for (let fi = 0; fi < 9; fi++) {
    drawRooFrame(g, T, fi, 'down', 'read');
    g.generateTexture(`roo_read_${fi}`, T, H);
  }
  for (let fi = 0; fi < 2; fi++) {
    for (const dir of dirs) {
      drawRooFrame(g, T, fi, dir, 'sleep');
      g.generateTexture(`roo_sleep_${dir}_${fi}`, T, H);
    }
    drawRooFrame(g, T, fi, 'side', 'stir');
    g.generateTexture(`roo_stir_${fi}`, T, H);
    drawRooFrame(g, T, fi, 'side', 'maestro');
    g.generateTexture(`roo_maestro_${fi}`, T, H);
  }
}
