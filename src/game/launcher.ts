// Criação e reinício do jogo Phaser (o canvas é criado só na primeira vez).
import Phaser from 'phaser';
import { CONFIG } from '../config';
import { BootScene } from '../scenes/BootScene';
import { MainScene } from '../scenes/MainScene';
import { hideGameOver } from '../ui/overlays';
import { closeShop } from '../ui/shop';
import { audio } from '../audio/AudioEngine';

let phaserGame: Phaser.Game | null = null;

function mainScene(): MainScene | null {
  if (!phaserGame) return null;
  return phaserGame.scene.getScene('Main') as MainScene;
}

export function startGame(): void {
  closeShop();
  hideGameOver();
  if (audio.enabled && !audio.playing) audio.start();
  if (!phaserGame) {
    phaserGame = new Phaser.Game({
      type: Phaser.AUTO,
      width: CONFIG.cols * CONFIG.tile,
      height: CONFIG.rows * CONFIG.tile,
      backgroundColor: '#0e1613',
      pixelArt: true,
      antialias: false,
      parent: 'game',
      scene: [BootScene, MainScene],
    });
  } else {
    mainScene()?.scene.restart();
  }
}

export function retryGame(): void {
  hideGameOver();
  if (audio.enabled && !audio.playing) audio.start();
  mainScene()?.scene.restart();
}
