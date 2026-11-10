// Criação e reinício do jogo Phaser (o canvas é criado só na primeira vez).
import Phaser from 'phaser';
import { CANVAS } from '../config';
import { BootScene } from '../scenes/BootScene';
import { HudScene } from '../scenes/HudScene';
import { MainScene } from '../scenes/MainScene';
import { hideGameOver } from '../ui/overlays';
import { closeShop } from '../ui/shop';
import { ensureFonts } from '../ui/fonts';
import { audio } from '../audio/AudioEngine';

let phaserGame: Phaser.Game | null = null;

function mainScene(): MainScene | null {
  if (!phaserGame) return null;
  return phaserGame.scene.getScene('Main') as MainScene;
}

export async function startGame(): Promise<void> {
  closeShop();
  hideGameOver();
  if (audio.enabled && !audio.playing) audio.start();
  if (!phaserGame) {
    await ensureFonts();
    phaserGame = new Phaser.Game({
      type: Phaser.AUTO,
      width: CANVAS.width,
      height: CANVAS.height,
      backgroundColor: '#0e1613',
      pixelArt: true,
      antialias: false,
      parent: 'game',
      // o canvas se ajusta ao contêiner #game (CSS), em qualquer tela
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene: [BootScene, MainScene, HudScene],
    });
    // só em desenvolvimento: permite inspecionar o jogo pelo console/testes (window.__game)
    if (import.meta.env.DEV) Object.assign(window, { __game: phaserGame });
  } else {
    mainScene()?.scene.restart();
  }
}

export function retryGame(): void {
  hideGameOver();
  if (audio.enabled && !audio.playing) audio.start();
  mainScene()?.scene.restart();
}
