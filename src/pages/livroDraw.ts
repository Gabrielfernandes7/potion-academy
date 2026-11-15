// Utilitários de desenho do Livro de Roo (livro.html): pixel art num canvas pequeno (W x H), ampliado sem suavização.
// Tudo em blocos inteiros, sem degradê suave: o brilho das velas é feito de discos concêntricos em degraus, como o resto
// do jogo (CLAUDE.md, "Estilo visual"). Só canvas 2D, sem Phaser.
export const W = 200;
export const H = 150;

export type Ctx = CanvasRenderingContext2D;
export type Sprites = Record<string, HTMLCanvasElement>;

/** Cores do livro: tinta, pergaminho, ouro, cera, noite. */
export const COR = {
  tinta: '#2a1a10', tintaSuave: '#5a3d22', pergaminho: '#e9d9b0', pergaminhoEscuro: '#cdb07a',
  ouro: '#d9a441', ouroClaro: '#f0c674', cera: '#f3e6c4', chama: '#ffb84d', chamaClara: '#fff0b0',
  noite0: '#0b1218', noite1: '#101c26', noite2: '#17283a', tijolo: '#3a241a', tijoloClaro: '#563626',
  madeira: '#5a3a22', madeiraClara: '#7a5230', verde: '#3fa58f', vermelho: '#8f2d1f',
} as const;

/** As cores da película de uma bolha de sabão (as mesmas da Roo Água e da cena do nascimento). */
export const IRIS: readonly string[] = ['#ffa8e0', '#fff1a0', '#9ff0ff', '#c9b0ff', '#a8ffd0'];

export function rect(c: Ctx, x: number, y: number, w: number, h: number, color: string, alpha = 1): void {
  c.globalAlpha = alpha;
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  c.globalAlpha = 1;
}

/** Um disco em pixels (linhas de retângulos), sem suavização. */
export function disco(c: Ctx, cx: number, cy: number, r: number, color: string, alpha = 1): void {
  c.globalAlpha = alpha;
  c.fillStyle = color;
  if (r <= 2) {
    // discos minúsculos (cabeças, pontos de luz) são quadrados: a conta de um disco de raio 1 ou 2 desenha um "+", que
    // parece uma cruz, e o jogo não põe cruz em figura nenhuma (CLAUDE.md, "Respeito à fé")
    const lado = Math.max(2, r * 2);
    c.fillRect(Math.round(cx - lado / 2), Math.round(cy - lado / 2), lado, lado);
    c.globalAlpha = 1;
    return;
  }
  for (let dy = -r; dy <= r; dy++) {
    const half = Math.floor(Math.sqrt(r * r - dy * dy));
    c.fillRect(Math.round(cx - half), Math.round(cy + dy), half * 2 + 1, 1);
  }
  c.globalAlpha = 1;
}

/** Brilho de luz em degraus: `passos` discos concêntricos, cada um mais fraco, somados. */
export function brilho(c: Ctx, cx: number, cy: number, r: number, color: string, forca = 0.16, passos = 4): void {
  for (let i = 0; i < passos; i++) disco(c, cx, cy, Math.round(r * (1 - i / passos)), color, forca);
}

/** Gerador pseudoaleatório com semente (mulberry32): o céu estrelado é sempre o mesmo. */
export function sorteio(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Faixas horizontais de cor (céu ou parede em degraus de pixel): `cores` de cima para baixo entre y0 e y1. */
export function faixas(c: Ctx, y0: number, y1: number, cores: readonly string[]): void {
  const h = (y1 - y0) / cores.length;
  cores.forEach((cor, i) => rect(c, 0, y0 + i * h, W, h + 1, cor));
}

export function estrelas(c: Ctx, t: number, seed: number, n: number, yMax: number): void {
  const r = sorteio(seed);
  for (let i = 0; i < n; i++) {
    const x = Math.floor(r() * W);
    const y = Math.floor(r() * yMax);
    const fase = r() * 6.28;
    const a = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * (1 + r() * 2) + fase));
    rect(c, x, y, 1, 1, '#fff6d8', a);
    if (r() < 0.12) { rect(c, x - 1, y, 3, 1, '#fff6d8', a * 0.5); rect(c, x, y - 1, 1, 3, '#fff6d8', a * 0.5); }
  }
}

/** A chama de uma vela: três retângulos que tremem, mais o brilho em volta. (x, y) = a ponta do pavio. */
export function chamaDeVela(c: Ctx, x: number, y: number, t: number, escala = 1, luz = true): void {
  const tremor = Math.sin(t * 9 + x * 1.7) + Math.sin(t * 13.3 + x);
  const sway = Math.round(tremor * 0.5);
  const alto = Math.round((5 + Math.sin(t * 7 + x) * 0.8) * escala);
  if (luz) brilho(c, x, y - 2, Math.round(26 * escala), COR.chama, 0.07 + 0.015 * tremor, 5);
  rect(c, x - 1 + sway, y - alto, 3, alto, '#e0702a');
  rect(c, x - 1 + sway * 0.5, y - alto + 1, 2, alto - 1, COR.chama);
  rect(c, x + sway * 0.4, y - alto + 2, 1, Math.max(1, alto - 3), COR.chamaClara);
  rect(c, x, y, 1, 1, '#2a1a10');
}

/** Uma vela inteira: o toco de cera com a chama. (x, y) = o pé da vela. */
export function vela(c: Ctx, x: number, y: number, t: number, altura = 10, escala = 1): void {
  rect(c, x - 2, y - altura, 5, altura, COR.cera);
  rect(c, x - 2, y - altura, 1, altura, '#fffbe8');
  rect(c, x + 2, y - altura, 1, altura, '#c9b88a');
  rect(c, x - 3, y, 7, 1, '#7a5a30'); // o pires
  rect(c, x - 1, y - altura - 1, 1, 1, COR.tinta);
  chamaDeVela(c, x, y - altura - 1, t, escala);
}

/** Desenha um sprite do jogo na posição (x, y) (canto superior esquerdo), com escala inteira, sem suavizar. */
export function sprite(c: Ctx, img: HTMLCanvasElement | undefined, x: number, y: number, escala = 1, espelho = false): void {
  if (!img) return;
  c.imageSmoothingEnabled = false;
  const w = img.width * escala;
  const h = img.height * escala;
  if (espelho) {
    c.save();
    c.translate(Math.round(x + w), Math.round(y));
    c.scale(-1, 1);
    c.drawImage(img, 0, 0, w, h);
    c.restore();
  } else {
    c.drawImage(img, Math.round(x), Math.round(y), w, h);
  }
}

/**
 * Uma bolha de sabão iridescente em pixels: o anel muda de cor com o ângulo e com o tempo, o miolo leva uma película
 * bem leve e há dois brilhos. (cx, cy) = o centro, r = o raio.
 */
export function bolha(c: Ctx, cx: number, cy: number, r: number, t: number): void {
  disco(c, cx, cy, r, '#dff6ff', 0.1);
  const passos = Math.max(24, Math.round(r * 7));
  for (let i = 0; i < passos; i++) {
    const a = (i / passos) * Math.PI * 2;
    const x = Math.round(cx + Math.cos(a) * r);
    const y = Math.round(cy + Math.sin(a) * r);
    const cor = IRIS[(Math.floor((a / (Math.PI * 2)) * 10) + Math.floor(t * 3)) % IRIS.length];
    rect(c, x, y, 2, 2, cor, 0.95);
  }
  // películas coloridas que giram devagar por dentro
  for (let k = 0; k < 3; k++) {
    const a = t * 0.9 + k * 2.1;
    disco(c, cx + Math.cos(a) * r * 0.42, cy + Math.sin(a) * r * 0.42, Math.max(2, Math.round(r * 0.3)), IRIS[(k * 2 + Math.floor(t * 2)) % IRIS.length], 0.12);
  }
  rect(c, cx - r * 0.55, cy - r * 0.62, 4, 2, '#ffffff', 0.95);
  rect(c, cx - r * 0.55, cy - r * 0.62 + 2, 2, 3, '#ffffff', 0.8);
  rect(c, cx + r * 0.4, cy + r * 0.38, 3, 2, '#ffffff', 0.7);
}

/** Uma moldura de tinta em volta da gravura (dois fios e as quatro cantoneiras), como nos manuscritos. */
export function moldura(c: Ctx): void {
  c.strokeStyle = COR.tinta;
  c.lineWidth = 1;
  c.strokeRect(0.5, 0.5, W - 1, H - 1);
  c.strokeStyle = COR.ouro;
  c.strokeRect(3.5, 3.5, W - 7, H - 7);
  for (const [x, y] of [[3, 3], [W - 4, 3], [3, H - 4], [W - 4, H - 4]]) rect(c, x - 1, y - 1, 3, 3, COR.vermelho);
}

/** Uma nuvem de pontinhos que sobem (vapor, poeira de farinha, faíscas): `n` partículas determinísticas no tempo. */
export function subindo(c: Ctx, x: number, y: number, t: number, n: number, altura: number, cor: string, largura = 6, ciclo = 3): void {
  const r = sorteio(Math.round(x * 31 + y));
  for (let i = 0; i < n; i++) {
    const fase = (t / ciclo + r()) % 1;
    const px = x + (r() - 0.5) * largura + Math.sin(fase * 6 + i) * 1.5;
    const py = y - fase * altura;
    rect(c, px, py, 1, 1, cor, 0.85 * (1 - fase));
  }
}
