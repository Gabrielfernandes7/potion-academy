import { describe, expect, it } from 'vitest';
import { timerView } from '../src/game/hudState';

// a chave da HUD usa a visão do cronômetro: milissegundos diferentes com o mesmo número na tela não redesenham
describe('chave da HUD e cronômetro', () => {
  it('dois instantes no mesmo segundo têm a mesma visão', () => {
    expect(timerView(12_100)).toEqual(timerView(12_900));
  });
  it('a virada de segundo muda a visão', () => {
    expect(timerView(12_001)).not.toEqual(timerView(12_000));
  });
  it('estouro de tempo (zero e negativo) continua distinguível do aviso', () => {
    expect(timerView(0).overtime).toBe(true);
    expect(timerView(5_000).overtime).toBe(false);
  });
});
