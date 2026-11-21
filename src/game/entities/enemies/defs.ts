// Dados dos inimigos comuns (sem lógica de jogo): movimento, textura e se bloqueia a casa.
// Vida, fraquezas, resistências e imunidades ficam em ../profiles.ts. Para um inimigo novo:
// acrescente o tipo em EnemyKind, uma linha em ENEMY_TYPES, o perfil em profiles.ts, a textura
// em src/textures/ e o movimento em enemies/EnemySystem.ts (MOTION). Ver docs/14-estrutura-do-codigo.md.
import type { ElementId } from '../../../config';
import { PROFILES } from '../profiles';

export type EnemyKind = 'frog' | 'ghost' | 'flower' | 'lantern' | 'clock' | 'mole' | 'owl' | 'slime' | 'sentinel' | 'rat' | 'salamander';

// Como o inimigo age: 'wander' anda ao acaso; 'stalk' anda ao acaso, mas persegue a Roo quando ela está perto
// (enemyRules.stalkDir); 'patrol' anda em linha reta e volta ao bater; 'burrow' afunda e brota perto da Roo;
// 'dive' marca a casa da Roo e mergulha nela; 'rooted' fica fixo (a flor).
export type EnemyBehavior = 'wander' | 'stalk' | 'patrol' | 'burrow' | 'dive' | 'rooted' | 'thief' | 'friend';

export interface EnemyDef {
  name: string;
  texture: string;
  moveInterval: number; // ms entre passos (Infinity: não se move)
  stepMs: number; // duração da animação de um passo
  passWalls: boolean; // atravessa muralhas, caixotes e poções
  rooted: boolean; // fixo no chão: bloqueia a casa onde está
  behavior: EnemyBehavior;
  harmless?: boolean; // não machuca ao encostar (ratinho, salamandra)
}

export const ENEMY_TYPES: Record<EnemyKind, EnemyDef> = {
  frog:   { name: 'Sapo mago',   texture: 'enemy',        moveInterval: 800,      stepMs: 300, passWalls: false, rooted: false, behavior: 'stalk' },
  ghost:  { name: 'Fantasma',    texture: 'enemy_ghost',  moveInterval: 1500,     stepMs: 700, passWalls: true,  rooted: false, behavior: 'wander' },
  flower: { name: 'Flor do mal', texture: 'enemy_flower', moveInterval: Infinity, stepMs: 300, passWalls: false, rooted: true,  behavior: 'rooted' },
  lantern: { name: 'Lanterna viva',       texture: 'enemy_lantern', moveInterval: 700,  stepMs: 280, passWalls: false, rooted: false, behavior: 'patrol' },
  clock:   { name: 'Relógio de cobre',    texture: 'enemy_clock',   moveInterval: 1000, stepMs: 380, passWalls: false, rooted: false, behavior: 'patrol' },
  mole:    { name: 'Toupeira de sal',     texture: 'enemy_mole',    moveInterval: 900,  stepMs: 320, passWalls: false, rooted: false, behavior: 'burrow' },
  slime:   { name: 'Gosma de mercúrio',  texture: 'enemy_slime',   moveInterval: 1300, stepMs: 520, passWalls: false, rooted: false, behavior: 'wander' },
  sentinel: { name: 'Sentinela de cera',  texture: 'enemy_sentinel', moveInterval: 1500, stepMs: 600, passWalls: false, rooted: false, behavior: 'patrol' },
  rat:     { name: 'Ratinho do celeiro',  texture: 'enemy_rat',     moveInterval: 380,  stepMs: 190, passWalls: false, rooted: false, behavior: 'thief', harmless: true },
  salamander: { name: 'Salamandra do caldeirão', texture: 'enemy_salamander', moveInterval: 2200, stepMs: 600, passWalls: false, rooted: false, behavior: 'friend', harmless: true },
  owl:     { name: 'Coruja do scriptorium', texture: 'enemy_owl',   moveInterval: 1100, stepMs: 400, passWalls: true,  rooted: false, behavior: 'dive' },
};

// Imunidade vem da tabela de personagens (profiles.ts).
export function isImmune(kind: EnemyKind, element: ElementId): boolean {
  return PROFILES[kind].immune.includes(element);
}
