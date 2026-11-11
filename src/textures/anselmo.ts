// Frei Anselmo, monge do Mosteiro de São Tomás. Grade 40 x 50, como a Roo.
//
// Visual: um velho gentil. Hábito marrom-terra com o capuz abaixado sobre os ombros, tonsura
// (cabeça careca com mechas brancas nas têmporas), sobrancelhas e barba brancas, bochechas
// coradas, cruz de madeira no peito, cordão com nós, mãos juntas e sandálias.
//
// Desenhamos só o lado direito (x >= 20) na vista de frente; o motor espelha para o esquerdo.
// Por isso as formas translúcidas ficam longe do eixo (x = 20), para não somar o alfa duas vezes.
// Poses:  'front_0/1' (frente; 1 respira, a cabeça e o capuz sobem 1 px), 'back' (de costas),
//         'side' (perfil, sem espelho) e 'retrato' (frente em 4x, vetorial, para as cartas).
import Phaser from 'phaser';

type Gfx = Phaser.GameObjects.Graphics;
type Pt = readonly [number, number];

type ColorKey =
  | 'habito' | 'habitoSombra' | 'capuz' | 'cordao' | 'pele' | 'peleSombra' | 'barba' | 'barbaSombra'
  | 'sombra' | 'contorno' | 'rim' | 'cruz' | 'boca' | 'bochecha' | 'sandalia' | 'brilho';

// Cores quentes e claras o bastante para não sumir sobre o chão escuro do jardim.
export const ANSELMO_COLOR: Record<ColorKey, number> = {
  habito: 0x7a5538,
  habitoSombra: 0x45301f,
  capuz: 0x8c6341,
  cordao: 0xe0c27c,
  pele: 0xe6b08c,
  peleSombra: 0xc98a66,
  barba: 0xf6f1e6,
  barbaSombra: 0xc9c1b0,
  sombra: 0x17110d,
  contorno: 0x24160e,
  rim: 0xc9a06f,
  cruz: 0xb9833f,
  boca: 0xa9473f,
  bochecha: 0xe98d83,
  sandalia: 0x4a3322,
  brilho: 0xfff3dc,
};

// `top`: a forma sobe junto com a respiração (cabeça, capuz e barba).
interface Common { c: ColorKey; a?: number; top?: boolean }
type Shape =
  | (Common & { t: 'poly'; pts: Pt[] })
  | (Common & { t: 'line'; pts: Pt[]; w: number })
  | (Common & { t: 'ell'; x: number; y: number; w: number; h: number; stroke?: number })
  | (Common & { t: 'circ'; x: number; y: number; r: number });

// Vista de frente, metade direita.
const FRENTE: Shape[] = [
  { t: 'ell', x: 27, y: 46.5, w: 15, h: 4, c: 'sombra', a: 0.35 },

  // sandálias (aparecem sob a barra do hábito)
  { t: 'ell', x: 24.5, y: 47, w: 6.5, h: 3, c: 'sandalia' },
  { t: 'ell', x: 24.5, y: 47, w: 6.5, h: 3, c: 'contorno', stroke: 0.7 },

  // hábito, em sino, com filete de luz no ombro e dobras
  { t: 'poly', pts: [[20, 19], [26, 19.5], [29.5, 24], [31.5, 34], [34, 46], [20, 46]], c: 'habito' },
  { t: 'poly', pts: [[29.5, 24], [31.5, 34], [34, 46], [31, 46], [28.5, 33]], c: 'habitoSombra', a: 0.55 },
  { t: 'line', pts: [[25.5, 37], [26.5, 46]], c: 'habitoSombra', w: 1, a: 0.6 },
  { t: 'line', pts: [[22, 40], [22.5, 46]], c: 'habitoSombra', w: 1, a: 0.5 },
  { t: 'line', pts: [[20, 19], [26, 19.5], [29.5, 24]], c: 'rim', w: 1, a: 0.85 },
  { t: 'line', pts: [[20, 19], [26, 19.5], [29.5, 24], [31.5, 34], [34, 46], [20, 46]], c: 'contorno', w: 1 },

  // capuz abaixado: gola grossa em volta do pescoço
  { t: 'poly', pts: [[20, 17.5], [27, 18], [31, 22.5], [30, 27], [25, 27.5], [20, 28]], c: 'capuz', top: true },
  { t: 'line', pts: [[20, 17.5], [27, 18], [31, 22.5]], c: 'rim', w: 1, a: 0.85, top: true },
  { t: 'line', pts: [[20, 17.5], [27, 18], [31, 22.5], [30, 27], [25, 27.5], [20, 28]], c: 'contorno', w: 1, top: true },
  { t: 'line', pts: [[27, 21], [28, 25]], c: 'habitoSombra', w: 1, a: 0.5, top: true },

  // cordão de cinto, com nó e pontas
  { t: 'line', pts: [[20, 33], [31, 33]], c: 'cordao', w: 1.2 },
  { t: 'circ', x: 24, y: 33, r: 1.6, c: 'cordao' },
  { t: 'line', pts: [[24, 33], [24.5, 41]], c: 'cordao', w: 1.1 },
  { t: 'circ', x: 24.5, y: 41.5, r: 1.2, c: 'cordao' },
  { t: 'line', pts: [[26, 33], [27.5, 39]], c: 'cordao', w: 1.1 },
  { t: 'circ', x: 27.5, y: 39.5, r: 1.1, c: 'cordao' },

  // cruz de madeira no peito, pendurada por um cordão
  { t: 'line', pts: [[24, 24], [20.8, 28.5]], c: 'cordao', w: 0.8 },
  { t: 'ell', x: 20, y: 31, w: 1.8, h: 5.5, c: 'cruz' },
  { t: 'ell', x: 20, y: 30, w: 5, h: 1.6, c: 'cruz' },

  // mangas largas e mãos juntas
  { t: 'poly', pts: [[28, 25], [31, 31], [30.5, 36], [25, 36.5], [23, 33], [25, 29]], c: 'habito' },
  { t: 'poly', pts: [[28, 25], [31, 31], [30.5, 36], [29, 36], [28.5, 31]], c: 'habitoSombra', a: 0.5 },
  { t: 'line', pts: [[28, 25], [31, 31], [30.5, 36], [25, 36.5], [23, 33]], c: 'contorno', w: 1 },
  { t: 'ell', x: 20, y: 35.5, w: 8, h: 4.5, c: 'pele' },
  { t: 'ell', x: 20, y: 35.5, w: 8, h: 4.5, c: 'contorno', stroke: 0.8 },
  { t: 'line', pts: [[20, 33.5], [20, 37.5]], c: 'peleSombra', w: 0.8 },

  // cabeça: orelha, pele, tonsura
  { t: 'ell', x: 27.8, y: 14, w: 3, h: 4.2, c: 'pele', top: true },
  { t: 'ell', x: 20, y: 12.5, w: 15.5, h: 16.5, c: 'pele', top: true },
  { t: 'ell', x: 20, y: 12.5, w: 15.5, h: 16.5, c: 'contorno', stroke: 0.9, top: true },
  { t: 'ell', x: 23.2, y: 6.8, w: 5, h: 2.4, c: 'brilho', a: 0.5, top: true }, // reflexo na careca
  // mechas brancas nas têmporas (a coroa de cabelo da tonsura)
  { t: 'poly', pts: [[27.6, 17], [28.2, 11.5], [26.6, 7.4], [24.8, 6.8], [26, 10.5], [25.6, 15.5]], c: 'barba', top: true },
  { t: 'line', pts: [[28.2, 11.5], [26.6, 7.4], [24.8, 6.8]], c: 'contorno', w: 0.8, a: 0.8, top: true },

  // rosto: sobrancelha espessa, olho com brilho, nariz redondo, bochecha
  { t: 'line', pts: [[21.6, 10], [25.8, 10.8]], c: 'barba', w: 2, top: true },
  { t: 'line', pts: [[21.6, 10.8], [25.8, 11.6]], c: 'barbaSombra', w: 0.7, a: 0.7, top: true },
  { t: 'ell', x: 24, y: 12.6, w: 2.4, h: 2.6, c: 'contorno', top: true },
  { t: 'circ', x: 24.5, y: 11.9, r: 0.6, c: 'brilho', top: true },
  { t: 'ell', x: 20, y: 15.4, w: 3.4, h: 2.8, c: 'peleSombra', top: true },
  { t: 'circ', x: 25.2, y: 15.8, r: 1.8, c: 'bochecha', a: 0.55, top: true },

  // bigode e barba cheia, com a boca sorrindo
  { t: 'poly', pts: [[20, 17.2], [26.5, 16.2], [28, 18.4], [24.5, 19.2], [20, 18.6]], c: 'barba', top: true },
  { t: 'poly', pts: [[20, 18], [27.5, 17.6], [28.2, 21], [26.5, 25], [23, 28.2], [20, 29]], c: 'barba', top: true },
  { t: 'line', pts: [[27.5, 17.6], [28.2, 21], [26.5, 25], [23, 28.2], [20, 29]], c: 'contorno', w: 0.9, top: true },
  { t: 'line', pts: [[24, 21], [23.6, 26]], c: 'barbaSombra', w: 0.8, a: 0.8, top: true },
  { t: 'ell', x: 20, y: 20, w: 3.2, h: 1.2, c: 'boca', top: true },
  { t: 'line', pts: [[22, 19.6], [22.8, 19.1]], c: 'boca', w: 0.7, top: true },
  { t: 'line', pts: [[20, 17.6], [24.5, 17.2]], c: 'barbaSombra', w: 0.7, a: 0.8, top: true },
];

// Costas: capuz abaixado, nuca com o anel de cabelo branco, cordão no meio.
const COSTAS: Shape[] = [
  { t: 'ell', x: 27, y: 46.5, w: 15, h: 4, c: 'sombra', a: 0.35 },
  { t: 'ell', x: 24.5, y: 47, w: 6.5, h: 3, c: 'sandalia' },
  { t: 'poly', pts: [[20, 19], [26, 19.5], [29.5, 24], [31.5, 34], [34, 46], [20, 46]], c: 'habito' },
  { t: 'poly', pts: [[29.5, 24], [31.5, 34], [34, 46], [31, 46], [28.5, 33]], c: 'habitoSombra', a: 0.55 },
  { t: 'line', pts: [[25.5, 36], [26.5, 46]], c: 'habitoSombra', w: 1, a: 0.6 },
  { t: 'line', pts: [[20, 19], [26, 19.5], [29.5, 24]], c: 'rim', w: 1, a: 0.85 },
  { t: 'line', pts: [[20, 19], [26, 19.5], [29.5, 24], [31.5, 34], [34, 46], [20, 46]], c: 'contorno', w: 1 },
  { t: 'line', pts: [[20, 33], [31, 33]], c: 'cordao', w: 1.2 },
  { t: 'circ', x: 24, y: 33, r: 1.5, c: 'cordao' },
  // capuz caído nas costas: uma bolsa de pano
  { t: 'poly', pts: [[20, 17.5], [27, 18], [31, 22], [31, 28], [27, 32], [20, 33]], c: 'capuz', top: true },
  { t: 'line', pts: [[20, 17.5], [27, 18], [31, 22]], c: 'rim', w: 1, a: 0.85, top: true },
  { t: 'line', pts: [[20, 17.5], [27, 18], [31, 22], [31, 28], [27, 32], [20, 33]], c: 'contorno', w: 1, top: true },
  { t: 'line', pts: [[24, 22], [26, 30]], c: 'habitoSombra', w: 1, a: 0.5, top: true },
  // cabeça: coroa careca e cabelo branco em volta
  { t: 'ell', x: 20, y: 12.5, w: 15.5, h: 16.5, c: 'barba', top: true },
  { t: 'ell', x: 20, y: 7.6, w: 9, h: 5.4, c: 'pele', top: true },
  { t: 'ell', x: 20, y: 12.5, w: 15.5, h: 16.5, c: 'contorno', stroke: 0.9, top: true },
  { t: 'ell', x: 22.6, y: 6.8, w: 4, h: 2, c: 'brilho', a: 0.5, top: true },
  { t: 'line', pts: [[24, 13], [25, 18]], c: 'barbaSombra', w: 0.8, a: 0.8, top: true },
  { t: 'ell', x: 27.8, y: 14, w: 3, h: 4.2, c: 'pele', top: true },
];

// Perfil (olhando para a direita). Desenhado inteiro, sem espelho.
const LADO: Shape[] = [
  { t: 'ell', x: 20, y: 46.5, w: 22, h: 4, c: 'sombra', a: 0.35 },
  // sandália apontando para a frente
  { t: 'ell', x: 25, y: 47, w: 8, h: 3, c: 'sandalia' },
  { t: 'poly', pts: [[14, 19], [24, 19.5], [27.5, 24], [29, 33], [31, 46], [10, 46], [9.5, 34], [11, 25]], c: 'habito' },
  { t: 'poly', pts: [[24, 25], [29, 33], [31, 46], [24, 46], [21, 32]], c: 'habitoSombra', a: 0.55 },
  { t: 'line', pts: [[17, 36], [17.5, 46]], c: 'habitoSombra', w: 1, a: 0.6 },
  { t: 'line', pts: [[14, 19], [24, 19.5], [27.5, 24]], c: 'rim', w: 1, a: 0.85 },
  { t: 'line', pts: [[14, 19], [24, 19.5], [27.5, 24], [29, 33], [31, 46], [10, 46], [9.5, 34], [11, 25], [14, 19]], c: 'contorno', w: 1 },
  { t: 'line', pts: [[10, 33], [29, 33]], c: 'cordao', w: 1.2 },
  { t: 'circ', x: 24, y: 33, r: 1.5, c: 'cordao' },
  { t: 'line', pts: [[24, 33], [24.5, 40]], c: 'cordao', w: 1.1 },
  { t: 'circ', x: 24.5, y: 40.5, r: 1.1, c: 'cordao' },
  // cruz no peito
  { t: 'ell', x: 26.4, y: 30, w: 1.6, h: 5, c: 'cruz' },
  { t: 'ell', x: 26.4, y: 29.2, w: 4, h: 1.5, c: 'cruz' },
  // capuz abaixado atrás do pescoço
  { t: 'poly', pts: [[11, 19], [17, 17.5], [21, 19], [20, 27], [14, 31], [9.5, 27]], c: 'capuz', top: true },
  { t: 'line', pts: [[11, 19], [17, 17.5], [21, 19]], c: 'rim', w: 1, a: 0.85, top: true },
  { t: 'line', pts: [[11, 19], [17, 17.5], [21, 19], [20, 27], [14, 31], [9.5, 27]], c: 'contorno', w: 1, top: true },
  // manga e mão
  { t: 'ell', x: 25, y: 31, w: 6, h: 7, c: 'habito' },
  { t: 'ell', x: 25, y: 31, w: 6, h: 7, c: 'contorno', stroke: 0.8 },
  { t: 'ell', x: 27.5, y: 34.5, w: 4, h: 3.2, c: 'pele' },
  // cabeça
  { t: 'ell', x: 23, y: 12.5, w: 12.5, h: 16, c: 'pele', top: true },
  { t: 'ell', x: 23, y: 12.5, w: 12.5, h: 16, c: 'contorno', stroke: 0.9, top: true },
  { t: 'ell', x: 24, y: 6.8, w: 5, h: 2.2, c: 'brilho', a: 0.5, top: true },
  { t: 'poly', pts: [[17.2, 16], [16.6, 11], [18.4, 7.6], [21, 6.8], [20, 11], [20.6, 15]], c: 'barba', top: true }, // mecha atrás
  { t: 'ell', x: 28.6, y: 14.6, w: 3.6, h: 3.8, c: 'pele', top: true }, // nariz
  { t: 'ell', x: 28.6, y: 14.6, w: 3.6, h: 3.8, c: 'contorno', stroke: 0.7, top: true },
  { t: 'line', pts: [[24.2, 10.2], [28, 9.8]], c: 'barba', w: 2, top: true },
  { t: 'ell', x: 26.4, y: 12.4, w: 2.2, h: 2.6, c: 'contorno', top: true },
  { t: 'circ', x: 26.8, y: 11.7, r: 0.55, c: 'brilho', top: true },
  { t: 'circ', x: 24, y: 15.6, r: 1.7, c: 'bochecha', a: 0.55, top: true },
  // bigode e barba
  { t: 'poly', pts: [[22, 17.6], [28.6, 16.8], [30, 18.4], [26, 19.4], [22, 19]], c: 'barba', top: true },
  { t: 'poly', pts: [[21, 18.5], [28.4, 18], [29, 21.6], [26, 25.6], [22.6, 27.6], [20, 24]], c: 'barba', top: true },
  { t: 'line', pts: [[28.4, 18], [29, 21.6], [26, 25.6], [22.6, 27.6], [20, 24]], c: 'contorno', w: 0.9, top: true },
  { t: 'line', pts: [[25.4, 20.2], [27.8, 20]], c: 'boca', w: 1.1, top: true },
];

function drawShape(g: Gfx, s: Shape, o: { mirror: boolean; dy: number; k: number }): void {
  const { mirror, dy, k } = o;
  const mp = (p: Pt): Pt => [(mirror ? 40 - p[0] : p[0]) * k, (p[1] + dy) * k];
  const col = ANSELMO_COLOR[s.c];
  const a = s.a ?? 1;

  switch (s.t) {
    case 'poly':
    case 'line': {
      const pts = s.pts.map(mp);
      if (s.t === 'line') g.lineStyle(s.w * k, col, a); else g.fillStyle(col, a);
      g.beginPath();
      g.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
      if (s.t === 'poly') { g.closePath(); g.fillPath(); } else g.strokePath();
      break;
    }
    case 'ell': {
      const [x, y] = mp([s.x, s.y]);
      if (s.stroke) {
        g.lineStyle(s.stroke * k, col, a);
        g.strokeEllipse(x, y, s.w * k, s.h * k);
      } else {
        g.fillStyle(col, a);
        g.fillEllipse(x, y, s.w * k, s.h * k);
      }
      break;
    }
    case 'circ': {
      const [x, y] = mp([s.x, s.y]);
      g.fillStyle(col, a);
      g.fillCircle(x, y, s.r * k);
      break;
    }
  }
}

// Desenha uma lista de formas. `mirror` espelha o lado direito; `topDy` desloca as formas `top`
// (a respiração); `k` é a escala (1 = 40 x 50, 4 = retrato).
function drawPose(g: Gfx, shapes: Shape[], opts: { mirror: boolean; topDy?: number; k?: number }): void {
  g.clear();
  const k = opts.k ?? 1;
  const dyOf = (s: Shape): number => (s.top ? (opts.topDy ?? 0) : 0);
  // forma por forma (e não um lado inteiro de cada vez), para manter a ordem das camadas
  for (const s of shapes) {
    drawShape(g, s, { mirror: false, dy: dyOf(s), k });
    if (opts.mirror) drawShape(g, s, { mirror: true, dy: dyOf(s), k });
  }
}

export const ANSELMO_PORTRAIT_SCALE = 4;

export function drawAnselmoTextures(scene: Phaser.Scene): void {
  const g = scene.make.graphics({}, false);
  const bake = (key: string, shapes: Shape[], opts: { mirror: boolean; topDy?: number; k?: number }): void => {
    drawPose(g, shapes, opts);
    const k = opts.k ?? 1;
    g.generateTexture(key, 40 * k, 50 * k);
  };
  bake('anselmo_front_0', FRENTE, { mirror: true, topDy: 0 });
  bake('anselmo_front_1', FRENTE, { mirror: true, topDy: -1 });
  bake('anselmo_back', COSTAS, { mirror: true });
  bake('anselmo_side', LADO, { mirror: false });
  bake('anselmo_retrato', FRENTE, { mirror: true, k: ANSELMO_PORTRAIT_SCALE });
  g.destroy();
}
