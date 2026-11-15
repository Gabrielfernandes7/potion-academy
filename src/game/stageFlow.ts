// Passagem entre fases (puro, sem Phaser): o que a Roo leva para a fase seguinte e o que acontece
// ao chegar na porta. Antes vivia na MainScene; agora um erro aqui é pego pelo teste, não pelo jogo.
import type { BombId } from '../config';
import { createUpgrades, cloneUpgrades, type Upgrades } from './upgrades';
import type { Carry } from './types';

export interface CarriedState {
  hp: number;
  upgrades: Upgrades;
  speedUp: number;
  bombType: BombId;
}

// Estado inicial da fase: padrão de fase 1, ou o que veio da fase anterior.
export function startingState(carry: Carry | undefined, maxHp: number): CarriedState {
  if (!carry) {
    return { hp: maxHp, upgrades: createUpgrades(), speedUp: 0, bombType: 'normal' };
  }
  return {
    hp: carry.hp,
    upgrades: cloneUpgrades(carry.upgrades),
    speedUp: carry.speedUp,
    bombType: carry.bombType,
  };
}

// O que sai da fase que acabou: vida (com a cura da passagem, sem passar do máximo), power-ups,
// o frasco escolhido. Os upgrades são copiados para a fase seguinte não compartilhar objeto.
export function carryForward(
  now: { hp: number; upgrades: Upgrades; speedUp: number; bombType: BombId },
  heal: number,
  maxHp: number,
): Carry {
  return {
    hp: Math.min(maxHp, now.hp + heal),
    upgrades: cloneUpgrades(now.upgrades),
    speedUp: now.speedUp,
    bombType: now.bombType,
  };
}

// Ao chegar na porta: na última fase vence (a história fecha); antes, passa para a seguinte.
export type DoorOutcome = 'passage' | 'finish';

export function doorOutcome(stage: number, lastStage: number): DoorOutcome {
  return stage >= lastStage ? 'finish' : 'passage';
}
