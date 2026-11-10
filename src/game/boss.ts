// Regras puras do chefe (sem Phaser): escolha de habilidades, alvos e área das explosões.
// O comportamento visual está em BossController.ts. Ver docs/03-mundo.md.
import { CONFIG, ElementId } from '../config';

export type BossSkill = 'fire' | 'rain' | 'blink';
export type BossPhase = 1 | 2;
export interface Tile { x: number; y: number }

export const BOSS_NAME = 'BELLADONA';

// Textura da poção que ela arremessa, por elemento.
export const ELEMENT_POTION_TEXTURE: Record<ElementId, string> = {
  fire: 'bomb_normal',
  water: 'bomb_mega',
  earth: 'bomb_pierce',
  air: 'bomb_remote',
};

// Elemento de cada habilidade (define a cor do aviso e da explosão).
export const SKILL_ELEMENT: Record<BossSkill, ElementId> = {
  fire: 'fire',
  rain: 'water',
  blink: 'air',
};

// Fase 2 ("furiosa") começa quando a vida chega à metade.
export function phaseFor(hp: number, maxHp: number): BossPhase {
  return hp <= maxHp / 2 ? 2 : 1;
}

export function cooldownFor(phase: BossPhase): number {
  return phase === 1 ? CONFIG.bossCooldownMs : CONFIG.bossFuriousCooldownMs;
}

// Sorteia a próxima habilidade: nunca repete a anterior; a chuva só existe na fase 2.
export function pickBossSkill(phase: BossPhase, last: BossSkill | null, rng: () => number = Math.random): BossSkill {
  const weights: Array<[BossSkill, number]> = phase === 1
    ? [['fire', 0.65], ['blink', 0.35]]
    : [['fire', 0.4], ['rain', 0.35], ['blink', 0.25]];
  const pool = weights.filter(([s]) => s !== last);
  const total = pool.reduce((sum, [, w]) => sum + w, 0);
  let roll = rng() * total;
  for (const [skill, w] of pool) {
    roll -= w;
    if (roll < 0) return skill;
  }
  return pool[pool.length - 1][0];
}

const DIRS4: ReadonlyArray<readonly [number, number]> = [[0, -1], [0, 1], [-1, 0], [1, 0]];

// Casas atingidas por uma explosão em cruz. Obstáculos (muralha/caixote) bloqueiam o resto do braço.
export function blastTiles(cx: number, cy: number, radius: number, isOpen: (x: number, y: number) => boolean): Tile[] {
  const tiles: Tile[] = [{ x: cx, y: cy }];
  for (const [dx, dy] of DIRS4) {
    for (let r = 1; r <= radius; r++) {
      const x = cx + dx * r;
      const y = cy + dy * r;
      if (!isOpen(x, y)) break;
      tiles.push({ x, y });
    }
  }
  return tiles;
}

// Alvos da chuva de gotas: sempre a casa do jogador (para obrigá-lo a se mexer) e outras perto dele.
export function rainTargets(
  player: Tile, count: number, isOpen: (x: number, y: number) => boolean,
  rng: () => number = Math.random, maxDist = 4,
): Tile[] {
  const others: Tile[] = [];
  for (let dy = -maxDist; dy <= maxDist; dy++) {
    for (let dx = -maxDist; dx <= maxDist; dx++) {
      if (dx === 0 && dy === 0) continue;
      if (Math.abs(dx) + Math.abs(dy) > maxDist) continue;
      if (isOpen(player.x + dx, player.y + dy)) others.push({ x: player.x + dx, y: player.y + dy });
    }
  }
  // embaralha com a semente dada (Fisher-Yates)
  for (let i = others.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [others[i], others[j]] = [others[j], others[i]];
  }
  return [player, ...others.slice(0, Math.max(0, count - 1))];
}

// Onde ela reaparece depois do teletransporte: longe do jogador, se possível.
export function blinkDestination(player: Tile, candidates: Tile[], minDist: number, rng: () => number = Math.random): Tile | null {
  if (candidates.length === 0) return null;
  const far = candidates.filter(t => Math.abs(t.x - player.x) + Math.abs(t.y - player.y) >= minDist);
  const pool = far.length > 0 ? far : candidates;
  return pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))];
}
