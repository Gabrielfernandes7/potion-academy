import { describe, expect, it } from 'vitest';
import {
  MAX_CARRY_MS, advanceStep, beginStep, facingFor, lerp, moveDurationMs, tileCenter, walkTimeScale,
} from '../src/game/movement';

describe('velocidade', () => {
  it('sem velocidade, a casa leva o tempo base', () => {
    expect(moveDurationMs(300, 0)).toBe(300);
  });

  it("cada ponto de velocidade encurta a casa em 12%, de forma gradual", () => {
    expect(moveDurationMs(260, 1)).toBeCloseTo(260 / 1.12, 6);
    expect(moveDurationMs(260, 2)).toBeCloseTo(260 / 1.24, 6);
  });
});

describe('passo', () => {
  it('avança em proporção ao tempo e não termina antes do comprimento', () => {
    const tick = advanceStep(beginStep(0, 200), 100);
    expect(tick.t).toBeCloseTo(0.5, 6);
    expect(tick.finished).toBe(false);
  });

  it('ao terminar, o excedente vai para o próximo passo', () => {
    const tick = advanceStep(beginStep(0, 200), 230);
    expect(tick.finished).toBe(true);
    expect(tick.t).toBe(1);
    expect(tick.state.carry).toBe(30);
    expect(beginStep(tick.state.carry, 200).elapsed).toBe(30);
  });

  it('o excedente é limitado a MAX_CARRY_MS (sem salto após pausa longa)', () => {
    const tick = advanceStep(beginStep(0, 200), 900);
    expect(tick.state.carry).toBe(MAX_CARRY_MS);
  });

  it('andar em linha reta mantém a velocidade: o tempo sobra e é usado', () => {
    // 10 quadros de 50 ms (500 ms) com casas de 200 ms: 2 casas completas e 100 ms no meio da terceira
    let state = beginStep(0, 200);
    let finished = 0;
    for (let i = 0; i < 10; i++) {
      const tick = advanceStep(state, 50);
      if (tick.finished) {
        finished++;
        state = beginStep(tick.state.carry, 200);
      } else {
        state = tick.state;
      }
    }
    expect(finished).toBe(2);
    expect(state.elapsed).toBe(100);
  });
});

describe('interpolação e animação', () => {
  it('lerp vai de from a to conforme t', () => {
    expect(lerp(0, 40, 0)).toBe(0);
    expect(lerp(0, 40, 0.5)).toBe(20);
    expect(lerp(0, 40, 1)).toBe(40);
  });

  it('tileCenter aponta para o meio da casa', () => {
    expect(tileCenter(2, 40)).toBe(100);
  });

  it('caminhada: um ciclo de 4 quadros a cada 2 casas (a 300 ms por casa, 12 quadros/s)', () => {
    expect(walkTimeScale(300)).toBeCloseTo(4 / (2 * 0.3) / 12, 6);
  });
});

describe('direção', () => {
  it('cada eixo define a face', () => {
    expect(facingFor(-1, 0, 'down')).toBe('left');
    expect(facingFor(1, 0, 'down')).toBe('right');
    expect(facingFor(0, -1, 'down')).toBe('up');
    expect(facingFor(0, 1, 'up')).toBe('down');
  });

  it('parado mantém a face anterior', () => {
    expect(facingFor(0, 0, 'left')).toBe('left');
  });
});
