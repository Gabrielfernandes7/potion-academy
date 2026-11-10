import { describe, expect, it } from 'vitest';
import { ROO_HEAD_ROOM, ROO_STIR_HAND, rooOriginY, rooTextureHeight } from '../src/textures/rooGeometry';

describe('geometria da Roo', () => {
  it('a textura ganha a folga de cabeça acima do tile', () => {
    expect(rooTextureHeight(40)).toBe(40 + ROO_HEAD_ROOM);
  });

  it('a origem do sprite mantém o centro do tile no mesmo ponto de antes', () => {
    const tile = 40;
    const originPx = rooOriginY(tile) * rooTextureHeight(tile);
    // o centro do tile fica ROO_HEAD_ROOM px mais abaixo dentro da textura
    expect(originPx).toBeCloseTo(tile / 2 + ROO_HEAD_ROOM, 10);
  });

  it('a mão da pose "mexer" fica à frente e um pouco abaixo da origem', () => {
    expect(ROO_STIR_HAND.x).toBeGreaterThan(0);
    expect(ROO_STIR_HAND.y).toBeGreaterThan(0);
  });
});
