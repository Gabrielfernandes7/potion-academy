import { describe, expect, it } from 'vitest';
import { STAGE_SCHEMA, migrateCompleted } from '../../src/game/stages/migration';

describe('migração do progresso das fases', () => {
  it('a Névoa entrou como fase 3: as fases a partir da 3 sobem um número', () => {
    expect(migrateCompleted([1, 2, 3, 4, 7, 10], 1).slice(0, 2)).toEqual([1, 2]);
    expect(migrateCompleted([1, 2, 3], 1)).toEqual([1, 2, 5]); // 3 -> 4 (Névoa) -> 5 (Poço)
  });
  it('o Poço entrou como fase 4: da versão 2 para a 3, as fases a partir da 4 sobem um número', () => {
    expect(migrateCompleted([1, 2, 3, 4, 7, 10], 2)).toEqual([1, 2, 3, 5, 8, 11]);
  });
  it('de ponta a ponta, da versão 1 à atual', () => {
    expect(migrateCompleted([1, 2, 3, 4, 7, 10], 1)).toEqual([1, 2, 5, 6, 9, 12]);
  });
  it('sem versão salva vale a versão 1; na versão atual nada muda', () => {
    expect(migrateCompleted([1, 2], 1)).toEqual([1, 2]);
    expect(migrateCompleted([1, 2, 5], STAGE_SCHEMA)).toEqual([1, 2, 5]);
  });
  it('lista vazia e repetidos', () => {
    expect(migrateCompleted([], 1)).toEqual([]);
    expect(migrateCompleted([4, 4, 3], 1)).toEqual([5, 6]);
  });
});
