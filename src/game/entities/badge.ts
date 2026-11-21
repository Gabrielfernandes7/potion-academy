// O selo da fraqueza (puro): qual elemento aparece no selinho sobre cada inimigo. É o primeiro da lista de
// fraquezas do perfil (profiles.ts). Quem não machuca (ratinho, salamandra) não leva selo: não é ameaça.
import type { ElementId } from '../../config';
import { ENEMY_TYPES, type EnemyKind } from './enemies/defs';
import { PROFILES } from './profiles';

export function weaknessBadge(kind: EnemyKind): ElementId | null {
  if (ENEMY_TYPES[kind].harmless) return null;
  return PROFILES[kind].weak[0] ?? null;
}
