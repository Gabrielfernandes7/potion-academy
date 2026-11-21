// Quais poções a Roo pode usar agora. Na campanha, só as aprendidas na jornada (learning.ts); na Arena,
// todas. Enquanto uma forma dura, só a poção do elemento dela funciona (a Roo Água só usa água, a Roo Terra só terra...).
// Fica fora do storage para não mexer no que a jogadora aprendeu.
import { BOMB_TYPES, BombId, ElementId } from '../config';
import { hasBombType } from '../storage';

let arena = false;
let formElement: ElementId | null = null;

export function setArenaLoadout(on: boolean): void {
  arena = on;
}

export function inArenaLoadout(): boolean {
  return arena;
}

/** O elemento da forma ativa (ou null): só as poções dele funcionam enquanto ela dura. */
export function setFormElement(element: ElementId | null): void {
  formElement = element;
}

export function currentFormElement(): ElementId | null {
  return formElement;
}

/** A poção está bloqueada agora pela forma (um elemento que não é o da forma)? */
export function isBlockedBomb(type: BombId): boolean {
  return formElement !== null && BOMB_TYPES[type].element !== formElement;
}

/** A poção já é da Roo (aprendida, ou qualquer uma na Arena), sem olhar a forma? */
export function isOwnedBomb(type: BombId): boolean {
  return arena || hasBombType(type);
}

/** A poção está disponível agora? (aprendida ou na Arena, e não bloqueada pela forma) */
export function canUseBomb(type: BombId): boolean {
  if (isBlockedBomb(type)) return false;
  return arena || hasBombType(type);
}
