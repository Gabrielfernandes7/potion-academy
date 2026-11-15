import { describe, expect, it } from 'vitest';
import { STAGES } from '../../src/game/stages/index';

describe('sorteio do baú por fase', () => {
  it('cada fase tem chances que somam 100%', () => {
    for (const [i, stage] of STAGES.entries()) {
      const total = stage.chest.reduce((sum, odd) => sum + odd.chance, 0);
      expect(Math.abs(total - 1), `fase ${i + 1}`).toBeLessThan(1e-9);
    }
  });
  it('as chances de cada baú somam 1 e nenhuma é zero', () => {
    for (const stage of STAGES) {
      for (const odd of stage.chest) expect(odd.chance).toBeGreaterThan(0);
      expect(stage.chest.reduce((n, o) => n + o.chance, 0)).toBeCloseTo(1, 6);
    }
  });
});
