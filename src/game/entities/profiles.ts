// Tabela de personagens: atributo principal, vida, fraquezas, resistências e imunidades.
// É o único lugar para ajustar o equilíbrio entre elementos e personagens (a regra de cálculo está em damage.ts).
// Para um personagem novo: acrescente o id em EntityId e uma linha em PROFILES; o teste de
// tests/entities/damage.test.ts confere a coerência da tabela.
import type { DamageProfile } from './damage';

export type EntityId = 'frog' | 'ghost' | 'flower' | 'lantern' | 'clock' | 'mole' | 'owl' | 'belladonna' | 'mandrake' | 'chimera' | 'roo' | 'lion';

// Quem ensina cada regra ao jogador: o sapo (água, terra), o fantasma (água benta), a flor (fogo)...
export const PROFILES: Record<EntityId, DamageProfile> = {
  frog:       { element: 'water', maxHp: 6,  weak: ['earth'],        resist: ['water'],         immune: [] },
  ghost:      { element: 'air',   maxHp: 6,  weak: ['water'],        resist: ['air'],           immune: ['earth'] },
  flower:     { element: 'earth', maxHp: 10, weak: ['fire'],         resist: ['earth'],         immune: ['water'] },
  // Lanterna viva: chama de lamparina, a água a apaga; o fogo não a fere.
  lantern:    { element: 'fire',  maxHp: 6,  weak: ['water'],        resist: [],                immune: ['fire'] },
  // Relógio de cobre: autômato de bronze; a água o enferruja, a terra (o que ele é) não o toca.
  clock:      { element: 'earth', maxHp: 10, weak: ['water'],        resist: ['fire'],          immune: ['earth'] },
  // Toupeira de sal: vive debaixo da terra; o ar a tira do buraco. A terra não a toca.
  mole:       { element: 'earth', maxHp: 8,  weak: ['air'],          resist: [],                immune: ['earth'] },
  // Coruja do scriptorium: ave de ar; a terra a derruba (pesa no ar).
  owl:        { element: 'air',   maxHp: 6,  weak: ['earth'],        resist: ['air'],           immune: [] },
  belladonna: { element: 'earth', maxHp: 20, weak: ['fire', 'air'],  resist: ['water', 'earth'], immune: [] },
  mandrake:   { element: 'earth', maxHp: 28, weak: ['fire'],         resist: ['earth', 'water'], immune: [] },
  // Roo: o fogo é o que mais a machuca (inclusive as poções dela); a água, o que menos. 24 pontos = 6 golpes neutros.
  roo:        { element: 'water', maxHp: 24, weak: ['fire'],         resist: ['water'],        immune: [] },
  // Leão Verde: o solvente universal, que devora o sol (o ouro). A terra (sal, o que ele já dissolveu) não o toca;
  // o ar, a quintessência que ele não consegue dissolver, o fere muito; a água o dilui.
  lion:       { element: 'earth', maxHp: 28, weak: ['air'],          resist: ['water'],        immune: ['earth'] },
  // Quimera de Mercúrio: líquida, a água escorre por ela; a terra a prende. Fogo e ar machucam normal.
  chimera:    { element: 'water', maxHp: 24, weak: ['earth'],        resist: [],                immune: ['water'] },
};
