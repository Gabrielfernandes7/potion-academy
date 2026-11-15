// Roo Ar (puro): o perfil, a leveza, a visão de cima, o Sopro e o Salto de vento. Transforma com T, segurando a poção de ar.
//   Degraus 4 e 3: resiste ao ar, fraca à terra. Degraus 2 e 1: esfriando, sem fraqueza nem resistência.
//   Degrau 0: a Roo normal. Poções de ar +50% no auge.
// A leveza: transformada, a Roo anda 20% mais rápido (o contrário do peso da Terra). O preço é a fraqueza à terra.
// A visão de cima: a névoa não esconde nada da Roo transformada.
// Sopro (X): um vento em linha de 4 casas empurra para a frente os inimigos comuns (2 casas no auge, 1 nos degraus
//   baixos) e também as poções do chão, que deslizam e podem ser postas contra um alvo. Atordoa quem foi empurrado.
//   Flores (presas ao chão) e chefes não saem do lugar. Apaga as brasas. Custa 2 s da forma, espera 3,5 s.
// Salto de vento (C): um pulo de até 3 casas à frente, por cima de inimigos, poções e muros de sal, invulnerável
//   enquanto dura (0,25 s). Não atravessa parede nem caixote: para na última casa livre antes deles. Custa 1,5 s da
//   forma, espera 2,5 s. É a esquiva: tira a Roo do aviso de uma explosão ou do corredor cercado.
import { PROFILES } from '../entities/profiles';
import type { DamageProfile } from '../entities/damage';
import type { FormDef, FormStage } from './types';

const FULL: DamageProfile = { element: 'air', maxHp: PROFILES.roo.maxHp, weak: ['earth'], resist: ['air'], immune: [] };
const COOLING: DamageProfile = { element: 'air', maxHp: PROFILES.roo.maxHp, weak: [], resist: [], immune: [] };

export const AIR_FORM: FormDef = {
  id: 'air',
  nome: 'Roo Ar',
  element: 'air',
  profile: (stage: FormStage): DamageProfile => (stage >= 3 ? FULL : stage >= 1 ? COOLING : PROFILES.roo),
  boost: 0.5,
  ability: { id: 'gust', nome: 'Sopro', short: 'SOPRO', costMs: 2000, cooldownMs: 3500, range: 4 },
  ability2: { id: 'leap', nome: 'Salto de vento', short: 'SALTO', costMs: 1500, cooldownMs: 2500, range: 3 },
};

/** A leveza do ar: o passo demora 20% menos (0,8). Sem forma, 1. */
export function airWalkFactor(stage: FormStage): number {
  return stage > 0 ? 0.8 : 1;
}

export const LEAP_MS = 250; // duração do salto (a Roo é invulnerável)

/** Quanto tempo o Sopro atordoa o inimigo empurrado, por degrau (0 = não atordoa). */
export function gustStunMs(stage: FormStage): number {
  return stage <= 0 ? 0 : stage >= 3 ? 1400 : 700;
}

/**
 * Onde o salto termina: a casa livre mais distante da linha (até `range`). O vento passa por cima de inimigos,
 * poções e muros de sal (`canFly`), mas para na primeira casa que não deixa passar (parede, caixote, borda).
 * Devolve null se não houver onde pousar.
 */
export function leapTarget(
  from: { x: number; y: number }, dir: { x: number; y: number }, range: number,
  canFly: (x: number, y: number) => boolean, landable: (x: number, y: number) => boolean,
): { x: number; y: number } | null {
  if (dir.x === 0 && dir.y === 0) return null;
  let best: { x: number; y: number } | null = null;
  for (let i = 1; i <= range; i++) {
    const x = from.x + dir.x * i;
    const y = from.y + dir.y * i;
    if (!canFly(x, y)) break;
    if (landable(x, y)) best = { x, y };
  }
  return best;
}

/** A névoa não esconde a Roo enquanto a forma dura (qualquer degrau acima de 0). */
export function airSeesThroughFog(stage: FormStage): boolean {
  return stage > 0;
}

/** Visão na névoa da forma de ar: grande o bastante para cobrir a grade inteira. */
export const AIR_SIGHT_RADIUS = 40;

/** Quantas casas o Sopro empurra cada inimigo: 2 no auge, 1 nos degraus baixos. */
export function gustPush(stage: FormStage): number {
  return stage <= 0 ? 0 : stage >= 3 ? 2 : 1;
}

/** As casas da linha do vento: à frente de `from`, até `range`, parando na primeira que não for livre. */
export function gustTiles(
  from: { x: number; y: number }, dir: { x: number; y: number }, range: number,
  isOpen: (x: number, y: number) => boolean,
): Array<{ x: number; y: number }> {
  const out: Array<{ x: number; y: number }> = [];
  if (dir.x === 0 && dir.y === 0) return out;
  for (let i = 1; i <= range; i++) {
    const x = from.x + dir.x * i;
    const y = from.y + dir.y * i;
    if (!isOpen(x, y)) break;
    out.push({ x, y });
  }
  return out;
}

/** Onde o inimigo para depois do sopro: anda até `steps` casas na direção, parando antes da primeira ocupada. */
export function gustTarget(
  from: { x: number; y: number }, dir: { x: number; y: number }, steps: number,
  canEnter: (x: number, y: number) => boolean,
): { x: number; y: number } {
  let x = from.x;
  let y = from.y;
  for (let i = 0; i < steps; i++) {
    if (!canEnter(x + dir.x, y + dir.y)) break;
    x += dir.x;
    y += dir.y;
  }
  return { x, y };
}
