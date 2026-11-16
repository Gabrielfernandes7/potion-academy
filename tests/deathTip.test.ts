import { describe, expect, it } from 'vitest';
import { deathTip } from '../src/game/deathTip';

describe('dica da derrota', () => {
  it('cada causa tem texto e dica', () => {
    for (const c of ['fire', 'water', 'earth', 'air', 'contact', 'overtime', null] as const) {
      const d = deathTip(c);
      expect(d.by.length).toBeGreaterThan(3);
      expect(d.tip.length).toBeGreaterThan(10);
    }
  });
  it('o fogo lembra que é a fraqueza da Roo', () => {
    expect(deathTip('fire').tip).toMatch(/fraqueza/);
  });
});
