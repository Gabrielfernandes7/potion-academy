// Inimigos: sapo, fantasma e flor do mal. Nascem no começo da fase (e conforme os caixotes quebram),
// andam em passos animados, morrem nas explosões (menos quando imunes) e machucam a Roo.
// As regras puras (contagem, casa de nascimento, direções) estão em game/enemyRules.ts.
// Dano usa a posição visual do sprite; gridX/gridY mudam quando o passo COMEÇA.
import Phaser from 'phaser';
import { CONFIG, ElementId, EMPTY, ENEMY_TYPES, EnemyKind, WALL, DIRS, isImmune } from '../config';
import { canSpawnEnemyAt, countKind, enemyMoveOptions } from './enemyRules';
import type { Enemy } from './types';
import type { MainScene } from '../scenes/MainScene';

// Efeito de quem é atingido, por elemento: o que sobra depois da explosão.
// fogo: brasas e fumaça subindo; água: respingos que caem; terra: lascas de pedra e poeira;
// éter: faíscas que giram no ar.
const HIT_FX: Record<ElementId, {
  texture: string; speed: { min: number; max: number }; angle: { min: number; max: number };
  gravity: number; life: { min: number; max: number }; size: number; count: number; tint: number[]; blend: string;
}> = {
  fire: { texture: 'menu_spark', speed: { min: 40, max: 110 }, angle: { min: -120, max: -60 }, gravity: -60, life: { min: 500, max: 900 }, size: 1.8, count: 9, tint: [0xff7043, 0xffb74d, 0xffd54f], blend: 'ADD' },
  water: { texture: 'menu_bubble', speed: { min: 60, max: 140 }, angle: { min: 200, max: 340 }, gravity: 260, life: { min: 450, max: 700 }, size: 1.1, count: 10, tint: [0x4fc3f7, 0xb3e5fc, 0xffffff], blend: 'NORMAL' },
  earth: { texture: 'menu_spark', speed: { min: 30, max: 100 }, angle: { min: -170, max: -10 }, gravity: 380, life: { min: 400, max: 650 }, size: 1.8, count: 8, tint: [0x8d6e63, 0x6d4c41, 0xa1887f], blend: 'NORMAL' },
  air: { texture: 'menu_spark', speed: { min: 30, max: 90 }, angle: { min: 0, max: 360 }, gravity: -30, life: { min: 500, max: 900 }, size: 1.5, count: 12, tint: [0xffffff, 0xe0d8ff, 0xb3e5fc], blend: 'ADD' },
};

// Movimento de cada inimigo: pulo vertical e horizontal do passo, e o balanço parado (altura e velocidade).
const MOTION: Record<EnemyKind, { hopV: number; hopH: number; bob: number; bobMs: number }> = {
  frog: { hopV: 7, hopH: 3, bob: 1.2, bobMs: 260 },
  ghost: { hopV: 0, hopH: 0, bob: 2.6, bobMs: 420 },
  flower: { hopV: 0, hopH: 0, bob: 0, bobMs: 500 },
};

export class EnemySystem {
  enemies: Enemy[] = [];
  private lashGfx!: Phaser.GameObjects.Graphics; // avisos dos chicotes das flores do mal

  constructor(private readonly scene: MainScene) {}

  // Camada dos avisos de chicote (criada pela cena em create(), na mesma ordem de antes).
  createLashGfx(): void {
    this.lashGfx = this.scene.add.graphics().setDepth(4);
  }

  clearLash(): void {
    this.lashGfx.clear();
  }

  spawnEnemies(): void {
    for (const rule of this.scene.def.enemies) {
      for (let i = 0; i < rule.start; i++) this.spawnEnemy(rule.kind);
    }
  }

  countEnemies(kind: EnemyKind): number {
    return countKind(this.enemies, kind);
  }

  spawnEnemy(kind: EnemyKind): void {
    const s = this.scene;
    const rule = s.def.enemies.find(r => r.kind === kind);
    if (!rule || this.countEnemies(kind) >= rule.max) return;
    const def = ENEMY_TYPES[kind];
    for (let attempt = 0; attempt < 80; attempt++) {
      const x = Phaser.Math.Between(1, CONFIG.cols - 2);
      const y = Phaser.Math.Between(1, CONFIG.rows - 2);
      const ok = canSpawnEnemyAt(x, y, {
        tile: s.grid[y][x],
        door: { x: s.doorX, y: s.doorY },
        player: { x: s.player.gridX, y: s.player.gridY },
        enemyAt: this.enemies.some(e => e.gridX === x && e.gridY === y),
        bombAt: s.hasBomb(x, y),
      });
      if (!ok) continue;
      const sprite = s.add.image(
        x * CONFIG.tile + CONFIG.tile / 2,
        y * CONFIG.tile + CONFIG.tile / 2,
        def.texture,
      ).setDepth(7).setScale(0.01);
      if (def.rooted) {
        // a flor balança presa ao chão: o pivô fica perto da base
        sprite.setOrigin(0.5, 0.88);
        sprite.y += 0.38 * CONFIG.tile;
      }
      s.tweens.add({ targets: sprite, scale: 1, duration: 250, ease: 'Back.easeOut' });
      this.enemies.push({
        kind, gridX: x, gridY: y, sprite, moveTimer: def.moveInterval, alive: true,
        moveT: def.stepMs, fromX: sprite.x, fromY: sprite.y, hopY: false, phase: Math.random() * 1000,
        lashMs: CONFIG.flowerLashCycleMs * (0.5 + Math.random() * 0.5), fxCooldown: 0,
      });
      return;
    }
  }

  killEnemy(enemy: Enemy, element: ElementId = 'fire'): void {
    enemy.alive = false;
    this.scene.tweens.killTweensOf(enemy.sprite);
    const px = enemy.sprite.x;
    const py = enemy.sprite.y;
    enemy.sprite.destroy();
    this.enemies = this.enemies.filter(e => e !== enemy);
    this.hitFx(px, py, element);
    this.scene.pickupSystem.spawnPickupSprite(enemy.gridX, enemy.gridY, 'coin');
    this.scene.cameras.main.shake(60, 0.003);
  }

  // Uma explosão alcançou o inimigo: mata, a menos que ele seja imune ao elemento (flor do mal e a água).
  hitEnemy(enemy: Enemy, element: ElementId): void {
    if (!isImmune(enemy.kind, element)) {
      this.killEnemy(enemy, element);
      return;
    }
    if (enemy.fxCooldown > 0) return;
    enemy.fxCooldown = 700; // a explosão dura 380 ms; sem isso o aviso se repetiria a cada quadro
    this.hitFx(enemy.sprite.x, enemy.sprite.y - 6, element);
    this.scene.floatingText(enemy.gridX, enemy.gridY, 'IMUNE', '#c5e1a5');
    this.scene.tweens.add({ targets: enemy.sprite, alpha: 0.55, duration: 90, yoyo: true, repeat: 1 });
  }

  // Efeito de ser atingido por um elemento (inimigo ou Roo): partículas próprias do elemento.
  hitFx(px: number, py: number, element: ElementId): void {
    const c = HIT_FX[element];
    const emitter = this.scene.add.particles(px, py, c.texture, {
      speed: c.speed,
      angle: c.angle,
      gravityY: c.gravity,
      lifespan: c.life,
      scale: { start: c.size, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: c.tint,
      blendMode: c.blend,
      emitting: false,
    }).setDepth(10);
    emitter.explode(c.count);
    this.scene.time.delayedCall(1000, () => emitter.destroy());
  }

  moveEnemy(enemy: Enemy): void {
    const s = this.scene;
    const def = ENEMY_TYPES[enemy.kind];
    const valid = enemyMoveOptions({
      from: { x: enemy.gridX, y: enemy.gridY },
      passWalls: def.passWalls,
      door: { x: s.doorX, y: s.doorY },
      cols: CONFIG.cols,
      rows: CONFIG.rows,
      isFree: (x, y) => s.isFree(x, y),
      occupied: (x, y) => this.enemies.some(e => e !== enemy && e.alive && e.gridX === x && e.gridY === y),
    });
    if (valid.length === 0) return;
    const [dx, dy] = Phaser.Utils.Array.GetRandom(valid);
    // o passo é animado em animateEnemy (deslize, pulo e balanço), não por tween
    enemy.fromX = enemy.sprite.x;
    enemy.fromY = enemy.sprite.y;
    enemy.hopY = dy !== 0;
    enemy.moveT = 0;
    enemy.gridX += dx;
    enemy.gridY += dy;
  }

  // Passo: desliza até a casa nova (sapo: com um pulinho; fantasma: flutuando); parado, balança de leve.
  // O fantasma fica meio transparente enquanto está dentro de uma parede ou de um caixote.
  animateEnemy(enemy: Enemy, delta: number): void {
    const def = ENEMY_TYPES[enemy.kind];
    const m = MOTION[enemy.kind];
    const tx = enemy.gridX * CONFIG.tile + CONFIG.tile / 2;
    // a flor tem o pivô perto da base: o sprite fica um pouco abaixo do centro da casa
    const ty = enemy.gridY * CONFIG.tile + CONFIG.tile / 2 + (def.rooted ? 0.38 * CONFIG.tile : 0);
    if (enemy.moveT < def.stepMs) {
      enemy.moveT = Math.min(def.stepMs, enemy.moveT + delta);
      const p = enemy.moveT / def.stepMs;
      const hop = Math.sin(p * Math.PI) * (enemy.hopY ? m.hopV : m.hopH);
      enemy.sprite.x = enemy.fromX + (tx - enemy.fromX) * p;
      enemy.sprite.y = enemy.fromY + (ty - enemy.fromY) * p - hop;
    } else {
      enemy.phase += delta;
      enemy.sprite.x = tx;
      enemy.sprite.y = ty + Math.sin(enemy.phase / m.bobMs) * m.bob;
    }
    if (def.passWalls) {
      const tile = this.scene.getTile(enemy.gridX, enemy.gridY);
      enemy.sprite.setAlpha(tile === EMPTY ? 0.92 : 0.45);
    }
    if (def.rooted) enemy.sprite.setAngle(Math.sin(enemy.phase / 380) * 4);
  }

  // Flor do mal: de tempos em tempos avisa no chão e chicoteia as quatro casas ao redor.
  updateFlower(enemy: Enemy, delta: number): void {
    const s = this.scene;
    enemy.lashMs -= delta;
    const around: Array<{ x: number; y: number }> = [];
    for (const [dx, dy] of DIRS) {
      const x = enemy.gridX + dx;
      const y = enemy.gridY + dy;
      const tile = s.getTile(x, y);
      if (tile !== null && tile !== WALL) around.push({ x, y });
    }
    if (enemy.lashMs > CONFIG.flowerWarnMs) return;
    const T = CONFIG.tile;
    if (enemy.lashMs > 0) {
      // aviso: casas se enchem de um rosa pulsante
      const pulse = 0.25 + 0.2 * Math.sin(enemy.lashMs / 55);
      for (const c of around) {
        this.lashGfx.fillStyle(0xd81b60, pulse);
        this.lashGfx.fillRect(c.x * T + 2, c.y * T + 2, T - 4, T - 4);
        this.lashGfx.lineStyle(2, 0xff80ab, 0.9);
        this.lashGfx.strokeRect(c.x * T + 2, c.y * T + 2, T - 4, T - 4);
      }
      return;
    }
    // chicote
    const me = s.playerTile();
    for (const c of around) {
      this.thornFx(c.x * T + T / 2, c.y * T + T / 2);
      if (c.x === me.x && c.y === me.y) s.damagePlayer(false, 'earth');
    }
    s.tweens.add({ targets: enemy.sprite, scaleX: 1.25, scaleY: 0.85, duration: 90, yoyo: true });
    enemy.lashMs = CONFIG.flowerLashCycleMs;
  }

  // Espinhos e folhas que saltam quando a flor chicoteia.
  thornFx(px: number, py: number): void {
    const emitter = this.scene.add.particles(px, py, 'menu_spark', {
      speed: { min: 40, max: 110 },
      angle: { min: 0, max: 360 },
      lifespan: { min: 300, max: 520 },
      scale: { start: 1.8, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [0x66bb6a, 0x2e7d32, 0xad1457],
      emitting: false,
    }).setDepth(10);
    emitter.explode(6);
    this.scene.time.delayedCall(700, () => emitter.destroy());
  }

  update(delta: number): void {
    const s = this.scene;
    this.lashGfx.clear();
    for (const enemy of [...this.enemies]) {
      if (!enemy.alive) continue;
      const def = ENEMY_TYPES[enemy.kind];
      enemy.fxCooldown = Math.max(0, enemy.fxCooldown - delta);
      // chama residual também atinge inimigos
      const blast = s.bombSystem.explosions.find(e => e.x === enemy.gridX && e.y === enemy.gridY);
      if (blast) {
        this.hitEnemy(enemy, blast.element);
        if (!enemy.alive) continue;
      }
      this.animateEnemy(enemy, delta);
      if (def.rooted) {
        this.updateFlower(enemy, delta);
        continue;
      }
      const dist = Phaser.Math.Distance.Between(
        enemy.sprite.x, enemy.sprite.y, s.playerSprite.x, s.playerSprite.y,
      );
      if (dist < CONFIG.tile * 0.6) s.damagePlayer();
      enemy.moveTimer -= delta;
      if (enemy.moveTimer <= 0) {
        this.moveEnemy(enemy);
        enemy.moveTimer = def.moveInterval;
      }
    }
  }
}
