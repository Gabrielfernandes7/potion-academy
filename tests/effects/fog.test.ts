import { describe, expect, it } from 'vitest';
import {
  FOG_MAX_RADIUS, FOG_MIN_RADIUS, clampFogRadius, fogRadiusPx, inVision,
} from '../../src/game/effects/fogRules';

describe('névoa: raio', () => {
  it('o raio fica entre o mínimo e o máximo', () => {
    expect(clampFogRadius(0)).toBe(FOG_MIN_RADIUS);
    expect(clampFogRadius(99)).toBe(FOG_MAX_RADIUS);
    expect(clampFogRadius(3)).toBe(3);
  });
  it('sem respirar o raio é fixo; respirando varia pouco em torno da base', () => {
    expect(fogRadiusPx(3, 40, 123, false)).toBe(120);
    for (let t = 0; t < 4000; t += 100) {
      const r = fogRadiusPx(3, 40, t, true);
      expect(r).toBeGreaterThanOrEqual(120 * 0.94);
      expect(r).toBeLessThanOrEqual(120 * 1.06);
    }
  });
});

describe('névoa: visão', () => {
  it('vê o que está dentro do círculo, em linha reta', () => {
    expect(inVision(5, 5, 5, 5, 3)).toBe(true);
    expect(inVision(8, 5, 5, 5, 3)).toBe(true);
    expect(inVision(9, 5, 5, 5, 3)).toBe(false);
    expect(inVision(7, 7, 5, 5, 3)).toBe(true);  // diagonal: 2,83 casas
    expect(inVision(8, 8, 5, 5, 3)).toBe(false); // diagonal: 4,24 casas
  });
});
