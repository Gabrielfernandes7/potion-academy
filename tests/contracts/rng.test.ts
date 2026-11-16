import { describe, expect, it } from 'vitest';

// Sorteio de jogabilidade (mapa, itens, inimigos, ataques de chefe) passa por game/rng.ts, para a semente valer.
// Falas dos chefes e o cochilo da Roo são só enfeite e podem usar Math.random.
const ALLOWED = [/rng\.ts$/, /lines\.ts$/, /SleepSystem\.ts$/];
const files = import.meta.glob('../../src/game/**/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

describe('contrato: sorteios de jogabilidade usam a fonte com semente', () => {
  it('nada em src/game usa Math.random fora da lista de enfeites', () => {
    expect(Object.keys(files).length).toBeGreaterThan(20);
    const bad = Object.entries(files)
      .filter(([f, src]) => !ALLOWED.some(r => r.test(f)) && /Math\.random/.test(src))
      .map(([f]) => f);
    expect(bad).toEqual([]);
  });
});
