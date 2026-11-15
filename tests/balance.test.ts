import { describe, expect, it } from 'vitest';
import { BOMB_ORDER, BOMB_TYPES, CONFIG } from '../src/config';
import { crossTiles, dominates } from '../src/game/balance';

describe('equilíbrio das poções', () => {
  it('nenhuma poção é melhor que outra em tudo (todas têm um motivo para existir)', () => {
    for (const a of BOMB_ORDER) {
      for (const b of BOMB_ORDER) {
        if (a === b) continue;
        expect(dominates(BOMB_TYPES[b], BOMB_TYPES[a]), `${b} domina ${a}`).toBe(false);
      }
    }
  });

  it('o raio das poções pagas não passa de 3 (mapa de 15 x 13)', () => {
    for (const id of BOMB_ORDER) expect(BOMB_TYPES[id].radius).toBeLessThanOrEqual(3);
  });

  it('a poção inicial é a de fogo; as outras são aprendidas na jornada (learning.ts)', () => {
    expect(BOMB_ORDER[0]).toBe('normal');
  });

  it('crossTiles conta as casas de uma cruz', () => {
    expect(crossTiles(2)).toBe(9);
    expect(crossTiles(3)).toBe(13);
  });
});

describe('limites dos power-ups', () => {
  it('a soma dos limites não deixa a personagem forte demais', () => {
    expect(CONFIG.maxBombs + CONFIG.maxBombUp).toBeLessThanOrEqual(5);
    expect(CONFIG.maxFireUp).toBeLessThanOrEqual(3);
    expect(CONFIG.maxSpeedUp).toBeLessThanOrEqual(2);
  });
});

describe('chefe', () => {
  it('o aviso no chão dá tempo de reagir (pelo menos 1 s)', () => {
    expect(CONFIG.bossTelegraphMs).toBeGreaterThanOrEqual(1000);
  });
  it('o intervalo da fase furiosa é menor, mas ainda justo', () => {
    expect(CONFIG.bossFuriousCooldownMs).toBeLessThan(CONFIG.bossCooldownMs);
    expect(CONFIG.bossFuriousCooldownMs).toBeGreaterThan(CONFIG.bossTelegraphMs);
  });
});
