// Roo Aqua (puro): o perfil e a Bolha de sabão. Está no jogo (tecla Y).
//   Degraus 4 e 3: IMUNE à água (mas segue fraca ao fogo). Degraus 2 e 1: esfriando, resiste à água e sem
//   fraqueza. Degrau 0: a Roo normal. Poções de água +50% no auge. Pode usar todas as poções.
// Bolha de sabão (X): a Roo sopra uma bolha que flutua devagar até 4 casas à frente. Se alcança um inimigo
//   comum, o prende dentro dela: ele não anda, não machuca e não chicoteia, até a bolha estourar (mais tempo
//   nos degraus altos). Chefes são imunes (a bolha só estoura). Custa 2 s da forma, espera 3,5 s. A Roo nasceu
//   de uma bolha: é a habilidade mais dela.
import { PROFILES } from '../entities/profiles';
import type { DamageProfile } from '../entities/damage';
import type { FormDef, FormStage } from './types';

const FULL: DamageProfile = { element: 'water', maxHp: PROFILES.roo.maxHp, weak: ['fire'], resist: [], immune: ['water'] };
const COOLING: DamageProfile = { element: 'water', maxHp: PROFILES.roo.maxHp, weak: [], resist: ['water'], immune: [] };

export const WATER_FORM: FormDef = {
  id: 'water',
  nome: 'Roo Aqua',
  element: 'water',
  transformKey: 'Y',
  profile: (stage: FormStage): DamageProfile => (stage >= 3 ? FULL : stage >= 1 ? COOLING : PROFILES.roo),
  boost: 0.5,
  ability: { id: 'bubble', nome: 'Bolha de sabão', short: 'BOLHA', costMs: 2000, cooldownMs: 3500, range: 4 },
};

// A iridescência da bolha de sabão: a cor do anel muda com o ângulo e com o tempo, como a película de sabão
// reflete a luz (rosa, amarelo, ciano, violeta, verde). Usada na bolha lançada, na que prende o inimigo e
// nas que giram em volta da Roo Aqua (textures/rooWater.ts).
export const IRIDESCENT: readonly number[] = [0xffa8e0, 0xfff1a0, 0x9ff0ff, 0xc9b0ff, 0xa8ffd0];

/** A cor iridescente do trecho `index` do anel, deslocada por `shift` (que anda com o tempo). Aceita negativos. */
export function iridescent(index: number, shift = 0): number {
  const n = IRIDESCENT.length;
  return IRIDESCENT[(((Math.floor(index) + Math.floor(shift)) % n) + n) % n];
}

export const BUBBLE_STEP_MS = 330; // tempo para a bolha andar uma casa

/** Quanto tempo a bolha segura um inimigo, por degrau (mais forte no auge). */
export function trapMs(stage: FormStage): number {
  return stage <= 0 ? 0 : 1000 + 750 * stage;
}

/** O caminho da bolha: as casas à frente de `from`, até `range`, parando antes de parede ou caixote. */
export function bubblePath(
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

/**
 * Anda com a bolha pelo caminho: em que casa ela está depois de `elapsedMs`, e se já chegou ao fim.
 * Índice 0 = a primeira casa à frente da Roo.
 */
export function bubbleAt(pathLength: number, elapsedMs: number): { index: number; done: boolean } {
  if (pathLength <= 0) return { index: 0, done: true };
  const index = Math.floor(elapsedMs / BUBBLE_STEP_MS);
  return index >= pathLength ? { index: pathLength - 1, done: true } : { index, done: false };
}
