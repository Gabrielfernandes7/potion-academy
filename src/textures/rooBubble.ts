// Roo bebê dentro da bolha iridescente (capítulo "A bolha", docs/12-historia.md; GIFs em docs/img/).
// Mesma Roo do jogo (paleta de roo.ts: pelo laranja, orelhas altas com miolo claro, chapéu e manto roxos com
// ferragens douradas, olhos escuros, contorno escuro), só que bebê: cabeça grande, corpo pequeno, chapéu e manto miúdos.
// Pixel art desenhada em código, num canvas de 112x112, em laço de BUBBLE_FRAMES quadros. Duas poses:
//   'fetal'   : deitadinha de lado, em posição fetal, dormindo (sem chapéu)
//   'observe' : acordada, olhando em volta, com a mãozinha encostada na parede da bolha
// Só canvas 2D (sem Phaser): roda no jogo (texturas roo_bubble_<pose>_<n>) e no script que gera os GIFs.

export const BUBBLE_SIZE = 112;
export const BUBBLE_FRAMES = 16;
export type BubblePose = 'fetal' | 'observe';
export const BUBBLE_POSES: readonly BubblePose[] = ['fetal', 'observe'];

const C = BUBBLE_SIZE / 2;
const R = 46; // raio da bolha

type Ctx = CanvasRenderingContext2D;

// Fábrica de canvas: no navegador usa o DOM; o script dos GIFs injeta a do Node (setCanvasFactory).
let makeCanvas: (w: number, h: number) => HTMLCanvasElement = (w, h) => {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  return cv;
};
export function setCanvasFactory(f: (w: number, h: number) => HTMLCanvasElement): void { makeCanvas = f; }

// paleta da Roo (roo.ts)
const OUT = '#1c1410';
const FUR = '#ff9a3a';
const HEAD = '#ffa448';
const FUR_LIGHT = '#ffc070';
const FUR_DARK = '#d07020';
const EAR = '#e07820';
const EAR_IN = '#ffd8a0';
const EAR_TIP = '#c06018';
const EAR_BACK = '#b8601a'; // orelha de trás, mais escura
const PINK = '#ff9eb5';
const CAPE_DEEP = '#240850';
const CREAM = '#ffe4b0';
const CREAM_DARK = '#f5c888';
const NOSE = '#5d3a28';
const BROW = '#c06018';
const FOOT = '#a85814';
const CAPE = '#4a148c';
const CAPE_LIGHT = '#7e3fd0';
const CAPE_DARK = '#2e0a5c';
const GOLD = '#ffd54f';
const GOLD_TRIM = '#d9a441';
const EYE = '#1a1a1a';

const rect = (c: Ctx, color: string, x: number, y: number, w = 1, h = 1): void => {
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), w, h);
};

// Elipse cheia sem suavização (uma linha de pixels por vez).
function ellipse(c: Ctx, color: string, cx: number, cy: number, rx: number, ry: number): void {
  c.fillStyle = color;
  for (let dy = -Math.floor(ry); dy <= Math.floor(ry); dy++) {
    const half = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry))) + 0.5);
    c.fillRect(Math.round(cx) - half, Math.round(cy) + dy, half * 2 + 1, 1);
  }
}

// Forma com contorno de 1 px, como o contorno escuro da Roo do jogo.
function shape(c: Ctx, fill: string, cx: number, cy: number, rx: number, ry: number): void {
  ellipse(c, OUT, cx, cy, rx + 1, ry + 1);
  ellipse(c, fill, cx, cy, rx, ry);
}

// Chapéu de bruxo: cone roxo com a ponta torta, faixa dourada na aba e uma estrelinha na ponta.
function hat(c: Ctx, x: number, y: number, h: number, base: number, lean: number): void {
  for (let i = 0; i <= h; i++) {
    const w = Math.round(2 + (base - 2) * (i / h));
    const cx = x + Math.round(lean * (1 - i / h) * (1 - i / h));
    const yy = y + i;
    rect(c, OUT, cx - Math.floor(w / 2) - 1, yy, w + 2, 1);
    rect(c, CAPE, cx - Math.floor(w / 2), yy, w, 1);
    rect(c, CAPE_LIGHT, cx - Math.floor(w / 2) + 1, yy, Math.max(1, Math.floor(w / 4)), 1);
    rect(c, CAPE_DARK, cx + Math.floor(w / 2) - Math.floor(w / 5), yy, Math.max(1, Math.floor(w / 5)), 1);
  }
  // aba
  const by = y + h + 1;
  ellipse(c, OUT, x, by, Math.floor(base / 2) + 3, 3);
  ellipse(c, CAPE, x, by, Math.floor(base / 2) + 2, 2);
  rect(c, GOLD, x - Math.floor(base / 2) - 1, by - 1, base + 3, 1);
  rect(c, GOLD_TRIM, x - Math.floor(base / 2) - 1, by, base + 3, 1);
  // estrelinha
  const tx = x + lean;
  rect(c, GOLD, tx, y - 2, 1, 3);
  rect(c, GOLD, tx - 1, y - 1, 3, 1);
  rect(c, '#ffffff', tx, y - 1, 1, 1);
}

// Garras: dois pontinhos escuros.
const claws = (c: Ctx, x: number, y: number): void => { rect(c, OUT, x, y, 1, 2); rect(c, OUT, x + 2, y, 1, 2); };

// Cápsula: traço grosso de pontas redondas, com a espessura variando ao longo do caminho (ponta de orelha, rabo,
// curva do corpo). Desenha em pontos densos, então a silhueta sai contínua, sem "contas". `fill` null só faz o contorno.
type P = readonly [number, number];
function capsule(c: Ctx, color: string, path: readonly P[], radii: readonly number[], grow = 0): void {
  for (let i = 0; i < path.length; i++) {
    const [x0, y0] = path[i];
    const [x1, y1] = path[Math.min(i + 1, path.length - 1)];
    const r0 = radii[i], r1 = radii[Math.min(i + 1, radii.length - 1)];
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
    for (let j = 0; j <= n; j++) {
      const u = j / n;
      const r = r0 + (r1 - r0) * u + grow;
      ellipse(c, color, x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, r, r);
    }
  }
}
// Peça com contorno escuro de 1 px (contorno primeiro, miolo depois).
function part(c: Ctx, fill: string, path: readonly P[], radii: readonly number[]): void {
  capsule(c, OUT, path, radii, 1);
  capsule(c, fill, path, radii);
}

// ---------------------------------------------------------------- pose fetal
// Um filhote aconchegado, em forma de lua crescente aberta para a esquerda: cabeça grande de lado, rosto de olhos
// fechados, patinhas junto do queixo, joelhos dobrados e pés pequenos, rabo acompanhando a curva, orelhas caídas
// (uma para trás, outra repousando junto da cabeça) e o manto roxo como cobertor nas costas.
// Coordenadas relativas ao centro da bolha.
function drawFetal(c: Ctx, k: number): void {
  const t = k / BUBBLE_FRAMES;
  const bf = (1 - Math.cos(t * Math.PI * 2)) / 2; // respiração lenta, 0 a 1, sem saltos no laço
  const hem = Math.round(bf); // o manto sobe e desce com o corpo
  const tip = Math.round(Math.sin(t * Math.PI * 2 + 1)); // pontas das orelhas, quase imperceptível

  // rabo: contorna a curva do corpo por baixo e sobe pelas costas
  part(c, FUR_DARK, [[6, 24], [17, 28], [26, 24], [29, 16]], [3.2, 3.2, 3, 2.6]);
  ellipse(c, FUR_LIGHT, 29, 15, 2, 2);

  // orelha de trás: dobrada para trás, mais escura, ponta redonda
  part(c, EAR_BACK, [[-2, -18], [5, -23], [12, -22 + tip], [17, -17 + tip]], [4.2, 4.2, 3.6, 3]);
  capsule(c, EAR, [[1, -20], [7, -22], [12, -21 + tip]], [2, 2, 1.6]);

  // joelhos e pés de trás (pequenos, sobrepostos)
  part(c, FOOT, [[-3, 15], [-10, 16]], [3, 2.8]);
  rect(c, OUT, -10, 14, 1, 4);

  // corpo: arco grosso, costas à direita; barriga clara do lado de dentro da curva
  const body: P[] = [[4, -8], [12, -1], [14, 8], [9, 16], [0, 20]];
  const br = [9, 11, 11, 10, 8].map(r => r + bf * 1.2);
  part(c, FUR, body, br);
  capsule(c, FUR_LIGHT, [[8, -14], [16, -6]], [2, 2]); // brilho no alto das costas
  capsule(c, CREAM, [[3, 0], [6, 6], [5, 12]], [2.5, 3.8, 3]);

  // manto-cobertor sobre as costas, com a barra dourada do lado de dentro
  const cape: P[] = [[8, -10], [16, -2], [18, 8], [13, 17 + hem]];
  capsule(c, OUT, cape, [6, 6.5, 6.5, 5.5], 1);
  capsule(c, CAPE, cape, [6, 6.5, 6.5, 5.5]);
  capsule(c, CAPE_LIGHT, [[10, -13], [17, -5]], [1.4, 1.4]);
  capsule(c, CAPE_DARK, [[22, 4], [20, 12], [14, 18 + hem]], [2, 2.4, 2]);
  for (const [x, y] of [[8, -4], [11, 0], [12, 4], [12, 8], [11, 12], [9, 15 + hem]] as const) {
    rect(c, GOLD, x, y + (y > 12 ? hem : 0), 1, 1);
    rect(c, GOLD_TRIM, x, y + 1 + (y > 12 ? hem : 0), 1, 1);
  }
  rect(c, GOLD, 4, -5, 3, 3); // fecho dourado no pescoço
  rect(c, '#ffffff', 4, -5, 1, 1);

  // pé da frente, com dedos
  part(c, FOOT, [[-5, 20], [-12, 21]], [3, 2.6]);
  rect(c, OUT, -12, 20, 1, 3);
  rect(c, OUT, -9, 19, 1, 4);
  rect(c, FUR_LIGHT, -8, 18, 3, 1);

  // cabeça grande, inclinada, apoiada de lado
  part(c, HEAD, [[-6, -10], [-5, -10]], [12, 12]);
  capsule(c, FUR_LIGHT, [[-12, -18], [-5, -19]], [1.8, 1.8]);
  rect(c, '#ffe2a8', -11, -20, 4, 1);
  // olhos fechados (arcos) com cílios; leve inclinação da cabeça
  for (const [ex, ey] of [[-12, -8], [-2, -11]] as const) {
    rect(c, EYE, ex - 2, ey, 5, 1);
    rect(c, EYE, ex - 1, ey + 1, 3, 1);
    rect(c, EYE, ex - 3, ey - 1, 1, 1);
    rect(c, EYE, ex + 3, ey - 1, 1, 1);
    rect(c, BROW, ex - 2, ey - 4, 5, 1);
  }
  // focinho pequeno, nariz e boquinha em "w"
  ellipse(c, CREAM, -8, -3, 5, 3);
  rect(c, NOSE, -10, -5, 4, 2);
  rect(c, '#ffffff', -9, -5, 1, 1);
  rect(c, OUT, -10, -2, 1, 1); rect(c, OUT, -8, -2, 1, 1); rect(c, OUT, -6, -2, 1, 1);
  rect(c, OUT, -9, -1, 1, 1); rect(c, OUT, -7, -1, 1, 1);
  // bochechas
  rect(c, PINK, -16, -4, 3, 2);
  rect(c, PINK, 3, -7, 3, 2);

  // orelha da frente: repousa junto da cabeça, caída pela lateral do rosto
  part(c, EAR, [[-12, -19], [-17, -15], [-19, -8]], [3.8, 3.6, 3]);
  capsule(c, EAR_IN, [[-13, -18], [-16, -14], [-17, -9]], [1.4, 1.4, 1.1]);
  rect(c, PINK, -16, -13, 1, 2);

  // patinhas junto do queixo: duas mãozinhas separadas por uma linha, com dedinhos
  part(c, FUR, [[-11, 3 + hem]], [3.2]);
  part(c, FUR, [[-4, 4 + hem]], [3.2]);
  rect(c, OUT, -7, 1 + hem, 1, 6);
  for (const hx of [-13, -11, -6, -4]) rect(c, FUR_LIGHT, hx, 0 + hem + (hx > -8 ? 1 : 0), 1, 1);
}

// ---------------------------------------------------------------- pose observando
function drawObserve(c: Ctx, k: number): void {
  const t = k / BUBBLE_FRAMES;
  const breathe = Math.sin(t * Math.PI * 2) > 0.4 ? 1 : 0;
  const blink = k === 13;
  // para onde olha: esquerda, centro, direita, cima
  const look: readonly (readonly [number, number])[] = [
    [-2, 0], [-2, 0], [-2, 0], [-1, 0], [0, 0], [0, 0], [1, 0], [2, 0], [2, 0], [2, 0], [1, -1], [0, -2], [0, -2], [0, 0], [-1, 0], [-2, 0],
  ];
  const [lx, ly] = look[k];
  const hx = Math.round(lx / 2); // a cabeça acompanha um pouco
  const earFlick = k === 5 || k === 6 ? 1 : 0;
  const handUp = k >= 6 && k <= 12; // mão encostada na parede da bolha

  // rabo
  shape(c, FUR_DARK, 70, 78, 8, 3);
  ellipse(c, FUR_LIGHT, 74, 76, 2, 1);

  // orelhas altas
  for (const s of [-1, 1] as const) {
    const flick = s === 1 ? earFlick : 0;
    const ex = 48 + s * 10 + hx;
    shape(c, EAR, ex, 24, 4, 9);
    shape(c, EAR, ex + s, 14 - flick, 3, 6);
    ellipse(c, EAR_IN, ex, 25, 2, 7);
    ellipse(c, EAR_IN, ex + s, 15 - flick, 1, 4);
    ellipse(c, EAR_TIP, ex + s, 9 - flick, 2, 1);
  }

  // corpo e manto: abas dos dois lados, barriga clara no meio
  shape(c, FUR, 48, 64, 12, 12 + breathe);
  ellipse(c, CAPE, 48, 66, 15, 11 + breathe);
  ellipse(c, CAPE_DARK, 62, 66, 2, 9 + breathe);
  ellipse(c, CAPE_LIGHT, 38, 62, 2, 5);
  ellipse(c, CAPE_LIGHT, 44, 58, 3, 1);
  ellipse(c, CAPE_DEEP, 48, 75 + breathe, 13, 1);
  ellipse(c, CAPE_DARK, 48, 57, 9, 2); // sombra da cabeça sobre o manto
  ellipse(c, CREAM, 48, 66, 6, 8 + breathe);
  ellipse(c, CREAM_DARK, 48, 72 + breathe, 4, 2);
  for (let x = 34; x <= 62; x += 2) rect(c, x % 4 === 0 ? GOLD_TRIM : GOLD, x, 77 + breathe + (x % 4 === 0 ? 1 : 0), 1, 1);
  rect(c, OUT, 33, 76 + breathe, 1, 2);
  rect(c, OUT, 63, 76 + breathe, 1, 2);

  // pés
  for (const s of [-1, 1] as const) {
    shape(c, FOOT, 48 + s * 8, 82, 6, 3);
    claws(c, 48 + s * 8 - 1, 84);
  }

  // mãozinhas redondas laranja (a da direita sobe e encosta na bolha)
  shape(c, FUR, 34, 70 + breathe, 4, 4);
  if (handUp) {
    shape(c, FUR, 65, 52, 4, 4); // palma apertada na parede
    ellipse(c, FUR_LIGHT, 64, 50, 2, 1);
    rect(c, OUT, 67, 49, 1, 2);
  } else {
    shape(c, FUR, 62, 70 + breathe, 4, 4);
  }

  // cabeça grande
  shape(c, HEAD, 48 + hx, 42, 16, 13);
  ellipse(c, FUR_LIGHT, 42 + hx, 35, 7, 3);

  // chapeuzinho, meio de lado, com a faixa dourada
  hat(c, 48 + hx + 2, 21, 9, 11, 3);

  // focinho
  ellipse(c, CREAM, 48 + hx + lx, 50 + (ly > 0 ? 1 : 0), 8, 5);
  ellipse(c, CREAM_DARK, 48 + hx + lx, 54, 5, 1);
  rect(c, NOSE, 46 + hx + lx, 47, 5, 3);
  rect(c, '#ffffff', 47 + hx + lx, 47, 1, 1);
  rect(c, OUT, 48 + hx + lx, 50, 1, 2);
  rect(c, OUT, 46 + hx + lx, 52, 2, 1);
  rect(c, OUT, 49 + hx + lx, 52, 2, 1);
  for (const s of [-1, 1] as const) rect(c, '#ff9eb5', 48 + hx + s * 12 - 1, 48, 3, 2);

  // sobrancelha-faixa e olhos grandes, escuros, com brilho (como a Roo do jogo)
  rect(c, BROW, 48 + hx - 14, 36, 29, 1);
  for (const s of [-1, 1] as const) {
    const ex = 48 + hx + s * 8;
    if (blink) {
      rect(c, EYE, ex - 3, 43, 7, 1);
      rect(c, EYE, ex - 2, 44, 5, 1);
      continue;
    }
    shape(c, EYE, ex, 42, 4, 5);
    ellipse(c, '#2b2b2b', ex + lx, 42 + ly, 3, 4);
    rect(c, '#ffffff', ex + lx - 2, 39 + ly, 2, 2);
    rect(c, '#ffffff', ex + lx + 1, 44 + ly, 1, 1);
  }
  // fecho dourado do manto no pescoço
  rect(c, GOLD, 47, 55, 3, 2);
  rect(c, '#ffffff', 47, 55, 1, 1);
}

// ---------------------------------------------------------------- a bolha
// Matiz iridescente: gira com o ângulo, com a distância e com o tempo (volta completa no laço).
const hueAt = (x: number, y: number, d: number, t: number): number =>
  (((Math.atan2(y, x) * 57.3 + 180 + d * 5 + t * 360) % 360) + 360) % 360;

function drawGlow(c: Ctx, k: number): void {
  const pulse = 0.5 + 0.5 * Math.sin((k / BUBBLE_FRAMES) * Math.PI * 2);
  for (let y = -C; y < C; y++) {
    for (let x = -C; x < C; x++) {
      const d = Math.sqrt(x * x + y * y);
      if (d <= R - 1 || d > R + 8) continue;
      const fall = 1 - (d - R + 1) / 9;
      const a = fall * fall * (0.25 + pulse * 0.25);
      c.fillStyle = `hsl(${hueAt(x, y, d, k / BUBBLE_FRAMES)} 90% 75% / ${a.toFixed(3)})`;
      c.fillRect(C + x, C + y, 1, 1);
    }
  }
}

function drawBubbleFront(c: Ctx, k: number): void {
  const t = k / BUBBLE_FRAMES;
  const pulse = 0.5 + 0.5 * Math.sin(t * Math.PI * 2);
  for (let y = -R; y <= R; y++) {
    for (let x = -R; x <= R; x++) {
      const d = Math.sqrt(x * x + y * y);
      if (d > R) continue;
      const hue = hueAt(x, y, d, t);
      const edge = R - d; // 0 na borda
      if (edge < 2) c.fillStyle = `hsl(${hue} 92% 80% / 0.95)`;
      else if (edge < 4) c.fillStyle = `hsl(${hue} 85% 82% / ${(0.34 + pulse * 0.1).toFixed(2)})`;
      else if (edge < 8) c.fillStyle = `hsl(${hue} 80% 84% / ${(0.15 + pulse * 0.06).toFixed(2)})`;
      else c.fillStyle = `hsl(${hue} 70% 85% / 0.06)`;
      c.fillRect(C + x, C + y, 1, 1);
    }
  }
  // brilho principal: arco no alto à esquerda e pingos
  for (let i = 0; i < 12; i++) {
    const a = Math.PI * (1.05 + i * 0.04);
    rect(c, '#ffffff', C + Math.cos(a) * (R - 6), C + Math.sin(a) * (R - 6), 1, 1);
    if (i < 6) rect(c, '#ffffff', C + Math.cos(a) * (R - 7), C + Math.sin(a) * (R - 7), 1, 1);
  }
  rect(c, '#ffffff', C + 22, C + 26, 3, 3);
  rect(c, '#ffffffcc', C + 27, C + 20, 2, 2);
  // brilho que corre pela borda
  const ga = t * Math.PI * 2 - 1;
  for (let i = -5; i <= 5; i++) {
    const a = ga + i * 0.035;
    rect(c, i === 0 ? '#ffffff' : '#fff7d0', C + Math.cos(a) * (R - 1), C + Math.sin(a) * (R - 1), 1, 1);
  }
}

// Estrela de 4 pontas; `s` é o tamanho (0 some, 1 a 3 cresce).
function star(c: Ctx, x: number, y: number, s: number): void {
  if (s <= 0) return;
  rect(c, '#ffffff', x, y, 1, 1);
  for (let i = 1; i <= s; i++) {
    const col = i === s ? '#fff1a8' : '#ffffff';
    rect(c, col, x + i, y); rect(c, col, x - i, y); rect(c, col, x, y + i); rect(c, col, x, y - i);
  }
}

const SPARKLES: ReadonlyArray<readonly [number, number, number]> = [
  // x, y, fase (em quadros)
  [C - 30, C - 28, 0], [C + 32, C - 20, 3], [C + 20, C + 34, 6], [C - 34, C + 18, 9],
  [C - 6, C - 40, 12], [C + 40, C + 4, 14], [C - 20, C + 38, 5], [C + 8, C - 30, 10],
];

function drawSparkles(c: Ctx, k: number): void {
  for (const [x, y, phase] of SPARKLES) {
    const u = ((k - phase + BUBBLE_FRAMES) % BUBBLE_FRAMES) / BUBBLE_FRAMES; // 0 a 1
    const s = u < 0.5 ? Math.round(Math.sin(u * 2 * Math.PI) * 3) : 0;
    star(c, x, y, s);
  }
}

// Luz de contorno: a borda da silhueta recebe um tom da moldura (azul e rosa no alto, verde e amarelo embaixo).
function rimLight(lc: Ctx, k: number): void {
  const img = lc.getImageData(0, 0, BUBBLE_SIZE, BUBBLE_SIZE);
  const d = img.data;
  const a = (x: number, y: number): number => (x < 0 || y < 0 || x >= BUBBLE_SIZE || y >= BUBBLE_SIZE ? 0 : d[(y * BUBBLE_SIZE + x) * 4 + 3] < 128 ? 0 : 255); // sombras translúcidas não recebem luz
  const top = ['#a8d8ff', '#ffb8e8'];
  const bottom = ['#b8ffb8', '#fff0a0'];
  const out: Array<[number, number, string]> = [];
  for (let y = 0; y < BUBBLE_SIZE; y++) {
    for (let x = 0; x < BUBBLE_SIZE; x++) {
      if (a(x, y) === 0) continue;
      if (a(x, y - 1) === 0) out.push([x, y, top[((x >> 1) + (k >> 2)) % 2]]);
      else if (a(x, y + 1) === 0) out.push([x, y, bottom[((x >> 1) + (k >> 2)) % 2]]);
    }
  }
  for (const [x, y, col] of out) { lc.fillStyle = col; lc.globalAlpha = 0.75; lc.fillRect(x, y, 1, 1); }
  lc.globalAlpha = 1;
}

// Desenha o quadro `k` (0 a BUBBLE_FRAMES-1) da pose num contexto 112x112 transparente.
export function drawRooBubbleFrame(c: Ctx, k: number, pose: BubblePose = 'fetal'): void {
  c.imageSmoothingEnabled = false;
  const bob = Math.round(Math.sin((k / BUBBLE_FRAMES) * Math.PI * 2) * 2);
  drawGlow(c, k);
  const layer = makeCanvas(BUBBLE_SIZE, BUBBLE_SIZE);
  const lc = layer.getContext('2d') as Ctx;
  lc.imageSmoothingEnabled = false;
  lc.save();
  // o bebê boia: sobe e desce dentro da bolha. A pose fetal é mais baixa que a outra, então sobe um pouco.
  if (pose === 'fetal') lc.translate(C - 4, C - 3 + bob);
  else lc.translate(C - 48, C - 48 + bob - 1);
  if (pose === 'fetal') drawFetal(lc, k);
  else drawObserve(lc, k);
  lc.restore();
  rimLight(lc, k);
  c.drawImage(layer, 0, 0);
  drawBubbleFront(c, k);
  drawSparkles(c, k);
}

// Todos os quadros de uma pose como canvas (para registrar como texturas).
export function drawRooBubbleFrames(pose: BubblePose): HTMLCanvasElement[] {
  return Array.from({ length: BUBBLE_FRAMES }, (_, k) => {
    const canvas = document.createElement('canvas');
    canvas.width = BUBBLE_SIZE;
    canvas.height = BUBBLE_SIZE;
    drawRooBubbleFrame(canvas.getContext('2d') as Ctx, k, pose);
    return canvas;
  });
}
