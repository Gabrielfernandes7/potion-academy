// Regras puras do Ouroboros (sem Phaser): a fraqueza que gira, o dano por elemento, a escolha de habilidades e os anéis.
// Os textos estão em lines.ts e o comportamento visual em OuroborosController.ts.
//
// O Ouroboros é a serpente que devora a própria cauda: o ciclo, o fim que é começo. A fraqueza dele não é fixa: gira
// pelos quatro elementos, um a cada ciclo (fogo, terra, água, ar), e o elemento que ele veste é o da fraqueza do momento.
// O elemento oposto no ciclo (dois passos à frente) ele devora: não sente nada.
import type { ElementId } from '../../../../config';
import type { BossPhase } from '../common';
import { PROFILES } from '../../profiles';
import { random } from '../../../rng';

export const OUROBOROS_NAME = 'OUROBOROS';
export const OUROBOROS_HP = PROFILES.ouroboros.maxHp;

/** A ordem do ciclo: cada elemento é a fraqueza por um tempo, e o seguinte vem depois. */
export const ELEMENT_CYCLE: readonly ElementId[] = ['fire', 'earth', 'water', 'air'];

/** Quanto dura cada fraqueza (ms): mais curta na fúria. */
export function cycleMs(phase: BossPhase): number {
  return phase === 1 ? 9000 : 6500;
}

/** O elemento fraco no ciclo de número `index` (qualquer inteiro; dá a volta). */
export function weakAt(index: number): ElementId {
  const n = ELEMENT_CYCLE.length;
  return ELEMENT_CYCLE[((Math.floor(index) % n) + n) % n];
}

export const OUROBOROS_HIT_WEAK = 4; // dano no elemento da vez
export const OUROBOROS_HIT_NEUTRAL = 1; // dano nos elementos vizinhos no ciclo
// o oposto (dois passos adiante) não causa dano: ele o devora e se cura
export const OUROBOROS_DEVOUR_HEAL = 1;

/** Dano de uma explosão do `element` quando a fraqueza do momento é `weak`. */
export function ouroborosDamage(element: ElementId, weak: ElementId): number {
  const n = ELEMENT_CYCLE.length;
  const diff = ((ELEMENT_CYCLE.indexOf(element) - ELEMENT_CYCLE.indexOf(weak)) % n + n) % n;
  if (diff === 0) return OUROBOROS_HIT_WEAK;
  if (diff === 2) return 0;
  return OUROBOROS_HIT_NEUTRAL;
}

export type OuroborosSkill = 'ring' | 'bite' | 'cycle';

export function ouroborosCooldown(phase: BossPhase): number {
  return phase === 1 ? 3200 : 2100;
}

/** Sorteia a próxima habilidade: nunca repete a anterior; o Ciclo só existe na fúria. */
export function pickOuroborosSkill(phase: BossPhase, last: OuroborosSkill | null, rng: () => number = random): OuroborosSkill {
  const weights: Array<[OuroborosSkill, number]> = phase === 1
    ? [['ring', 0.55], ['bite', 0.45]]
    : [['ring', 0.35], ['bite', 0.3], ['cycle', 0.35]];
  const pool = weights.filter(([s]) => s !== last);
  const total = pool.reduce((sum, [, w]) => sum + w, 0);
  let roll = rng() * total;
  for (const [skill, w] of pool) {
    roll -= w;
    if (roll < 0) return skill;
  }
  return pool[pool.length - 1][0];
}

/**
 * Um anel em volta de `center`: as casas livres a exatamente `radius` casas (Chebyshev), formando um quadrado oco.
 * A serpente cerca o lugar: quem está dentro do anel ou fora dele está a salvo; só quem está nele é atingido.
 */
export function ringTiles(
  center: { x: number; y: number }, radius: number, isOpen: (x: number, y: number) => boolean,
): Array<{ x: number; y: number }> {
  const out: Array<{ x: number; y: number }> = [];
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;
      if (isOpen(center.x + dx, center.y + dy)) out.push({ x: center.x + dx, y: center.y + dy });
    }
  }
  return out;
}
