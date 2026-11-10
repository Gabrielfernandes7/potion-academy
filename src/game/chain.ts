// Reação entre poções: o que acontece quando a explosão de uma poção alcança outra poção armada.
// Regra pura (sem Phaser), para testar e para mudar num lugar só. Ver docs/06-decisoes.md.
//
// - Fogo acende: a explosão de fogo faz explodir as poções que alcança.
// - Água apaga: a explosão de água neutraliza uma poção de fogo armada (ela se desfaz em vapor, sem
//   explodir). A explosão de água continua machucando quem estiver no caminho.
// - Terra é estável: nunca é acesa nem neutralizada; só explode pelo próprio fusível.
// - Água, terra e éter não acendem outras poções.
import type { ElementId } from '../config';

export type ChainOutcome = 'trigger' | 'neutralize' | 'ignore';

export function chainOutcome(source: ElementId, target: ElementId): ChainOutcome {
  if (target === 'earth') return 'ignore';
  if (source === 'water' && target === 'fire') return 'neutralize';
  if (source === 'fire') return 'trigger';
  return 'ignore';
}
