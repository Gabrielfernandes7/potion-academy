import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../../../src/audio/tracks';
import {
  BossSkill, blinkDestination, cooldownFor, pickBossSkill, rainTargets,
} from '../../../src/game/entities/bosses/belladonna/rules';
import { blastTiles, phaseFor } from '../../../src/game/entities/bosses/common';
import { CONFIG } from '../../../src/config';
import { damageTo, hitsToKill } from '../../../src/game/entities/damage';
import { PROFILES } from '../../../src/game/entities/profiles';

describe('fases do chefe', () => {
  it('fica furiosa na metade da vida', () => {
    expect(phaseFor(8, 8)).toBe(1);
    expect(phaseFor(5, 8)).toBe(1);
    expect(phaseFor(4, 8)).toBe(2);
    expect(phaseFor(1, 8)).toBe(2);
  });
  it('a fase furiosa ataca mais rápido', () => {
    expect(cooldownFor(2)).toBeLessThan(cooldownFor(1));
    expect(cooldownFor(1)).toBe(CONFIG.bossCooldownMs);
  });
});

describe('escolha de habilidade', () => {
  it('nunca repete a anterior', () => {
    const rng = mulberry32(5);
    let last: BossSkill | null = null;
    for (let i = 0; i < 300; i++) {
      const s: BossSkill = pickBossSkill(i % 2 === 0 ? 1 : 2, last, rng);
      expect(s).not.toBe(last);
      last = s;
    }
  });
  it('a chuva só existe na fase 2', () => {
    const rng = mulberry32(9);
    for (let i = 0; i < 300; i++) expect(pickBossSkill(1, null, rng)).not.toBe('rain');
    const seen = new Set<BossSkill>();
    for (let i = 0; i < 300; i++) seen.add(pickBossSkill(2, null, rng));
    expect(seen.has('rain')).toBe(true);
  });
});

describe('área das explosões', () => {
  const open = (x: number, y: number): boolean => x >= 0 && x < 10 && y >= 0 && y < 10 && !(x === 5 && y === 3);

  it('cruz completa em campo aberto', () => {
    expect(blastTiles(3, 6, 1, open)).toHaveLength(5);
    expect(blastTiles(3, 6, 2, open)).toHaveLength(9);
  });
  it('obstáculos bloqueiam o braço da cruz (dá para se proteger atrás de um caixote)', () => {
    const tiles = blastTiles(4, 3, 3, open); // (5,3) está fechado: o braço da direita não passa
    expect(tiles.some(t => t.x === 5 && t.y === 3)).toBe(false);
    expect(tiles.some(t => t.x === 6 && t.y === 3)).toBe(false);
    expect(tiles.some(t => t.x === 3 && t.y === 3)).toBe(true);
  });
  it('não sai do mapa', () => {
    for (const t of blastTiles(0, 0, 3, open)) {
      expect(t.x).toBeGreaterThanOrEqual(0);
      expect(t.y).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('chuva e teletransporte', () => {
  const open = (x: number, y: number): boolean => x >= 0 && x < 15 && y >= 0 && y < 13;

  it('a chuva sempre atinge a casa do jogador e usa casas distintas e próximas', () => {
    const player = { x: 7, y: 6 };
    const t = rainTargets(player, CONFIG.bossRainDrops, open, mulberry32(3));
    expect(t[0]).toEqual(player);
    expect(t).toHaveLength(CONFIG.bossRainDrops);
    expect(new Set(t.map(p => `${p.x},${p.y}`)).size).toBe(t.length);
    for (const p of t) expect(Math.abs(p.x - 7) + Math.abs(p.y - 6)).toBeLessThanOrEqual(4);
  });
  it('o teletransporte prefere longe do jogador, mas funciona se não houver', () => {
    const player = { x: 1, y: 1 };
    const cand = [{ x: 2, y: 1 }, { x: 12, y: 10 }, { x: 11, y: 9 }];
    for (let s = 1; s < 20; s++) {
      const d = blinkDestination(player, cand, 8, mulberry32(s));
      expect(d && Math.abs(d.x - 1) + Math.abs(d.y - 1)).toBeGreaterThanOrEqual(8);
    }
    expect(blinkDestination(player, [{ x: 2, y: 1 }], 8)).toEqual({ x: 2, y: 1 });
    expect(blinkDestination(player, [], 8)).toBeNull();
  });
});

describe('dano por elemento na Belladona', () => {
  const b = PROFILES.belladonna;
  it('todo elemento causa pelo menos 1 de dano e fogo/éter causam mais que água/terra', () => {
    for (const el of ['fire', 'water', 'earth', 'air'] as const) expect(damageTo(b, el)).toBeGreaterThanOrEqual(1);
    expect(damageTo(b, 'fire')).toBeGreaterThan(damageTo(b, 'water'));
    expect(damageTo(b, 'air')).toBeGreaterThan(damageTo(b, 'earth'));
  });
  it('a vida do chefe é divisível em golpes viáveis para qualquer elemento', () => {
    expect(CONFIG.bossHp).toBe(b.maxHp);
    expect(hitsToKill(b, 'water')).toBeLessThanOrEqual(12);
    expect(hitsToKill(b, 'fire')).toBeGreaterThanOrEqual(3);
  });
});
