// Gera as texturas procedurais e entra na cena principal.
import Phaser from 'phaser';
import { generateTextures } from '../textures';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    generateTextures(this);
    this.scene.start('Main');
  }
}
