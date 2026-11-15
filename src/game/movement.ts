// Movimento da Roo (puro, sem Phaser). A MainScene anda casa a casa: o tempo que sobra ao chegar
// numa casa (`carry`) vai para o passo seguinte, então andar em linha reta tem velocidade constante.
import type { Facing } from './types';

// Quanto tempo extra pode ser guardado de um passo para o outro (evita um salto após uma pausa longa).
export const MAX_CARRY_MS = 34;

// Velocidade gradual: cada ponto de velocidade encurta a casa em 12% (antes, 55%, e o primeiro
// power-up já parecia outra personagem).
export const SPEED_STEP = 0.12;

export function moveDurationMs(baseMs: number, speedUp: number): number {
  return baseMs / (1 + speedUp * SPEED_STEP);
}

export interface StepState {
  elapsed: number; // ms já andados neste passo (inclui o que sobrou do anterior)
  length: number; // duração total do passo
  carry: number; // ms que sobraram ao terminar (vão para o próximo passo)
}

export function beginStep(carry: number, length: number): StepState {
  return { elapsed: carry, length, carry: 0 };
}

export interface StepTick {
  t: number; // progresso de 0 a 1
  finished: boolean;
  state: StepState;
}

// Avança o passo por `delta` ms. Ao terminar, guarda o excedente (limitado) em `carry`.
export function advanceStep(state: StepState, delta: number): StepTick {
  const elapsed = state.elapsed + delta;
  const t = Math.min(1, elapsed / state.length);
  if (t < 1) return { t, finished: false, state: { ...state, elapsed } };
  const carry = Math.min(elapsed - state.length, MAX_CARRY_MS);
  return { t, finished: true, state: { elapsed, length: state.length, carry } };
}

export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

// Velocidade da animação de caminhada: um ciclo de 4 quadros a cada 2 casas (passo esquerdo e direito).
export function walkTimeScale(stepLengthMs: number): number {
  return 4 / (2 * (stepLengthMs / 1000)) / 12;
}

// Direção olhada depois de tentar andar. Parado (0,0) mantém a direção anterior.
export function facingFor(dx: number, dy: number, previous: Facing): Facing {
  if (dx < 0) return 'left';
  if (dx > 0) return 'right';
  if (dy < 0) return 'up';
  if (dy > 0) return 'down';
  return previous;
}

// Centro, em pixels, de uma casa da grade.
export function tileCenter(gridCoord: number, tile: number): number {
  return gridCoord * tile + tile / 2;
}
