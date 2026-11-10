import { describe, expect, it } from 'vitest';
import { ENEMY_TYPES, LAST_STAGE, STAGES, isImmune, stageDef } from '../src/config';

describe('fases', () => {
  it('são quatro, na ordem: laboratório, salão dos fantasmas, duelo e jardim', () => {
    expect(STAGES.map(s => s.kind)).toEqual(['lab', 'crypt', 'boss', 'garden']);
    expect(LAST_STAGE).toBe(4);
  });

  it('a fase 1 não tem fantasmas nem flores do mal', () => {
    const kinds = stageDef(1).enemies.map(e => e.kind);
    expect(kinds).not.toContain('ghost');
    expect(kinds).not.toContain('flower');
  });

  it('só o duelo não tem porta nem inimigos comuns', () => {
    for (const s of STAGES) {
      expect(s.door).toBe(s.kind !== 'boss');
      if (s.kind === 'boss') expect(s.enemies).toHaveLength(0);
    }
  });

  it('o jardim tem sapos e flores do mal; o salão tem fantasmas', () => {
    expect(stageDef(4).enemies.map(e => e.kind).sort()).toEqual(['flower', 'frog']);
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

  it('sapos e fantasmas não são imunes a nada', () => {
    for (const e of ['fire', 'water', 'earth', 'air'] as const) {
      expect(isImmune('frog', e)).toBe(false);
      expect(isImmune('ghost', e)).toBe(false);
    }
  });
});
