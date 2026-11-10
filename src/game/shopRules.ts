// Regras de exibição da loja (puras, sem DOM, testáveis).
import { BOMB_TYPES, BombId } from '../config';

export type CardState = 'initial' | 'owned' | 'affordable' | 'locked';

export interface CardView {
  state: CardState;
  missing: number; // quanto falta de POÇÃO para comprar (só em 'locked')
}

export function cardView(type: BombId, owned: boolean, bank: number): CardView {
  if (type === 'normal') return { state: 'initial', missing: 0 };
  if (owned) return { state: 'owned', missing: 0 };
  const cost = BOMB_TYPES[type].cost;
  if (bank >= cost) return { state: 'affordable', missing: 0 };
  return { state: 'locked', missing: cost - bank };
}

export function buttonLabel(type: BombId, view: CardView): string {
  switch (view.state) {
    case 'initial': return 'Inicial';
    case 'owned': return 'Adquirida';
    case 'affordable': return `Comprar · ${BOMB_TYPES[type].cost} POÇÃO`;
    case 'locked': return `Faltam ${view.missing} POÇÃO`;
  }
}

export function formatFuse(fuseMs: number): string {
  if (!isFinite(fuseMs)) return 'Manual (tecla D)';
  return `${String(fuseMs / 1000).replace('.', ',')} s`;
}
