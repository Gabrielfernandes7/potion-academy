import { describe, expect, it } from 'vitest';
import { DIARY, unlockedEntries } from '../src/game/diary';

describe('diário da Roo', () => {
  it('sem fases vencidas, só a primeira página está aberta', () => {
    expect(unlockedEntries([]).map(e => e.stage)).toEqual([0]);
  });
  it('cada fase vencida abre a sua página', () => {
    expect(unlockedEntries([1, 3]).map(e => e.stage)).toEqual([0, 1, 3]);
  });
  it('há uma página para cada fase do jogo', () => {
    expect(DIARY.map(e => e.stage)).toEqual([0, 1, 2, 3, 4]);
  });
});
