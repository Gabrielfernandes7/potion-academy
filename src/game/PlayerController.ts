// O controle da Roo na partida: passo à mão, escolha de direção, dano e acerto de explosão.
// A MainScene guarda o estado (player, sprite) e delega aqui; a matemática está em movement.ts,
// playerInput.ts e entities/roo.ts.
import { buzz } from '../ui/haptics';
import { CONFIG, ElementId } from '../config';
import type { MainScene } from '../scenes/MainScene';
import { deathTip, type DeathCause } from './deathTip';
import { damageToRoo } from './entities/roo';
import { HIT_TINT, hitFx } from './entities/hitEffects';
import { stepDust } from './fx/battleFx';
import { advanceStep, beginStep, facingFor, lerp, moveDurationMs, tileCenter, walkTimeScale, type StepState } from './movement';
import { chooseMove, nextLastDir, type Dir, type DirFlags } from './playerInput';

export class PlayerController {
  lastDir: Dir = { x: 0, y: 0 };
  lastCause: DeathCause | null = null; // o que machucou a Roo por último (dica da tela de derrota)
  private moveFrom = { x: 0, y: 0 };
  private moveTo = { x: 0, y: 0 };
  private step: StepState = beginStep(0, 220);
  private stepCount = 0; // a poeira sai a cada dois passos

  constructor(private readonly scene: MainScene) {}

  /** Zera o estado de uma nova partida. */
  reset(): void {
    this.lastDir = { x: 0, y: 0 };
    this.lastCause = null;
    this.step = beginStep(0, 220);
  }

  tip(): { by: string; tip: string } {
    return deathTip(this.lastCause);
  }

  // Casa onde a jogadora está de fato (posição do sprite, como o dano).
  tile(): { x: number; y: number } {
    const T = CONFIG.tile;
    const s = this.scene.playerSprite;
    return { x: Math.floor(s.x / T), y: Math.floor(s.y / T) };
  }

  moveDuration(): number {
    const s = this.scene;
    return moveDurationMs(CONFIG.baseMoveDuration, s.player.speedUp) * (s.forms?.walkFactor() ?? 1); // Roo Terra: o peso
  }

  // Movimento feito à mão (não por tween): o tempo que sobra ao chegar numa casa vai para o passo
  // seguinte, então andar em linha reta tem velocidade constante, sem pausa entre casas.
  moveToTile(nx: number, ny: number, duration: number): void {
    const s = this.scene;
    s.player.gridX = nx;
    s.player.gridY = ny;
    s.player.moving = true;
    this.moveFrom = { x: s.playerSprite.x, y: s.playerSprite.y };
    // poeirinha nos pés a cada dois passos; a Roo Ar flutua e não levanta pó
    if (++this.stepCount % 2 === 0 && s.forms?.form?.formElement !== 'air') stepDust(s, this.moveFrom.x, this.moveFrom.y + CONFIG.tile * 0.35);
    this.moveTo = { x: tileCenter(nx, CONFIG.tile), y: tileCenter(ny, CONFIG.tile) };
    this.step = beginStep(this.step.carry, duration);
    s.playWalk();
    s.playerSprite.anims.timeScale = walkTimeScale(duration);
  }

  // Avança o passo atual; ao chegar, guarda o excedente de tempo e libera o próximo passo.
  advance(delta: number): void {
    const s = this.scene;
    if (!s.player.moving) return;
    const tick = advanceStep(this.step, delta);
    this.step = tick.state;
    s.playerSprite.x = lerp(this.moveFrom.x, this.moveTo.x, tick.t);
    s.playerSprite.y = lerp(this.moveFrom.y, this.moveTo.y, tick.t);
    if (!tick.finished) return;
    // sem playIdle aqui: se a tecla segue pressionada, o próximo passo continua o mesmo ciclo
    s.player.moving = false;
    s.pickupSystem.checkPickups();
    s.checkWin();
  }

  tryMove(dx: number, dy: number): void {
    const s = this.scene;
    if (s.player.moving) return;
    s.player.dir = { x: dx, y: dy };
    s.player.facing = facingFor(dx, dy, s.player.facing);
    const nx = s.player.gridX + dx;
    const ny = s.player.gridY + dy;
    if (!s.isFree(nx, ny)) {
      s.playIdle();
      return;
    }
    this.moveToTile(nx, ny, this.moveDuration());
  }

  /** Entrada de direção de um quadro: atualiza a última seta e dá o passo, se estiver parada. */
  steer(just: DirFlags, held: DirFlags): void {
    this.lastDir = nextLastDir(this.lastDir, just);
    if (this.scene.player.moving) return;
    const d = chooseMove(this.lastDir, held);
    if (d) this.tryMove(d.x, d.y);
  }

  /** Fim do quadro: se não começou outro passo, o tempo sobrando não vale e a caminhada vira parada. */
  settle(): void {
    const s = this.scene;
    if (s.player.moving) return;
    this.step = beginStep(0, this.step.length);
    if (s.playerSprite.anims.currentAnim?.key.startsWith('roo_walk_')) {
      s.playerSprite.anims.timeScale = 1;
      s.playIdle();
    }
  }

  // Dano à Roo; o efeito do elemento vive em game/entities/hitEffects.ts.
  damage(bypassInvuln = false, element?: ElementId): void {
    const s = this.scene;
    if (s.duel) return; // a Roo só assiste ao duelo
    if (!bypassInvuln && s.player.invulnerable > 0) return;
    this.lastCause = bypassInvuln ? 'overtime' : element ?? 'contact';
    const raw = damageToRoo(element, s.forms.profile()); // transformada, o que a machuca muda
    const amount = s.forms.reduceDamage(raw); // com a defesa da forma de pé, o dano cai pela metade
    if (amount < raw) s.floatingText(s.player.gridX, s.player.gridY - 1, 'DEFENDIDO', '#bfe6ff', 11, 700);
    s.player.hp -= amount;
    s.player.invulnerable = CONFIG.invulnTime;
    s.floatingText(s.player.gridX, s.player.gridY, `-${amount}`, '#ff8a80');
    s.updateHud();
    s.play('hurt');
    buzz(45);
    s.playPose('hurt');
    s.playerSprite.setTint(element ? HIT_TINT[element] : 0xff5252);
    if (element) hitFx(s, s.playerSprite.x, s.playerSprite.y - 8, element);
    s.tweens.add({
      targets: s.playerSprite, alpha: 0.3,
      duration: 120, yoyo: true, repeat: 5,
      onComplete: () => {
        s.playerSprite.setAlpha(1);
        s.playerSprite.clearTint();
      },
    });
    if (s.player.hp <= 0) {
      s.player.hp = 0;
      s.updateHud();
      s.triggerGameOver();
    }
  }

  checkHit(): void {
    const s = this.scene;
    if (s.player.invulnerable > 0) return;
    const t = this.tile();
    const key = `${t.x},${t.y}`;
    const blast = s.bombSystem.explosions.find(e => e.key === key && !e.hitPlayer);
    if (blast) {
      blast.hitPlayer = true;
      this.damage(false, blast.element);
    }
  }
}
