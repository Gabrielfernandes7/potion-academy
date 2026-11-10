// Paleta do jardim (fase 4), em um arquivo puro (sem Phaser) para ser testada.
// Regra: chão claro e pouco saturado, sebe escura, flor do mal em cor quente.
// Tests em tests/gardenContrast.test.ts garantem contraste mínimo entre eles.

export const GARDEN_PALETTE = {
  // chão: verde-musgo pálido, quase um caminho de grama seca
  floorBase: 0x9db07a,
  floorBladeDark: 0x6f8553,
  floorBladeLight: 0xc1d19a,
  floorBaseAlt: 0x92a872,
  // sebe: muito escura, para parecer obstáculo sólido
  hedgeBase: 0x14261a,
  hedgeMid: 0x24422b,
  hedgeLight: 0x3a6240,
  hedgeEdge: 0x4f7d52,
  // flor do mal: pétalas magenta-quentes, contorno quase preto
  petalA: 0x9c1046,
  petalB: 0x8f1a1a,
  petalOutline: 0x2a0a2e,
  petalCore: 0x4a1747,
  stem: 0x2e5a22,
  stemDark: 0x1b3d14,
} as const;

// Razão de contraste WCAG entre duas cores (1 a 21).
function luminance(color: number): number {
  const channel = (c: number): number => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const r = channel((color >> 16) & 0xff);
  const g = channel((color >> 8) & 0xff);
  const b = channel(color & 0xff);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: number, b: number): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
