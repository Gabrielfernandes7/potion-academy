// Constantes de balanceamento e de configuração do jogo.
// Ajuste valores aqui; o restante do código lê daqui.

export const CONFIG = {
  cols: 15,
  rows: 13,
  tile: 40,
  maxHp: 5,
  invulnTime: 1500,
  damagePerExplosion: 1,
  gemsForDoor: 3,
  maxBombs: 2,
  pushCd: 3000,
  pushRange: 3,
  maxBombUp: 3,
  maxFireUp: 3,
  maxSpeedUp: 2,
  timeUpBonus: 15000,
  overtimeDamageInterval: 1200,
  baseMoveDuration: 220,
  sleepAfterMs: 5000,   // parada sem input por este tempo => dorme
  zzzIntervalMs: 1400,  // intervalo entre os 'z' flutuantes
  hudHeight: 56,        // faixa da HUD acima da grade, em px do canvas

  // ---- o chefe (Belladona) ----
  bossHp: 8,
  bossMoveInterval: 1100,
  bossHitInvuln: 1400,        // proteção do chefe depois de levar um golpe
  bossFirstCastMs: 2600,      // quanto ela espera antes da primeira habilidade
  bossCooldownMs: 3400,       // intervalo entre habilidades (vida acima de 50%)
  bossFuriousCooldownMs: 2300, // intervalo quando a vida chega a 50% ou menos
  bossTelegraphMs: 1200,      // aviso no chão antes de a poção cair
  bossRainDrops: 4,
  bossBlinkHideMs: 700,
  // Ganhos de POÇÃO dobrados (inflação); os preços da loja não mudaram.
  coinPickupValue: 2,         // POÇÃO de cada moeda solta (antes 1)
  bossVictoryBonus: 80,       // POÇÃO ganha ao derrotá-la (antes 40)
  gardenVictoryBonus: 60,     // POÇÃO ganha ao cruzar o portão do jardim, fim do jogo (antes 30)
  stageClearHeal: 0,          // vida recuperada ao passar de uma fase para a seguinte

  // ---- flor do mal (jardim) ----
  flowerLashCycleMs: 3200,    // intervalo entre os chicotes de espinhos
  flowerWarnMs: 800,          // aviso no chão antes de cada chicote
};

// Tamanho interno do canvas: grade + faixa da HUD.
export const CANVAS = {
  width: CONFIG.cols * CONFIG.tile,
  height: CONFIG.rows * CONFIG.tile + CONFIG.hudHeight,
};

export type ElementId = 'fire' | 'water' | 'earth' | 'air';

export interface ElementDef {
  name: string;
  alchemy: string;
  color: number;
  glow: number;
  symbol: string;
  description: string;
}

export const ELEMENTS: Record<ElementId, ElementDef> = {
  fire:  { name: 'FOGO',  alchemy: 'Enxofre',  color: 0xff6b6b, glow: 0xffa94d, symbol: '△', description: 'Chamas quentes e radiantes.' },
  water: { name: 'ÁGUA',  alchemy: 'Mercúrio', color: 0x74b9ff, glow: 0xa8e6f5, symbol: '▽', description: 'Fluxo aquoso e gelado.' },
  earth: { name: 'TERRA', alchemy: 'Sal',      color: 0x81c784, glow: 0xc8e6c9, symbol: '◇', description: 'Energia mineral e natural.' },
  air:   { name: 'ÉTER',  alchemy: 'Éter',     color: 0xc9d6df, glow: 0xeef4f8, symbol: '☿', description: 'Magia arcana pura.' },
};

export type BombId = 'normal' | 'mega' | 'pierce' | 'remote';

export interface BombDef {
  label: string;
  radius: number;
  fuse: number;
  cost: number;
  desc: string;
  element: ElementId;
  pierce?: boolean;
  remote?: boolean;
}

export const BOMB_TYPES: Record<BombId, BombDef> = {
  normal: { label: 'Poção de Fogo',  radius: 2, fuse: 2000,     cost: 0,   desc: 'Poção básica: rápida e confiável.', element: 'fire' },
  mega:   { label: 'Poção Aqua',     radius: 3, fuse: 2400,     cost: 60,  desc: 'Alcance maior, mas o fusível é mais lento.', element: 'water' },
  pierce: { label: 'Poção Telúrica', radius: 2, fuse: 2200,     cost: 90,  desc: 'Atravessa caixotes e limpa uma fileira.', element: 'earth', pierce: true },
  remote: { label: 'Poção Etérea',   radius: 2, fuse: Infinity, cost: 120, desc: 'Explode quando você quiser (tecla D).', element: 'air', remote: true },
};

export const BOMB_ORDER: BombId[] = ['normal', 'mega', 'pierce', 'remote'];

export const EMPTY = 0;
export const WALL = 1;
export const BLOCK = 2;

export const DIRS: ReadonlyArray<readonly [number, number]> = [[0, -1], [0, 1], [-1, 0], [1, 0]];

// ---------------------------------------------------------------- inimigos

export type EnemyKind = 'frog' | 'ghost' | 'flower';

export interface EnemyDef {
  name: string;
  texture: string;
  moveInterval: number; // ms entre passos (Infinity: não se move)
  stepMs: number; // duração da animação de um passo
  passWalls: boolean; // atravessa muralhas, caixotes e poções
  rooted: boolean; // fixo no chão: bloqueia a casa onde está
  immune: ElementId[]; // explosões destes elementos não o machucam
}

export const ENEMY_TYPES: Record<EnemyKind, EnemyDef> = {
  frog:   { name: 'Sapo mago',   texture: 'enemy',        moveInterval: 800,      stepMs: 300, passWalls: false, rooted: false, immune: [] },
  ghost:  { name: 'Fantasma',    texture: 'enemy_ghost',  moveInterval: 1500,     stepMs: 700, passWalls: true,  rooted: false, immune: [] },
  flower: { name: 'Flor do mal', texture: 'enemy_flower', moveInterval: Infinity, stepMs: 300, passWalls: false, rooted: true,  immune: ['water'] },
};

export function isImmune(kind: EnemyKind, element: ElementId): boolean {
  return ENEMY_TYPES[kind].immune.includes(element);
}

// ---------------------------------------------------------------- fases

type StageKind = 'lab' | 'crypt' | 'boss' | 'garden';
export type StageTheme = 'stone' | 'crypt' | 'garden';

// Quantos inimigos de um tipo: `start` no início; se houver `every`, mais um a cada N caixotes quebrados, até `max`.
interface EnemyRule {
  kind: EnemyKind;
  start: number;
  max: number;
  every?: number;
}

// Quantas moedas um baú pode trazer, com a chance de cada valor (as chances somam 1).
// Regra: quanto maior a recompensa, menor a chance.
export interface ChestOdd { chance: number; coins: number }

export interface StageDef {
  kind: StageKind;
  name: string;
  tip?: string; // dica mostrada ao entrar na fase
  time: number; // ms
  blockChance: number;
  door: boolean; // fase de gemas e porta (o chefe não tem porta)
  enemies: EnemyRule[];
  theme: StageTheme;
  track?: string; // faixa de música da fase (a escolha da jogadora na Sala de Música vale mais)
  chest: ReadonlyArray<ChestOdd>; // sorteio do baú (moedas) nesta fase
}

// Tabelas de baú: a fase mais avançada tem baús mais generosos, mas ainda raros.
const CHEST_COMMON: ReadonlyArray<ChestOdd> = [
  { chance: 0.70, coins: 10 }, { chance: 0.25, coins: 20 }, { chance: 0.04, coins: 40 }, { chance: 0.01, coins: 100 },
];
const CHEST_RICH: ReadonlyArray<ChestOdd> = [
  { chance: 0.55, coins: 10 }, { chance: 0.30, coins: 20 }, { chance: 0.12, coins: 40 }, { chance: 0.03, coins: 100 },
];

export const STAGES: StageDef[] = [
  {
    kind: 'lab', name: 'O CHAMADO', chest: CHEST_COMMON, time: 90000, blockChance: 0.7, door: true, theme: 'stone',
    enemies: [{ kind: 'frog', start: 2, max: 5, every: 8 }],
  },
  {
    kind: 'crypt', name: 'O CAMINHO', chest: CHEST_RICH, tip: 'Poção Aqua apaga poções de Fogo. Fantasmas atravessam paredes.',
    time: 100000, blockChance: 0.6, door: true, theme: 'crypt', track: 'luar',
    enemies: [{ kind: 'ghost', start: 2, max: 4, every: 10 }, { kind: 'frog', start: 1, max: 1 }],
  },
  {
    kind: 'boss', name: 'O DUELO', chest: CHEST_RICH, time: 120000, blockChance: 0.35, door: false, theme: 'stone',
    enemies: [],
  },
  {
    kind: 'garden', name: 'O RETORNO', chest: CHEST_RICH, tip: 'As flores do mal resistem à Poção Aqua. Use outra poção.',
    time: 100000, blockChance: 0.5, door: true, theme: 'garden', track: 'jardim',
    enemies: [{ kind: 'frog', start: 2, max: 3, every: 10 }, { kind: 'flower', start: 5, max: 5 }],
  },
];

export const LAST_STAGE = STAGES.length;

// Fase de 1 a LAST_STAGE (valores fora do intervalo são ajustados).
export function stageDef(stage: number): StageDef {
  return STAGES[Math.min(LAST_STAGE, Math.max(1, Math.floor(stage))) - 1];
}
