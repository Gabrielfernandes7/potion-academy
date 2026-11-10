// Frei Anselmo, monge do Mosteiro de São Tomás (personagem novo, ainda sem cena no jogo).
// Hábito marrom-terra, cordão de cinto, capuz e barba branca. Grade 40 x 50, como a Roo.
//
// As formas vêm da base gerada por outra IA (ver task.md, "Meta prompt"): desenhamos só o
// lado direito (x >= 20) na vista de frente; o motor espelha para o lado esquerdo.
// Poses:  'front_0/1' (frente; 1 respira, o capuz sobe 1 px), 'back' (capuz fechado),
//         'side' (perfil, sem espelho).
import Phaser from 'phaser';

type Gfx = Phaser.GameObjects.Graphics;
type Pt = readonly [number, number];

type ColorKey = 'habito' | 'habitoSombra' | 'cordao' | 'pele' | 'peleSombra' | 'barba' | 'sombra' | 'contorno' | 'rim';

// Cores: o hábito foi clareado e ganhou um filete de luz (rim), para não sumir sobre o chão escuro.
const COLOR: Record<ColorKey, number> = {
  habito: 0x5c4030,
  habitoSombra: 0x2e2018,
  cordao: 0xc8a96b,
  pele: 0xd9a17e,
  peleSombra: 0xb97958,
  barba: 0xf0eadd,
  sombra: 0x17110d,
  contorno: 0x1b120d,
  rim: 0xb08a62,
};

type Shape =
  | { t: 'poly'; pts: Pt[]; c: ColorKey; a?: number; capuz?: boolean }
  | { t: 'line'; pts: Pt[]; c: ColorKey; w: number; a?: number; capuz?: boolean }
  | { t: 'ell'; x: number; y: number; w: number; h: number; c: ColorKey; a?: number; stroke?: number; capuz?: boolean }
  | { t: 'circ'; x: number; y: number; r: number; c: ColorKey; a?: number };

// Frente: metade direita. O espelho completa a figura.
const FRENTE: Shape[] = [
  { t: 'ell', x: 27, y: 46, w: 14, h: 4, c: 'sombra', a: 0.35 },

  // hábito, com filete de luz no ombro
  { t: 'poly', pts: [[20, 17], [26, 18], [29, 23], [31, 32], [32, 46], [20, 46]], c: 'habito' },
  { t: 'poly', pts: [[29, 24], [32, 46], [30, 46], [27, 30]], c: 'habitoSombra', a: 0.5 },
  { t: 'line', pts: [[20, 17], [26, 18], [29, 23]], c: 'rim', w: 1, a: 0.8 },
  { t: 'line', pts: [[20, 17], [26, 18], [29, 23], [31, 32], [32, 46], [20, 46]], c: 'contorno', w: 1 },

  // cordão de cinto com nó
  { t: 'line', pts: [[20, 32], [30, 32]], c: 'cordao', w: 1 },
  { t: 'circ', x: 26, y: 32, r: 1.5, c: 'cordao' },

  // mangas fechadas, mãos no centro
  { t: 'ell', x: 22, y: 29, w: 5, h: 6.5, c: 'habito' },
  { t: 'ell', x: 22, y: 29, w: 5, h: 6.5, c: 'contorno', stroke: 0.7 },

  // terço pendurado do cinto
  { t: 'line', pts: [[20, 32], [20, 36]], c: 'cordao', w: 0.8 },
  { t: 'line', pts: [[20, 36], [20, 40]], c: 'cordao', w: 1.2 },
  { t: 'line', pts: [[20, 38], [21.5, 38]], c: 'cordao', w: 1.2 },

  // rosto
  { t: 'ell', x: 23, y: 16, w: 8, h: 11, c: 'pele' },
  { t: 'ell', x: 20, y: 17, w: 2.5, h: 1.5, c: 'peleSombra', a: 0.55 },
  { t: 'line', pts: [[22.5, 15.5], [24.5, 16]], c: 'contorno', w: 1 },
  { t: 'line', pts: [[22, 13], [24.5, 13.5]], c: 'contorno', w: 1 },
  { t: 'line', pts: [[24.5, 16.5], [25.5, 17]], c: 'contorno', w: 1, a: 0.65 },
  { t: 'line', pts: [[24, 18], [24.5, 19]], c: 'contorno', w: 1, a: 0.55 },
  { t: 'line', pts: [[20, 19.5], [22, 19.2]], c: 'contorno', w: 1 },

  // capuz: abóbada e laterais
  { t: 'poly', pts: [[20, 2], [23, 1], [26, 3], [28, 6], [28, 9], [20, 9]], c: 'habito', capuz: true },
  { t: 'poly', pts: [[28, 9], [30, 11], [29, 16], [26, 20], [23, 20], [23, 16], [25, 12], [27, 10]], c: 'habito', capuz: true },
  { t: 'line', pts: [[20, 2], [23, 1], [26, 3], [28, 6], [28, 9]], c: 'rim', w: 1, a: 0.8, capuz: true },
  { t: 'line', pts: [[20, 2], [23, 1], [26, 3], [28, 6], [28, 9]], c: 'contorno', w: 1, capuz: true },
  { t: 'line', pts: [[28, 9], [30, 11], [29, 16], [26, 20], [23, 20], [23, 16], [25, 12], [27, 10]], c: 'contorno', w: 1, capuz: true },
  { t: 'poly', pts: [[27, 12], [29, 14], [28, 16], [26, 18], [25, 17], [26, 15], [27, 13]], c: 'habitoSombra', a: 0.5, capuz: true },

  // barba
  { t: 'poly', pts: [[20, 21], [25, 21], [27, 23], [26, 25.5], [24, 27], [21, 27], [20, 25]], c: 'barba' },
  { t: 'line', pts: [[20, 21], [25, 21], [27, 23], [26, 25.5], [24, 27], [21, 27], [20, 25]], c: 'contorno', w: 1 },
];

// Costas: capuz fechado, sem rosto nem mãos.
const COSTAS: Shape[] = [
  { t: 'ell', x: 27, y: 46, w: 14, h: 4, c: 'sombra', a: 0.35 },
  { t: 'poly', pts: [[20, 17], [26, 18], [29, 23], [31, 32], [32, 46], [20, 46]], c: 'habito' },
  { t: 'poly', pts: [[29, 24], [32, 46], [30, 46], [27, 30]], c: 'habitoSombra', a: 0.5 },
  { t: 'line', pts: [[20, 17], [26, 18], [29, 23]], c: 'rim', w: 1, a: 0.8 },
  { t: 'line', pts: [[20, 17], [26, 18], [29, 23], [31, 32], [32, 46], [20, 46]], c: 'contorno', w: 1 },
  { t: 'line', pts: [[20, 32], [30, 32]], c: 'cordao', w: 1 },
  { t: 'circ', x: 26, y: 32, r: 1.5, c: 'cordao' },
  { t: 'poly', pts: [[20, 1], [24, 1], [27, 3], [29, 6], [29, 11], [28, 16], [26, 20], [22, 22], [20, 22]], c: 'habito' },
  { t: 'line', pts: [[20, 1], [24, 1], [27, 3], [29, 6]], c: 'rim', w: 1, a: 0.8 },
  { t: 'line', pts: [[20, 1], [24, 1], [27, 3], [29, 6], [29, 11], [28, 16], [26, 20], [22, 22], [20, 22]], c: 'contorno', w: 1 },
  { t: 'line', pts: [[20, 10], [20, 22]], c: 'contorno', w: 1 }, // costura central
];

// Perfil (olhando para a direita). Desenhado inteiro, sem espelho.
const LADO: Shape[] = [
  { t: 'ell', x: 20, y: 46, w: 22, h: 4, c: 'sombra', a: 0.35 },
  { t: 'poly', pts: [[13, 18], [24, 19], [27, 24], [29, 32], [31, 46], [9, 46], [8, 34], [10, 24], [12, 20]], c: 'habito' },
  { t: 'poly', pts: [[24, 25], [29, 32], [31, 46], [24, 46], [20, 30]], c: 'habitoSombra', a: 0.5 },
  { t: 'line', pts: [[13, 18], [24, 19], [27, 24]], c: 'rim', w: 1, a: 0.8 },
  { t: 'line', pts: [[13, 18], [24, 19], [27, 24], [29, 32], [31, 46], [9, 46], [8, 34], [10, 24], [12, 20], [13, 18]], c: 'contorno', w: 1 },
  { t: 'line', pts: [[9, 32], [28, 32]], c: 'cordao', w: 1 },
  { t: 'circ', x: 22, y: 32, r: 1.2, c: 'cordao' },
  { t: 'ell', x: 25, y: 30, w: 5, h: 6, c: 'habito' },
  { t: 'ell', x: 25, y: 30, w: 5, h: 6, c: 'contorno', stroke: 0.7 },
  { t: 'ell', x: 22, y: 15, w: 8, h: 10, c: 'pele' },
  { t: 'poly', pts: [[26, 14], [28, 15], [26, 16]], c: 'pele' }, // nariz
  { t: 'line', pts: [[24, 14], [25, 14.5]], c: 'contorno', w: 1 }, // olho
  { t: 'line', pts: [[24.5, 15], [25.5, 15.5]], c: 'contorno', w: 1, a: 0.6 },
  { t: 'line', pts: [[24, 18.5], [25, 18.2]], c: 'contorno', w: 1 }, // boca
  // capuz (perfil)
  { t: 'poly', pts: [[12, 4], [18, 1], [24, 2], [27, 5], [26, 8], [22, 10], [14, 10], [11, 8]], c: 'habito' },
  { t: 'poly', pts: [[11, 8], [10, 14], [11, 20], [14, 24], [18, 24], [20, 20], [18, 15], [15, 11]], c: 'habito' },
  { t: 'line', pts: [[12, 4], [18, 1], [24, 2], [27, 5]], c: 'rim', w: 1, a: 0.8 },
  { t: 'line', pts: [[12, 4], [18, 1], [24, 2], [27, 5], [26, 8], [22, 10], [14, 10], [11, 8]], c: 'contorno', w: 1 },
  { t: 'line', pts: [[11, 8], [10, 14], [11, 20], [14, 24], [18, 24], [20, 20], [18, 15], [15, 11]], c: 'contorno', w: 1 },
  { t: 'poly', pts: [[13, 7], [12, 13], [13, 18], [17, 21], [19, 20], [18, 16], [17, 11], [14, 9]], c: 'habitoSombra', a: 0.5 },
  // barba
  { t: 'poly', pts: [[21, 20], [27, 20], [29, 22], [27, 25], [23, 24], [21, 22]], c: 'barba' },
  { t: 'line', pts: [[21, 20], [27, 20], [29, 22], [27, 25], [23, 24], [21, 22], [21, 20]], c: 'contorno', w: 1 },
];

function drawShape(g: Gfx, s: Shape, mirror: boolean, dy: number): void {
  const mx = (x: number): number => (mirror ? 40 - x : x);
  const mp = (p: Pt): Pt => [mx(p[0]), p[1] + dy];
  const col = COLOR[s.c];
  const a = s.a ?? 1;

  switch (s.t) {
    case 'poly':
    case 'line': {
      const pts = s.pts.map(mp);
      if (s.t === 'line') g.lineStyle(s.w, col, a); else g.fillStyle(col, a);
      g.beginPath();
      g.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
      if (s.t === 'poly') { g.closePath(); g.fillPath(); } else g.strokePath();
      break;
    }
    case 'ell': {
      const y = s.y + dy;
      if (s.stroke) {
        g.lineStyle(s.stroke, col, a);
        g.strokeEllipse(mx(s.x), y, s.w, s.h);
      } else {
        g.fillStyle(col, a);
        g.fillEllipse(mx(s.x), y, s.w, s.h);
      }
      break;
    }
    case 'circ':
      g.fillStyle(col, a);
      g.fillCircle(mx(s.x), s.y + dy, s.r);
      break;
  }
}

// Desenha uma lista de formas numa textura 40 x 50. `mirror` espelha o lado direito;
// `capuzDy` desloca só as formas do capuz (a respiração).
function drawPose(g: Gfx, shapes: Shape[], opts: { mirror: boolean; capuzDy?: number }): void {
  g.clear();
  const dyOf = (s: Shape): number => ('capuz' in s && s.capuz ? (opts.capuzDy ?? 0) : 0);
  for (const s of shapes) drawShape(g, s, false, dyOf(s));
  if (opts.mirror) for (const s of shapes) drawShape(g, s, true, dyOf(s));
}

export function drawAnselmoTextures(scene: Phaser.Scene): void {
  const g = scene.make.graphics({}, false);
  const bake = (key: string, shapes: Shape[], opts: { mirror: boolean; capuzDy?: number }): void => {
    drawPose(g, shapes, opts);
    g.generateTexture(key, 40, 50);
  };
  bake('anselmo_front_0', FRENTE, { mirror: true, capuzDy: 0 });
  bake('anselmo_front_1', FRENTE, { mirror: true, capuzDy: -1 });
  bake('anselmo_back', COSTAS, { mirror: true });
  bake('anselmo_side', LADO, { mirror: false });
  g.destroy();
}
