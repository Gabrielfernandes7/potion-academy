import { describe, expect, it } from 'vitest';
import { ENEMY_TYPES, isImmune } from '../../src/game/entities/enemies/defs';
import { LAST_STAGE, STAGES, stageDef } from '../../src/game/stages/index';

describe('fases', () => {
  it('são onze: Vale (três), Torre (três e o duelo), Retorno (três e o jardim)', () => {
    expect(STAGES.map(s => s.kind)).toEqual(['lab', 'crypt', 'crypt', 'crypt', 'crypt', 'crypt', 'boss', 'crypt', 'crypt', 'crypt', 'garden']);
    expect(LAST_STAGE).toBe(11);
  });

  it('a fase 1 não tem fantasmas nem flores do mal', () => {
    const kinds = stageDef(1).enemies.map(e => e.kind);
    expect(kinds).not.toContain('ghost');
    expect(kinds).not.toContain('flower');
  });

  it('os chefes: Belladona na Torre, Mandrágora no jardim; só o duelo não tem porta', () => {
    expect(stageDef(7).boss).toBe('belladonna');
    expect(stageDef(11).boss).toBe('mandrake');
    expect(STAGES.filter(s => s.boss)).toHaveLength(2);
  });

  it('só o duelo não tem porta nem inimigos comuns', () => {
    for (const s of STAGES) {
      expect(s.door).toBe(s.kind !== 'boss');
      if (s.kind === 'boss') expect(s.enemies).toHaveLength(0);
    }
  });

  it('o jardim só tem as flores que a Mandrágora faz brotar; o salão tem fantasmas', () => {
    expect(stageDef(11).enemies.map(e => e.kind)).toEqual(['flower']);
    expect(stageDef(11).enemies[0].start).toBe(0);
    expect(stageDef(2).enemies.map(e => e.kind)).toContain('ghost');
  });

  it('cada regra de inimigo é coerente: início dentro do máximo; flores não se multiplicam', () => {
    for (const s of STAGES) {
      for (const r of s.enemies) {
        expect(r.start).toBeLessThanOrEqual(r.max);
        if (ENEMY_TYPES[r.kind].rooted) expect(r.every).toBeUndefined();
      }
    }
  });

  it('stageDef ajusta números fora do intervalo', () => {
    expect(stageDef(0).kind).toBe('lab');
    expect(stageDef(99).kind).toBe('garden');
  });
});

describe('inimigos', () => {
  it('o fantasma atravessa paredes e é mais lento que o sapo', () => {
    expect(ENEMY_TYPES.ghost.passWalls).toBe(true);
    expect(ENEMY_TYPES.frog.passWalls).toBe(false);
    expect(ENEMY_TYPES.ghost.moveInterval).toBeGreaterThan(ENEMY_TYPES.frog.moveInterval);
  });

  it('a flor do mal é fixa e imune à água, e só à água', () => {
    expect(ENEMY_TYPES.flower.rooted).toBe(true);
    expect(isImmune('flower', 'water')).toBe(true);
    for (const e of ['fire', 'earth', 'air'] as const) expect(isImmune('flower', e)).toBe(false);
  });

  it('sapos não são imunes a nada; fantasmas só à Telúrica', () => {
    for (const e of ['fire', 'water', 'earth', 'air'] as const) {
      expect(isImmune('frog', e)).toBe(false);
      expect(isImmune('ghost', e)).toBe(e === 'earth');
    }
  });
});
