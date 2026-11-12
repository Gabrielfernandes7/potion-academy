// Cena do nascimento da Roo (livro da história, capítulo "A bolha"): pixel art em 240x135, ampliada sem suavização.
// A Roo é a do próprio jogo: as texturas vêm de generateTextures. Carregada só quando a pessoa aperta "Ver a cena".
import Phaser from 'phaser';
import { generateTextures } from './textures';

const W = 240;
const H = 135;
const TOTAL = 21; // segundos
const POUCH = { x: 206, y: 76 }; // abertura da bolsa da capa
const TIP = { x: 82, y: 70 }; // ponta do tubo de vidro

// Legendas: [a partir de quantos segundos, texto]
const CAPTIONS: ReadonlyArray<readonly [number, string]> = [
  [0, 'Madrugada de inverno. O último pó de Prima Materia e o sabão de lixívia.'],
  [3, 'O mestre sopra pelo tubo de vidro.'],
  [6, 'Sobe uma bolha iridescente. Reflete o laboratório inteiro. Não estoura.'],
  [12.5, 'Flutua até a capa pendurada no gancho.'],
  [14.5, 'Pousa na bolsa e estoura, sem ruído, como quem suspira.'],
  [16, 'Na bolsa, alguém respira.'],
  [18.5, 'Ninguém soube explicar por que um canguru.'],
];

type Sprites = Record<string, HTMLCanvasElement>;
let spritesPromise: Promise<Sprites> | null = null;

// Gera as texturas do jogo num Phaser escondido e copia só as da Roo.
function loadSprites(): Promise<Sprites> {
  spritesPromise ??= new Promise<Sprites>((resolve, reject) => {
    const host = document.createElement('div');
    host.hidden = true;
    document.body.appendChild(host);
    class Gen extends Phaser.Scene {
      constructor() { super('BirthGen'); }
      create(): void {
        try {
          generateTextures(this);
          const out: Sprites = {};
          for (const key of ['roo_sleep_down_0', 'roo_sleep_down_1', 'roo_down_0']) {
            const src = this.textures.get(key).getSourceImage() as HTMLCanvasElement;
            const copy = document.createElement('canvas');
            copy.width = src.width;
            copy.height = src.height;
            copy.getContext('2d')?.drawImage(src, 0, 0);
            out[key] = copy;
          }
          resolve(out);
          this.game.destroy(true);
          host.remove();
        } catch (e) { reject(e); }
      }
    }
    new Phaser.Game({ type: Phaser.CANVAS, width: 1, height: 1, parent: host, pixelArt: true, audio: { noAudio: true }, scene: [Gen] });
  });
  return spritesPromise;
}

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
const ease = (v: number): number => { const u = clamp01(v); return u * u * (3 - 2 * u); };
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

type Ctx = CanvasRenderingContext2D;
const px = (c: Ctx, color: string, x: number, y: number, w = 1, h = 1): void => { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), w, h); };

function disk(c: Ctx, color: string, cx: number, cy: number, r: number): void {
  c.fillStyle = color;
  for (let y = -r; y <= r; y++) {
    const half = Math.floor(Math.sqrt(r * r - y * y));
    c.fillRect(Math.round(cx) - half, Math.round(cy) + y, half * 2 + 1, 1);
  }
}

function drawRoom(c: Ctx, t: number): void {
  px(c, '#1c1a24', 0, 0, W, 100); // parede
  px(c, '#2a2233', 0, 100, W, H - 100); // chão
  for (let x = 0; x < W; x += 24) px(c, '#1c1a24', x, 100, 1, H - 100);
  px(c, '#1c1a24', 0, 118, W, 1);
  // janela com lua e estrelas
  px(c, '#5b4d36', 148, 12, 44, 44);
  px(c, '#14243b', 151, 15, 38, 38);
  disk(c, '#e8dcc0', 172, 30, 6);
  disk(c, '#14243b', 175, 28, 5); // lua crescente
  for (const [sx, sy] of [[156, 20], [182, 22], [160, 44], [184, 46], [168, 48]]) px(c, '#e8dcc0', sx, sy);
  px(c, '#5b4d36', 170, 15, 2, 38);
  px(c, '#5b4d36', 151, 33, 38, 2);
  // prateleira com frascos
  px(c, '#5b4d36', 8, 62, 104, 3);
  const bottles = ['#d9533a', '#4a90d9', '#81c784', '#d9a441', '#a770d9', '#4a90d9', '#d9533a', '#81c784', '#d9a441'];
  bottles.forEach((col, i) => { px(c, col, 14 + i * 11, 52, 6, 10); px(c, '#e8dcc0', 16 + i * 11, 49, 2, 3); });
  // gancho
  px(c, '#bfae8a', 204, 36, 4, 4);
  // lanterna na mesa (a chama pisca)
  px(c, '#5b4d36', 94, 80, 8, 10);
  px(c, '#d9a441', 95, 81, 6, 8);
  const flick = Math.floor(t * 6) % 3;
  px(c, '#ffeb3b', 97, 77 - flick % 2, 2, 4);
  px(c, '#ff9800', 97, 79, 2, 2);
}

function drawTable(c: Ctx): void {
  px(c, '#5b4d36', 14, 88, 100, 5);
  px(c, '#3d332b', 14, 93, 100, 2);
  px(c, '#3d332b', 20, 95, 5, 23);
  px(c, '#3d332b', 104, 95, 5, 23);
  // prato com a mistura
  px(c, '#bfae8a', 64, 84, 20, 4);
  px(c, '#2a5a6a', 66, 84, 16, 2);
}

function drawMestre(c: Ctx, t: number): void {
  const lean = t > 2.6 && t < 6.2 ? 2 : 0; // inclina-se ao soprar
  const breathe = Math.floor(t * 1.5) % 2;
  // manto
  px(c, '#3a3350', 28, 58 - breathe, 28, 46);
  px(c, '#2a2438', 28, 58 - breathe, 3, 46);
  px(c, '#d9a441', 40, 62, 2, 38);
  // cabeça, barba e chapéu
  const hx = 34 + lean;
  px(c, '#e8c9a0', hx, 44, 14, 13);
  px(c, '#e8dcc0', hx - 1, 53, 16, 9);
  px(c, '#e8dcc0', hx + 2, 62, 10, 3);
  px(c, '#1a1a1a', hx + 9, 49, 2, 2);
  px(c, '#2b3a67', hx - 3, 42, 20, 3);
  for (let i = 0; i < 7; i++) px(c, '#2b3a67', hx + 6 - i, 35 + i, 2 + i * 2, 1); // ponta no alto, abrindo até a aba
  px(c, '#d9a441', hx + 1, 42, 12, 1);
  // braço e tubo de vidro até a ponta
  px(c, '#3a3350', 54, 66, 8, 5);
  px(c, '#e8c9a0', 62, 69, 3, 3);
  for (let x = 64; x <= TIP.x; x++) px(c, '#bfe3ff', x, 70 + Math.round((x - 64) * (TIP.y - 70) / (TIP.x - 64)) - 1, 1, 1);
}

// Bolha: borda iridescente que gira de cor, miolo quase transparente e um brilho.
function drawBubble(c: Ctx, cx: number, cy: number, r: number, t: number): void {
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      const d = Math.sqrt(x * x + y * y);
      if (d > r) continue;
      const hue = (Math.atan2(y, x) * 57.3 + 180 + t * 70 + d * 6) % 360;
      if (d > r - 1.6) c.fillStyle = `hsl(${hue} 85% 76% / 0.92)`;
      else c.fillStyle = `hsl(${hue} 70% 80% / 0.14)`;
      c.fillRect(Math.round(cx + x), Math.round(cy + y), 1, 1);
    }
  }
  const h = Math.max(1, Math.round(r * 0.22));
  px(c, '#ffffff', cx - r * 0.5, cy - r * 0.55, h + 1, h);
  px(c, '#ffffff', cx - r * 0.5, cy - r * 0.3, 1, h);
}

function drawPop(c: Ctx, cx: number, cy: number, u: number): void {
  // faíscas de pixel saindo para fora e um anel que abre
  const ring = 11 + u * 12;
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    c.fillStyle = `hsl(${(i * 37) % 360} 85% 78% / ${1 - u})`;
    c.fillRect(Math.round(cx + Math.cos(a) * ring), Math.round(cy + Math.sin(a) * ring), 2, 2);
  }
  for (let i = 0; i < 14; i++) {
    const a = i * 2.4;
    const dist = ring * (0.4 + (i % 3) * 0.3);
    c.fillStyle = `hsl(${(i * 53) % 360} 90% 82% / ${1 - u})`;
    c.fillRect(Math.round(cx + Math.cos(a) * dist), Math.round(cy + Math.sin(a) * dist), 1, 1);
  }
}

function drawCape(c: Ctx): void {
  px(c, '#4a148c', 186, 40, 40, 58);
  px(c, '#2e0a5c', 186, 40, 4, 58);
  px(c, '#2e0a5c', 220, 40, 6, 58);
  px(c, '#7e3fd0', 194, 44, 24, 3);
  px(c, '#d9a441', 186, 40, 40, 2); // barra dourada no alto
  px(c, '#2e0a5c', 196, POUCH.y, 20, 4); // boca da bolsa, escura por dentro
}

function drawPouchLip(c: Ctx): void {
  px(c, '#7e3fd0', 194, POUCH.y + 4, 24, 14);
  px(c, '#4a148c', 194, POUCH.y + 4, 24, 2);
  px(c, '#2e0a5c', 194, POUCH.y + 17, 24, 1);
}

// Qual legenda vale em t
function captionAt(t: number): string {
  let text = CAPTIONS[0][1];
  for (const [from, s] of CAPTIONS) if (t >= from) text = s;
  return text;
}

function bubbleAt(t: number): { x: number; y: number; r: number } | null {
  if (t < 3 || t >= 14.5) return null;
  if (t < 6) return { x: TIP.x + 1, y: TIP.y, r: 1 + 13 * ease((t - 3) / 3) };
  const u = clamp01((t - 6) / 7); // viagem de 6 s a 13 s
  const x = lerp(TIP.x + 1, POUCH.x, ease(u));
  const y = lerp(TIP.y, POUCH.y - 12, ease(u)) + Math.sin(u * Math.PI * 3) * 10 * (1 - u * 0.6);
  const settle = clamp01((t - 13) / 1.5); // 13 s a 14,5 s: desce para a bolsa
  return { x, y: y + settle * 8, r: 14 - settle * 2 };
}

function render(c: Ctx, t: number, roo: Sprites): void {
  c.imageSmoothingEnabled = false;
  drawRoom(c, t);
  drawMestre(c, t);
  drawTable(c);
  drawCape(c);

  // Roo sai da bolsa (só a cabeça e as orelhas aparecem: o resto fica dentro)
  if (t >= 15.2) {
    const rise = ease((t - 15.2) / 1.4);
    const awake = t >= 18.2;
    const key = awake ? 'roo_down_0' : `roo_sleep_down_${Math.floor(t * 1.2) % 2}`;
    const img = roo[key];
    const crop = 32;
    const top = POUCH.y + 8 - crop * rise;
    c.drawImage(img, 0, 0, img.width, crop, POUCH.x - img.width / 2, Math.round(top), img.width, crop);
  }
  drawPouchLip(c);

  const b = bubbleAt(t);
  if (b) drawBubble(c, b.x, b.y, b.r, t);
  if (t >= 14.5 && t < 15.4) drawPop(c, POUCH.x, POUCH.y - 2, (t - 14.5) / 0.9);
}

// Toca a cena uma vez. Resolve quando termina (ou na hora, se a pessoa reduz movimento: mostra o último quadro).
export async function playBirthScene(canvas: HTMLCanvasElement, caption: HTMLElement): Promise<void> {
  const roo = await loadSprites();
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (still) {
    render(ctx, 19, roo);
    caption.textContent = 'Na bolsa da capa, alguém respira. Ninguém soube explicar por que um canguru.';
    return;
  }
  await new Promise<void>(resolve => {
    const start = performance.now();
    const frame = (now: number): void => {
      const t = Math.min(TOTAL, (now - start) / 1000);
      render(ctx, t, roo);
      const text = captionAt(t);
      if (caption.textContent !== text) caption.textContent = text;
      if (t < TOTAL) requestAnimationFrame(frame);
      else resolve();
    };
    requestAnimationFrame(frame);
  });
}
