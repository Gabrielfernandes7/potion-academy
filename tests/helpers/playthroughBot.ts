// Um bot que joga uma fase comum do começo ao fim (issue #5), só com as regras puras do jogo: sem Phaser, sem
// navegador, sem desenhar nada (roda em milissegundos). Monta a grade como a MainScene (buildTiles + porta + gemas
// escondidas), quebra caixotes com poções de Fogo, recolhe as gemas e vai à porta.
//
// O que ele responde: as 3 gemas e a porta são alcançáveis nesta grade? E quanto tempo leva um jogador cuidadoso e
// SEQUENCIAL (uma poção por vez, espera cada explosão acabar, nenhum power-up)? Se ele termina dentro do tempo da fase,
// um humano termina também. O que ele NÃO modela: inimigos, vida, baús e as formas da Roo.
import { BLOCK, BOMB_TYPES, CONFIG, DIRS, EMPTY } from '../../src/config';
import { buildTiles, cellKey, doorCell, isSpawnSafe, type Tiles } from '../../src/game/grid';
import { walkBlast } from '../../src/game/blast';
import { mulberry32 } from '../../src/game/rng';
import type { StageDef } from '../../src/game/stages/types';

const EXPLOSION_LINGER_MS = 380; // quanto tempo a chama fica no chão (BombSystem)
const SAFETY_MS = 250; // folga: o bot sai da cruz antes de o pavio acabar

export interface BotResult {
  won: boolean;
  reason: string; // 'porta aberta e alcançada' ou o que travou
  timeMs: number; // tempo gasto até a porta (ou até travar), com uma poção por vez
  twoBombsMs: number; // o mesmo, com dois frascos em campo: metade da espera de cada explosão some (o jogador anda enquanto a outra queima)
  bombs: number;
  blocks: number; // caixotes gerados
  gems: number; // gemas recolhidas
}

interface Pt { x: number; y: number }

function bfs(tiles: Tiles, from: Pt, passable: (x: number, y: number) => boolean): Map<string, number> {
  const dist = new Map<string, number>([[cellKey(from.x, from.y), 0]]);
  const queue: Pt[] = [from];
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i];
    const d = dist.get(cellKey(p.x, p.y)) as number;
    for (const [dx, dy] of DIRS) {
      const x = p.x + dx, y = p.y + dy;
      const k = cellKey(x, y);
      if (dist.has(k) || y < 0 || y >= tiles.length || x < 0 || x >= tiles[0].length || !passable(x, y)) continue;
      dist.set(k, d + 1);
      queue.push({ x, y });
    }
  }
  return dist;
}

export function playStage(def: StageDef, seed: number): BotResult {
  const { cols, rows } = CONFIG;
  const roll = mulberry32(seed);
  const { tiles, blockKeys } = buildTiles(cols, rows, def.blockChance, (x, y) => isSpawnSafe(x, y, cols, rows), roll);
  const door = doorCell(cols, rows, def.door);
  tiles[door.y][door.x] = EMPTY; // placeDoor: a porta ocupa a casa e tira o caixote de lá
  const blocks = blockKeys.filter(k => k !== cellKey(door.x, door.y));
  // assignHiddenGems: embaralha e as 3 primeiras guardam as gemas
  const shuffled = [...blocks];
  for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(roll() * (i + 1)); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; }
  const gemBlocks = new Set(shuffled.slice(0, CONFIG.gemsForDoor));
  const floorGems = new Set<string>();

  const step = CONFIG.baseMoveDuration;
  const type = BOMB_TYPES.normal;
  let pos: Pt = { x: 1, y: 1 };
  let time = 0, bombs = 0, gems = 0;
  const out = (won: boolean, reason: string): BotResult => ({ won, reason, timeMs: time, twoBombsMs: time - (bombs * (type.fuse + EXPLOSION_LINGER_MS)) / 2, bombs, blocks: blocks.length, gems });
  const open = () => gems >= CONFIG.gemsForDoor;
  const passable = (x: number, y: number): boolean => {
    if (tiles[y][x] !== EMPTY) return false;
    return !(x === door.x && y === door.y && !open());
  };

  for (let guard = 0; guard < 400; guard++) {
    const dist = bfs(tiles, pos, passable);
    // 1. a porta aberta e alcançável: fim
    if (open()) {
      const d = dist.get(cellKey(door.x, door.y));
      if (d !== undefined) {
        time += d * step;
        return out(true, 'porta aberta e alcançada');
      }
      // a porta abriu, mas ainda há caixotes no caminho: segue quebrando, em direção a ela
    }
    // 2. gema no chão ao alcance: recolhe a mais perto
    let best: { k: string; d: number } | null = null;
    for (const k of open() ? [] : floorGems) { const d = dist.get(k); if (d !== undefined && (!best || d < best.d)) best = { k, d }; }
    if (best) {
      const [gx, gy] = best.k.split(',').map(Number);
      time += best.d * step; pos = { x: gx, y: gy }; floorGems.delete(best.k); gems++;
      continue;
    }
    // 3. põe uma poção onde derruba mais caixotes por passo andado, com fuga garantida
    const getTile = (x: number, y: number): number | null => (y < 0 || y >= rows || x < 0 || x >= cols ? null : tiles[y][x]);
    const doorish = open(); // porta aberta e cercada: o que importa é chegar perto dela
    const cands: Array<{ at: Pt; hits: string[]; walk: number; blast: Set<string>; score: number }> = [];
    for (const [k, d] of dist) {
      const [x, y] = k.split(',').map(Number);
      const blast = new Set<string>();
      const hits: string[] = [];
      for (const t of walkBlast(x, y, type.radius, !!type.pierce, getTile)) {
        blast.add(cellKey(t.x, t.y));
        if (t.tile === BLOCK) hits.push(cellKey(t.x, t.y));
      }
      if (!hits.length) continue;
      let score = hits.length * 2 - d * 0.5;
      if (doorish) score = -Math.min(...hits.map(h => { const [hx, hy] = h.split(',').map(Number); return Math.abs(hx - door.x) + Math.abs(hy - door.y); })) * 2 - d * 0.5;
      cands.push({ at: { x, y }, hits, walk: d, blast, score });
    }
    cands.sort((a, b) => b.score - a.score);
    let pick: { at: Pt; hits: string[]; walk: number; flee: number; blast: Set<string> } | null = null;
    for (const c of cands) {
      // fuga: sai pela casa livre mais perto fora da cruz, sem passar pela poção
      const away = bfs(tiles, c.at, (px, py) => passable(px, py) && !(px === c.at.x && py === c.at.y));
      let flee = Infinity;
      for (const [ek, ed] of away) {
        if (!c.blast.has(ek) && ed * step + SAFETY_MS <= type.fuse) flee = Math.min(flee, ed);
      }
      if (flee !== Infinity) { pick = { ...c, flee }; break; }
    }
    if (!pick) {
      const left = [...floorGems].length + gemBlocks.size;
      return out(false, `travou: sem caixote ao alcance (${left} gema(s) fora de alcance, ${gems} recolhida(s))`);
    }
    // anda, põe, foge e espera a explosão
    time += pick.walk * step + type.fuse + EXPLOSION_LINGER_MS;
    bombs++;
    for (const k of pick.hits) {
      const [bx, by] = k.split(',').map(Number);
      tiles[by][bx] = EMPTY;
      if (gemBlocks.has(k)) { gemBlocks.delete(k); floorGems.add(k); }
    }
    pos = { x: pick.at.x, y: pick.at.y };
  }
  return out(false, 'travou: passos demais (bot em laço)');
}

/** Resumo de várias sementes de uma fase. */
export function playMany(def: StageDef, seeds: number[]): { results: BotResult[]; wins: number; worstMs: number; medianMs: number; worstTwoMs: number } {
  const results = seeds.map(s => playStage(def, s));
  const times = results.filter(r => r.won).map(r => r.timeMs).sort((a, b) => a - b);
  const two = results.filter(r => r.won).map(r => r.twoBombsMs).sort((a, b) => a - b);
  return {
    results,
    worstTwoMs: two.length ? two[two.length - 1] : 0,
    wins: results.filter(r => r.won).length,
    worstMs: times.length ? times[times.length - 1] : 0,
    medianMs: times.length ? times[Math.floor(times.length / 2)] : 0,
  };
}
