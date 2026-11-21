import { describe, expect, it } from 'vitest';
import { doorOpensByGem } from '../src/game/pickupRules';
import { CONFIG } from '../src/config';

describe('porta e gemas', () => {
  it('na fase de braseiros, pegar as gemas não abre a porta', () => {
    expect(doorOpensByGem({ type: 'braziers', count: 3 }, CONFIG.gemsForDoor, false, false)).toBe(false);
  });
  it('na fase de gemas, a porta abre com as gemas necessárias', () => {
    expect(doorOpensByGem({ type: 'gems' }, CONFIG.gemsForDoor, false, false)).toBe(true);
    expect(doorOpensByGem({ type: 'gems' }, CONFIG.gemsForDoor - 1, false, false)).toBe(false);
  });
  it('no chefe, a porta não abre por gemas; e não reabre se já está aberta', () => {
    expect(doorOpensByGem({ type: 'gems' }, CONFIG.gemsForDoor, true, false)).toBe(false);
    expect(doorOpensByGem({ type: 'gems' }, CONFIG.gemsForDoor, false, true)).toBe(false);
  });
});
