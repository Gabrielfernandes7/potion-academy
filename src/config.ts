import { PROFILES } from './game/entities/profiles';
// Constantes de balanceamento e de configuração do jogo.
// Ajuste valores aqui; o restante do código lê daqui.

export const CONFIG = {
  cols: 15,
  rows: 13,
  tile: 40,
  maxHp: PROFILES.roo.maxHp, // 24 pontos de vida (barra contínua; game/entities/roo.ts)
  invulnTime: 1500,
  gemsForDoor: 3,
  maxBombs: 2,
  maxBombUp: 3,
  maxFireUp: 3,
  maxSpeedUp: 2,
  timeUpBonus: 15000,
  overtimeDamageInterval: 1200,
  baseMoveDuration: 300, // ms por casa sem power-up (igual ao sapo; +2 velocidade fica em ~143 ms)
  sleepAfterMs: 5000,   // parada sem input por este tempo => dorme
  zzzIntervalMs: 1400,  // intervalo entre os 'z' flutuantes
  hudHeight: 56,        // faixa da HUD acima da grade, em px do canvas

  // ---- o chefe (Belladona) ----
  bossHp: PROFILES.belladonna.maxHp, // 20: 4 golpes de fogo/éter ou 10 de água/terra (game/entities/damage.ts)
  bossMoveInterval: 1100,
  bossHitInvuln: 1400,        // proteção do chefe depois de levar um golpe
  bossFirstCastMs: 2600,      // quanto ela espera antes da primeira habilidade
  bossCooldownMs: 3400,       // intervalo entre habilidades (vida acima de 50%)
  bossFuriousCooldownMs: 2300, // intervalo quando a vida chega a 50% ou menos
  bossTelegraphMs: 1200,      // aviso no chão antes de a poção cair
  bossRainDrops: 4,
  bossBlinkHideMs: 700,
  // Ganhos de OURO: moedas e baús rendem menos (o ouro acumulava sem ter o que comprar). Preços da loja iguais.
  coinPickupValue: 1,         // OURO de cada moeda solta (era 2)
  bossVictoryBonus: 80,       // OURO ganho ao derrotá-la (antes 40)
  gardenVictoryBonus: 60,     // OURO ganho ao cruzar o portão do jardim, fim do jogo (antes 30)
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
