// Roo Aqua (a transformação de água): recolore a capa da Roo para azul e pinta bolhas de sabão, gotas e ondas
// por cima das texturas prontas. Mesmo molde de rooFire.ts: o estágio vai de 1 (capa azul) a 4 (bolhas
// iridescentes e ondas aos pés); a fase do tremor (0 a 7) faz as bolhas girarem e as gotas caírem.
// Sem Phaser: só canvas 2D.
import { iridescent } from '../game/forms/water';
import type { FireDir } from './rooFire';

export interface WaterOpts {
  dir: FireDir;
  frame: number; // 0 a 3 (caminhada)
  tick?: number; // fase do tremor (0 a 7)
  stage?: number; // 0 = original; 1 = capa azul; 2 = gotas; 3 = bolhas; 4 = mais bolhas e ondas (padrão)
}

// Degradê azul da capa, do topo (claro) à barra (escuro): cada faixa é um degrau de pixel.
const CLOAK_GRADIENT = [0x4fc3f7, 0x29a1e6, 0x1e88e5, 0x1565c0, 0x0d47a1] as const;
const DETAIL_LIGHT = 0xe8fbff;
const DETAIL_WARM = 0xb7ecff;

const isPurple = (r: number, g: number, b: number): boolean => b > g + 8 && b >= r * 0.8;
const isGold = (r: number, g: number, b: number): boolean => r > 190 && b < 120 && g / r > 0.7;

function shade(x: number, y: number, r: number, top: number, span: number): number {
  const last = CLOAK_GRADIENT.length - 1;
  const t = Math.min(1, Math.max(0, (y - top) / span)) * last;
  let idx = Math.floor(t);
  if (t - idx > 0.5 && (x + y) % 2 === 0 && idx < last) idx++; // xadrez na fronteira: sem degradê suave
  if (r < 75) idx = Math.min(last, idx + 1);
  else if (r > 110) idx = Math.max(0, idx - 1);
  return CLOAK_GRADIENT[idx];
}

function recolor(d: Uint8ClampedArray, w: number, h: number): void {
  let top = h;
  let bottom = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (d[i + 3] >= 40 && isPurple(d[i], d[i + 1], d[i + 2])) { top = Math.min(top, y); bottom = Math.max(bottom, y); }
    }
  }
  const span = Math.max(1, bottom - top);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (d[i + 3] < 40) continue;
      const r = d[i], g = d[i + 1], b = d[i + 2];
      let c = -1;
      if (isPurple(r, g, b)) c = shade(x, y, r, top, span);
      else if (isGold(r, g, b)) c = r > 230 ? DETAIL_LIGHT : DETAIL_WARM;
      if (c >= 0) { d[i] = (c >> 16) & 255; d[i + 1] = (c >> 8) & 255; d[i + 2] = c & 255; }
    }
  }
}

type Ctx = CanvasRenderingContext2D;
const px = (c: Ctx, x: number, y: number, color: string): void => { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), 1, 1); };

const rgba = (c: number, a: number): string => `rgba(${(c >> 16) & 255},${(c >> 8) & 255},${c & 255},${a})`;

// Bolha de sabão iridescente em pixels: o anel é dividido em trechos de cores diferentes (rosa, amarelo, ciano,
// violeta, verde) que giram com a fase do tremor; o miolo leva uma película colorida bem leve e há um brilho no alto.
function bubble(c: Ctx, cx: number, cy: number, r: number, tick: number): void {
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const d = Math.hypot(dx, dy);
      if (d > r + 0.4) continue;
      const sector = Math.floor(((Math.atan2(dy, dx) + Math.PI) / (Math.PI * 2)) * 10);
      if (d <= r - 0.7) px(c, cx + dx, cy + dy, rgba(iridescent(sector, tick), 0.2));
      else px(c, cx + dx, cy + dy, rgba(iridescent(sector, tick), 0.95));
    }
  }
  px(c, cx - r * 0.45, cy - r * 0.55, '#ffffff');
  px(c, cx - r * 0.45 + 1, cy - r * 0.55, '#ffffff');
}

export function makeWaterRoo(
  src: CanvasImageSource & { width: number; height: number },
  o: WaterOpts,
): HTMLCanvasElement {
  const w = src.width;
  const h = src.height;
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const ctx = out.getContext('2d');
  if (!ctx) return out;
  ctx.drawImage(src, 0, 0);
  const stage = o.stage ?? 4;
  if (stage < 1) return out;
  const img = ctx.getImageData(0, 0, w, h);
  recolor(img.data, w, h);
  ctx.putImageData(img, 0, 0);

  const tick = (o.tick ?? o.frame) % 8;
  const cx = w / 2;
  // gotas que caem dos lados (estágio 2 em diante)
  if (stage >= 2) {
    for (let i = 0; i < 3; i++) {
      const x = [7, cx + 1, w - 8][i];
      const y = 12 + ((tick * 3 + i * 9) % (h - 20));
      px(ctx, x, y, '#7fd6ff'); px(ctx, x, y + 1, '#bff0ff'); px(ctx, x, y + 2, '#4fb8f0');
    }
  }
  // bolhas que giram em volta do corpo (estágio 3 em diante)
  if (stage >= 3) {
    const n = stage === 3 ? 2 : 3;
    for (let i = 0; i < n; i++) {
      const a = (tick / 8 + i / n) * Math.PI * 2;
      bubble(ctx, cx + Math.cos(a) * 16, h * 0.56 + Math.sin(a) * 11, i === 0 ? 3 : 2, tick + i * 2);
    }
  }
  // estágio 4: ondas aos pés e brilhos
  if (stage >= 4) {
    const ripple = 11 + (tick % 4) * 1.5;
    for (let a = 0; a < Math.PI * 2; a += 0.28) px(ctx, cx + Math.cos(a) * ripple, h - 4 + Math.sin(a) * 2.2, 'rgba(176,236,255,0.8)');
    for (let i = 0; i < 4; i++) {
      if ((tick + i * 2) % 4 !== 0) continue;
      px(ctx, 4 + ((i * 11 + tick * 5) % (w - 8)), 6 + ((i * 17 + tick * 3) % (h - 16)), '#ffffff');
    }
  }
  return out;
}
