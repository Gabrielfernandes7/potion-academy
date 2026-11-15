// Roo Ar (a transformação de ar): capa de céu claro e névoa, com fios de vento por cima. Mesmo molde de rooWater.ts:
// o estágio vai de 1 (capa clara) a 4 (redemoinhos em volta e um anel de vento aos pés); a fase do tremor (0 a 7)
// faz os fios girarem e as penas subirem. Sem Phaser: só canvas 2D.
import { recolorCloak, type CloakPalette } from './rooRecolor';
import type { FireDir } from './rooFire';

export interface AirOpts {
  dir: FireDir;
  frame: number; // 0 a 3 (caminhada)
  tick?: number; // fase do tremor (0 a 7)
  stage?: number; // 0 = original; 1 = capa clara; 2 = penas; 3 = fios de vento; 4 = redemoinhos e anel (padrão)
}

const PALETTE: CloakPalette = {
  gradient: [0xf2f7fb, 0xd7e6f2, 0xb9d2e6, 0x9bbbd6, 0x7a9fc0], // do branco do céu ao azul de névoa
  detailLight: 0xffffff,
  detailWarm: 0xe4eff8,
};

type Ctx = CanvasRenderingContext2D;
const px = (c: Ctx, x: number, y: number, color: string): void => { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), 1, 1); };

// Fio de vento: um arco de pixels em espiral curta, branco com a ponta azulada, girando com a fase.
function wisp(c: Ctx, cx: number, cy: number, r: number, start: number): void {
  for (let k = 0; k < 7; k++) {
    const a = start + k * 0.34;
    const rr = r - k * 0.18;
    px(c, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.7, k < 5 ? '#ffffff' : '#bcd8ee');
  }
}

export function makeAirRoo(
  src: CanvasImageSource & { width: number; height: number },
  o: AirOpts,
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
  // penas que sobem dos lados (estágio 2 em diante)
  if (stage >= 2) {
    for (let i = 0; i < 3; i++) {
      const x = [6, cx + 2, w - 7][i] + ((tick + i) % 2);
      const y = h - 8 - ((tick * 3 + i * 9) % (h - 18));
      px(ctx, x, y, '#ffffff'); px(ctx, x + 1, y + 1, '#d7e6f2'); px(ctx, x + 2, y + 2, '#bcd8ee');
    }
  }
  // fios de vento que giram em volta do corpo (estágio 3 em diante)
  if (stage >= 3) {
    const n = stage === 3 ? 2 : 3;
    for (let i = 0; i < n; i++) {
      const a = (tick / 8 + i / n) * Math.PI * 2;
      wisp(ctx, cx + Math.cos(a) * 15, h * 0.56 + Math.sin(a) * 10, 4 + (i % 2), a * 2);
    }
  }
  // estágio 4: anel de vento aos pés e brilhos
  if (stage >= 4) {
    const ring = 12 + (tick % 4);
    for (let a = 0; a < Math.PI * 2; a += 0.34) {
      if (Math.floor(a / 0.34 + tick) % 3 === 0) continue; // o anel é de arcos soltos, que correm
      px(ctx, cx + Math.cos(a) * ring, h - 4 + Math.sin(a) * 2.4, 'rgba(235,245,255,0.9)');
    }
    for (let i = 0; i < 4; i++) {
      if ((tick + i * 2) % 4 !== 0) continue;
      px(ctx, 4 + ((i * 11 + tick * 5) % (w - 8)), 6 + ((i * 17 + tick * 3) % (h - 16)), '#ffffff');
    }
  }
  return out;
}
