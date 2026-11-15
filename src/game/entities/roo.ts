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

export interface HpBarView { ratio: number }

/** Como a barra aparece: a proporção de vida que sobrou (a cor vem de hpColor). */
export function hpBarView(hp: number, maxHp: number): HpBarView {
  return { ratio: maxHp > 0 ? Math.min(1, Math.max(0, hp / maxHp)) : 0 };
}

// Cor da barra de vida: verde com a vida cheia, amarelo na metade, vermelho perto de zero.
export const HP_GREEN = 0x43a047;
export const HP_YELLOW = 0xfdd835;
export const HP_RED = 0xe53935;

function mixColor(a: number, b: number, t: number): number {
  const ch = (c: number, shift: number): number => (c >> shift) & 0xff;
  const out = (shift: number): number => Math.round(ch(a, shift) + (ch(b, shift) - ch(a, shift)) * t) << shift;
  return out(16) | out(8) | out(0);
}

/** A cor da barra para uma fração de vida (0 a 1): verde → amarelo (até a metade) → vermelho. */
export function hpColor(ratio: number): number {
  const r = Math.min(1, Math.max(0, ratio));
  if (r >= 0.5) return mixColor(HP_YELLOW, HP_GREEN, (r - 0.5) / 0.5);
  return mixColor(HP_RED, HP_YELLOW, r / 0.5);
}
