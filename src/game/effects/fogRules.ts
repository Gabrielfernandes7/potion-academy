// Regras puras da névoa (sem Phaser, testáveis). O desenho está em Fog.ts.
// A névoa cobre a fase e deixa um círculo claro em volta da Roo; o raio é em casas e "respira" um pouco.

export const FOG_MIN_RADIUS = 1.5;
export const FOG_MAX_RADIUS = 8;
export const FOG_DARKNESS = 0.96;// opacidade da névoa fora do círculo (0 = nada, 1 = preto)
const BREATH = 0.05;             // quanto o raio varia (5%)
const BREATH_MS = 1800;          // duração de uma respiração

// Raio em casas, preso aos limites (para não ficar cego nem sem névoa).
export function clampFogRadius(radiusTiles: number): number {
  return Math.min(FOG_MAX_RADIUS, Math.max(FOG_MIN_RADIUS, radiusTiles));
}

// Raio em pixels num instante: o raio base com uma respiração lenta (sem ela, o raio é fixo).
export function fogRadiusPx(radiusTiles: number, tile: number, timeMs: number, breathe = true): number {
  const base = clampFogRadius(radiusTiles) * tile;
  if (!breathe) return base;
  return base * (1 + BREATH * Math.sin((timeMs / BREATH_MS) * Math.PI * 2));
}

// A casa (tx, ty) está dentro da visão da Roo (em casas)? Distância em linha reta, do centro das casas.
export function inVision(tx: number, ty: number, playerX: number, playerY: number, radiusTiles: number): boolean {
  const dx = tx - playerX;
  const dy = ty - playerY;
  return dx * dx + dy * dy <= clampFogRadius(radiusTiles) ** 2;
}
