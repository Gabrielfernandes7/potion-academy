// Regra do docs/21-desempenho.md: nenhum emissor de partículas por efeito. Os emissores nascem no reservatório
// (game/fx/particlePool.ts); fora dele, só as cenas de vida longa e fixa abaixo podem criar um (uma vez, ao abrir).
import { describe, expect, it } from 'vitest';

const sources = import.meta.glob<string>('/src/**/*.ts', { query: '?raw', import: 'default', eager: true });

const ALLOWED = [
  '/src/game/fx/particlePool.ts', // o próprio reservatório
  '/src/scenes/EndScene.ts',      // a cena final: dois emissores criados uma vez, vivem até a cena fechar
];

describe('desempenho: partículas', () => {
  it('só o reservatório (e a cena final) cria emissores com add.particles', () => {
    const offenders = Object.entries(sources)
      .filter(([file, src]) => /\badd\.particles\(/.test(src) && !ALLOWED.includes(file))
      .map(([file]) => file);
    expect(offenders, 'use fxPool(scene).burst(...) em vez de add.particles').toEqual([]);
  });

  it('a lista de exceções não ficou velha', () => {
    for (const file of ALLOWED) expect(Object.keys(sources), file).toContain(file);
  });
});
