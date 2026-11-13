// Quais poções a Roo pode usar. Na campanha, só as compradas no Caldeirão de Magia (storage); na Arena de
// treino, todas. Além disso, uma transformação pode proibir um elemento (a Roo Fire recusa a água).
// Fica fora do storage para não mexer no que o jogador comprou.
import { BOMB_TYPES, BombId, ElementId } from '../config';
import { hasBombType } from '../storage';

let arena = false;
let forbidden: ElementId | null = null;

export function setArenaLoadout(on: boolean): void {
  arena = on;
}

export function inArenaLoadout(): boolean {
  return arena;
}

/** O elemento que a transformação ativa proíbe (ou null). */
export function setForbiddenElement(element: ElementId | null): void {
  forbidden = element;
}

export function forbiddenElement(): ElementId | null {
  return forbidden;
}

/** Esta poção está proibida agora pela transformação? */
export function isBannedBomb(type: BombId): boolean {
  return forbidden !== null && BOMB_TYPES[type].element === forbidden;
}

/** A poção está disponível agora? (liberada na loja ou na Arena, e não proibida pela forma) */
export function canUseBomb(type: BombId): boolean {
  if (isBannedBomb(type)) return false;
  return arena || hasBombType(type);
}
