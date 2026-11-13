// Contrato entre a cena de gameplay e a cena da HUD (comunicação por eventos do Phaser).
import type { BombId } from '../config';
import type { FormView } from './forms';

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
  stage: number;
  boss: { hp: number; maxHp: number; name: string } | null;
  form: FormView; // transformação da Roo: forma, tempo, espera e habilidade
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

// Bolinhas de frasco: uma por poção que a Roo pode ter ao mesmo tempo; cheia = já colocada no chão.
export function pipsView(active: number, max: number): boolean[] {
  const n = Math.max(0, Math.floor(max));
  return Array.from({ length: n }, (_, i) => i < active);
}

// Quanto do segmento `i` (de `count`) está cheio, para uma barra dividida em degraus (0 a 1).
export function segmentFill(ratio: number, i: number, count = 4): number {
  return Math.min(1, Math.max(0, ratio * count - i));
}
