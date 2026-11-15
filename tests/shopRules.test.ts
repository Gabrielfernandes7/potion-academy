import { describe, expect, it } from 'vitest';
import { buttonLabel, cardView, formatFuse } from '../src/game/shopRules';

describe('cardView', () => {
  it('a poção de fogo é a inicial e já é da Roo', () => {
    expect(cardView('normal', false).state).toBe('initial');
    expect(cardView('normal', true).state).toBe('initial');
  });

  it('as outras poções não se compram: ou são aprendidas (owned) ou estão na jornada', () => {
    expect(cardView('mega', false).state).toBe('journey');
    expect(cardView('pierce', false).state).toBe('journey');
    expect(cardView('remote', true).state).toBe('owned');
  });
});

describe('buttonLabel / formatFuse', () => {
  it('textos do botão por estado, sem preço', () => {
    expect(buttonLabel('normal', cardView('normal', true))).toBe('Inicial');
    expect(buttonLabel('remote', cardView('remote', true))).toBe('Aprendida');
    expect(buttonLabel('mega', cardView('mega', false))).toBe('Na jornada');
  });

  it('o pavio aparece em segundos com vírgula, ou como manual', () => {
    expect(formatFuse(2400)).toBe('2,4 s');
    expect(formatFuse(Infinity)).toBe('Manual (tecla D)');
  });
});
