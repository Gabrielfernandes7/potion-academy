import { describe, expect, it } from 'vitest';
import { BASE_HIT, damageTo, hitsToKill } from '../../src/game/entities/damage';
import { PROFILES } from '../../src/game/entities/profiles';
import { HEART_HEAL, ROO_MAX_HP, damageToRoo, healRoo, hpBarView } from '../../src/game/entities/roo';
import { CONFIG } from '../../src/config';

describe('vida da Roo', () => {
  it('usa o perfil da tabela: o fogo é a fraqueza, a água é a resistência', () => {
    expect(PROFILES.roo.weak).toEqual(['fire']);
    expect(PROFILES.roo.resist).toContain('water');
    expect(damageToRoo('fire')).toBeGreaterThan(damageToRoo('earth'));
    expect(damageToRoo('earth')).toBe(BASE_HIT);
    expect(damageToRoo('air')).toBe(BASE_HIT);
    expect(damageToRoo('water')).toBeLessThan(BASE_HIT);
    expect(damageToRoo('water')).toBeGreaterThanOrEqual(1);
  });
  it('o fogo é o elemento que mais a machuca (e nenhum outro empata)', () => {
    const els = ['fire', 'water', 'earth', 'air'] as const;
    const max = Math.max(...els.map(e => damageToRoo(e)));
    expect(damageToRoo('fire')).toBe(max);
    expect(els.filter(e => damageToRoo(e) === max)).toEqual(['fire']);
  });
  it('contato com inimigo ou chefe é dano neutro', () => {
    expect(damageToRoo()).toBe(BASE_HIT);
  });
  it('a barra tem 24 pontos: 6 golpes neutros, 4 de fogo, e nunca uma imunidade', () => {
    expect(ROO_MAX_HP).toBe(24);
    expect(CONFIG.maxHp).toBe(ROO_MAX_HP);
    expect(hitsToKill(PROFILES.roo, 'earth')).toBe(6);
    expect(hitsToKill(PROFILES.roo, 'fire')).toBe(4);
    expect(hitsToKill(PROFILES.roo, 'water')).toBeLessThan(Infinity);
    expect(damageTo(PROFILES.roo, 'water')).toBeGreaterThan(0);
  });
  it('coração cura um golpe neutro e não passa do máximo', () => {
    expect(HEART_HEAL).toBe(BASE_HIT);
    expect(healRoo(10)).toBe(10 + HEART_HEAL);
    expect(healRoo(ROO_MAX_HP - 1)).toBe(ROO_MAX_HP);
  });
  it('a barra: proporção contínua e aviso de vida baixa (um quarto ou menos)', () => {
    expect(hpBarView(24, 24)).toEqual({ ratio: 1, low: false });
    expect(hpBarView(13, 24).ratio).toBeCloseTo(13 / 24);
    expect(hpBarView(6, 24).low).toBe(true);
    expect(hpBarView(7, 24).low).toBe(false);
    expect(hpBarView(0, 24)).toEqual({ ratio: 0, low: false });
    expect(hpBarView(99, 24).ratio).toBe(1);
  });
});
