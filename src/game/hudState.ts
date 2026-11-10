// Contrato entre a cena de gameplay e a cena da HUD (comunicação por eventos do Phaser).
import type { BombId } from '../config';

export const HUD_UPDATE = 'hud:update';
export const HUD_SELECT_BOMB = 'hud:select-bomb';

export interface HudState {
  hp: number;
  maxHp: number;
  coins: number;
  gems: number;
  gemsForDoor: number;
  blocks: number;
  bombsActive: number;
  bombsMax: number;
  timeLeftMs: number;
  selected: BombId;
}

export interface TimerView {
  seconds: number;
  warning: boolean;
  overtime: boolean;
}

// Regras visuais do cronômetro: aviso nos últimos 20 s, hora extra quando zera.
export function timerView(timeLeftMs: number): TimerView {
  const seconds = Math.max(0, Math.ceil(timeLeftMs / 1000));
  return {
    seconds,
    overtime: timeLeftMs <= 0,
    warning: timeLeftMs > 0 && seconds <= 20,
  };
}
