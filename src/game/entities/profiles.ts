// Tabela de personagens: atributo principal, vida, fraquezas, resistências e imunidades.
// É o único lugar para ajustar o equilíbrio entre elementos e personagens (a regra de cálculo está em damage.ts).
// Para um personagem novo: acrescente o id em EntityId e uma linha em PROFILES; o teste de
// tests/entities/damage.test.ts confere a coerência da tabela.
import type { DamageProfile } from './damage';

export type EntityId = 'frog' | 'ghost' | 'flower' | 'belladonna' | 'mandrake' | 'chimera' | 'roo' | 'lion';

// Quem ensina cada regra ao jogador: o sapo (água, terra), o fantasma (água benta), a flor (fogo)...
export const PROFILES: Record<EntityId, DamageProfile> = {
  frog:       { element: 'water', maxHp: 6,  weak: ['earth'],        resist: ['water'],         immune: [] },
  ghost:      { element: 'air',   maxHp: 6,  weak: ['water'],        resist: ['air'],           immune: ['earth'] },
  flower:     { element: 'earth', maxHp: 10, weak: ['fire'],         resist: ['earth'],         immune: ['water'] },
  belladonna: { element: 'earth', maxHp: 20, weak: ['fire', 'air'],  resist: ['water', 'earth'], immune: [] },
  mandrake:   { element: 'earth', maxHp: 28, weak: ['fire'],         resist: ['earth', 'water'], immune: [] },
  // Roo: o fogo é o que mais a machuca (inclusive as poções dela); a água, o que menos. 24 pontos = 6 golpes neutros.
  roo:        { element: 'water', maxHp: 24, weak: ['fire'],         resist: ['water'],        immune: [] },
  // Leão Verde: o solvente universal, que devora o sol (o ouro). A terra (sal, o que ele já dissolveu) não o toca;
  // o éter, a quintessência que ele não consegue dissolver, o fere muito; a água o dilui.
  lion:       { element: 'earth', maxHp: 28, weak: ['air'],          resist: ['water'],        immune: ['earth'] },
  // Quimera de Mercúrio: líquida, a água escorre por ela; a terra a prende. Fogo e éter machucam normal.
  chimera:    { element: 'water', maxHp: 24, weak: ['earth'],        resist: [],                immune: ['water'] },
};
