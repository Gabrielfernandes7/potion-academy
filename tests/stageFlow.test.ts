import { describe, expect, it } from 'vitest';
import { createUpgrades } from '../src/game/upgrades';
import { carryForward, doorOutcome, startingState } from '../src/game/stageFlow';
import type { Carry } from '../src/game/types';

const MAX = 24;

describe('começo da fase', () => {
  it('sem carry (fase 1), começa com vida cheia e nada conquistado', () => {
    const s = startingState(undefined, MAX);
    expect(s.hp).toBe(MAX);
    expect(s.speedUp).toBe(0);
    expect(s.bombType).toBe('normal');
  });

  it('com carry, recebe o que veio da fase anterior', () => {
    const carry: Carry = {
      hp: 10, upgrades: createUpgrades(), speedUp: 2, bombType: 'mega',
    };
    const s = startingState(carry, MAX);
    expect(s).toMatchObject({ hp: 10, speedUp: 2, bombType: 'mega' });
  });

  it('os upgrades são copiados: a fase nova não mexe no objeto da anterior', () => {
    const carry: Carry = { hp: 5, upgrades: createUpgrades(), speedUp: 0, bombType: 'normal' };
    const s = startingState(carry, MAX);
    s.upgrades.normal.fireLevel = 99;
    expect(carry.upgrades.normal.fireLevel).not.toBe(99);
  });
});

describe('o que sai da fase', () => {
  const now = { hp: 10, upgrades: createUpgrades(), speedUp: 1, bombType: 'mega' as const };

  it('leva vida, velocidade e frasco', () => {
    const c = carryForward(now, 0, MAX);
    expect(c).toMatchObject({ hp: 10, speedUp: 1, bombType: 'mega' });
  });

  it('a cura da passagem não passa do máximo', () => {
    expect(carryForward(now, 100, MAX).hp).toBe(MAX);
    expect(carryForward(now, 3, MAX).hp).toBe(13);
  });

  it('o carry é uma cópia dos upgrades, não o mesmo objeto', () => {
    const c = carryForward(now, 0, MAX);
    expect(c.upgrades).not.toBe(now.upgrades);
  });
});

describe('porta', () => {
  it('nas fases do meio, a porta leva à passagem', () => {
    expect(doorOutcome(1, 12)).toBe('passage');
    expect(doorOutcome(11, 12)).toBe('passage');
  });

  it('na última fase, a porta termina a história', () => {
    expect(doorOutcome(12, 12)).toBe('finish');
  });
});
