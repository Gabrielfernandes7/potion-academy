// Recolor da capa da Roo, comum às formas de terra e de ar (a de fogo e a de água têm o seu próprio): troca o
// roxo da capa por um degradê de degraus de pixel (do topo, claro, à barra, escuro) e o dourado por detalhes
// claros. Sem Phaser: só dados de imagem 2D.
export interface CloakPalette {
  gradient: readonly number[]; // do topo (claro) à barra (escuro)
  detailLight: number; // dourado brilhante
  detailWarm: number; // dourado de sombra
}

const isPurple = (r: number, g: number, b: number): boolean => b > g + 8 && b >= r * 0.8;
const isGold = (r: number, g: number, b: number): boolean => r > 190 && b < 120 && g / r > 0.7;

function shade(pal: CloakPalette, x: number, y: number, r: number, top: number, span: number): number {
  const last = pal.gradient.length - 1;
  const t = Math.min(1, Math.max(0, (y - top) / span)) * last;
  let idx = Math.floor(t);
  if (t - idx > 0.5 && (x + y) % 2 === 0 && idx < last) idx++; // xadrez na fronteira: sem degradê suave
  if (r < 75) idx = Math.min(last, idx + 1);
  else if (r > 110) idx = Math.max(0, idx - 1);
  return pal.gradient[idx];
}

export function recolorCloak(d: Uint8ClampedArray, w: number, h: number, pal: CloakPalette): void {
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
      if (isPurple(r, g, b)) c = shade(pal, x, y, r, top, span);
      else if (isGold(r, g, b)) c = r > 230 ? pal.detailLight : pal.detailWarm;
      if (c >= 0) { d[i] = (c >> 16) & 255; d[i + 1] = (c >> 8) & 255; d[i + 2] = c & 255; }
    }
  }
}
