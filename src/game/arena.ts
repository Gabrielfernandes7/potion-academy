// Arena de treino (puro, testável): enfrente os chefes quando quiser, sem mexer na campanha. Cada luta é uma
// fase de chefe montada na hora (ARENA_STAGE = 0, fora de STAGES), com tempo de sobra e todas as poções
// liberadas. Vencer só guarda o chefe como vencido (abre a página dele no Manuscrito).
import type { BlockStyle } from './stages/blockStyles';
import { CHEST_RICH } from './stages/chests';
import type { BossId, StageDef, StageTheme } from './stages/types';
import { BOSS_DEFS, BOSS_IDS, bossIdleTexture } from './entities/bosses/defs';
import type { EntityId } from './entities/profiles';

export const ARENA_STAGE = 0;
export const ARENA_TIME_MS = 600000; // 10 min: o treino não tem pressa

export interface ArenaBoss {
  id: BossId;
  nome: string;
  perfil: EntityId;
  lugar: string; // de onde ele vem
  dica: string; // como enfrentar
  sprite: string; // textura mostrada no cartão
  theme: StageTheme;
  block: BlockStyle;
}

// A lista vem do registro de chefes (entities/bosses/defs.ts): um chefe novo aparece aqui sozinho.
export const ARENA_BOSSES: readonly ArenaBoss[] = BOSS_IDS.map(id => {
  const d = BOSS_DEFS[id];
  return { id, perfil: d.profile, sprite: bossIdleTexture(id), ...d.arena };
});

export function arenaBoss(id: string): ArenaBoss | undefined {
  return ARENA_BOSSES.find(b => b.id === id);
}

/** A fase de chefe da Arena: sem porta, sem inimigos comuns e com o chão e o bloco da casa dele. */
export function arenaStageDef(id: BossId): StageDef {
  const b = arenaBoss(id);
  if (!b) throw new Error(`Chefe fora da Arena: ${id}`);
  return {
    kind: 'boss', boss: b.id, name: b.nome.toUpperCase(), place: 'Arena de Treino',
    story: `Treino contra ${b.nome}. Nada aqui conta para a jornada.`, tip: b.dica,
    chest: CHEST_RICH, time: ARENA_TIME_MS, blockChance: 0.4, door: false, enemies: [],
    theme: b.theme, block: b.block, track: 'duelo', chapter: 'ARENA',
  };
}
