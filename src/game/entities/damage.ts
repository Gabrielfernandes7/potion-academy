// Dano por elemento (regra pura, sem Phaser): cada personagem tem um atributo principal, uma
// barra de vida, fraquezas, resistências e imunidades. Toda poção da Roo causa o mesmo dano-base;
// o que muda é o multiplicador do personagem atingido. Ver docs/10-equilibrio.md.
import type { ElementId } from '../../config';

export interface DamageProfile {
  element: ElementId;   // atributo principal
  maxHp: number;        // pontos da barra de vida
  weak: ElementId[];    // fraqueza: dano maior
  resist: ElementId[];  // resistência: dano menor
  immune: ElementId[];  // imune: nenhum dano
}

export const BASE_HIT = 4;
export const MULT = { weak: 1.5, neutral: 1, resist: 0.5, immune: 0 } as const;

export function multiplierFor(profile: DamageProfile, element: ElementId): number {
  if (profile.immune.includes(element)) return MULT.immune;
  if (profile.weak.includes(element)) return MULT.weak;
  if (profile.resist.includes(element)) return MULT.resist;
  return MULT.neutral;
}

// Dano em pontos de vida: nunca menos de 1, a não ser que seja imune (0).
export function damageTo(profile: DamageProfile, element: ElementId): number {
  const m = multiplierFor(profile, element);
  return m === 0 ? 0 : Math.max(1, Math.round(BASE_HIT * m));
}

export function isImmuneTo(profile: DamageProfile, element: ElementId): boolean {
  return profile.immune.includes(element);
}

// Quantos golpes do elemento são precisos para zerar a vida (Infinity se imune).
export function hitsToKill(profile: DamageProfile, element: ElementId): number {
  const d = damageTo(profile, element);
  return d === 0 ? Infinity : Math.ceil(profile.maxHp / d);
}
