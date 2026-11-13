import { describe, expect, it } from 'vitest';
import { buttonLabel, cardView, formatFuse } from '../src/game/shopRules';

describe('cardView', () => {
  it('a poção de fogo é sempre inicial', () => {
    expect(cardView('normal', true, 0).state).toBe('initial');
  });
  it('compra liberada quando o saldo cobre o custo', () => {
    expect(cardView('mega', false, 60).state).toBe('affordable');
    expect(cardView('mega', false, 500).state).toBe('affordable');
  });
  it('bloqueada mostra quanto falta', () => {
    const v = cardView('pierce', false, 50);
    expect(v.state).toBe('locked');
    expect(v.missing).toBe(40);
  });
  it('já comprada fica como adquirida, mesmo sem saldo', () => {
    expect(cardView('remote', true, 0).state).toBe('owned');
  });
});

describe('buttonLabel / formatFuse', () => {
  it('textos do botão por estado', () => {
    expect(buttonLabel('mega', cardView('mega', false, 100))).toBe('Comprar · 60 OURO');
    expect(buttonLabel('pierce', cardView('pierce', false, 50))).toBe('Faltam 40 OURO');
    expect(buttonLabel('remote', cardView('remote', true, 0))).toBe('Adquirida');
    expect(buttonLabel('normal', cardView('normal', true, 0))).toBe('Inicial');
  });
  it('fusível com vírgula decimal e modo manual', () => {
    expect(formatFuse(2200)).toBe('2,2 s');
    expect(formatFuse(2000)).toBe('2 s');
    expect(formatFuse(Infinity)).toBe('Manual (tecla D)');
  });
});
