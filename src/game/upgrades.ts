// Power-ups por poção (puro, testável): alcance e número de frascos valem só para a poção
// que estava escolhida ao coletar. A velocidade de caminhada continua da jogadora (global).
import { BOMB_ORDER, CONFIG, type BombId } from '../config';

export interface PotionUpgrade {
  bombsMax: number; // frascos ativos desta poção ao mesmo tempo
  fireLevel: number; // raio extra desta poção
}

export type Upgrades = Record<BombId, PotionUpgrade>;

export function createUpgrades(): Upgrades {
  const u = {} as Upgrades;
  for (const id of BOMB_ORDER) u[id] = { bombsMax: CONFIG.maxBombs, fireLevel: 0 };
  return u;
}

export function cloneUpgrades(u: Upgrades): Upgrades {
  const c = {} as Upgrades;
  for (const id of BOMB_ORDER) c[id] = { ...u[id] };
  return c;
}

export function addBombSlot(u: Upgrades, id: BombId): void {
  u[id].bombsMax = Math.min(CONFIG.maxBombs + CONFIG.maxBombUp, u[id].bombsMax + 1);
}

export function addFireLevel(u: Upgrades, id: BombId): void {
  u[id].fireLevel = Math.min(CONFIG.maxFireUp, u[id].fireLevel + 1);
}

// Pode colocar outro frasco desta poção? `active` é a lista de tipos dos frascos em jogo.
export function canPlace(u: Upgrades, id: BombId, active: readonly BombId[]): boolean {
  return active.filter(t => t === id).length < u[id].bombsMax;
}

export function blastRadius(u: Upgrades, id: BombId, baseRadius: number): number {
  return baseRadius + u[id].fireLevel;
}
