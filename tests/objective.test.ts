import { describe, expect, it } from 'vitest';
import { BRAZIER } from '../src/config';
import { buildTiles, isSpawnSafe } from '../src/game/grid';
import {
  goalText, goalView, introTip, isComplete, objectiveOf, pickBrazierCells, waveKind, wavesDue, type Objective, type Progress,
} from '../src/game/objective';
import { mulberry32 } from '../src/game/rng';
import { walkBlast } from '../src/game/blast';
import { STAGES } from '../src/game/stages';
import { ENEMY_TYPES } from '../src/game/entities/enemies/defs';
import { CONFIG } from '../src/config';

const P: Progress = { gems: 0, gemsNeeded: 3, lit: 0, surviveMs: 0, huntAlive: 0, huntTotal: 0 };

describe('objetivos das fases', () => {
  it('sem objetivo, a fase é de gemas', () => {
    expect(objectiveOf({})).toEqual({ type: 'gems' });
  });

  it('gemas: completa com as 3', () => {
    const o: Objective = { type: 'gems' };
    expect(isComplete(o, { ...P, gems: 2 })).toBe(false);
    expect(isComplete(o, { ...P, gems: 3 })).toBe(true);
  });

  it('braseiros: completa com todos acesos', () => {
    const o: Objective = { type: 'braziers', count: 3 };
    expect(isComplete(o, { ...P, lit: 2 })).toBe(false);
    expect(isComplete(o, { ...P, lit: 3 })).toBe(true);
    expect(goalView(o, { ...P, lit: 5 })).toEqual({ kind: 'braziers', done: 3, total: 3 });
  });

  it('sobreviver: completa com o tempo e a HUD conta em segundos', () => {
    const o: Objective = { type: 'survive', ms: 60000, waveMs: 12000, waves: ['clock'] };
    expect(isComplete(o, { ...P, surviveMs: 59999 })).toBe(false);
    expect(isComplete(o, { ...P, surviveMs: 60000 })).toBe(true);
    expect(goalView(o, { ...P, surviveMs: 12500 })).toEqual({ kind: 'survive', done: 12, total: 60 });
    expect(goalView(o, { ...P, surviveMs: 999999 }).done).toBe(60);
  });

  it('caçar: completa quando não resta nenhum, e nunca antes de haver quem caçar', () => {
    const o: Objective = { type: 'hunt', kind: 'ghost' };
    expect(isComplete(o, { ...P, huntTotal: 2, huntAlive: 1 })).toBe(false);
    expect(isComplete(o, { ...P, huntTotal: 2, huntAlive: 0 })).toBe(true);
    expect(isComplete(o, { ...P, huntTotal: 0, huntAlive: 0 })).toBe(false);
    expect(goalView(o, { ...P, huntTotal: 3, huntAlive: 1 })).toEqual({ kind: 'hunt', done: 2, total: 3 });
  });

  it('as ondas chegam uma a cada intervalo, revezando os tipos, e param no fim do tempo', () => {
    const o: Objective = { type: 'survive', ms: 60000, waveMs: 15000, waves: ['frog', 'rat'] };
    expect(wavesDue(o, 14999, 0)).toBe(0);
    expect(wavesDue(o, 15000, 0)).toBe(1);
    expect(wavesDue(o, 31000, 1)).toBe(1);
    expect(wavesDue(o, 999999, 0)).toBe(4);
    expect([0, 1, 2].map(n => waveKind(o, n))).toEqual(['frog', 'rat', 'frog']);
    expect(wavesDue({ type: 'gems' }, 99999, 0)).toBe(0);
  });

  it('a dica do cartão diz o objetivo, menos nas fases de gemas', () => {
    expect(introTip({ tip: 'dica' })).toBe('dica');
    expect(introTip({ objective: { type: 'braziers', count: 3 } })).toContain('OBJETIVO: acenda os 3 braseiros');
    expect(introTip({ objective: { type: 'hunt', kind: 'lantern' }, tip: 'x' })).toMatch(/^OBJETIVO: .* x$/);
    expect(goalText({ type: 'hunt', kind: 'lantern' })).toContain('lanternas vivas');
    expect(goalText({ type: 'hunt', kind: 'ghost' })).toContain('fantasmas');
    expect(goalText({ type: 'survive', ms: 60000, waveMs: 1, waves: [] })).toContain('60 s');
  });
});

describe('braseiros: onde ficam', () => {
  const door = { x: CONFIG.cols - 2, y: CONFIG.rows - 2 };
  const build = (seed: number) => buildTiles(CONFIG.cols, CONFIG.rows, 0.55, (x, y) => isSpawnSafe(x, y, CONFIG.cols, CONFIG.rows), mulberry32(seed)).tiles;

  it('em muitas sementes: o número pedido, em corredores, longe do começo e da porta e uns dos outros', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const cells = pickBrazierCells(build(seed), 3, door, mulberry32(seed + 9));
      expect(cells, `semente ${seed}`).toHaveLength(3);
      for (const c of cells) {
        expect(c.x % 2 === 1 && c.y % 2 === 1, 'casa ímpar').toBe(true);
        expect(Math.abs(c.x - 1) + Math.abs(c.y - 1)).toBeGreaterThanOrEqual(5);
        expect(Math.abs(c.x - door.x) + Math.abs(c.y - door.y)).toBeGreaterThanOrEqual(3);
      }
      for (const a of cells) for (const b of cells) if (a !== b) expect(Math.abs(a.x - b.x) + Math.abs(a.y - b.y)).toBeGreaterThanOrEqual(2);
    }
  });

  it('o braseiro absorve a explosão: ela o alcança e para nele', () => {
    const tiles = build(3);
    tiles[5][5] = 0; tiles[5][6] = 0; tiles[5][7] = BRAZIER; tiles[5][8] = 0;
    const seen = [...walkBlast(5, 5, 3, false, (x, y) => tiles[y]?.[x] ?? null)].map(t => `${t.x},${t.y}`);
    expect(seen).toContain('7,5');
    expect(seen).not.toContain('8,5');
  });
});

describe('as fases usam os objetivos', () => {
  const common = STAGES.filter(s => s.door && !s.boss);

  it('há um pouco de cada: 9 de gemas, 2 de braseiros, 2 de sobreviver, 2 de caçar', () => {
    const count = (t: string) => common.filter(s => objectiveOf(s).type === t).length;
    expect([count('gems'), count('braziers'), count('survive'), count('hunt')]).toEqual([9, 2, 2, 2]);
  });

  it('cada objetivo tem o que precisa para ser cumprido', () => {
    for (const s of common) {
      const o = objectiveOf(s);
      if (o.type === 'hunt') {
        const rule = s.enemies.find(r => r.kind === o.kind);
        expect(rule, `${s.name}: quem caçar`).toBeTruthy();
        expect(rule?.start, `${s.name}: sem reforço, senão a caçada nunca acaba`).toBe(rule?.max);
        expect(rule?.every, s.name).toBeUndefined();
        expect(ENEMY_TYPES[o.kind].harmless, s.name).toBeFalsy();
      }
      if (o.type === 'survive') {
        expect(s.time, `${s.name}: sobra tempo para chegar à porta`).toBeGreaterThanOrEqual(o.ms + 20000);
        for (const k of o.waves) expect(s.enemies.some(r => r.kind === k), `${s.name}: regra de ${k}`).toBe(true);
      }
    }
  });
});
