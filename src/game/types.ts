import Phaser from 'phaser';
import type { BombId, ElementId } from '../config';
import type { PickupType } from './rewards';
import type { Upgrades } from './upgrades';
import type { EnemyKind } from './entities/enemies/defs';
import type { BossId } from './stages/types';
import type { FormId } from './forms/types';

export type Facing = 'up' | 'down' | 'left' | 'right';

export interface Player {
  gridX: number;
  gridY: number;
  dir: { x: number; y: number };
  facing: Facing;
  moving: boolean;
  hp: number;
  invulnerable: number;
  upgrades: Upgrades; // alcance e frascos por poção
  speedUp: number;
}

export interface Bomb {
  gridX: number;
  gridY: number;
  type: BombId;
  element: ElementId;
  sprite: Phaser.GameObjects.Image;
  halo: Phaser.GameObjects.Image; // brilho do elemento atrás do frasco
  fx: Phaser.GameObjects.Particles.ParticleEmitter; // faíscas do pavio
  fuseMs: number; // fusível total (Infinity nas poções remotas)
  age: number; // ms desde que foi colocada
  timer: number;
  detonated: boolean;
}

export interface Pickup {
  gridX: number;
  gridY: number;
  type: PickupType;
  prize?: PickupType; // item que o baú guarda (sorteado ao nascer)
  potion?: BombId; // power-up de alcance/frasco: a poção que ele fortalece (sorteada ao nascer)
  sprite: Phaser.GameObjects.Image;
  halo?: Phaser.GameObjects.Image;
}

export interface Enemy {
  kind: EnemyKind;
  gridX: number;
  gridY: number;
  sprite: Phaser.GameObjects.Image;
  moveTimer: number;
  alive: boolean;
  // animação do passo: moveT vai de 0 a ENEMY_STEP_MS; depois o sprite só balança (phase)
  moveT: number;
  fromX: number;
  fromY: number;
  hopY: boolean; // o passo é na vertical: o pulo é maior
  phase: number;
  lashMs: number; // flor do mal: tempo até o próximo chicote de espinhos
  dir: { x: number; y: number }; // patrulha: o sentido do passo
  steps: number; // patrulha: passos dados desde a última pausa
  actMs: number; // toupeira/coruja: tempo até a próxima ação (afundar, mergulhar)
  state: 'walk' | 'burrowed' | 'aim'; // toupeira: debaixo da terra; coruja: marcando a casa
  target: { x: number; y: number } | null; // casa onde brota ou onde mergulha
  loot: { type: PickupType; prize?: PickupType; potion?: BombId } | null; // ratinho: o item que roubou
  used: boolean; // salamandra: já aqueceu a Roo nesta fase
  trapMs: number; // preso numa bolha de sabão da Roo Água: não anda, não machuca e não chicoteia até estourar
  fxCooldown: number; // evita repetir o aviso "IMUNE" e o dano a cada quadro enquanto a explosão dura
  hp: number;
  maxHp: number;
  bar: Phaser.GameObjects.Graphics; // barra de vida (aparece depois do primeiro golpe)
}

export interface Explosion {
  x: number;
  y: number;
  timer: number;
  key: string;
  hitPlayer: boolean;
  element: ElementId; // de qual poção veio: define o efeito de quem é atingido
  fromRoo?: boolean; // poção ou Labareda da Roo: só estas ganham o bônus de fogo da transformação
}

export interface PowerupCounts {
  bomb_up: number;
  fire_up: number;
  speed_up: number;
  time_up: number;
}

// O que a jogadora leva da fase 1 para a fase 2.
export interface Carry {
  hp: number;
  upgrades: Upgrades;
  speedUp: number;
  bombType: import('../config').BombId;
}

// Dados passados ao reiniciar a MainScene (sem dados = começa na fase 1).
export interface StageData {
  stage?: number;
  carry?: Carry;
  arena?: BossId; // treino na Arena contra este chefe (stage = ARENA_STAGE; nada vale para a campanha)
  form?: FormId; // na Arena: a transformação fixa em que a Roo luta (sem fim; só para treinar)
  duel?: BossId; // com `arena`: duelo de chefes (arena contra duel, sem a Roo; game/duel.ts)
}
