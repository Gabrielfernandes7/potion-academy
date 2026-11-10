// Gera as texturas procedurais e abre o menu.
import Phaser from 'phaser';
import { TEXTURES_READY } from '../game/events';
import { generateTextures } from '../textures';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    generateTextures(this);
    this.game.events.emit(TEXTURES_READY);
    this.scene.start('Menu');
  }
}
