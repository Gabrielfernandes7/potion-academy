// Bombas, explosões e empurrão: o sistema de frascos da partida.
// A cena (MainScene) guarda o estado da partida e chama este sistema; as regras de reação
// entre poções ficam em game/chain.ts. Ver docs/ARCH.md.
import Phaser from 'phaser';
import { BLOCK, BOMB_TYPES, CONFIG, DIRS, ELEMENTS, ElementId, WALL } from '../config';
import { chainOutcome } from './chain';
import type { Bomb, Explosion } from './types';
import type { MainScene } from '../scenes/MainScene';

const EXPLOSION_FX: Record<ElementId, {
  texture: string; speed: { min: number; max: number }; angle: { min: number; max: number };
  gravity: number; life: { min: number; max: number }; size: number; count: number; extra: number[]; blend: string;
}> = {
  fire: { texture: 'menu_spark', speed: { min: 30, max: 90 }, angle: { min: -130, max: -50 }, gravity: -40, life: { min: 450, max: 900 }, size: 2, count: 7, extra: [0xffd54f], blend: 'ADD' },
  water: { texture: 'menu_bubble', speed: { min: 20, max: 80 }, angle: { min: 0, max: 360 }, gravity: 120, life: { min: 400, max: 800 }, size: 1.1, count: 8, extra: [0xffffff], blend: 'NORMAL' },
  earth: { texture: 'menu_spark', speed: { min: 30, max: 90 }, angle: { min: -150, max: -30 }, gravity: 260, life: { min: 400, max: 700 }, size: 1.6, count: 7, extra: [0x8d6e63, 0x6d4c41], blend: 'NORMAL' },
  air: { texture: 'menu_spark', speed: { min: 20, max: 70 }, angle: { min: 0, max: 360 }, gravity: -10, life: { min: 600, max: 1000 }, size: 1.8, count: 8, extra: [0xffffff, 0xe0d8ff], blend: 'ADD' },
};

export class BombSystem {
  bombs: Bomb[] = [];
  explosions: Explosion[] = [];

  constructor(private readonly scene: MainScene) {}

  placeBomb(): void {
    if (this.bombs.length >= this.scene.player.bombsMax) return;
    if (this.scene.hasBomb(this.scene.player.gridX, this.scene.player.gridY)) return;
    const type = BOMB_TYPES[this.scene.bombType];
    const sprite = this.scene.add.image(
      this.scene.player.gridX * CONFIG.tile + CONFIG.tile / 2,
      this.scene.player.gridY * CONFIG.tile + CONFIG.tile / 2,
      'bomb_' + this.scene.bombType,
    ).setDepth(5).setScale(0.01);
    this.scene.tweens.add({ targets: sprite, scale: 1, duration: 150, ease: 'Back.easeOut' });
    // brilho do elemento + faíscas no pavio; a pulsação acelera perto de explodir (updateBombs)
    const el = ELEMENTS[type.element];
    const halo = this.scene.add.image(sprite.x, sprite.y, 'menu_puff').setTint(el.color)
      .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.25).setScale(0.85).setDepth(4);
    const fx = this.scene.add.particles(0, 0, 'menu_spark', {
      follow: sprite,
      followOffset: { x: 0, y: -15 },
      lifespan: 420,
      speed: { min: 10, max: 38 },
      angle: { min: -125, max: -55 },
      scale: { start: 0.9, end: 0 },
      alpha: { start: 1, end: 0 },
      frequency: 90,
      blendMode: 'ADD',
      tint: [0xffd54f, el.color],
    }).setDepth(6);
    this.bombs.push({
      gridX: this.scene.player.gridX, gridY: this.scene.player.gridY,
      type: this.scene.bombType, element: type.element, sprite, halo, fx,
      fuseMs: type.fuse, age: 0,
      timer: type.fuse, detonated: false,
    });
    this.scene.play('bomb');
    this.scene.updateHud();
  }

  detonateRemote(): void {
    for (const b of [...this.bombs]) {
      if (b.type === 'remote' && !b.detonated) this.detonate(b);
    }
  }

  detonate(bomb: Bomb): void {
    if (bomb.detonated) return;
    bomb.detonated = true;
    const type = BOMB_TYPES[bomb.type];
    const radius = type.radius + this.scene.player.fireLevel;
    const tiles: Array<{ x: number; y: number }> = [{ x: bomb.gridX, y: bomb.gridY }];
    for (const [dx, dy] of DIRS) {
      for (let r = 1; r <= radius; r++) {
        const nx = bomb.gridX + dx * r;
        const ny = bomb.gridY + dy * r;
        const tile = this.scene.getTile(nx, ny);
        if (tile === null || tile === WALL) break;
        // reação entre poções: fogo acende, água apaga o fogo, terra é imune (ver game/chain.ts)
        const chainBomb = this.bombs.find(b => b !== bomb && b.gridX === nx && b.gridY === ny && !b.detonated);
        if (chainBomb) {
          const outcome = chainOutcome(bomb.element, chainBomb.element);
          if (outcome === 'trigger') this.detonate(chainBomb);
          else if (outcome === 'neutralize') this.neutralizeBomb(chainBomb);
        }
        tiles.push({ x: nx, y: ny });
        if (tile === BLOCK) {
          this.scene.removeBlock(nx, ny);
          this.scene.spawnReward(nx, ny);
          if (!type.pierce) break;
        }
      }
    }
    const element = ELEMENTS[bomb.element] ?? ELEMENTS.fire;
    this.scene.boss?.onExplosion(tiles);
    for (const t of tiles) {
      for (const enemy of this.scene.enemies) {
        if (enemy.alive && enemy.gridX === t.x && enemy.gridY === t.y) this.scene.hitEnemy(enemy, bomb.element);
      }
      this.spawnExplosion(t.x, t.y, element.color, element.glow, bomb.element);
    }
    this.scene.tweens.killTweensOf(bomb.sprite);
    bomb.sprite.destroy();
    bomb.halo.destroy();
    bomb.fx.destroy();
    this.scene.play('explosion', bomb.element);
    this.scene.cameras.main.shake(70, 0.003);
  }

  neutralizeBomb(bomb: Bomb): void {
    if (bomb.detonated) return;
    bomb.detonated = true;
    const { x, y } = bomb.sprite;
    this.scene.tweens.killTweensOf(bomb.sprite);
    bomb.sprite.destroy();
    bomb.halo.destroy();
    bomb.fx.destroy();
    const steam = this.scene.add.particles(x, y, 'menu_puff', {
      speed: { min: 8, max: 30 },
      angle: { min: -120, max: -60 },
      lifespan: { min: 700, max: 1100 },
      scale: { start: 0.35, end: 1.1 },
      alpha: { start: 0.55, end: 0 },
      tint: [0xe3f2fd, 0xb0bec5, 0xffffff],
      emitting: false,
    }).setDepth(10);
    steam.explode(7);
    this.scene.time.delayedCall(1300, () => steam.destroy());
    this.scene.floatingText(Math.floor(x / CONFIG.tile), Math.floor(y / CONFIG.tile), 'APAGADA', '#a8e6f5');
    this.scene.play('fizzle');
  }

  pushAbility(): void {
    if (this.scene.cooldowns.push > 0 || this.scene.player.moving) return;
    const { gridX, gridY, dir } = this.scene.player;
    const fx = gridX + dir.x;
    const fy = gridY + dir.y;
    const bomb = this.bombs.find(b => b.gridX === fx && b.gridY === fy);
    if (!bomb) return;
    let lastX = fx;
    let lastY = fy;
    for (let i = 1; i <= CONFIG.pushRange; i++) {
      const tx = fx + dir.x * i;
      const ty = fy + dir.y * i;
      if (!this.scene.isFree(tx, ty)) break;
      lastX = tx;
      lastY = ty;
    }
    if (lastX === fx && lastY === fy) return;
    bomb.gridX = lastX;
    bomb.gridY = lastY;
    this.scene.tweenSpriteTo(bomb.sprite, lastX, lastY, 200, 'Cubic.easeOut');
    this.scene.cooldowns.push = CONFIG.pushCd;
  }

  updateBombs(delta: number): void {
    for (const bomb of this.bombs) {
      if (bomb.detonated) continue;
      bomb.age += delta;
      bomb.timer -= delta;
      // pulsa mais rápido e brilha mais conforme o fusível acaba (a etérea pulsa devagar e sempre)
      const finite = isFinite(bomb.fuseMs);
      const closeness = finite ? 1 - Math.max(0, bomb.timer / bomb.fuseMs) : 0;
      const k = Math.sin((bomb.age / 1000) * (finite ? 5 + 16 * closeness : 3));
      if (bomb.age > 180) bomb.sprite.setScale(1 + 0.07 * k + 0.12 * closeness);
      bomb.halo.setPosition(bomb.sprite.x, bomb.sprite.y)
        .setAlpha(0.18 + 0.2 * (0.5 + 0.5 * k) + 0.25 * closeness);
      if (bomb.timer <= 0) this.detonate(bomb);
    }
    const before = this.bombs.length;
    this.bombs = this.bombs.filter(b => !b.detonated);
    if (this.bombs.length !== before) this.scene.updateHud();
  }

  updateExplosions(delta: number): void {
    this.explosions = this.explosions.filter(e => (e.timer -= delta) > 0);
  }

  spawnExplosion(x: number, y: number, color: number, glow: number, element: ElementId = 'fire'): void {
    const px = x * CONFIG.tile + CONFIG.tile / 2;
    const py = y * CONFIG.tile + CONFIG.tile / 2;
    const core = this.scene.add.image(px, py, 'menu_puff').setTint(color)
      .setBlendMode(Phaser.BlendModes.ADD).setDepth(8).setScale(0.9).setAlpha(0.95);
    const ring = this.scene.add.circle(px, py, 10, color, 0.18)
      .setStrokeStyle(2, glow, 0.95).setDepth(9);
    this.scene.tweens.add({
      targets: core, alpha: 0, scale: 1.9, duration: 420,
      onComplete: () => core.destroy(),
    });
    this.scene.tweens.add({
      targets: ring, scale: 2.2, alpha: 0, duration: 380,
      onComplete: () => ring.destroy(),
    });
    this.explosionFx(px, py, color, glow, element);
    this.explosions.push({ x, y, timer: 380, key: `${x},${y}`, hitPlayer: false, element });
  }

  private explosionFx(px: number, py: number, color: number, glow: number, element: ElementId): void {
    const c = EXPLOSION_FX[element];
    const emitter = this.scene.add.particles(px, py, c.texture, {
      speed: c.speed,
      angle: c.angle,
      gravityY: c.gravity,
      lifespan: c.life,
      scale: { start: c.size, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [color, glow, ...c.extra],
      blendMode: c.blend,
      emitting: false,
    }).setDepth(9);
    emitter.explode(c.count);
    this.scene.time.delayedCall(1100, () => emitter.destroy());
  }

  // Atualização por quadro: avança os pavios e depois as explosões.
  update(delta: number): void {
    this.updateBombs(delta);
    this.updateExplosions(delta);
  }
}
