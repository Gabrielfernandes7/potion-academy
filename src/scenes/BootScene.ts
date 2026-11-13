// Gera as texturas procedurais e abre o menu.
import Phaser from 'phaser';
import { TEXTURES_READY } from '../game/events';
import { generateTextures } from '../textures';
import { addRooFormTextures } from '../textures/rooFormTextures';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    generateTextures(this);
    addRooFormTextures(this); // as formas da Roo (fogo e água): só o jogo precisa de todas
    this.game.events.emit(TEXTURES_READY);
    this.scene.start('Menu');
  }
}
