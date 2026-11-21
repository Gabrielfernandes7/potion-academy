import { describe, expect, it } from 'vitest';
import { ROO_HEAD_ROOM, rooFootOriginY, rooOriginY, rooTextureHeight } from '../src/textures/rooGeometry';

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

  it('a origem nos pés fica perto da base da textura', () => {
    const tile = 40;
    const feet = rooFootOriginY(tile) * rooTextureHeight(tile);
    expect(feet).toBe(rooTextureHeight(tile) - 3);
  });
});
