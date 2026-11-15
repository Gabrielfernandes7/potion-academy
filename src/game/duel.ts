// Duelo de chefes na Arena (puro, testável): dois chefes lutam entre si, sem a Roo, para testar equilíbrio.
// Dura no máximo DUEL_MS. Quem cair primeiro perde; se o tempo acabar com os dois de pé, perde quem tiver
// menos vida (em pontos); vida igual é empate.
import type { BossId } from './stages/types';

export const DUEL_MS = 100000;

export interface Duelist { hp: number; defeated: boolean }

export type DuelOutcome =
  | { winner: 0 | 1; reason: 'ko' | 'time' }
  | { winner: null; reason: 'draw' };

/** O resultado agora, ou null se a luta segue. `timeUp` = o tempo acabou. */
export function duelOutcome(a: Duelist, b: Duelist, timeUp: boolean): DuelOutcome | null {
  if (a.defeated && b.defeated) return { winner: null, reason: 'draw' }; // caíram no mesmo instante
  if (a.defeated) return { winner: 1, reason: 'ko' };
  if (b.defeated) return { winner: 0, reason: 'ko' };
  if (!timeUp) return null;
  if (a.hp === b.hp) return { winner: null, reason: 'draw' };
  return { winner: a.hp > b.hp ? 0 : 1, reason: 'time' };
}

/** Os dois lados do duelo são sempre chefes diferentes? (o mesmo chefe contra si mesmo não ajuda a testar) */
export function validDuel(a: BossId | null | undefined, b: BossId | null | undefined): boolean {
  return !!a && !!b && a !== b;
}
