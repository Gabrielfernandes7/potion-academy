import { describe, expect, it } from 'vitest';
import type { ElementId } from '../src/config';
import { chainOutcome } from '../src/game/chain';

const ELEMENTS: ElementId[] = ['fire', 'water', 'earth', 'air'];

describe('reação entre poções', () => {
  it('o fogo acende as poções de fogo, água e éter que alcança', () => {
    expect(chainOutcome('fire', 'fire')).toBe('trigger');
    expect(chainOutcome('fire', 'water')).toBe('trigger');
    expect(chainOutcome('fire', 'air')).toBe('trigger');
  });

  it('a água apaga a poção de fogo (neutraliza, não acende)', () => {
    expect(chainOutcome('water', 'fire')).toBe('neutralize');
  });

  it('a terra é imune: nenhuma explosão a acende nem a apaga', () => {
    for (const source of ELEMENTS) expect(chainOutcome(source, 'earth')).toBe('ignore');
  });

  it('só o fogo acende outras poções; água, terra e éter não', () => {
    for (const source of ['water', 'earth', 'air'] as ElementId[]) {
      for (const target of ELEMENTS) {
        expect(chainOutcome(source, target), `${source} -> ${target}`).not.toBe('trigger');
      }
    }
  });

  it('a água só neutraliza o fogo; nas outras poções não faz nada', () => {
    for (const target of ['water', 'earth', 'air'] as ElementId[]) {
      expect(chainOutcome('water', target)).toBe('ignore');
    }
  });
});
