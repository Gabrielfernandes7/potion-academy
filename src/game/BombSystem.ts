// Bombas, explosões e empurrão: o sistema de frascos da partida.
// A cena (MainScene) guarda o estado da partida e chama este sistema; as regras de reação
// entre poções ficam em game/chain.ts. Ver docs/ARCH.md.
import Phaser from 'phaser';
import { BLOCK, BOMB_TYPES, CONFIG, ELEMENTS, ElementId, WALL } from '../config';
import { chainOutcome } from './chain';
import { walkBlast } from './blast';
import { blastRadius, canPlace } from './upgrades';
import type { Bomb, Explosion } from './types';
import type { MainScene } from '../scenes/MainScene';
import { fxPool } from './fx/particlePool';
import { ObjectPool } from './fx/objectPool';

const SPARK_MS = 90; // intervalo entre as faíscas do pavio de uma poção
const FLASH_MS = 420; // duração do miolo e do anel de cada casa de uma explosão

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

  // imagens das explosões, reaproveitadas (o miolo e o anel de cada casa atingida)
  private readonly corePool = new ObjectPool(() => this.scene.add.image(0, 0, 'menu_puff').setBlendMode(Phaser.BlendModes.ADD).setDepth(8));
  private readonly ringPool = new ObjectPool(() => this.scene.add.image(0, 0, 'fx_ring').setDepth(9));

  // as explosões em andamento (miolo e anel de cada casa): crescem e somem em FLASH_MS
  private flashes: Array<{ core: Phaser.GameObjects.Image; ring: Phaser.GameObjects.Image; t: number }> = [];

  constructor(private readonly scene: MainScene) {}

  placeBomb(): void {
    if (!canPlace(this.scene.player.upgrades, this.scene.bombType, this.bombs.map(b => b.type))) return;
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
    this.bombs.push({
      gridX: this.scene.player.gridX, gridY: this.scene.player.gridY,
      type: this.scene.bombType, element: type.element, sprite, halo, sparkMs: 0,
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
    const radius = blastRadius(this.scene.player.upgrades, bomb.type, type.radius);
    const tiles: Array<{ x: number; y: number }> = [];
    // o muro de sal da Roo Terra barra a explosão como uma parede (até a Poção de Terra, que atravessa caixotes, para nele)
    const tileAt = (x: number, y: number): number | null => (this.scene.forms?.isSaltWall(x, y) ? WALL : this.scene.getTile(x, y));
    for (const t of walkBlast(bomb.gridX, bomb.gridY, radius, !!type.pierce, tileAt)) {
      if (!t.origin) {
        // reação entre poções: fogo acende, água apaga o fogo, terra é imune (ver game/chain.ts)
        const chainBomb = this.bombs.find(b => b !== bomb && b.gridX === t.x && b.gridY === t.y && !b.detonated);
        if (chainBomb) {
          const outcome = chainOutcome(bomb.element, chainBomb.element);
          if (outcome === 'trigger') this.detonate(chainBomb);
          else if (outcome === 'neutralize') this.neutralizeBomb(chainBomb);
        }
      }
      tiles.push({ x: t.x, y: t.y });
      if (t.tile === BLOCK && !t.origin) {
        this.scene.removeBlock(t.x, t.y);
        this.scene.pickupSystem.spawnReward(t.x, t.y);
      }
    }
    this.applyBlast(tiles, bomb.element);
    this.scene.tweens.killTweensOf(bomb.sprite);
    bomb.sprite.destroy();
    bomb.halo.destroy();
    this.scene.play('explosion', bomb.element);
    this.scene.cameras.main.shake(70, 0.003);
  }

  // O efeito de uma explosão da Roo nas casas atingidas: chefe, inimigos, visual e as brasas da Roo Fire
  // (o fogo acende, a água apaga). Serve às poções e à Labareda.
  private applyBlast(tiles: Array<{ x: number; y: number }>, elementId: ElementId): void {
    const element = ELEMENTS[elementId] ?? ELEMENTS.fire;
    this.scene.boss?.onExplosion(tiles, elementId);
    for (const t of tiles) {
      if (elementId === 'fire') this.scene.lightBrazier(t.x, t.y); // só o fogo acende um braseiro
      for (const enemy of this.scene.enemySystem.enemies) {
        if (enemy.alive && enemy.gridX === t.x && enemy.gridY === t.y) this.scene.enemySystem.hitEnemy(enemy, elementId, true);
      }
      this.spawnExplosion(t.x, t.y, element.color, element.glow, elementId, false, true);
    }
    this.scene.onRooBlast(tiles, elementId);
  }

  /** Labareda da Roo Fire: um jato de fogo nas casas à frente. */
  flameBlast(tiles: Array<{ x: number; y: number }>): void {
    this.applyBlast(tiles, 'fire');
    this.scene.play('explosion', 'fire');
    this.scene.cameras.main.shake(60, 0.003);
  }

  /** O estouro da Raiz da Roo Terra: terra rachando nas casas ao redor de onde ela brotou. */
  earthBlast(tiles: Array<{ x: number; y: number }>): void {
    this.applyBlast(tiles, 'earth');
    this.scene.play('explosion', 'earth');
  }

  neutralizeBomb(bomb: Bomb, label = 'APAGADA'): void {
    if (bomb.detonated) return;
    bomb.detonated = true;
    const { x, y } = bomb.sprite;
    this.scene.tweens.killTweensOf(bomb.sprite);
    bomb.sprite.destroy();
    bomb.halo.destroy();
    fxPool(this.scene).burst('steam', 'menu_puff', {
      speed: { min: 8, max: 30 },
      angle: { min: -120, max: -60 },
      lifespan: { min: 700, max: 1100 },
      scale: { start: 0.35, end: 1.1 },
      alpha: { start: 0.55, end: 0 },
      tint: [0xe3f2fd, 0xb0bec5, 0xffffff],
    }, x, y, 7, 10);
    this.scene.floatingText(Math.floor(x / CONFIG.tile), Math.floor(y / CONFIG.tile), label, '#a8e6f5');
    this.scene.play('fizzle');
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
      if (bomb.timer <= 0) { this.detonate(bomb); continue; }
      this.emitFuseSpark(bomb, delta);
    }
    const before = this.bombs.length;
    this.bombs = this.bombs.filter(b => !b.detonated);
    if (this.bombs.length !== before) this.scene.updateHud();
  }

  // Faísca do pavio a cada SPARK_MS. Sai do reservatório de partículas (um emissor por elemento, compartilhado por todas
  // as poções), em vez de um emissor por poção (docs/21-desempenho.md).
  private emitFuseSpark(bomb: Bomb, delta: number): void {
    bomb.sparkMs -= delta;
    if (bomb.sparkMs > 0) return;
    bomb.sparkMs += SPARK_MS;
    const color = ELEMENTS[bomb.element].color;
    fxPool(this.scene).burst(`fuse:${bomb.element}`, 'menu_spark', {
      lifespan: 420,
      speed: { min: 10, max: 38 },
      angle: { min: -125, max: -55 },
      scale: { start: 0.9, end: 0 },
      alpha: { start: 1, end: 0 },
      blendMode: 'ADD',
      tint: [0xffd54f, color],
    }, bomb.sprite.x, bomb.sprite.y - 15, 1, 6);
  }

  updateExplosions(delta: number): void {
    this.explosions = this.explosions.filter(e => (e.timer -= delta) > 0);
    // anima o miolo e o anel de cada casa: escala 0,9 -> 1,9 (miolo) e 1 -> 1,9 (anel), e a transparência a zero
    for (const f of this.flashes) {
      f.t += delta;
      const k = Math.min(1, f.t / FLASH_MS);
      const ease = 1 - (1 - k) * (1 - k); // freia no fim, como o antigo tween
      f.core.setScale(0.9 + 1.0 * ease).setAlpha(0.95 * (1 - k));
      f.ring.setScale(1 + 0.9 * ease).setAlpha(0.9 * (1 - k));
    }
    if (this.flashes.some(f => f.t >= FLASH_MS)) {
      for (const f of this.flashes) if (f.t >= FLASH_MS) { this.corePool.release(f.core); this.ringPool.release(f.ring); }
      this.flashes = this.flashes.filter(f => f.t < FLASH_MS);
    }
  }

  // `lite` pula as partículas (para explosões em muitas casas ao mesmo tempo, como o Grito da Mandrágora).
  spawnExplosion(x: number, y: number, color: number, glow: number, element: ElementId = 'fire', lite = false, fromRoo = false): void {
    const px = x * CONFIG.tile + CONFIG.tile / 2;
    const py = y * CONFIG.tile + CONFIG.tile / 2;
    // dois desenhos por casa (o miolo e o anel), vindos de um reservatório e animados no update (sem tweens: eram 2 por casa)
    const core = this.corePool.acquire().setPosition(px, py).setTint(color).setScale(0.9).setAlpha(0.95);
    const ring = this.ringPool.acquire().setPosition(px, py).setTint(glow).setScale(1).setAlpha(0.9);
    this.flashes.push({ core, ring, t: 0 });
    if (!lite) this.explosionFx(px, py, color, glow, element);
    this.explosions.push({ x, y, timer: 380, key: `${x},${y}`, hitPlayer: false, element, fromRoo });
  }

  // Partículas do elemento: um emissor por elemento e por cor, compartilhado (ver fx/particlePool.ts).
  private explosionFx(px: number, py: number, color: number, glow: number, element: ElementId): void {
    const c = EXPLOSION_FX[element];
    fxPool(this.scene).burst(`blast:${element}:${color}`, c.texture, {
      speed: c.speed,
      angle: c.angle,
      gravityY: c.gravity,
      lifespan: c.life,
      scale: { start: c.size, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [color, glow, ...c.extra],
      blendMode: c.blend,
    }, px, py, c.count, 9);
  }

  // Atualização por quadro: avança os pavios e depois as explosões.
  update(delta: number): void {
    this.updateBombs(delta);
    this.updateExplosions(delta);
  }
}
