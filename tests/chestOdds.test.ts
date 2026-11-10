import { describe, expect, it } from 'vitest';
import { STAGES } from '../src/config';

describe('sorteio do baú por fase', () => {
  it('cada fase tem chances que somam 100%', () => {
    for (const [i, stage] of STAGES.entries()) {
      const total = stage.chest.reduce((sum, odd) => sum + odd.chance, 0);
      expect(Math.abs(total - 1), `fase ${i + 1}`).toBeLessThan(1e-9);
    }
  });
  it('recompensas maiores são sempre mais raras', () => {
    for (const stage of STAGES) {
      const sorted = [...stage.chest].sort((a, b) => a.coins - b.coins);
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].chance).toBeLessThanOrEqual(sorted[i - 1].chance);
      }
    }
  });
});
