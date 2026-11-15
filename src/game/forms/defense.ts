// A defesa das transformações (tecla V; puro): toda forma tem uma defesa que dura poucos segundos e reduz o dano que a
// Roo leva. Cada uma tem um efeito além da redução:
//   fogo  : Escudo de brasas: um anel de brasas nas quatro casas ao redor, que queima quem pisa nele.
//   água  : Bolha protetora: uma bolha iridescente em volta da Roo.
//   terra : Círculo de sal: um muro nas quatro casas ao redor e, ao levantar, empurra para longe o que estava nelas.
//   ar    : Redemoinho: um vento em volta que afasta uma casa os inimigos vizinhos.
// Apertar V de novo, com a defesa de pé, a desfaz antes da hora. A defesa gasta tempo da transformação e tem espera.
import type { FormDefense } from './types';

/** Quanto do dano a defesa corta (0,5 = metade). */
export const GUARD_REDUCE = 0.5;
export const GUARD_MS = 3000;
export const GUARD_COOLDOWN_MS = 6000;
export const GUARD_COST_MS = 2000;

/** O dano que a Roo leva com a defesa de pé: reduzido, arredondado, e nunca negativo. Sem defesa, o dano inteiro. */
export function guardedDamage(damage: number, guarding: boolean, reduce = GUARD_REDUCE): number {
  if (!guarding || damage <= 0) return damage;
  return Math.max(0, Math.round(damage * (1 - reduce)));
}

export const DEFENSE_FIRE: FormDefense = { id: 'embers', nome: 'Escudo de brasas', short: 'ESCUDO', costMs: GUARD_COST_MS, cooldownMs: GUARD_COOLDOWN_MS, guardMs: GUARD_MS, reduce: GUARD_REDUCE };
export const DEFENSE_WATER: FormDefense = { id: 'bubble', nome: 'Bolha protetora', short: 'BOLHA', costMs: GUARD_COST_MS, cooldownMs: GUARD_COOLDOWN_MS, guardMs: GUARD_MS, reduce: GUARD_REDUCE };
export const DEFENSE_EARTH: FormDefense = { id: 'salt-ring', nome: 'Círculo de sal', short: 'CÍRCULO', costMs: GUARD_COST_MS, cooldownMs: GUARD_COOLDOWN_MS, guardMs: GUARD_MS, reduce: GUARD_REDUCE };
export const DEFENSE_AIR: FormDefense = { id: 'whirl', nome: 'Redemoinho', short: 'VENTO', costMs: GUARD_COST_MS, cooldownMs: GUARD_COOLDOWN_MS, guardMs: GUARD_MS, reduce: GUARD_REDUCE };

/** Quantas casas o Círculo de sal empurra o que estava ao redor, para longe da Roo. */
export const RING_PUSH_STEPS = 2;
/** Quantas casas o Redemoinho afasta os inimigos vizinhos. */
export const WHIRL_PUSH_STEPS = 1;

/** As quatro casas vizinhas, cada uma com o sentido para longe de `at` (para empurrar o que está nela). */
export function ringNeighbors(at: { x: number; y: number }): Array<{ x: number; y: number; dir: { x: number; y: number } }> {
  return [[0, -1], [0, 1], [-1, 0], [1, 0]].map(([dx, dy]) => ({ x: at.x + dx, y: at.y + dy, dir: { x: dx, y: dy } }));
}
