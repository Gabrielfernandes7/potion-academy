// Regras puras do Leão Verde (sem Phaser): dano por elemento, escolha de habilidades e áreas. As falas
// estão em lines.ts e o comportamento visual em LionController.ts. Ver docs/03-mundo.md e docs/06-decisoes.md.
//
// O Leão Verde é o solvente universal da alquimia: dissolve tudo, até o ouro (o sol). Nos manuscritos ele
// aparece devorando o sol. A terra (o sal) é imune; o éter (a quintessência) é a fraqueza.
import { ElementId } from '../../../../config';
import { damageTo } from '../../damage';
import { PROFILES } from '../../profiles';
import type { BossPhase } from '../common';

export const LION_NAME = 'LEÃO VERDE';
export const LION_HP = PROFILES.lion.maxHp;

export const LION_DAMAGE: Record<ElementId, number> = {
  fire: damageTo(PROFILES.lion, 'fire'),
  air: damageTo(PROFILES.lion, 'air'),
  earth: damageTo(PROFILES.lion, 'earth'),
  water: damageTo(PROFILES.lion, 'water'),
};

export type LionSkill = 'pounce' | 'dissolve' | 'roar';

export function lionCooldown(phase: BossPhase): number {
  return phase === 1 ? 3600 : 2500;
}

// Depois do Bote ele fica exposto: dano extra por um tempo (a hora de atacar).
export const LION_EXPOSED_MS = 2200;
export const LION_EXPOSED_BONUS = 2;

// Sorteia a próxima habilidade: nunca repete a anterior; o Rugido só existe na fase 2.
export function pickLionSkill(
  phase: BossPhase, last: LionSkill | null, rng: () => number = Math.random,
): LionSkill {
  const weights: Array<[LionSkill, number]> = phase === 1
    ? [['pounce', 0.5], ['dissolve', 0.5]]
    : [['pounce', 0.3], ['dissolve', 0.35], ['roar', 0.35]];
  const pool = weights.filter(([s]) => s !== last);
  const total = pool.reduce((sum, [, w]) => sum + w, 0);
  let roll = rng() * total;
  for (const [skill, w] of pool) {
    roll -= w;
    if (roll < 0) return skill;
  }
  return pool[pool.length - 1][0];
}

// Dissolver: o ácido corre pela linha (ou, furioso, também pela coluna) da casa da jogadora, até a parede.
// Qualquer poção da Roo sobre a linha se dissolve. Devolve as casas, sem repetir.
export function dissolveTiles(
  target: { x: number; y: number }, horizontal: boolean, both: boolean,
  isOpen: (x: number, y: number) => boolean,
): Array<{ x: number; y: number }> {
  const out: Array<{ x: number; y: number }> = [{ x: target.x, y: target.y }];
  const seen = new Set<string>([`${target.x},${target.y}`]);
  const axes = both ? [true, false] : [horizontal];
  for (const h of axes) {
    for (const s of [-1, 1]) {
      for (let r = 1; r < 40; r++) {
        const x = h ? target.x + s * r : target.x;
        const y = h ? target.y : target.y + s * r;
        if (!isOpen(x, y)) break;
        const k = `${x},${y}`;
        if (!seen.has(k)) { seen.add(k); out.push({ x, y }); }
      }
    }
  }
  return out;
}
