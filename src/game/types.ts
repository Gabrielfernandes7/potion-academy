import Phaser from 'phaser';
import type { BombId, ElementId, EnemyKind } from '../config';
import type { PickupType } from './rewards';

export type Facing = 'up' | 'down' | 'left' | 'right';

export interface Player {
  gridX: number;
  gridY: number;
  dir: { x: number; y: number };
  facing: Facing;
  moving: boolean;
  hp: number;
  invulnerable: number;
  bombsMax: number;
  fireLevel: number;
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
  fxCooldown: number; // evita repetir o aviso "IMUNE" a cada quadro enquanto a explosão dura
}

export interface Explosion {
  x: number;
  y: number;
  timer: number;
  key: string;
  hitPlayer: boolean;
  element: ElementId; // de qual poção veio: define o efeito de quem é atingido
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
  bombsMax: number;
  fireLevel: number;
  speedUp: number;
  coins: number;
  bombType: import('../config').BombId;
}

// Dados passados ao reiniciar a MainScene (sem dados = começa na fase 1).
export interface StageData {
  stage?: number;
  carry?: Carry;
}
