import { describe, expect, it } from 'vitest';
import { damageTo, hitsToKill } from '../../src/game/entities/damage';
import { ENEMY_TYPES } from '../../src/game/entities/enemies/defs';
import {
  CLOCK_PAUSE_MS, CLOCK_STEPS_BETWEEN_PAUSES, MOLE_BURROW_MS, OWL_AIM_MS, RAT_ESCAPE_MS, RAT_FLEE_DISTANCE, SALAMANDER_HEAL,
  SLIME_MAX_TOTAL, moleSpot, nearestOf, patrolDir, splitHp, stealable, stepAway, stepToward,
} from '../../src/game/entities/enemies/enemyRules';
import { PROFILES } from '../../src/game/entities/profiles';
import { STAGES, stageDef } from '../../src/game/stages/index';

const open = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < 9 && y < 9;

describe('inimigos novos: tabela', () => {
  it('lanterna (fogo), relógio e toupeira (terra) e coruja (ar) têm perfil e definição', () => {
    for (const k of ['lantern', 'clock', 'mole', 'owl'] as const) {
      expect(ENEMY_TYPES[k], k).toBeDefined();
      expect(PROFILES[k], k).toBeDefined();
    }
    expect(PROFILES.lantern.element).toBe('fire');
    expect(PROFILES.owl.element).toBe('air');
  });
  it('cada um tem fraqueza e imunidade que se entendem de imediato', () => {
    expect(PROFILES.lantern.weak).toEqual(['water']);
    expect(PROFILES.lantern.immune).toEqual(['fire']);
    expect(PROFILES.clock.weak).toEqual(['water']);
    expect(PROFILES.mole.weak).toEqual(['air']);
    expect(PROFILES.owl.weak).toEqual(['earth']);
    expect(damageTo(PROFILES.lantern, 'fire')).toBe(0);
    expect(damageTo(PROFILES.lantern, 'water')).toBeGreaterThan(damageTo(PROFILES.lantern, 'air'));
    expect(hitsToKill(PROFILES.owl, 'earth')).toBeLessThan(hitsToKill(PROFILES.owl, 'fire'));
  });
  it('comportamentos: patrulha, afundar, mergulhar; só a coruja atravessa paredes', () => {
    expect(ENEMY_TYPES.lantern.behavior).toBe('patrol');
    expect(ENEMY_TYPES.clock.behavior).toBe('patrol');
    expect(ENEMY_TYPES.mole.behavior).toBe('burrow');
    expect(ENEMY_TYPES.owl.behavior).toBe('dive');
    expect(ENEMY_TYPES.owl.passWalls).toBe(true);
    expect(ENEMY_TYPES.lantern.passWalls).toBe(false);
  });
});

describe('patrulha', () => {
  it('segue em frente enquanto a casa está livre', () => {
    expect(patrolDir({ x: 3, y: 3 }, { x: 1, y: 0 }, open)).toEqual({ x: 1, y: 0 });
  });
  it('bate e volta; sem volta, vira; cercado, nada', () => {
    expect(patrolDir({ x: 3, y: 3 }, { x: 1, y: 0 }, (x, y) => open(x, y) && x !== 4)).toEqual({ x: -1, y: 0 });
    expect(patrolDir({ x: 3, y: 3 }, { x: 1, y: 0 }, (x, y) => open(x, y) && x === 3 && y !== 3 ? true : false)).toEqual({ x: 0, y: 1 });
    expect(patrolDir({ x: 3, y: 3 }, { x: 1, y: 0 }, () => false)).toBeNull();
  });
  it('o relógio de cobre trava por 2 s a cada volta de 8 passos', () => {
    expect(CLOCK_PAUSE_MS).toBe(2000);
    expect(CLOCK_STEPS_BETWEEN_PAUSES).toBe(8);
  });
});

describe('toupeira de sal e coruja', () => {
  it('a toupeira brota a 2 ou 3 passos da Roo, nunca na dela nem numa vizinha', () => {
    for (const pick of [0, 0.3, 0.7, 0.999]) {
      const t = moleSpot({ x: 4, y: 4 }, open, 9, 9, pick)!;
      const d = Math.abs(t.x - 4) + Math.abs(t.y - 4);
      expect(d).toBeGreaterThanOrEqual(2);
      expect(d).toBeLessThanOrEqual(3);
      expect(t.x).toBeGreaterThanOrEqual(1);
      expect(t.x).toBeLessThanOrEqual(7);
    }
  });
  it('sem casa livre, não brota; o monte avisa por mais de um segundo e o círculo da coruja por 1 s', () => {
    expect(moleSpot({ x: 4, y: 4 }, () => false, 9, 9, 0.5)).toBeNull();
    expect(MOLE_BURROW_MS).toBeGreaterThan(1000);
    expect(OWL_AIM_MS).toBe(1000);
  });
});

describe('Observatório', () => {
  const obs = STAGES.filter(s => s.chapter === 'O OBSERVATÓRIO');
  it('tem 4 fases no tema do observatório: três com porta e a cúpula do Ouroboros, sem porta', () => {
    expect(obs).toHaveLength(4);
    for (const s of obs) expect(s.theme).toBe('observatory');
    expect(obs.slice(0, 3).every(s => s.door && !s.boss)).toBe(true);
    expect(obs[3]).toMatchObject({ kind: 'boss', boss: 'ouroboros', door: false });
  });
  it('usa os inimigos novos e o Retorno vem depois', () => {
    const kinds = new Set(obs.flatMap(s => s.enemies.map(e => e.kind)));
    for (const k of ['lantern', 'clock', 'mole', 'owl']) expect(kinds.has(k as never), k).toBe(true);
    expect(stageDef(17).chapter).toBe('O RETORNO');
  });
});

describe('gosma, sentinela, ratinho e salamandra', () => {
  it('perfis: a gosma resiste à água e se prende na terra; a sentinela derrete no fogo; o ratinho teme o fogo', () => {
    expect(PROFILES.slime.weak).toEqual(['earth']);
    expect(PROFILES.slime.immune).toEqual(['water']);
    expect(PROFILES.sentinel.weak).toEqual(['fire']);
    expect(PROFILES.sentinel.resist).toEqual(['earth']);
    expect(PROFILES.rat.weak).toEqual(['fire']);
    expect(PROFILES.salamander.weak).toEqual(['water']);
    expect(PROFILES.salamander.immune).toEqual(['fire']);
  });
  it('o ratinho e a salamandra não machucam; os outros, sim', () => {
    expect(ENEMY_TYPES.rat.harmless).toBe(true);
    expect(ENEMY_TYPES.salamander.harmless).toBe(true);
    expect(ENEMY_TYPES.slime.harmless).toBeUndefined();
    expect(ENEMY_TYPES.sentinel.harmless).toBeUndefined();
  });
  it('a sentinela marcha devagar (patrulha) e o ratinho é o mais rápido', () => {
    expect(ENEMY_TYPES.sentinel.behavior).toBe('patrol');
    expect(ENEMY_TYPES.rat.behavior).toBe('thief');
    expect(ENEMY_TYPES.rat.moveInterval).toBeLessThan(ENEMY_TYPES.frog.moveInterval);
    expect(ENEMY_TYPES.sentinel.moveInterval).toBeGreaterThan(ENEMY_TYPES.frog.moveInterval);
  });
  it('a gosma se divide em duas metades, a maior com a original; vida 1 não divide', () => {
    expect(splitHp(8)).toEqual({ keep: 4, spawn: 4 });
    expect(splitHp(5)).toEqual({ keep: 3, spawn: 2 });
    expect(splitHp(2)).toEqual({ keep: 1, spawn: 1 });
    expect(splitHp(1)).toBeNull();
    expect(SLIME_MAX_TOTAL).toBeGreaterThanOrEqual(4);
  });
  it('o ratinho vai ao item mais perto e foge da Roo', () => {
    expect(stepToward({ x: 2, y: 2 }, { x: 6, y: 2 }, open)).toEqual({ x: 1, y: 0 });
    expect(stepToward({ x: 2, y: 2 }, { x: 2, y: 2 }, open)).toBeNull();
    const away = stepAway({ x: 4, y: 4 }, { x: 3, y: 4 }, open)!;
    expect(Math.abs(4 + away.x - 3) + Math.abs(4 + away.y - 4)).toBe(2); // ficou mais longe
    expect(stepAway({ x: 4, y: 4 }, { x: 3, y: 4 }, (x, y) => open(x, y) && y === 4 && x !== 5)).toBeNull();
    expect(nearestOf({ x: 0, y: 0 }, [{ x: 5, y: 5 }, { x: 1, y: 2 }])).toEqual({ x: 1, y: 2 });
    expect(nearestOf({ x: 0, y: 0 }, [])).toBeNull();
    expect(RAT_FLEE_DISTANCE).toBe(3);
    expect(RAT_ESCAPE_MS).toBeGreaterThan(2000);
  });
  it('o ratinho leva de tudo, menos gema (a porta não abriria mais)', () => {
    expect(stealable('gem')).toBe(false);
    for (const t of ['heart', 'chest', 'bomb_up', 'fire_up', 'speed_up', 'time_up']) expect(stealable(t), t).toBe(true);
  });
  it('a salamandra cura uma vez; as fases certas a usam', () => {
    expect(SALAMANDER_HEAL).toBeGreaterThan(0);
    expect(stageDef(1).enemies.map(e => e.kind)).toContain('salamander');
    expect(STAGES.some(s => s.enemies.some(e => e.kind === 'slime'))).toBe(true);
    expect(STAGES.some(s => s.enemies.some(e => e.kind === 'sentinel'))).toBe(true);
    expect(STAGES.some(s => s.enemies.some(e => e.kind === 'rat'))).toBe(true);
  });
});
