// Simula os inimigos de partida sobre o trajeto do bot (issue #17): quantos toques, quanto dano e quanto tempo a Roo
// passa ao alcance de um inimigo, se ela seguir o plano SEM fugir. Usa as mesmas regras puras do jogo (enemyRules.ts,
// damage.ts, roo.ts), e o tempo de tique do jogo é 50 ms. Não é uma IA de fuga: o bot segue o plano, e o número mostra
// a pressão do plano, não o que um jogador cuidadoso evitaria. Modela só os inimigos de partida (`start`); os que
// nascem com os caixotes (`every`) ficam de fora, então a pressão aqui é um piso.
// Aproximações: toupeira, coruja, ratinho e salamandra andam como o passeio ao acaso (não afundam, não mergulham,
// não roubam); relógio e lanterna e sentinela andam em patrulha. Perseguição: `chase: false` trata o sapo como antes.
import { BOMB_TYPES, CONFIG, EMPTY } from '../../src/config';
import { damageTo } from '../../src/game/entities/damage';
import { damageToRoo } from '../../src/game/entities/roo';
import { ENEMY_TYPES } from '../../src/game/entities/enemies/defs';
import { enemyMoveOptions, patrolDir, STALK_NOTICE_DISTANCE, stalkDir } from '../../src/game/entities/enemies/enemyRules';
import { PROFILES } from '../../src/game/entities/profiles';
import { mulberry32 } from '../../src/game/rng';
import { playStage, type BotResult, type Pt, type SimEnemy } from './playthroughBot';
import type { StageDef } from '../../src/game/stages/types';

export const TICK_MS = 50;
const KEY = (x: number, y: number): string => `${x},${y}`;

export interface ThreatResult {
  hits: number; // toques recebidos (contato ou explosão, respeitando a proteção de 1,5 s)
  damage: number; // pontos de vida perdidos
  minHp: number; // a vida mais baixa que a Roo chegou a ter
  dead: boolean; // zerou a vida em algum momento do plano
  contactMs: number; // tempo dividindo a casa com um inimigo que machuca
  closeMs: number; // tempo com um inimigo a até 2 casas (a zona de ameaça)
  kills: number; // inimigos que a própria explosão do bot matou
  selfBurn: number; // vezes que a explosão da própria Roo a alcançou
  spawned: number; // inimigos de partida nesta grade
}

/** Simula os inimigos de partida sobre o trajeto de uma partida do bot. */
export function simulateThreats(run: BotResult, seed: number, opts: { chase: boolean }): ThreatResult {
  const { cols, rows } = CONFIG;
  const grid = run.grid.map(row => [...row]);
  const roll = mulberry32(seed ^ 0x5eed);
  const enemies: SimEnemy[] = run.start.map(e => ({ ...e }));
  const spawned = enemies.length;
  const roo = { hp: PROFILES.roo.maxHp, invuln: 0, hits: 0, damage: 0, minHp: PROFILES.roo.maxHp, dead: false };
  let contactMs = 0, closeMs = 0, kills = 0, selfBurn = 0;
  const hurt = (amount: number): void => {
    if (roo.invuln > 0) return;
    roo.hp -= amount; roo.hits++; roo.damage += amount; roo.invuln = CONFIG.invulnTime;
    roo.minHp = Math.min(roo.minHp, roo.hp);
    if (roo.hp <= 0) roo.dead = true;
  };
  // a mesma regra do jogo: a Roo sofre o dano-base do contato (4), e o ratinho e a salamandra não machucam
  const contactDamage = damageToRoo();
  const harmful = (e: SimEnemy): boolean => !ENEMY_TYPES[e.kind].harmless;
  const isBlocked = (x: number, y: number): boolean => grid[y][x] !== EMPTY;

  const booms = [...run.booms];
  let bi = 0;
  let ti = 0;
  const end = run.timeMs;
  for (let t = 0; t <= end; t += TICK_MS) {
    while (ti + 1 < run.trail.length && run.trail[ti + 1].t <= t) ti++;
    const me = { x: run.trail[ti].x, y: run.trail[ti].y };
    roo.invuln = Math.max(0, roo.invuln - TICK_MS);

    // explosões do bot que chegaram a este instante
    while (bi < booms.length && booms[bi].t <= t) {
      const b = booms[bi++];
      const cross = new Set(b.cells.map(c => KEY(c.x, c.y)));
      // a própria explosão: o dano do elemento da Roo (fogo, a fraqueza dela: 6)
      if (cross.has(KEY(me.x, me.y))) { selfBurn++; hurt(damageToRoo(BOMB_TYPES.normal.element)); }
      for (const e of enemies) {
        if (!e.alive || !cross.has(KEY(e.x, e.y))) continue;
        const dmg = damageTo(PROFILES[e.kind], BOMB_TYPES.normal.element);
        if (dmg === 0) continue;
        e.hp -= dmg;
        if (e.hp <= 0) { e.alive = false; kills++; }
      }
      for (const h of b.hits) grid[h.y][h.x] = EMPTY;
    }

    // contato: a Roo divide a casa com um inimigo que machuca
    let touching = false;
    for (const e of enemies) {
      if (!e.alive || !harmful(e) || e.x !== me.x || e.y !== me.y) continue;
      touching = true;
      hurt(contactDamage);
    }
    if (touching) contactMs += TICK_MS;
    if (enemies.some(e => e.alive && harmful(e) && Math.abs(e.x - me.x) + Math.abs(e.y - me.y) <= STALK_NOTICE_DISTANCE)) closeMs += TICK_MS;

    // movimento: cada inimigo dá o próximo passo no seu intervalo
    for (const e of enemies) {
      if (!e.alive) continue;
      const def2 = ENEMY_TYPES[e.kind];
      if (!Number.isFinite(def2.moveInterval) || def2.rooted) continue;
      e.timer -= TICK_MS;
      if (e.timer > 0) continue;
      e.timer = def2.moveInterval;
      const valid = enemyMoveOptions({
        from: { x: e.x, y: e.y }, passWalls: def2.passWalls, door: run.door, cols, rows,
        isFree: (x, y) => !isBlocked(x, y),
        occupied: (x, y) => enemies.some(o => o !== e && o.alive && o.x === x && o.y === y),
      });
      if (valid.length === 0) continue;
      const canEnter = (x: number, y: number): boolean => valid.some(([vx, vy]) => e.x + vx === x && e.y + vy === y);
      // o sapo persegue só se a regra da fase manda (e se o teste pediu a perseguição); senão, passeia ao acaso
      const chasing = def2.behavior === 'stalk' && e.chases && opts.chase;
      const behavior = def2.behavior === 'stalk' && !chasing ? 'wander' : def2.behavior;
      let step: Pt | null = null;
      if (behavior === 'stalk') step = stalkDir({ x: e.x, y: e.y }, me, canEnter);
      if (behavior === 'patrol') {
        const d = patrolDir({ x: e.x, y: e.y }, e.dir, canEnter);
        if (d) { e.dir = d; step = d; }
      }
      if (!step && behavior !== 'patrol') {
        const [vx, vy] = valid[Math.floor(roll() * valid.length)];
        step = { x: vx, y: vy };
      }
      if (step) { e.x += step.x; e.y += step.y; }
    }
  }
  return {
    hits: roo.hits, damage: roo.damage, minHp: roo.minHp, dead: roo.dead, contactMs, closeMs, kills, selfBurn, spawned,
  };
}

// ---------- resumo por fase (usado pelos testes de equilíbrio e pelo relatório `npm run bot:report`) ----------

export interface StageThreat {
  name: string;
  seeds: number;
  wins: number; // sementes em que o bot alcançou a porta
  timeMedianMs: number; // tempo mediano com uma poção por vez
  timeWorstTwoMs: number; // pior tempo com dois frascos (o caso que o teste exige dentro do tempo da fase)
  timeLimitMs: number; // tempo da fase
  hitsOff: number; // toques médios, sem perseguição (o sapo anda ao acaso)
  hitsOn: number; // toques médios, com a perseguição que a regra da fase manda
  damageOn: number; // dano médio com perseguição (de 24 pontos da Roo)
  closeMsOn: number; // tempo médio ao alcance de um inimigo (2 casas), com perseguição
  deathRateOn: number; // fração das sementes em que o plano sem fuga zeraria a vida
  chasers: number; // sapos com perseguição nas partidas (média)
}

const median = (xs: number[]): number => {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};
const mean = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/** Roda o bot e a simulação de inimigos em cada semente e resume a pressão de uma fase. */
export function stageThreat(def: StageDef, seeds: number[]): StageThreat {
  const runs = seeds.map(seed => ({ seed, run: playStage(def, seed) }));
  const won = runs.filter(r => r.run.won);
  const on = runs.map(r => simulateThreats(r.run, r.seed, { chase: true }));
  const off = runs.map(r => simulateThreats(r.run, r.seed, { chase: false }));
  return {
    name: def.name,
    seeds: seeds.length,
    wins: won.length,
    timeMedianMs: median(won.map(r => r.run.timeMs)),
    timeWorstTwoMs: Math.max(0, ...won.map(r => r.run.twoBombsMs)),
    timeLimitMs: def.time,
    hitsOff: mean(off.map(t => t.hits)),
    hitsOn: mean(on.map(t => t.hits)),
    damageOn: mean(on.map(t => t.damage)),
    closeMsOn: mean(on.map(t => t.closeMs)),
    deathRateOn: mean(on.map(t => (t.dead ? 1 : 0))),
    chasers: mean(runs.map(r => r.run.start.filter(e => e.chases).length)),
  };
}
