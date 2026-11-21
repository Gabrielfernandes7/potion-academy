// Issue #17: o sapo persegue a Roo quando ela está perto, e só então. Regra pura (enemyRules.stalkDir) e a conta
// de equilíbrio: a Roo tem de conseguir fugir dele andando, e ele tem de chegar nela se ela ficar parada.
import { describe, expect, it } from 'vitest';
import { CONFIG } from '../../src/config';
import { ENEMY_TYPES } from '../../src/game/entities/enemies/defs';
import { STALK_NOTICE_DISTANCE, stalkDir } from '../../src/game/entities/enemies/enemyRules';

const open = () => true;

describe('perseguição curta (stalkDir)', () => {
  it('o sapo é o único que persegue; os outros continuam como estavam', () => {
    expect(ENEMY_TYPES.frog.behavior).toBe('stalk');
    expect(ENEMY_TYPES.ghost.behavior).toBe('wander');
    expect(ENEMY_TYPES.slime.behavior).toBe('wander');
  });

  it('longe (mais de 2 casas) não persegue: devolve null e o sapo anda ao acaso', () => {
    expect(stalkDir({ x: 5, y: 5 }, { x: 8, y: 5 }, open)).toBeNull();
    expect(stalkDir({ x: 5, y: 5 }, { x: 7, y: 7 }, open)).toBeNull();
  });

  it('perto (até 2 casas) dá o passo que aproxima, na direção da Roo', () => {
    expect(stalkDir({ x: 5, y: 5 }, { x: 7, y: 5 }, open)).toEqual({ x: 1, y: 0 });
    expect(stalkDir({ x: 5, y: 5 }, { x: 4, y: 4 }, open)).not.toBeNull();
    const d = stalkDir({ x: 5, y: 5 }, { x: 4, y: 4 }, open);
    // o passo reduz a distância até a Roo (Manhattan)
    expect(Math.abs(5 + (d?.x ?? 0) - 4) + Math.abs(5 + (d?.y ?? 0) - 4)).toBeLessThan(2);
  });

  it('se a casa da Roo está bloqueada pela parede, procura outro caminho ou desiste', () => {
    // a Roo está a 2 casas à direita; a casa do meio está bloqueada: ele não atravessa
    const blocked = (x: number, y: number) => !(x === 6 && y === 5);
    expect(stalkDir({ x: 5, y: 5 }, { x: 7, y: 5 }, blocked)).toBeNull();
    // se só a vertical está livre, ela não aproxima (a distância não cai): ele fica
    const onlyUp = (x: number, y: number) => x === 5 && y === 4;
    expect(stalkDir({ x: 5, y: 5 }, { x: 7, y: 5 }, onlyUp)).toBeNull();
  });

  it('o alcance é uma constante de regra (2 casas) e pode ser trocado no teste', () => {
    expect(STALK_NOTICE_DISTANCE).toBe(2);
    expect(stalkDir({ x: 5, y: 5 }, { x: 8, y: 5 }, open, 3)).toEqual({ x: 1, y: 0 });
  });
});

describe('equilíbrio do sapo perseguidor', () => {
  it('a Roo, andando, sempre escapa do sapo: ele é mais lento que ela', () => {
    // a Roo sem power-up leva baseMoveDuration por casa; o sapo leva moveInterval por passo.
    // Com a velocidade máxima a Roo fica ainda mais rápida (ver game/movement.ts), então a folga só cresce.
    expect(ENEMY_TYPES.frog.moveInterval).toBeGreaterThan(CONFIG.baseMoveDuration * 2);
  });

  it('parada 2 s (o pavio de Fogo), o sapo dá ao menos 2 passos: a espera perto dele é o risco', () => {
    const fuseMs = 2000;
    expect(Math.floor(fuseMs / ENEMY_TYPES.frog.moveInterval)).toBeGreaterThanOrEqual(2);
  });
});
