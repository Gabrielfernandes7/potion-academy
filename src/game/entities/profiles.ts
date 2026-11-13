// Tabela de personagens: atributo principal, vida, fraquezas, resistências e imunidades.
// É o único lugar para ajustar o equilíbrio entre elementos e personagens (a regra de cálculo está em damage.ts).
// Para um personagem novo: acrescente o id em EntityId e uma linha em PROFILES; o teste de
// tests/entities/damage.test.ts confere a coerência da tabela.
import type { DamageProfile } from './damage';

export type EntityId = 'frog' | 'ghost' | 'flower' | 'belladonna' | 'mandrake';

// Quem ensina cada regra ao jogador: o sapo (água, terra), o fantasma (água benta), a flor (fogo)...
export const PROFILES: Record<EntityId, DamageProfile> = {
  frog:       { element: 'water', maxHp: 6,  weak: ['earth'],        resist: ['water'],         immune: [] },
  ghost:      { element: 'air',   maxHp: 6,  weak: ['water'],        resist: ['air'],           immune: ['earth'] },
  flower:     { element: 'earth', maxHp: 10, weak: ['fire'],         resist: ['earth'],         immune: ['water'] },
  belladonna: { element: 'earth', maxHp: 20, weak: ['fire', 'air'],  resist: ['water', 'earth'], immune: [] },
  mandrake:   { element: 'earth', maxHp: 28, weak: ['fire'],         resist: ['earth', 'water'], immune: [] },
};
