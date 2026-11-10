import { describe, it, expect } from 'vitest';
import { GARDEN_PALETTE as P, contrastRatio } from '../src/textures/gardenPalette';

// Mínimo de 3:1 (WCAG, para elementos gráficos): o que o jogador precisa distinguir de relance.
const MIN = 3;

describe('contraste do jardim', () => {
  it('sebe se destaca do chão', () => {
    expect(contrastRatio(P.hedgeBase, P.floorBase)).toBeGreaterThanOrEqual(MIN);
    expect(contrastRatio(P.hedgeMid, P.floorBase)).toBeGreaterThanOrEqual(MIN);
  });

  it('flor do mal se destaca do chão, nas duas pétalas', () => {
    expect(contrastRatio(P.petalA, P.floorBase)).toBeGreaterThanOrEqual(MIN);
    expect(contrastRatio(P.petalB, P.floorBase)).toBeGreaterThanOrEqual(MIN);
    expect(contrastRatio(P.petalA, P.floorBaseAlt)).toBeGreaterThanOrEqual(MIN);
  });

  it('contorno escuro da flor garante leitura sobre qualquer cor de pétala', () => {
    expect(contrastRatio(P.petalOutline, P.floorBase)).toBeGreaterThanOrEqual(MIN);
  });
});
