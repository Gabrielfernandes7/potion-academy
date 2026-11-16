// A dica da tela de derrota: o que levou a Roo ao chão e como evitar (puro, testado). Ensina em vez de só dizer "game over".
import type { ElementId } from '../config';

export type DeathCause = ElementId | 'contact' | 'overtime';

const ELEMENT_TIPS: Record<ElementId, { by: string; tip: string }> = {
  fire: { by: 'uma explosão de fogo', tip: 'O fogo é a fraqueza da Roo (6 de dano). Afaste-se 3 casas depois de pôr a poção, ou use a água.' },
  water: { by: 'uma explosão de água', tip: 'A água é a que menos machuca a Roo. Fique atenta ao aviso azul no chão.' },
  earth: { by: 'uma explosão de terra', tip: 'A terra atravessa caixotes: não fique na linha da poção, mesmo atrás de um caixote.' },
  air: { by: 'uma explosão de ar', tip: 'A poção de Ar só explode quando você aperta D. Não deixe uma esquecida no caminho.' },
};

/** O texto "Caiu por ..." e a dica para a causa. */
export function deathTip(cause: DeathCause | null): { by: string; tip: string } {
  if (cause === 'overtime') return { by: 'o tempo esgotado', tip: 'Quando o tempo acaba, a Roo perde vida aos poucos. Abra a porta antes, ou pegue +Tempo nos caixotes.' };
  if (cause === 'contact') return { by: 'o contato com um inimigo', tip: 'Inimigos machucam ao encostar. Explodi-los de longe é mais seguro que passar por eles.' };
  if (cause) return ELEMENT_TIPS[cause];
  return { by: 'um golpe', tip: 'Respire, leia os avisos no chão e tente de novo.' };
}
