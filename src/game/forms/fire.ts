// Roo Fire (puro): o perfil, as Brasas, a Labareda e a Luz de chama. Está no jogo (tecla T).
//   Degraus 4 e 3: resiste ao fogo, fraca à água. Degraus 2 e 1: esfriando, sem fraqueza nem resistência.
//   Degrau 0: a Roo normal. Poções de fogo +50% no auge. NÃO pode usar poção de água enquanto transformada.
// Brasas: a explosão de fogo deixa brasas; queimam inimigos comuns (chefes são imunes), nunca machucam a Roo,
//   duram menos a cada degrau, e a água as apaga.
// Labareda (X): jato de fogo de 3 casas à frente; custa 2 s da forma, espera 3,5 s.
// Luz de chama: mais visão na névoa (+0,5 casa por degrau).
import { PROFILES } from '../entities/profiles';
import { DamageProfile, damageTo } from '../entities/damage';
import type { FormDef, FormStage } from './types';

const FULL: DamageProfile = { element: 'fire', maxHp: PROFILES.roo.maxHp, weak: ['water'], resist: ['fire'], immune: [] };
const COOLING: DamageProfile = { element: 'fire', maxHp: PROFILES.roo.maxHp, weak: [], resist: [], immune: [] };

export const FIRE_FORM: FormDef = {
  id: 'fire',
  nome: 'Roo Fire',
  element: 'fire',
  transformKey: 'T',
  profile: (stage: FormStage): DamageProfile => (stage >= 3 ? FULL : stage >= 1 ? COOLING : PROFILES.roo),
  boost: 0.5,
  forbids: 'water', // a chama recusa a água
  ability: { id: 'flame', nome: 'Labareda', short: 'LABAREDA', costMs: 2000, cooldownMs: 3500, range: 3 },
};

/** Luz de chama: casas a mais de visão na névoa, 0,5 por degrau (2 no auge). */
export function fireLight(stage: FormStage): number {
  return stage * 0.5;
}

/** Quanto tempo as brasas duram, por degrau (0 = sem brasas). */
export function emberMs(stage: FormStage): number {
  return stage * 700;
}

export const EMBER_TICK_MS = 800; // intervalo entre queimaduras no mesmo alvo
export const embersHurt = (target: 'enemy' | 'boss'): boolean => target === 'enemy';

/** Dano de uma queimadura de brasa num alvo (o dano de fogo da tabela dele, sem bônus). */
export function emberDamage(target: DamageProfile): number {
  return damageTo(target, 'fire');
}

/** Casas do jato da Labareda: à frente de `from`, até `range` casas, parando na primeira que não for livre. */
export function flameTiles(
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

interface Ember { until: number }

/** Brasas no chão: casas com validade. Puro: quem chama dá o relógio. */
export class EmberField {
  private tiles = new Map<string, Ember>();

  private key = (x: number, y: number): string => `${x},${y}`;

  /** Acende brasas nas casas, com a duração do degrau. Sem efeito se o degrau não deixa brasas. */
  ignite(tiles: ReadonlyArray<{ x: number; y: number }>, now: number, stage: FormStage): void {
    const ms = emberMs(stage);
    if (ms <= 0) return;
    for (const t of tiles) {
      const k = this.key(t.x, t.y);
      const until = now + ms;
      const cur = this.tiles.get(k);
      this.tiles.set(k, { until: cur ? Math.max(cur.until, until) : until });
    }
  }

  /** A água apaga as brasas das casas que atingiu. Devolve quantas apagou. */
  douse(tiles: ReadonlyArray<{ x: number; y: number }>): number {
    let n = 0;
    for (const t of tiles) if (this.tiles.delete(this.key(t.x, t.y))) n++;
    return n;
  }

  lit(x: number, y: number, now: number): boolean {
    const e = this.tiles.get(this.key(x, y));
    return !!e && e.until > now;
  }

  /** Remove as vencidas e lista as acesas. */
  active(now: number): Array<{ x: number; y: number; left: number }> {
    const out: Array<{ x: number; y: number; left: number }> = [];
    for (const [k, e] of this.tiles) {
      if (e.until <= now) { this.tiles.delete(k); continue; }
      const [x, y] = k.split(',').map(Number);
      out.push({ x, y, left: e.until - now });
    }
    return out;
  }

  clear(): void {
    this.tiles.clear();
  }
}
