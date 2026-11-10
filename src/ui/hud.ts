// HUD em DOM (fica acima do canvas).
import { BOMB_TYPES, ELEMENTS, BombId, CONFIG } from '../config';
import { byId } from './dom';

export interface HudState {
  hp: number;
  coins: number;
  gems: number;
  blocks: number;
  bombsActive: number;
  bombsMax: number;
}

export function renderHud(s: HudState): void {
  byId('hp-fill').style.width = (s.hp / CONFIG.maxHp * 100) + '%';
  byId('coins').textContent = String(s.coins);
  byId('gems').textContent = `${s.gems}/${CONFIG.gemsForDoor}`;
  byId('blocks').textContent = String(s.blocks);
  byId('bombs').textContent = `${s.bombsActive}/${s.bombsMax}`;
}

export function renderElement(bombType: BombId): void {
  const element = ELEMENTS[BOMB_TYPES[bombType].element];
  const label = byId('element-label');
  label.textContent = `${element.symbol} ${element.name}`;
  label.style.color = '#' + element.color.toString(16).padStart(6, '0');
}

export function renderTimer(timeLeftMs: number, sec: number): void {
  byId('timer').textContent = String(sec);
  const stat = byId('timer-stat');
  stat.classList.toggle('overtime', timeLeftMs <= 0);
  stat.classList.toggle('warning', timeLeftMs > 0 && sec <= 20);
}
