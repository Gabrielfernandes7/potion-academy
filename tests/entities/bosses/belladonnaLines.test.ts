import { describe, expect, it } from 'vitest';
import { BOSS_LINES, pickBossLine } from '../../../src/game/entities/bosses/belladonna/lines';

describe('falas da Belladona', () => {
  it('todo tipo de fala tem pelo menos uma frase curta', () => {
    for (const [kind, list] of Object.entries(BOSS_LINES)) {
      expect(list.length, kind).toBeGreaterThan(0);
      for (const line of list) expect(line.length, line).toBeLessThanOrEqual(28);
    }
  });
  it('o sorteio cobre a lista inteira e nunca estoura o índice', () => {
    expect(pickBossLine('hurt', 0)).toBe(BOSS_LINES.hurt[0]);
    expect(pickBossLine('hurt', 0.999)).toBe(BOSS_LINES.hurt[BOSS_LINES.hurt.length - 1]);
  });
});
