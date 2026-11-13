// Regras puras da Mandrágora (sem Phaser): dano por elemento, escolha de habilidades e áreas. As falas estão em lines.ts.
// O comportamento visual está em MandrakeController.ts. Ver docs/03-mundo.md e docs/06-decisoes.md.
import { ElementId } from '../../../../config';
import { damageTo } from '../../damage';
import type { BossPhase, Tile } from '../common';
import { PROFILES } from '../../profiles';

export const MANDRAKE_NAME = 'MANDRÁGORA';
export const MANDRAKE_HP = PROFILES.mandrake.maxHp;

// Terra e água são o poder dela: resiste às duas (planta que se afoga ou se enterra demais também
// sofre, então não são imunidades nem curas). O fogo é a fraqueza. A tabela está em game/entities/damage.ts.
export const MANDRAKE_DAMAGE: Record<ElementId, number> = {
  fire: damageTo(PROFILES.mandrake, 'fire'),
  air: damageTo(PROFILES.mandrake, 'air'),
  earth: damageTo(PROFILES.mandrake, 'earth'),
  water: damageTo(PROFILES.mandrake, 'water'),
};

export type MandrakeSkill = 'roots' | 'tide' | 'burrow' | 'shriek' | 'sprouts';

export function mandrakeCooldown(phase: BossPhase): number {
  return phase === 1 ? 3600 : 2600;
}

// Sorteia a próxima habilidade: nunca repete a anterior. Grito e Brotos só na fase 2; Brotos
// só se ainda couber outra flor (`canSprout`).
export function pickMandrakeSkill(
  phase: BossPhase, last: MandrakeSkill | null, canSprout: boolean, rng: () => number = Math.random,
): MandrakeSkill {
  const weights: Array<[MandrakeSkill, number]> = phase === 1
    ? [['roots', 0.4], ['tide', 0.3], ['burrow', 0.3]]
    : [['roots', 0.2], ['tide', 0.2], ['burrow', 0.2], ['shriek', 0.25], ['sprouts', 0.15]];
  const pool = weights.filter(([s]) => s !== last && (s !== 'sprouts' || canSprout));
  const total = pool.reduce((sum, [, w]) => sum + w, 0);
  let roll = rng() * total;
  for (const [skill, w] of pool) {
    roll -= w;
    if (roll < 0) return skill;
  }
  return pool[pool.length - 1][0];
}

// Raízes: a linha (ou coluna) de casas livres que passa pela jogadora, até bater numa parede.
export function lineTiles(cx: number, cy: number, horizontal: boolean, isOpen: (x: number, y: number) => boolean): Tile[] {
  const tiles: Tile[] = [{ x: cx, y: cy }];
  for (const s of [-1, 1]) {
    for (let r = 1; r < 40; r++) {
      const x = horizontal ? cx + s * r : cx;
      const y = horizontal ? cy : cy + s * r;
      if (!isOpen(x, y)) break;
      tiles.push({ x, y });
    }
  }
  return tiles;
}

// Maré: o anel de casas a `d` passos (distância de Manhattan) da Mandrágora. `gapAxis` deixa uma
// faixa sem água (a vertical ou a horizontal que passa por ela): é o caminho seguro.
export function ringTiles(
  center: Tile, d: number, isOpen: (x: number, y: number) => boolean, gapAxis: 'vertical' | 'horizontal',
): Tile[] {
  const tiles: Tile[] = [];
  for (let dx = -d; dx <= d; dx++) {
    const dy = d - Math.abs(dx);
    for (const sy of dy === 0 ? [0] : [-1, 1]) {
      const x = center.x + dx;
      const y = center.y + dy * sy;
      const onGap = gapAxis === 'vertical' ? dx === 0 : y === center.y;
      if (!onGap && isOpen(x, y)) tiles.push({ x, y });
    }
  }
  return tiles;
}

// Grito: quase o mapa todo é perigoso. `safeCount` casas seguras ficam à vista, ao alcance da
// jogadora (até `reach` passos), mas nunca a casa em que ela está agora: precisa se mexer.
export function shriekPlan(
  open: Tile[], player: Tile, safeCount: number, rng: () => number = Math.random, reach = 3,
): { danger: Tile[]; safe: Tile[] } {
  const dist = (t: Tile): number => Math.abs(t.x - player.x) + Math.abs(t.y - player.y);
  let pool = open.filter(t => dist(t) >= 1 && dist(t) <= reach);
  if (pool.length === 0) pool = open.filter(t => dist(t) >= 1).sort((a, b) => dist(a) - dist(b)).slice(0, safeCount);
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const safe = shuffled.slice(0, safeCount);
  const isSafe = (t: Tile): boolean => safe.some(s => s.x === t.x && s.y === t.y);
  return { danger: open.filter(t => !isSafe(t)), safe };
}
