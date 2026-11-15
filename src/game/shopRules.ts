// Regras de exibição da loja (puras, sem DOM, testáveis). O Caldeirão não vende poções: a Roo
// aprende cada uma no decorrer da jornada (game/learning.ts). A loja só mostra o que já é dela.
import type { BombId } from '../config';

export type CardState = 'initial' | 'owned' | 'journey';

export interface CardView {
  state: CardState;
}

export function cardView(type: BombId, owned: boolean): CardView {
  if (type === 'normal') return { state: 'initial' };
  if (owned) return { state: 'owned' };
  return { state: 'journey' };
}

export function buttonLabel(_type: BombId, view: CardView): string {
  switch (view.state) {
    case 'initial': return 'Inicial';
    case 'owned': return 'Aprendida';
    case 'journey': return 'Na jornada';
  }
}

export function formatFuse(fuseMs: number): string {
  if (!isFinite(fuseMs)) return 'Manual (tecla D)';
  return `${String(fuseMs / 1000).replace('.', ',')} s`;
}
