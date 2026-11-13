import { describe, expect, it } from 'vitest';
import { STAGE_SCHEMA, migrateCompleted } from '../../src/game/stages/migration';

describe('migração do progresso das fases', () => {
  it('a Névoa entrou como fase 3: as fases a partir da 3 sobem um número', () => {
    expect(migrateCompleted([1, 2, 3, 4, 7, 10], 1)).toEqual([1, 2, 4, 5, 8, 11]);
  });
  it('sem versão salva vale a versão 1; na versão atual nada muda', () => {
    expect(migrateCompleted([1, 2], 1)).toEqual([1, 2]);
    expect(migrateCompleted([1, 2, 5], STAGE_SCHEMA)).toEqual([1, 2, 5]);
  });
  it('lista vazia e repetidos', () => {
    expect(migrateCompleted([], 1)).toEqual([]);
    expect(migrateCompleted([4, 4, 3], 1)).toEqual([4, 5]);
  });
});
