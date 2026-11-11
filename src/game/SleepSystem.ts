// Sono da Roo: depois de um tempo parada ela adormece e solta "z"; qualquer tecla ou toque acorda.
// A regra do tempo está em game/sleepRules.ts (pura); aqui ficam só os efeitos na cena.
import { CONFIG } from '../config';
import { touch } from '../input/touch';
import { SleepState, stepSleep } from './sleepRules';
import type { MainScene } from '../scenes/MainScene';

export class SleepSystem {
  private state: SleepState = { idleMs: 0, sleeping: false, zzzMs: 0 };

  constructor(private readonly scene: MainScene) {}

  get isSleeping(): boolean {
    return this.state.sleeping;
  }

  // Qualquer tecla ou toque conta como atividade.
  inputActive(): boolean {
    const c = this.scene.cursors;
    const k = this.scene.keys;
    return c.up.isDown || c.down.isDown || c.left.isDown || c.right.isDown ||
      k.space.isDown || k.x.isDown || k.d.isDown || k.r.isDown ||
      k.one.isDown || k.two.isDown || k.three.isDown || k.four.isDown ||
      touch.anyHeld || touch.consumeActivity();
  }

  update(delta: number): void {
    const active = this.scene.player.moving || this.inputActive();
    const event = stepSleep(this.state, delta, active, CONFIG.sleepAfterMs, CONFIG.zzzIntervalMs);
    if (event === 'wake') this.wake();
    else if (event === 'sleep') this.startSleep();
    else if (event === 'zzz') this.spawnZzz();
  }

  // O estado já foi atualizado por stepSleep; aqui só o sprite.
  private startSleep(): void {
    this.scene.refreshSprite('sleep');
  }

  private wake(): void {
    // se o jogador começou a andar neste frame, mantém a animação de caminhada
    this.scene.refreshSprite(this.scene.player.moving ? 'walk' : 'idle');
  }

  spawnZzz(): void {
    const big = Math.random() < 0.5;
    const z = this.scene.add.text(
      this.scene.playerSprite.x + 9,
      this.scene.playerSprite.y - 14,
      big ? 'Z' : 'z',
      {
        fontFamily: 'monospace', fontSize: big ? '18px' : '13px', color: '#d6e6ff', fontStyle: 'bold',
        stroke: '#0e1613', strokeThickness: 3,
      },
    ).setOrigin(0.5).setDepth(21);
    this.scene.tweens.add({
      targets: z,
      x: z.x + 8,
      y: z.y - 24,
      alpha: 0,
      duration: 1900,
      ease: 'Sine.easeOut',
      onComplete: () => z.destroy(),
    });
  }
}
