import { describe, expect, it } from 'vitest';
import { BASE_HIT, damageTo, hitsToKill } from '../../src/game/entities/damage';
import { PROFILES } from '../../src/game/entities/profiles';
import { HEART_HEAL, HP_GREEN, HP_RED, HP_YELLOW, ROO_MAX_HP, damageToRoo, healRoo, hpBarView, hpColor } from '../../src/game/entities/roo';
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
    expect(hpBarView(24, 24)).toEqual({ ratio: 1 });
    expect(hpBarView(13, 24).ratio).toBeCloseTo(13 / 24);
    expect(hpBarView(0, 24)).toEqual({ ratio: 0 });
    expect(hpBarView(99, 24).ratio).toBe(1);
  });
});

describe('cor da barra de vida', () => {
  it('verde com a vida cheia, amarela na metade, vermelha perto de zero', () => {
    expect(hpColor(1)).toBe(HP_GREEN);
    expect(hpColor(0.5)).toBe(HP_YELLOW);
    expect(hpColor(0)).toBe(HP_RED);
  });

  it('entre o cheio e a metade, a cor migra de verde para amarelo; abaixo, de amarelo para vermelho', () => {
    const g = (hpColor(0.75) >> 8) & 0xff; // canal verde
    expect(g).toBeGreaterThan((HP_GREEN >> 8) & 0xff); // entre o verde e o amarelo
    expect(g).toBeLessThan((HP_YELLOW >> 8) & 0xff);
    const r = (hpColor(0.25) >> 16) & 0xff; // canal vermelho
    expect(r).toBeGreaterThan((HP_RED >> 16) & 0xff);
    expect(r).toBeLessThan((HP_YELLOW >> 16) & 0xff);
  });

  it('valores fora de 0 a 1 são limitados', () => {
    expect(hpColor(2)).toBe(HP_GREEN);
    expect(hpColor(-1)).toBe(HP_RED);
  });
});
