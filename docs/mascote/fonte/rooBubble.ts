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

// paleta da Roo (roo.ts)
const OUT = '#1c1410';
const FUR = '#ff9a3a';
const HEAD = '#ffa448';
const FUR_LIGHT = '#ffc070';
const FUR_DARK = '#d07020';
const EAR = '#e07820';
const EAR_IN = '#ffd8a0';
const EAR_TIP = '#c06018';
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

// Cadeia de elipses (orelha caída): primeiro todos os contornos, depois os preenchimentos, sem "trançar".
function chain(c: Ctx, path: ReadonlyArray<readonly [number, number]>, rx: number, ry: number, fill: string, inner: string): void {
  // pontos intermediários: o miolo claro vira uma faixa contínua, não contas
  const pts: Array<readonly [number, number]> = [];
  path.forEach((p, i) => {
    pts.push(p);
    const n = path[i + 1];
    if (n) { pts.push([Math.round((p[0] + n[0]) / 2), Math.round((p[1] + n[1]) / 2)]); }
  });
  for (const [x, y] of pts) ellipse(c, OUT, x, y, rx + 1, ry + 1);
  for (const [x, y] of pts) ellipse(c, fill, x, y, rx, ry);
  for (const [x, y] of pts) ellipse(c, inner, x, y, Math.max(1, rx - 2), Math.max(1, ry - 1));
}

// ---------------------------------------------------------------- pose fetal
// Deitadinha de lado, encolhida: cabeça à esquerda, joelhos junto da barriga, mão sob a bochecha,
// rabo enrolado à direita, orelhas flutuando para trás e o manto de cobertor sobre as costas.
function drawFetal(c: Ctx, k: number): void {
  const t = k / BUBBLE_FRAMES;
  const b = Math.sin(t * Math.PI * 2) > 0.3 ? 1 : 0; // respira
  const sway = Math.round(Math.sin((t + 0.25) * Math.PI * 2)); // a ponta das orelhas oscila

  // rabo enrolado, à direita
  shape(c, FUR_DARK, 76, 63, 5, 4);
  shape(c, FUR_DARK, 79, 57, 3, 5);
  ellipse(c, FUR_LIGHT, 79, 54, 1, 2);

  // orelha de trás (aparece por cima do corpo)
  chain(c, [[42, 47], [50, 43], [58, 41 + sway], [66, 41 + sway]], 4, 3, EAR, EAR_IN);
  ellipse(c, EAR_TIP, 70, 41 + sway, 2, 2);

  // corpo deitado
  shape(c, FUR, 54, 61, 22, 13 + b);
  ellipse(c, CREAM, 47, 64, 11, 6); // barriga clara

  // manto de cobertor sobre as costas, com a barra dourada
  ellipse(c, OUT, 62, 55, 18, 9 + b);
  ellipse(c, CAPE, 62, 55, 17, 8 + b);
  ellipse(c, CAPE_LIGHT, 58, 49, 8, 1);
  ellipse(c, CAPE_DARK, 74, 56, 3, 5);
  for (let x = 47; x <= 77; x += 2) rect(c, x % 4 === 1 ? GOLD : GOLD_TRIM, x, 62 + b - (x > 72 ? 2 : 0), 1, 1);
  rect(c, GOLD, 45, 52, 3, 3); // fecho no pescoço
  rect(c, '#ffffff', 45, 52, 1, 1);

  // pernas dobradas: coxa e pés grandes com garrinhas, junto da barriga
  shape(c, FUR_LIGHT, 60, 69, 10, 5);
  shape(c, FOOT, 48, 76, 9, 3);
  shape(c, FOOT, 66, 77, 7, 3);
  claws(c, 38, 76);
  claws(c, 60, 77);

  // cabeça, de olhos fechados, repousando à esquerda
  shape(c, HEAD, 34, 58, 14, 12);
  ellipse(c, FUR_LIGHT, 28, 50, 6, 2);
  rect(c, BROW, 21, 53, 26, 1); // faixa da sobrancelha
  for (const ex of [29, 41]) {
    rect(c, EYE, ex - 2, 57, 5, 1); // olho fechado: arco para baixo
    rect(c, EYE, ex - 1, 58, 3, 1);
    rect(c, EYE, ex - 2, 56, 1, 1);
    rect(c, EYE, ex + 2, 56, 1, 1);
  }
  ellipse(c, CREAM, 34, 64, 7, 4); // focinho
  rect(c, NOSE, 32, 61, 5, 3);
  rect(c, '#ffffff', 33, 61, 1, 1);
  rect(c, OUT, 33, 65, 3, 1); // sorriso pequeno
  rect(c, '#ff9eb5', 22, 61, 3, 2);
  rect(c, '#ff9eb5', 44, 61, 3, 2);

  // orelha da frente, caída sobre o ombro
  chain(c, [[40, 51], [48, 48], [56, 48 + sway]], 4, 3, EAR, EAR_IN);
  ellipse(c, EAR_TIP, 60, 48 + sway, 2, 2);

  // mãozinha redonda sob a bochecha
  shape(c, FUR, 38, 69 + b, 4, 4);
  rect(c, FUR_LIGHT, 37, 67 + b, 2, 1);
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

// Desenha o quadro `k` (0 a BUBBLE_FRAMES-1) da pose num contexto 112x112 transparente.
export function drawRooBubbleFrame(c: Ctx, k: number, pose: BubblePose = 'fetal'): void {
  c.imageSmoothingEnabled = false;
  const bob = Math.round(Math.sin((k / BUBBLE_FRAMES) * Math.PI * 2) * 2);
  drawGlow(c, k);
  c.save();
  // o bebê boia: sobe e desce dentro da bolha. A pose fetal é mais baixa que a outra, então sobe um pouco.
  c.translate(C - 48 + (pose === 'fetal' ? -3 : 0), C - 48 + bob + (pose === 'fetal' ? -2 : -1));
  if (pose === 'fetal') drawFetal(c, k);
  else drawObserve(c, k);
  c.restore();
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
