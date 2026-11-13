import { describe, expect, it } from 'vitest';
import {
  CHIMERA_DAMAGE, CHIMERA_HP, chimeraCooldown, pickChimeraSkill, slideDestination, spitTiles, stepsFrom, waveBands, waveGapRow,
} from '../../../src/game/entities/bosses/chimera/rules';
import { CHIMERA_LINES, pickChimeraLine } from '../../../src/game/entities/bosses/chimera/lines';
import { PROFILES } from '../../../src/game/entities/profiles';
import { hitsToKill } from '../../../src/game/entities/damage';

const open = (x: number, y: number): boolean => x >= 1 && x <= 13 && y >= 1 && y <= 11;

describe('Quimera: dano por elemento', () => {
  it('a terra é a fraqueza, a água escorre (imune) e fogo e éter machucam normal', () => {
    expect(PROFILES.chimera.weak).toEqual(['earth']);
    expect(PROFILES.chimera.immune).toEqual(['water']);
    expect(CHIMERA_DAMAGE.water).toBe(0);
    expect(CHIMERA_DAMAGE.earth).toBeGreaterThan(CHIMERA_DAMAGE.fire);
    expect(CHIMERA_DAMAGE.fire).toBe(CHIMERA_DAMAGE.air);
    expect(CHIMERA_DAMAGE.fire).toBeGreaterThanOrEqual(1);
  });
  it('o fogo (poção inicial) a vence em poucos golpes; a água nunca', () => {
    expect(hitsToKill(PROFILES.chimera, 'water')).toBe(Infinity);
    expect(hitsToKill(PROFILES.chimera, 'fire')).toBeLessThanOrEqual(8);
    expect(hitsToKill(PROFILES.chimera, 'earth')).toBeLessThan(hitsToKill(PROFILES.chimera, 'fire'));
    expect(CHIMERA_HP).toBe(PROFILES.chimera.maxHp);
  });
  it('não tem o fogo como fraqueza (os outros chefes têm)', () => {
    expect(PROFILES.chimera.weak).not.toContain('fire');
  });
});

describe('Quimera: escolha de habilidade', () => {
  it('nunca repete a anterior', () => {
    for (let i = 0; i < 80; i++) expect(pickChimeraSkill(2, 'spit', () => i / 80)).not.toBe('spit');
  });
  it('a Onda só existe na fase 2', () => {
    for (let i = 0; i < 60; i++) expect(pickChimeraSkill(1, null, () => i / 60)).not.toBe('wave');
    const seen = new Set(Array.from({ length: 80 }, (_, i) => pickChimeraSkill(2, null, () => i / 80)));
    expect(seen.has('wave')).toBe(true);
  });
  it('a fase 2 age mais rápido, mas sempre depois do aviso de 1,2 s', () => {
    expect(chimeraCooldown(2)).toBeLessThan(chimeraCooldown(1));
    expect(chimeraCooldown(2)).toBeGreaterThan(1200);
  });
});

describe('Quimera: Cuspe', () => {
  it('em linha reta passa pela jogadora e segue até a parede', () => {
    const t = spitTiles({ x: 12, y: 5 }, { x: 8, y: 5 }, open);
    expect(t.map(p => p.x)).toEqual([11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
    expect(t.every(p => p.y === 5)).toBe(true);
  });
  it('na diagonal também cobre a casa da jogadora', () => {
    const t = spitTiles({ x: 10, y: 10 }, { x: 7, y: 7 }, open);
    expect(t).toContainEqual({ x: 7, y: 7 });
    expect(t).not.toContainEqual({ x: 10, y: 10 });
  });
  it('para em obstáculos e não tem casas repetidas', () => {
    const t = spitTiles({ x: 12, y: 5 }, { x: 8, y: 5 }, (x, y) => open(x, y) && x !== 6);
    expect(Math.min(...t.map(p => p.x))).toBe(7);
    expect(new Set(t.map(p => `${p.x},${p.y}`)).size).toBe(t.length);
  });
  it('sem direção (mesma casa) não cospe', () => {
    expect(spitTiles({ x: 5, y: 5 }, { x: 5, y: 5 }, open)).toEqual([]);
  });
});

describe('Quimera: Escorrer', () => {
  it('ressurge perto da jogadora, nunca na casa dela', () => {
    for (let i = 0; i < 50; i++) {
      const d = slideDestination({ x: 7, y: 6 }, open, () => i / 50)!;
      const dist = Math.abs(d.x - 7) + Math.abs(d.y - 6);
      expect(dist).toBeGreaterThanOrEqual(2);
      expect(dist).toBeLessThanOrEqual(4);
    }
  });
  it('sem casa livre, devolve null', () => {
    expect(slideDestination({ x: 7, y: 6 }, () => false)).toBeNull();
  });
});

describe('Quimera: Onda', () => {
  it('as faixas cobrem o campo todo, menos a linha seca', () => {
    const bands = waveBands(15, 13, true, 4, open);
    const all = bands.flat();
    expect(all.some(t => t.y === 4)).toBe(false);
    expect(new Set(all.map(t => t.x))).toEqual(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]));
    expect(bands.length).toBe(7);
  });
  it('varre a partir da esquerda ou da direita, duas colunas por vez', () => {
    const l = waveBands(15, 13, true, 4, open);
    expect(Math.max(...l[0].map(t => t.x))).toBe(2);
    const r = waveBands(15, 13, false, 4, open);
    expect(Math.min(...r[0].map(t => t.x))).toBe(12);
  });
  it('a linha seca nunca é a da jogadora e tem casa livre ao alcance de 4 passos', () => {
    for (let py = 1; py <= 11; py++) {
      const gap = waveGapRow({ x: 7, y: py }, 13, open, () => 0.3);
      expect(gap).toBeGreaterThanOrEqual(1);
      expect(gap).toBeLessThanOrEqual(11);
      expect(gap).not.toBe(py);
      const reach = stepsFrom({ x: 7, y: py }, open, 4);
      const inGap = [...reach.entries()].filter(([k]) => k.endsWith(`,${gap}`));
      expect(inGap.length).toBeGreaterThan(0);
    }
  });
  it('escolhe a linha mais próxima de quem está livre', () => {
    expect(waveGapRow({ x: 7, y: 6 }, 13, open, () => 0)).toBe(5);
    expect(waveGapRow({ x: 7, y: 1 }, 13, open)).toBe(2);
  });
  it('caixotes no caminho: só conta o que a jogadora alcança; cercada, a linha dela fica seca', () => {
    const walled = (x: number, y: number): boolean => open(x, y) && y === 6;
    expect(waveGapRow({ x: 7, y: 6 }, 13, walled)).toBe(6);
    const corridor = (x: number, y: number): boolean => open(x, y) && (y === 6 || x === 7);
    const gap = waveGapRow({ x: 7, y: 6 }, 13, corridor, () => 0);
    expect(Math.abs(gap - 6)).toBe(1);
  });
});

describe('Quimera: alcance', () => {
  it('stepsFrom conta passos pelas casas livres e respeita o limite', () => {
    const r = stepsFrom({ x: 5, y: 5 }, open, 2);
    expect(r.get('5,5')).toBe(0);
    expect(r.get('6,5')).toBe(1);
    expect(r.get('7,5')).toBe(2);
    expect(r.get('8,5')).toBeUndefined();
    expect(r.get('6,6')).toBe(2);
  });
});

describe('falas da Quimera', () => {
  it('toda fala é curta e o sorteio nunca estoura', () => {
    for (const [kind, list] of Object.entries(CHIMERA_LINES)) {
      expect(list.length, kind).toBeGreaterThan(0);
      for (const line of list) expect(line.length, line).toBeLessThanOrEqual(28);
    }
    expect(pickChimeraLine('hurt', 0.999)).toBe(CHIMERA_LINES.hurt[CHIMERA_LINES.hurt.length - 1]);
  });
});
