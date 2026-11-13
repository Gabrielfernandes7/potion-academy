// Belladona, a alquimista rival: habilidades e falas. O resto (vida, fases, tempos, avisos,
// dano e derrota) vem de BossBase. As regras puras estão em boss.ts e são testadas.
//
// Habilidades (cada uma mostra um aviso no chão antes de acontecer; ver docs/03-mundo.md):
//   fire  : arremessa uma poção de fogo na casa onde você está; explode em cruz (raio 1).
//           Furiosa: arremessa duas, uma depois da outra.
//   rain  : (só furiosa) gotas de água caem em casas ao redor de você.
//   blink : some e reaparece longe, protegida enquanto está escondida.
import Phaser from 'phaser';
import { CONFIG, ELEMENTS, ElementId } from '../../../../config';
import { damageTo } from '../../damage';
import { pickBossLine } from './lines';
import type { MainScene } from '../../../../scenes/MainScene';
import { BossBase, center } from '../BossBase';
import { BossPhase, Tile, blastTiles } from '../common';
import {
  BOSS_NAME, BossSkill, ELEMENT_POTION_TEXTURE, SKILL_ELEMENT,
  blinkDestination, cooldownFor, pickBossSkill, rainTargets,
} from './rules';
import { PROFILES } from '../../profiles';

export type { BossHudView } from '../BossBase';

const LIME = 0x9be564;

export class BelladonnaController extends BossBase {
  readonly name = BOSS_NAME;
  private lastSkill: BossSkill | null = null;

  constructor(scene: MainScene) {
    super(scene, {
      prefix: 'witch',
      spawn: { x: CONFIG.cols - 2, y: CONFIG.rows - 2 },
      maxHp: CONFIG.bossHp,
      moveIntervalMs: CONFIG.bossMoveInterval,
      firstCastMs: CONFIG.bossFirstCastMs,
      furiousTint: LIME,
    });
  }

  protected damageFor(element: ElementId): number {
    return damageTo(PROFILES.belladonna, element);
  }

  protected cooldownFor(phase: BossPhase): number {
    return cooldownFor(phase);
  }

  protected lineFor(kind: string): string {
    return pickBossLine(kind as Parameters<typeof pickBossLine>[0]);
  }

  protected onDefeated(): void {
    this.scene.onBossDefeated();
  }

  // ---------- habilidades ----------

  protected castNext(): void {
    const skill = pickBossSkill(this.phase, this.lastSkill);
    this.lastSkill = skill;
    this.state = 'casting';
    this.say(skill);
    if (skill === 'fire') this.castFire(this.phase === 2 ? 2 : 1);
    else if (skill === 'rain') this.castRain();
    else this.castBlink();
  }

  private castFire(shots: number): void {
    this.setPose('cast');
    this.scene.play('powerup');
    const throwOne = (): void => {
      if (this.state === 'defeated') return;
      const target = this.scene.playerTile();
      const tiles = blastTiles(target.x, target.y, 1, this.isOpen);
      this.telegraph(tiles, 'fire', target);
      this.throwPotion('fire', target, tiles);
    };
    throwOne();
    if (shots > 1) this.after(650, throwOne);
    this.after(shots > 1 ? 1100 : 750, () => this.endCast());
  }

  private castRain(): void {
    this.setPose('cast');
    this.scene.play('powerup');
    const targets = rainTargets(this.scene.playerTile(), CONFIG.bossRainDrops, this.isOpen);
    targets.forEach((tile, i) => {
      this.telegraph([tile], 'water', tile);
      // gota caindo do alto até a casa
      const drop = this.scene.add.image(center(tile.x), center(tile.y) - 110, ELEMENT_POTION_TEXTURE.water)
        .setDepth(13).setScale(0.7).setAlpha(0.9);
      this.scene.tweens.add({
        targets: drop, y: center(tile.y), rotation: 5, duration: CONFIG.bossTelegraphMs + i * 140,
        ease: 'Sine.easeIn', onComplete: () => drop.destroy(),
      });
      this.after(CONFIG.bossTelegraphMs + i * 140, () => {
        this.explode([tile], 'water');
      });
    });
    this.after(900, () => this.endCast());
  }

  private castBlink(): void {
    this.state = 'blinking';
    this.hidden = true;
    this.scene.play('door');
    const color = ELEMENTS[SKILL_ELEMENT.blink].color;
    this.burst(this.sprite.x, this.sprite.y - 10, 'menu_puff', [color, 0xffffff], 10, 60);
    this.scene.tweens.add({ targets: this.sprite, alpha: 0, duration: 300 });
    this.after(CONFIG.bossBlinkHideMs, () => {
      if (this.state === 'defeated') return;
      const player = this.scene.playerTile();
      const free: Tile[] = [];
      for (let y = 1; y < CONFIG.rows - 1; y++) {
        for (let x = 1; x < CONFIG.cols - 1; x++) {
          if (this.scene.isFree(x, y) && !(x === player.x && y === player.y)) free.push({ x, y });
        }
      }
      const dest = blinkDestination(player, free, 5);
      if (dest) {
        this.gridX = dest.x;
        this.gridY = dest.y;
        this.sprite.setPosition(center(dest.x), center(dest.y));
      }
      this.burst(this.sprite.x, this.sprite.y - 10, 'menu_spark', [color, 0xffffff], 14, 110);
      this.scene.tweens.add({ targets: this.sprite, alpha: 1, duration: 300 });
      this.hidden = false;
      this.state = 'idle';
      this.cooldownMs = Math.max(1200, cooldownFor(this.phase) * 0.55);
    });
  }

  private throwPotion(element: ElementId, target: Tile, tiles: Tile[]): void {
    const sx = this.sprite.x + 12;
    const sy = this.sprite.y - 20;
    const ex = center(target.x);
    const ey = center(target.y);
    const flight = CONFIG.bossTelegraphMs - 150;
    const proj = this.scene.add.image(sx, sy, ELEMENT_POTION_TEXTURE[element]).setDepth(13);
    this.scene.tweens.addCounter({
      from: 0, to: 1, duration: flight, delay: 150,
      onUpdate: tw => {
        const p = tw.getValue() ?? 0;
        proj.setPosition(Phaser.Math.Linear(sx, ex, p), Phaser.Math.Linear(sy, ey, p) - Math.sin(p * Math.PI) * 72);
        proj.setRotation(p * 9);
      },
      onComplete: () => proj.destroy(),
    });
    this.after(CONFIG.bossTelegraphMs, () => this.explode(tiles, element));
  }
}
