import { describe, expect, it } from 'vitest';
import { PLACAS_DAS_FASES, placaDaFase } from '../src/game/stageArt';
import { STAGES } from '../src/game/stages/index';
import { PLACAS, SPRITES_DAS_PLACAS } from '../src/pages/placas';
import type { Ctx } from '../src/pages/livroDraw';

function contextoFalso(registro: number[][]): Ctx {
  const alvo: Record<string, unknown> = {};
  return new Proxy(alvo, {
    get: (_t, nome: string) => (nome in alvo ? alvo[nome] : (...args: unknown[]): void => { registro.push(args.filter((a): a is number => typeof a === 'number')); }),
    set: (_t, nome: string, v) => { alvo[nome] = v; return true; },
  }) as unknown as Ctx;
}

describe('a gravura que abre cada fase', () => {
  it('há uma para cada fase da campanha, na ordem das fases', () => {
    expect(PLACAS_DAS_FASES).toHaveLength(STAGES.length);
    expect(PLACAS_DAS_FASES).toHaveLength(20);
  });
  it('toda gravura existe, e a Biblioteca usa as 4 partes, o Observatório 3 e a Torre 2, uma de cada vez', () => {
    for (const p of PLACAS_DAS_FASES) expect(typeof PLACAS[p.placa], p.placa).toBe('function');
    const variantes = (id: string): number[] => PLACAS_DAS_FASES.filter(p => p.placa === id).map(p => p.variante);
    expect(variantes('biblioteca')).toEqual([0, 1, 2, 3]);
    expect(variantes('observatorio')).toEqual([0, 1, 2]);
    expect(variantes('torre')).toEqual([0, 1]);
  });
  it('cada capítulo tem a sua cara: o chefe de cada um abre com a gravura do chefe ou do lugar dele', () => {
    const chefe = (i: number): string => placaDaFase(i).placa;
    expect(chefe(4)).toBe('poco'); // Quimera
    expect(chefe(8)).toBe('duelo'); // Belladona
    expect(chefe(12)).toBe('biblioteca'); // Leão Verde
    expect(chefe(16)).toBe('ciclo'); // Ouroboros
    expect(chefe(20)).toBe('retorno'); // Mandrágora e o portão
  });
  it('a Arena e o duelo usam a gravura do duelo; fase fora do intervalo também', () => {
    expect(placaDaFase(0).placa).toBe('duelo');
    expect(placaDaFase(99).placa).toBe('duelo');
  });
  it('cada gravura roda em vários instantes e variantes, sem erro e sem NaN', () => {
    for (const p of PLACAS_DAS_FASES) {
      for (const t of [0, 1.3, 7.9, 33]) {
        const reg: number[][] = [];
        expect(() => PLACAS[p.placa](contextoFalso(reg), t, {}, p.variante), `${p.placa}/${p.variante} t=${t}`).not.toThrow();
        expect(reg.length).toBeGreaterThan(10);
        // uma só asserção por gravura: um expect por número (centenas de milhares) custava ~2 s e não o jogo
        const ruins = reg.filter(args => args.some(n => !Number.isFinite(n))).map(args => args.join(','));
        expect(ruins, `${p.placa}/${p.variante} t=${t}`).toEqual([]);
      }
    }
  });
  it('as gravuras de lugar pedem os sprites dos inimigos e dos chefes que mostram', () => {
    for (const k of ['chimera_idle_0', 'lion_idle_0', 'enemy_lantern', 'enemy_clock', 'enemy_owl']) expect(SPRITES_DAS_PLACAS).toContain(k);
  });
});
