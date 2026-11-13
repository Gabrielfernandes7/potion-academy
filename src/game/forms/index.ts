// Porta de entrada das transformações (puro).
import type { ElementId } from '../../config';
import { PROFILES } from '../entities/profiles';
import type { DamageProfile } from '../entities/damage';
import { FORMS } from './registry';
import type { FormId, FormStage } from './types';

export * from './types';
export * from './stages';
export * from './fire';
export * from './water';
export * from './RooForm';
export { FORMS, FORM_IDS } from './registry';

/** O perfil de dano da Roo na forma e no degrau dados (sem forma, o normal). */
export function profileOf(form: FormId | null, stage: FormStage): DamageProfile {
  return form ? FORMS[form].profile(stage) : PROFILES.roo;
}

/** Multiplicador das poções do elemento da forma, por degrau: 1,5 no auge, caindo 0,125 por degrau. */
export function boostFactor(form: FormId | null, element: ElementId, stage: FormStage): number {
  if (!form) return 1;
  const def = FORMS[form];
  return element === def.element ? 1 + (def.boost * stage) / 4 : 1;
}

/** Dano de uma poção da Roo num alvo: só as do elemento da forma ganham o bônus; nunca menos que o dano base. */
export function boostedDamage(form: FormId | null, baseDamage: number, element: ElementId, stage: FormStage): number {
  if (baseDamage <= 0) return baseDamage;
  const f = boostFactor(form, element, stage);
  return f === 1 ? baseDamage : Math.max(baseDamage, Math.round(baseDamage * f));
}

/** Dano que a Roo leva de um golpe do elemento, na forma e no degrau dados (sem elemento, o contato neutro). */
export function formHit(form: FormId | null, element: ElementId | undefined, stage: FormStage, neutral: number, damageTo: (p: DamageProfile, e: ElementId) => number): number {
  return element ? damageTo(profileOf(form, stage), element) : neutral;
}
