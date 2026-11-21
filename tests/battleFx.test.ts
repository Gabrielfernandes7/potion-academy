import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/game/fx/particlePool', () => ({ fxPool: () => ({ burst: vi.fn() }) }));
import { BLOCK_DEBRIS, HIT_FLASH_MS, POOF_MS, POOF_TINT } from '../src/game/fx/battleFx';
import { BLOCK_TEXTURE } from '../src/game/stages/blockStyles';
import { ELEMENTS } from '../src/config';

describe('efeitos do campo de batalha', () => {
  it('todo bloco tem cores de lascas', () => {
    for (const style of Object.keys(BLOCK_TEXTURE)) expect(BLOCK_DEBRIS[style as keyof typeof BLOCK_DEBRIS]?.length).toBeGreaterThan(0);
  });

  it('todo elemento tem a fumaça do sumiço', () => {
    for (const el of Object.keys(ELEMENTS)) expect(POOF_TINT[el as keyof typeof POOF_TINT]?.length).toBeGreaterThan(0);
  });

  it('o clarão e o sumiço são curtos (não atrasam o jogo)', () => {
    expect(HIT_FLASH_MS).toBeLessThanOrEqual(100);
    expect(POOF_MS).toBeLessThanOrEqual(300);
  });
});
