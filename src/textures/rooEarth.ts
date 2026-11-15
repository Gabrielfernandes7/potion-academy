// Roo Terra (a transformação de terra): capa de terra e musgo, e sal por cima. Mesmo molde de rooWater.ts: o
// estágio vai de 1 (capa terrosa) a 4 (cristais de sal em volta e rachaduras aos pés); a fase do tremor (0 a 7)
// faz os grãos caírem e os cristais girarem. Sem Phaser: só canvas 2D.
import { recolorCloak, type CloakPalette } from './rooRecolor';
import type { FireDir } from './rooFire';

export interface EarthOpts {
  dir: FireDir;
  frame: number; // 0 a 3 (caminhada)
  tick?: number; // fase do tremor (0 a 7)
  stage?: number; // 0 = original; 1 = capa terrosa; 2 = grãos de sal; 3 = cristais; 4 = mais cristais e rachaduras (padrão)
}

const PALETTE: CloakPalette = {
  gradient: [0x8bc34a, 0x6d9a3c, 0x7a5a36, 0x5d4228, 0x3e2b1a], // musgo no ombro, terra na barra
  detailLight: 0xf4f0e0, // sal
  detailWarm: 0xd9d0b4,
};

type Ctx = CanvasRenderingContext2D;
const px = (c: Ctx, x: number, y: number, color: string): void => { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), 1, 1); };

// Cristal de sal em pixels: um losango de 3 a 5 px, branco com a face de baixo cinza e um brilho.
function crystal(c: Ctx, cx: number, cy: number, r: number, twinkle: boolean): void {
  for (let dy = -r; dy <= r; dy++) {
    const half = r - Math.abs(dy);
    for (let dx = -half; dx <= half; dx++) px(c, cx + dx, cy + dy, dy > 0 || dx > 0 ? '#cfc8ae' : '#f6f2e2');
  }
  px(c, cx, cy - r, '#8a7f60');
  px(c, cx, cy + r, '#8a7f60');
  if (twinkle) px(c, cx - 1, cy - 1, '#ffffff');
}

export function makeEarthRoo(
  src: CanvasImageSource & { width: number; height: number },
  o: EarthOpts,
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
  recolorCloak(img.data, w, h, PALETTE);
  ctx.putImageData(img, 0, 0);

  const tick = (o.tick ?? o.frame) % 8;
  const cx = w / 2;
  // grãos de sal que caem dos lados (estágio 2 em diante)
  if (stage >= 2) {
    for (let i = 0; i < 3; i++) {
      const x = [7, cx + 1, w - 8][i];
      const y = 12 + ((tick * 2 + i * 8) % (h - 20));
      px(ctx, x, y, '#f4f0e0'); px(ctx, x, y + 1, '#cfc8ae');
    }
  }
  // cristais de sal que giram devagar em volta do corpo (estágio 3 em diante)
  if (stage >= 3) {
    const n = stage === 3 ? 2 : 3;
    for (let i = 0; i < n; i++) {
      const a = (tick / 8 + i / n) * Math.PI * 2;
      crystal(ctx, cx + Math.cos(a) * 16, h * 0.56 + Math.sin(a) * 11, i === 0 ? 3 : 2, (tick + i) % 3 === 0);
    }
  }
  // estágio 4: chão rachado aos pés (rachaduras que pulsam) e pontos de brilho
  if (stage >= 4) {
    const reach = 9 + (tick % 4);
    for (const dir of [-1, 1]) {
      for (let k = 0; k < reach; k++) px(ctx, cx + dir * (4 + k), h - 3 + ((k * 7 + tick) % 3 === 0 ? 1 : 0) - (k % 2), '#3e2b1a');
    }
    for (let i = 0; i < 4; i++) {
      if ((tick + i * 2) % 4 !== 0) continue;
      px(ctx, 4 + ((i * 11 + tick * 5) % (w - 8)), 6 + ((i * 17 + tick * 3) % (h - 16)), '#ffffff');
    }
  }
  return out;
}
