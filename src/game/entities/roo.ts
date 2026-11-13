// Vida da Roo (regra pura, sem Phaser): uma barra contínua, como a dos chefes, com o mesmo perfil de
// fraqueza e resistência dos outros personagens (ver profiles.ts e damage.ts).
//   - Explosões causam dano pelo elemento: o fogo é a fraqueza, a água é a resistência.
//   - Encostar em inimigo ou chefe é dano neutro (BASE_HIT), qualquer que seja o atributo dele.
//   - Coração cura um golpe neutro (BASE_HIT): o "+1 vida" de antes.
import type { ElementId } from '../../config';
import { BASE_HIT, DamageProfile, damageTo } from './damage';
import { PROFILES } from './profiles';

export const ROO_MAX_HP = PROFILES.roo.maxHp;
export const HEART_HEAL = BASE_HIT;

/** Dano à Roo: pelo elemento da explosão; sem elemento (contato), neutro. */
export function damageToRoo(element?: ElementId, profile: DamageProfile = PROFILES.roo): number {
  return element ? damageTo(profile, element) : BASE_HIT;
}

/** Vida depois de curar (nunca passa do máximo). */
export function healRoo(hp: number, amount: number = HEART_HEAL, maxHp: number = ROO_MAX_HP): number {
  return Math.min(maxHp, hp + amount);
}

export interface HpBarView { ratio: number; low: boolean }

/** Como a barra aparece: proporção cheia e aviso de vida baixa (um quarto ou menos). */
export function hpBarView(hp: number, maxHp: number): HpBarView {
  const ratio = maxHp > 0 ? Math.min(1, Math.max(0, hp / maxHp)) : 0;
  return { ratio, low: ratio > 0 && ratio <= 0.25 };
}
