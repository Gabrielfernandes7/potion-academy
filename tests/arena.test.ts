import { describe, expect, it } from 'vitest';
import { ARENA_BOSSES, ARENA_STAGE, ARENA_TIME_MS, arenaBoss, arenaStageDef } from '../src/game/arena';
import { canUseBomb, inArenaLoadout, setArenaLoadout } from '../src/game/loadout';
import { PROFILES } from '../src/game/entities/profiles';
import { BLOCK_TEXTURE } from '../src/game/stages/blockStyles';
import { LAST_STAGE, STAGES } from '../src/game/stages/index';
import type { BossId } from '../src/game/stages/types';

const ALL_BOSSES: BossId[] = ['belladonna', 'mandrake', 'chimera', 'lion'];

describe('Arena de treino', () => {
  it('tem todos os chefes do jogo, inclusive o Leão Verde, sem repetir', () => {
    expect(ARENA_BOSSES.map(b => b.id).sort()).toEqual([...ALL_BOSSES].sort());
    for (const b of ARENA_BOSSES) expect(PROFILES[b.perfil], b.id).toBeDefined();
  });
  it('cada chefe tem nome, lugar, dica, desenho e bloco', () => {
    for (const b of ARENA_BOSSES) {
      for (const t of [b.nome, b.lugar, b.dica, b.sprite]) expect(t.trim()).not.toBe('');
      expect(BLOCK_TEXTURE[b.block]).toBeTruthy();
    }
    expect(arenaBoss('lion')!.nome).toBe('Leão Verde');
    expect(arenaBoss('nada')).toBeUndefined();
  });
  it('a luta é uma fase de chefe sem porta nem inimigos comuns, com tempo de sobra', () => {
    for (const b of ARENA_BOSSES) {
      const d = arenaStageDef(b.id);
      expect(d.kind).toBe('boss');
      expect(d.boss).toBe(b.id);
      expect(d.door).toBe(false);
      expect(d.enemies).toEqual([]);
      expect(d.time).toBe(ARENA_TIME_MS);
      expect(d.block).toBe(b.block);
    }
  });
  it('não mexe na campanha: a Arena não é uma fase de STAGES', () => {
    expect(ARENA_STAGE).toBe(0);
    expect(STAGES.some(s => s.name === 'ARENA' || s.chapter === 'ARENA')).toBe(false);
    expect(LAST_STAGE).toBe(STAGES.length);
    expect(() => arenaStageDef('nada' as BossId)).toThrow();
  });
  it('o Leão Verde só existe na Arena por enquanto (a Biblioteca está selada)', () => {
    expect(STAGES.some(s => s.boss === 'lion')).toBe(false);
    expect(arenaStageDef('lion').block).toBe('books');
  });
});

describe('equipamento de treino', () => {
  it('na Arena todas as poções estão liberadas; fora dela, só as compradas', () => {
    setArenaLoadout(false);
    expect(inArenaLoadout()).toBe(false);
    expect(canUseBomb('normal')).toBe(true);
    expect(canUseBomb('remote')).toBe(false);
    setArenaLoadout(true);
    expect(canUseBomb('remote')).toBe(true);
    expect(canUseBomb('mega')).toBe(true);
    setArenaLoadout(false);
  });
});
