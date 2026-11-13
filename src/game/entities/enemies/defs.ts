// Dados dos inimigos comuns (sem lógica de jogo): movimento, textura e se bloqueia a casa.
// Vida, fraquezas, resistências e imunidades ficam em ../profiles.ts. Para um inimigo novo:
// acrescente o tipo em EnemyKind, uma linha em ENEMY_TYPES, o perfil em profiles.ts, a textura
// em src/textures/ e o movimento em enemies/EnemySystem.ts (MOTION). Ver docs/14-estrutura-do-codigo.md.
import type { ElementId } from '../../../config';
import { PROFILES } from '../profiles';

export type EnemyKind = 'frog' | 'ghost' | 'flower';

export interface EnemyDef {
  name: string;
  texture: string;
  moveInterval: number; // ms entre passos (Infinity: não se move)
  stepMs: number; // duração da animação de um passo
  passWalls: boolean; // atravessa muralhas, caixotes e poções
  rooted: boolean; // fixo no chão: bloqueia a casa onde está
}

export const ENEMY_TYPES: Record<EnemyKind, EnemyDef> = {
  frog:   { name: 'Sapo mago',   texture: 'enemy',        moveInterval: 800,      stepMs: 300, passWalls: false, rooted: false },
  ghost:  { name: 'Fantasma',    texture: 'enemy_ghost',  moveInterval: 1500,     stepMs: 700, passWalls: true,  rooted: false },
  flower: { name: 'Flor do mal', texture: 'enemy_flower', moveInterval: Infinity, stepMs: 300, passWalls: false, rooted: true  },
};

// Imunidade vem da tabela de personagens (profiles.ts).
export function isImmune(kind: EnemyKind, element: ElementId): boolean {
  return PROFILES[kind].immune.includes(element);
}
