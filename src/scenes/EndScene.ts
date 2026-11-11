// Cena final: a Roo de volta ao Caldeirão, sozinha, com o frasco vazio. Roda por cima da MainScene
// (pausada). Ao terminar, devolve o controle à MainScene, que mostra a tela "Jornada cumprida".
import Phaser from 'phaser';
import { CANVAS } from '../config';
import { CAULDRON_LINES } from '../game/story';
import { readTheme } from '../ui/theme';

const W = CANVAS.width;
const H = CANVAS.height;
const FLOOR_Y = 330;

export class EndScene extends Phaser.Scene {
  private finished = false;
  private ready = false;

  constructor() {
    super('End');
  }

  create(): void {
    this.finished = false;
    this.ready = false;
    const theme = readTheme();
    this.cameras.main.fadeIn(1200, 8, 14, 12);

    // parede e chão do laboratório, bem escuros
    const bg = this.add.graphics();
    bg.fillStyle(0x151a1c, 1).fillRect(0, 0, W, FLOOR_Y);
    bg.fillStyle(0x0e1613, 1).fillRect(0, FLOOR_Y, W, H - FLOOR_Y);
    bg.fillStyle(0x000000, 0.35).fillEllipse(W * 0.42, FLOOR_Y + 72, 180, 22);

    // caldeirão apagado, com um fio de brasa embaixo
    const cx = W * 0.62;
    bg.fillStyle(0x23252b, 1).fillEllipse(cx, FLOOR_Y + 30, 150, 100);
    bg.fillStyle(0x2e3037, 1).fillEllipse(cx, FLOOR_Y - 10, 150, 34);
    bg.fillStyle(0x4fdc8a, 0.55).fillEllipse(cx, FLOOR_Y - 10, 124, 22);
    this.add.image(cx, FLOOR_Y + 82, 'menu_puff').setScale(3.2, 1).setTint(0xff7043)
      .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.3);
    this.add.particles(cx, FLOOR_Y + 82, 'menu_spark', {
      lifespan: { min: 500, max: 1000 }, speedY: { min: -50, max: -20 }, speedX: { min: -8, max: 8 },
      scale: { start: 1.6, end: 0 }, alpha: { start: 0.8, end: 0 }, frequency: 90,
      blendMode: 'ADD', tint: [0xff7043, 0xffd54f],
    });
    this.add.particles(cx, FLOOR_Y - 14, 'menu_puff', {
      lifespan: 2800, speedY: { min: -26, max: -14 }, scale: { start: 0.4, end: 1.5 },
      alpha: { start: 0.14, end: 0 }, frequency: 420, tint: 0xcfd8dc,
    });

    // Roo parada de frente, com o frasco vazio ao lado
    this.add.image(W * 0.42, FLOOR_Y + 66, 'roo_down_1').setOrigin(0.5, 1).setScale(3);
    const flask = this.add.image(W * 0.42 + 70, FLOOR_Y + 40, 'hud_flask_empty').setScale(3);
    const glow = this.add.image(flask.x, flask.y, 'menu_puff').setScale(1.6).setTint(0xffe9a8)
      .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.25);
    this.tweens.add({ targets: glow, alpha: 0.5, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // texto: uma linha por vez
    const text = this.add.text(W / 2, 70, '', {
      fontFamily: theme.fontBody, fontSize: '17px', color: '#f1e9d8', align: 'center',
      wordWrap: { width: W - 90 },
    }).setOrigin(0.5, 0).setAlpha(0);
    const hint = this.add.text(W / 2, H - 34, 'Enter, Espaço ou toque para continuar', {
      fontFamily: theme.fontBody, fontSize: '12px', color: theme.textMuted,
    }).setOrigin(0.5).setAlpha(0);

    let i = 0;
    const show = (): void => {
      text.setText(CAULDRON_LINES[i]);
      this.tweens.add({
        targets: text, alpha: 1, duration: 900,
        onComplete: () => {
          this.time.delayedCall(2600, () => {
            if (this.finished) return;
            this.tweens.add({
              targets: text, alpha: 0, duration: 700,
              onComplete: () => {
                i++;
                if (i < CAULDRON_LINES.length) show();
                else this.finish();
              },
            });
          });
        },
      });
    };
    this.time.delayedCall(1300, () => { show(); this.ready = true; hint.setAlpha(0.8); });

    const skip = (): void => {
      if (!this.ready) return;
      this.finish();
    };
    this.input.keyboard?.on('keydown-ENTER', skip);
    this.input.keyboard?.on('keydown-SPACE', skip);
    this.input.on('pointerdown', skip);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown-ENTER', skip);
      this.input.keyboard?.off('keydown-SPACE', skip);
    });
  }

  private finish(): void {
    if (this.finished) return;
    this.finished = true;
    this.cameras.main.fadeOut(900, 8, 14, 12);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.game.events.emit('end:done');
      this.scene.stop();
    });
  }
}
