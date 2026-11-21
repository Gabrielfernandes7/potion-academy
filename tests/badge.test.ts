import { describe, expect, it } from 'vitest';
import { weaknessBadge } from '../src/game/entities/badge';
import { ENEMY_TYPES, type EnemyKind } from '../src/game/entities/enemies/defs';
import { PROFILES } from '../src/game/entities/profiles';

const KINDS = Object.keys(ENEMY_TYPES) as EnemyKind[];

describe('selo da fraqueza', () => {
  it('mostra o primeiro elemento que fere o inimigo', () => {
    expect(weaknessBadge('ghost')).toBe('water');
    expect(weaknessBadge('slime')).toBe('earth');
    expect(weaknessBadge('sentinel')).toBe('fire');
    expect(weaknessBadge('mole')).toBe('air');
  });

  it('quem não machuca (ratinho, salamandra) não leva selo', () => {
    expect(weaknessBadge('rat')).toBeNull();
    expect(weaknessBadge('salamander')).toBeNull();
  });

  it('todo inimigo que machuca tem selo, e ele é de fato uma fraqueza do perfil', () => {
    for (const kind of KINDS) {
      const badge = weaknessBadge(kind);
      if (ENEMY_TYPES[kind].harmless) continue;
      expect(badge, kind).not.toBeNull();
      expect(PROFILES[kind].weak, kind).toContain(badge);
    }
  });
});
