// Regras puras da Quimera de Mercúrio (sem Phaser): dano por elemento, escolha de habilidades e áreas.
// O comportamento visual está em ChimeraController.ts. Ver docs/03-mundo.md e docs/06-decisoes.md.
import { ElementId } from '../../../../config';
import { damageTo } from '../../damage';
import { PROFILES } from '../../profiles';
import type { BossPhase, Tile } from '../common';

export const CHIMERA_NAME = 'QUIMERA';
export const CHIMERA_HP = PROFILES.chimera.maxHp;

// Mercúrio: a água escorre (imune); a terra a prende (fraqueza); fogo e éter machucam normal.
// A tabela está em game/entities/damage.ts, a partir do perfil em profiles.ts.
export const CHIMERA_DAMAGE: Record<ElementId, number> = {
  fire: damageTo(PROFILES.chimera, 'fire'),
  air: damageTo(PROFILES.chimera, 'air'),
  earth: damageTo(PROFILES.chimera, 'earth'),
  water: damageTo(PROFILES.chimera, 'water'),
};

export type ChimeraSkill = 'spit' | 'drops' | 'slide' | 'wave';

export function chimeraCooldown(phase: BossPhase): number {
  return phase === 1 ? 3500 : 2500;
}

// Sorteia a próxima habilidade: nunca repete a anterior. A Onda só existe na fase 2.
export function pickChimeraSkill(
  phase: BossPhase, last: ChimeraSkill | null, rng: () => number = Math.random,
): ChimeraSkill {
  const weights: Array<[ChimeraSkill, number]> = phase === 1
    ? [['spit', 0.4], ['drops', 0.35], ['slide', 0.25]]
    : [['spit', 0.25], ['drops', 0.25], ['slide', 0.2], ['wave', 0.3]];
  const pool = weights.filter(([s]) => s !== last);
  const total = pool.reduce((sum, [, w]) => sum + w, 0);
  let roll = rng() * total;
  for (const [skill, w] of pool) {
    roll -= w;
    if (roll < 0) return skill;
  }
  return pool[pool.length - 1][0];
}

// Cuspe: o jato de prata sai da Quimera e passa pela casa da jogadora, em linha reta (até em
// diagonal), e segue até bater numa parede ou num caixote. Sem a casa de quem cospe.
export function spitTiles(
  from: Tile, to: Tile, isOpen: (x: number, y: number) => boolean, maxLen = 40,
): Tile[] {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  if (steps === 0) return [];
  const tiles: Tile[] = [];
  for (let r = 1; r <= maxLen; r++) {
    const x = Math.round(from.x + (dx / steps) * r);
    const y = Math.round(from.y + (dy / steps) * r);
    if (!isOpen(x, y)) break;
    if (!tiles.some(t => t.x === x && t.y === y)) tiles.push({ x, y });
  }
  return tiles;
}

// Escorrer: onde ela ressurge, perto da jogadora (de `minDist` a `maxDist` passos), nunca na casa dela.
export function slideDestination(
  player: Tile, isOpen: (x: number, y: number) => boolean,
  rng: () => number = Math.random, minDist = 2, maxDist = 4,
): Tile | null {
  const pool: Tile[] = [];
  for (let dy = -maxDist; dy <= maxDist; dy++) {
    for (let dx = -maxDist; dx <= maxDist; dx++) {
      const d = Math.abs(dx) + Math.abs(dy);
      if (d < minDist || d > maxDist) continue;
      if (isOpen(player.x + dx, player.y + dy)) pool.push({ x: player.x + dx, y: player.y + dy });
    }
  }
  if (pool.length === 0) return null;
  return pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))];
}

// Onda: faixas de `width` colunas, varrendo o campo da esquerda para a direita (ou ao contrário).
// A linha `gapY` fica seca em todas as faixas: é o caminho seguro. Só entram casas livres.
export function waveBands(
  cols: number, rows: number, fromLeft: boolean, gapY: number,
  isOpen: (x: number, y: number) => boolean, width = 2,
): Tile[][] {
  const xs: number[] = [];
  for (let x = 1; x < cols - 1; x++) xs.push(x);
  if (!fromLeft) xs.reverse();
  const bands: Tile[][] = [];
  for (let i = 0; i < xs.length; i += width) {
    const band: Tile[] = [];
    for (const x of xs.slice(i, i + width)) {
      for (let y = 1; y < rows - 1; y++) if (y !== gapY && isOpen(x, y)) band.push({ x, y });
    }
    bands.push(band);
  }
  return bands;
}

// Passos mínimos (andando pelas casas livres) da casa `from` até cada casa alcançável em até `maxSteps`.
export function stepsFrom(
  from: Tile, isOpen: (x: number, y: number) => boolean, maxSteps: number,
): Map<string, number> {
  const dist = new Map<string, number>([[`${from.x},${from.y}`, 0]]);
  let frontier: Tile[] = [from];
  for (let step = 1; step <= maxSteps; step++) {
    const next: Tile[] = [];
    for (const t of frontier) {
      for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]] as const) {
        const x = t.x + dx;
        const y = t.y + dy;
        const key = `${x},${y}`;
        if (dist.has(key) || !isOpen(x, y)) continue;
        dist.set(key, step);
        next.push({ x, y });
      }
    }
    frontier = next;
  }
  return dist;
}

// A linha seca da Onda: uma linha (que não é a da jogadora) com casa livre que ela alcança em até
// `maxSteps` passos; vence a mais próxima (empate sorteado). Assim a fuga é sempre possível e a Roo
// precisa se mexer. Se nenhuma linha serve (ela está cercada de caixotes), a linha dela fica seca.
export function waveGapRow(
  player: Tile, rows: number, isOpen: (x: number, y: number) => boolean,
  rng: () => number = Math.random, maxSteps = 4,
): number {
  const reach = stepsFrom(player, isOpen, maxSteps);
  const best = new Map<number, number>(); // linha -> menor distância até uma casa livre dela
  for (const [key, d] of reach) {
    const y = Number(key.split(',')[1]);
    if (y === player.y || y < 1 || y > rows - 2) continue;
    if (!best.has(y) || d < best.get(y)!) best.set(y, d);
  }
  if (best.size === 0) return player.y;
  const min = Math.min(...best.values());
  const rowsAtMin = [...best.entries()].filter(([, d]) => d === min).map(([y]) => y).sort((a, b) => a - b);
  return rowsAtMin[Math.min(rowsAtMin.length - 1, Math.floor(rng() * rowsAtMin.length))];
}
