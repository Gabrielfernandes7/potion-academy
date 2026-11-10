import Phaser from 'phaser';
import type { BombId, ElementId } from '../config';
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
  timer: number;
  detonated: boolean;
}

export interface Pickup {
  gridX: number;
  gridY: number;
  type: PickupType;
  sprite: Phaser.GameObjects.Image;
}

export interface Enemy {
  gridX: number;
  gridY: number;
  sprite: Phaser.GameObjects.Image;
  moveTimer: number;
  alive: boolean;
}

export interface Explosion {
  x: number;
  y: number;
  timer: number;
  key: string;
  hitPlayer: boolean;
}

export interface PowerupCounts {
  bomb_up: number;
  fire_up: number;
  speed_up: number;
  time_up: number;
}
