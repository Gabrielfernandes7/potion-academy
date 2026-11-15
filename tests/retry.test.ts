import { describe, expect, it } from 'vitest';
import { retryData } from '../src/game/retry';

describe('recomeço ao perder', () => {
  it('a campanha volta à fase em que a Roo perdeu, não à fase 1 nem ao começo do capítulo', () => {
    expect(retryData(1, null, 0)).toEqual({ stage: 1 });
    expect(retryData(3, null, 0)).toEqual({ stage: 3 });
    expect(retryData(7, null, 0)).toEqual({ stage: 7 });
  });

  it('na Arena, recomeça a luta contra o mesmo chefe', () => {
    expect(retryData(0, 'belladonna', 0)).toEqual({ stage: 0, arena: 'belladonna' });
  });
});
