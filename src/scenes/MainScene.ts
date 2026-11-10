// Cena de gameplay: grade, bombas, inimigos, itens, porta e entrada.
// Regras importantes:
// - player/enemy.gridX/gridY mudam quando o movimento COMEÇA; o sprite interpola depois.
// - Dano usa a posição visual do sprite (o que o jogador vê bate com o que acontece).
// - Pickups, bombas e vitória usam coordenadas de grade.
// - update() retorna cedo com a loja aberta e, após gameOver/won, só trata a tecla R.
import Phaser from 'phaser';
import {
  BLOCK, BOMB_TYPES, BombId, CONFIG, DIRS, ELEMENTS, EMPTY, WALL,
} from '../config';
import { audio, SfxName } from '../audio/AudioEngine';
import { Bank, hasBombType } from '../storage';
import { PICKUP_TEXTURE, PickupType, rollReward } from '../game/rewards';
import type { Bomb, Enemy, Explosion, Facing, Pickup, Player, PowerupCounts } from '../game/types';
import { renderElement, renderHud, renderTimer } from '../ui/hud';
import { hideGameOver, setPauseVisible, showGameOver } from '../ui/overlays';
import { isShopOpen } from '../ui/shop';

type MainKeys = Record<'space' | 'x' | 'd' | 'r' | 'one' | 'two' | 'three' | 'four' | 'enter', Phaser.Input.Keyboard.Key>;

export class MainScene extends Phaser.Scene {
  grid: number[][] = [];
  blockSprites = new Map<string, Phaser.GameObjects.Image>();
  bombs: Bomb[] = [];
  activeExplosions: Explosion[] = [];
  pickups: Pickup[] = [];
  enemies: Enemy[] = [];
  coins = 0;
  gems = 0;
  bombType: BombId = 'normal';
  cooldowns = { push: 0 };
  gameOver = false;
  won = false;
  player!: Player;
  lastDir = { x: 0, y: 0 };
  doorX = 0;
  doorY = 0;
  doorOpen = false;
  doorSprite!: Phaser.GameObjects.Image;
  timeLeft = 0;
  overtimeDamageTimer = 0;
  blocksDestroyed = 0;
  nextEnemyThreshold = 0;
  lastTimerSec: number | null = null;
  powerupsCollected: PowerupCounts = { bomb_up: 0, fire_up: 0, speed_up: 0, time_up: 0 };
  isPaused = false;
  gemBlocks = new Set<string>();
  playerSprite!: Phaser.GameObjects.Sprite;
  cdGraphics!: Phaser.GameObjects.Graphics;
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  keys!: MainKeys;
  idleMs = 0;
  isSleeping = false;
  zzzMs = 0;

  constructor() {
    super('Main');
  }

  init(): void {
    this.grid = [];
    this.blockSprites = new Map();
    this.bombs = [];
    this.activeExplosions = [];
    this.pickups = [];
    this.enemies = [];
    this.coins = 0;
    this.gems = 0;
    this.bombType = 'normal';
    this.cooldowns = { push: 0 };
    this.gameOver = false;
    this.won = false;
    this.player = {
      gridX: 1, gridY: 1,
      dir: { x: 0, y: 1 }, facing: 'down', moving: false,
      hp: CONFIG.maxHp, invulnerable: 0,
      bombsMax: CONFIG.maxBombs,
      fireLevel: 0,
      speedUp: 0,
    };
    this.lastDir = { x: 0, y: 0 };
    this.doorX = CONFIG.cols - 2;
    this.doorY = CONFIG.rows - 2;
    this.doorOpen = false;
    this.timeLeft = CONFIG.phaseTime;
    this.overtimeDamageTimer = CONFIG.overtimeDamageInterval;
    this.blocksDestroyed = 0;
    this.nextEnemyThreshold = CONFIG.enemySpawnEvery;
    this.lastTimerSec = null;
    this.idleMs = 0;
    this.isSleeping = false;
    this.zzzMs = 0;
    this.powerupsCollected = { bomb_up: 0, fire_up: 0, speed_up: 0, time_up: 0 };
    this.isPaused = false;
    this.gemBlocks = new Set();
    setPauseVisible(false);
    this.tweens.resumeAll();
    this.anims.resumeAll();
  }

  create(): void {
    this.createHeroAnims();
    this.buildGrid();
    this.placeDoor();
    this.assignHiddenGems();
    this.spawnEnemies();
    this.playerSprite = this.add.sprite(
      this.player.gridX * CONFIG.tile + CONFIG.tile / 2,
      this.player.gridY * CONFIG.tile + CONFIG.tile / 2,
      'roo_down_0',
    ).setDepth(10);
    this.cdGraphics = this.add.graphics().setDepth(15);
    this.setupInput();
    this.updateHud();
    this.playIdle();
  }

  // ---------- Animação do herói ----------

  createHeroAnims(): void {
    if (this.anims.exists('roo_walk_down')) return;
    const walk = (key: string, prefix: string): void => {
      this.anims.create({
        key,
        frames: [0, 1, 2, 3].map(i => ({ key: prefix + i })),
        frameRate: 12,
        repeat: -1,
      });
    };
    // idle: respiração + tremor da orelha entre os frames 0 e 1
    const idle = (key: string, prefix: string): void => {
      this.anims.create({
        key,
        frames: [{ key: prefix + '0' }, { key: prefix + '1' }],
        frameRate: 2,
        repeat: -1,
      });
    };
    walk('roo_walk_down', 'roo_down_');
    walk('roo_walk_up', 'roo_up_');
    walk('roo_walk_side', 'roo_side_');
    idle('roo_idle_down', 'roo_down_');
    idle('roo_idle_up', 'roo_up_');
    idle('roo_idle_side', 'roo_side_');
    // sono: respiração lenta entre os frames 0 e 1
    for (const dir of ['down', 'up', 'side']) {
      this.anims.create({
        key: 'roo_sleep_' + dir,
        frames: [{ key: `roo_sleep_${dir}_0` }, { key: `roo_sleep_${dir}_1` }],
        frameRate: 1.2,
        repeat: -1,
      });
    }
  }

  // Direção do sprite: 'side' espelha para a esquerda; 'up' e 'down' são as outras faces.
  private spriteDirection(): 'side' | 'up' | 'down' {
    const f: Facing = this.player.facing;
    return f === 'left' || f === 'right' ? 'side' : f;
  }

  refreshSprite(mode: 'walk' | 'idle' | 'sleep'): void {
    const f: Facing = this.player.facing;
    const direction = this.spriteDirection();
    const animationKey = mode === 'sleep' ? 'roo_sleep_' + direction : (mode === 'walk' ? 'roo_walk_' : 'roo_idle_') + direction;
    if (this.anims.exists(animationKey)) this.playerSprite.anims.play(animationKey, true);
    else this.playerSprite.setTexture('roo_' + direction + '_' + (mode === 'walk' ? 0 : 1));
    this.playerSprite.setFlipX(direction === 'side' && f === 'left');
  }

  playIdle(): void { this.refreshSprite('idle'); }
  playWalk(): void { this.refreshSprite('walk'); }

  // ---------- Bombas e poções ----------

  setBomb(type: BombId): void {
    if (!hasBombType(type)) {
      this.floatingText(this.player.gridX, this.player.gridY, 'BLOQUEADA', '#bfae8a');
      return;
    }
    this.bombType = type;
    renderElement(this.bombType);
  }

  placeBomb(): void {
    if (this.bombs.length >= this.player.bombsMax) return;
    if (this.hasBomb(this.player.gridX, this.player.gridY)) return;
    const type = BOMB_TYPES[this.bombType];
    const sprite = this.add.image(
      this.player.gridX * CONFIG.tile + CONFIG.tile / 2,
      this.player.gridY * CONFIG.tile + CONFIG.tile / 2,
      'bomb_' + this.bombType,
    ).setDepth(5).setScale(0.01);
    this.tweens.add({ targets: sprite, scale: 1, duration: 150, ease: 'Back.easeOut' });
    this.tweens.add({ targets: sprite, scale: 1.1, duration: 200, yoyo: true, repeat: -1, delay: 160 });
    this.bombs.push({
      gridX: this.player.gridX, gridY: this.player.gridY,
      type: this.bombType, element: type.element, sprite,
      timer: type.fuse, detonated: false,
    });
    this.play('bomb');
    this.updateHud();
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
    const radius = type.radius + this.player.fireLevel;
    const tiles: Array<{ x: number; y: number }> = [{ x: bomb.gridX, y: bomb.gridY }];
    for (const [dx, dy] of DIRS) {
      for (let r = 1; r <= radius; r++) {
        const nx = bomb.gridX + dx * r;
        const ny = bomb.gridY + dy * r;
        const tile = this.getTile(nx, ny);
        if (tile === null || tile === WALL) break;
        // reação em cadeia
        const chainBomb = this.bombs.find(b => b !== bomb && b.gridX === nx && b.gridY === ny && !b.detonated);
        if (chainBomb) this.detonate(chainBomb);
        tiles.push({ x: nx, y: ny });
        if (tile === BLOCK) {
          this.removeBlock(nx, ny);
          this.spawnReward(nx, ny);
          if (!type.pierce) break;
        }
      }
    }
    const element = ELEMENTS[bomb.element] ?? ELEMENTS.fire;
    for (const t of tiles) {
      for (const enemy of this.enemies) {
        if (enemy.alive && enemy.gridX === t.x && enemy.gridY === t.y) this.killEnemy(enemy);
      }
      this.spawnExplosion(t.x, t.y, element.color, element.glow);
    }
    this.tweens.killTweensOf(bomb.sprite);
    bomb.sprite.destroy();
    this.play('explosion');
    this.cameras.main.shake(70, 0.003);
  }

  pushAbility(): void {
    if (this.cooldowns.push > 0 || this.player.moving) return;
    const { gridX, gridY, dir } = this.player;
    const fx = gridX + dir.x;
    const fy = gridY + dir.y;
    const bomb = this.bombs.find(b => b.gridX === fx && b.gridY === fy);
    if (!bomb) return;
    let lastX = fx;
    let lastY = fy;
    for (let i = 1; i <= CONFIG.pushRange; i++) {
      const tx = fx + dir.x * i;
      const ty = fy + dir.y * i;
      if (!this.isFree(tx, ty)) break;
      lastX = tx;
      lastY = ty;
    }
    if (lastX === fx && lastY === fy) return;
    bomb.gridX = lastX;
    bomb.gridY = lastY;
    this.tweenSpriteTo(bomb.sprite, lastX, lastY, 200, 'Cubic.easeOut');
    this.cooldowns.push = CONFIG.pushCd;
  }

  // ---------- Grade, blocos e porta ----------

  buildGrid(): void {
    for (let y = 0; y < CONFIG.rows; y++) {
      this.grid[y] = [];
      for (let x = 0; x < CONFIG.cols; x++) this.grid[y][x] = EMPTY;
    }
    for (let y = 0; y < CONFIG.rows; y++) {
      for (let x = 0; x < CONFIG.cols; x++) {
        const px = x * CONFIG.tile;
        const py = y * CONFIG.tile;
        this.add.image(px, py, (x + y) % 2 === 0 ? 'floor1' : 'floor2').setOrigin(0).setDepth(0);
        const isWall = x === 0 || y === 0 || x === CONFIG.cols - 1 || y === CONFIG.rows - 1 ||
                       (x % 2 === 0 && y % 2 === 0);
        if (isWall) {
          this.grid[y][x] = WALL;
          this.add.image(px, py, 'wall').setOrigin(0).setDepth(1);
        } else if (Math.random() < CONFIG.blockChance && !this.isSpawnSafe(x, y)) {
          this.grid[y][x] = BLOCK;
          const sprite = this.add.image(px, py, 'block').setOrigin(0).setDepth(2);
          this.blockSprites.set(`${x},${y}`, sprite);
        }
      }
    }
  }

  placeDoor(): void {
    const key = `${this.doorX},${this.doorY}`;
    const s = this.blockSprites.get(key);
    if (s) {
      this.tweens.killTweensOf(s);
      s.destroy();
      this.blockSprites.delete(key);
    }
    this.grid[this.doorY][this.doorX] = EMPTY;
    this.doorSprite = this.add.image(
      this.doorX * CONFIG.tile + CONFIG.tile / 2,
      this.doorY * CONFIG.tile + CONFIG.tile / 2,
      'door_closed',
    ).setDepth(3);
  }

  assignHiddenGems(): void {
    // garante gemas suficientes para abrir a porta
    const keys = Phaser.Utils.Array.Shuffle([...this.blockSprites.keys()]);
    this.gemBlocks = new Set(keys.slice(0, CONFIG.gemsForDoor));
  }

  isSpawnSafe(x: number, y: number): boolean {
    // área livre em L ao redor do spawn, para sempre haver rota de fuga
    return (y === 1 && x <= 3) || (x === 1 && y <= 3);
  }

  removeBlock(x: number, y: number): void {
    const key = `${x},${y}`;
    const sprite = this.blockSprites.get(key);
    if (sprite) {
      this.tweens.killTweensOf(sprite);
      sprite.destroy();
      this.blockSprites.delete(key);
    }
    this.grid[y][x] = EMPTY;
    this.blocksDestroyed++;
    if (this.blocksDestroyed >= this.nextEnemyThreshold && this.enemies.length < CONFIG.maxEnemies) {
      this.spawnEnemy();
      this.nextEnemyThreshold += CONFIG.enemySpawnEvery;
    }
    this.updateHud();
  }

  getTile(x: number, y: number): number | null {
    if (x < 0 || x >= CONFIG.cols || y < 0 || y >= CONFIG.rows) return null;
    return this.grid[y][x];
  }

  hasBomb(x: number, y: number): boolean {
    return this.bombs.some(b => b.gridX === x && b.gridY === y);
  }

  isFree(x: number, y: number): boolean {
    if (this.getTile(x, y) !== EMPTY) return false;
    if (this.hasBomb(x, y)) return false;
    if (!this.doorOpen && x === this.doorX && y === this.doorY) return false;
    return true;
  }

  // ---------- Itens ----------

  spawnReward(x: number, y: number): void {
    if (this.gemBlocks.has(`${x},${y}`)) {
      this.spawnPickupSprite(x, y, 'gem');
      return;
    }
    this.spawnPickupSprite(x, y, rollReward());
  }

  spawnPickupSprite(x: number, y: number, type: PickupType): void {
    const sprite = this.add.image(
      x * CONFIG.tile + CONFIG.tile / 2,
      y * CONFIG.tile + CONFIG.tile / 2,
      PICKUP_TEXTURE[type],
    ).setDepth(6);
    this.tweens.add({
      targets: sprite, y: sprite.y - 4,
      duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    this.pickups.push({ gridX: x, gridY: y, type, sprite });
  }

  collectPickup(pickup: Pickup): void {
    switch (pickup.type) {
      case 'coin':
        this.coins += 1;
        Bank.add(1);
        this.play('pickup');
        break;
      case 'gem':
        this.gems += 1;
        this.play('pickup');
        if (this.gems >= CONFIG.gemsForDoor && !this.doorOpen) this.openDoor();
        break;
      case 'chest':
        this.coins += 5;
        Bank.add(5);
        this.player.hp = Math.min(CONFIG.maxHp, this.player.hp + 2);
        this.play('powerup');
        break;
      case 'heart':
        this.player.hp = Math.min(CONFIG.maxHp, this.player.hp + 1);
        this.play('pickup');
        break;
      case 'bomb_up':
        this.player.bombsMax = Math.min(CONFIG.maxBombs + CONFIG.maxBombUp, this.player.bombsMax + 1);
        this.powerupsCollected.bomb_up++;
        this.floatingText(pickup.gridX, pickup.gridY, '+1 BOMBA', '#b39ddb');
        this.play('powerup');
        break;
      case 'fire_up':
        this.player.fireLevel = Math.min(CONFIG.maxFireUp, this.player.fireLevel + 1);
        this.powerupsCollected.fire_up++;
        this.floatingText(pickup.gridX, pickup.gridY, '+1 RAIO', '#ff8a65');
        this.play('powerup');
        break;
      case 'speed_up':
        this.player.speedUp = Math.min(CONFIG.maxSpeedUp, this.player.speedUp + 1);
        this.powerupsCollected.speed_up++;
        this.floatingText(pickup.gridX, pickup.gridY, '+VELOCIDADE', '#4dd0e1');
        this.play('powerup');
        break;
      case 'time_up':
        this.timeLeft = Math.min(this.timeLeft + CONFIG.timeUpBonus, CONFIG.phaseTime * 2);
        this.powerupsCollected.time_up++;
        this.floatingText(pickup.gridX, pickup.gridY, '+15s', '#fff59d');
        this.play('powerup');
        break;
    }
    this.tweens.killTweensOf(pickup.sprite);
    pickup.sprite.destroy();
    this.pickups = this.pickups.filter(p => p !== pickup);
    this.updateHud();
  }

  checkPickups(): void {
    if (this.gameOver || this.won) return;
    const found = this.pickups.find(p => p.gridX === this.player.gridX && p.gridY === this.player.gridY);
    if (found) this.collectPickup(found);
  }

  openDoor(): void {
    this.doorOpen = true;
    this.doorSprite.setTexture('door_open');
    this.tweens.add({
      targets: this.doorSprite, scale: { from: 1, to: 1.15 },
      duration: 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    this.cameras.main.flash(220, 100, 200, 100);
    this.play('door');
    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY;
    const txt = this.add.text(cx, cy, 'PORTA ABERTA!', {
      fontFamily: 'monospace', fontSize: '28px', color: '#4caf50', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(25);
    this.tweens.add({ targets: txt, y: cy - 40, alpha: 0, duration: 1500, onComplete: () => txt.destroy() });
  }

  checkWin(): void {
    if (this.player.moving) return;
    if (this.doorOpen && this.player.gridX === this.doorX && this.player.gridY === this.doorY) {
      this.won = true;
      this.triggerGameOver();
    }
  }

  // ---------- Inimigos ----------

  spawnEnemies(): void {
    for (let i = 0; i < CONFIG.enemyCount; i++) this.spawnEnemy();
  }

  spawnEnemy(): void {
    if (this.enemies.length >= CONFIG.maxEnemies) return;
    for (let attempt = 0; attempt < 60; attempt++) {
      const x = Phaser.Math.Between(1, CONFIG.cols - 2);
      const y = Phaser.Math.Between(1, CONFIG.rows - 2);
      if (this.grid[y][x] !== EMPTY) continue;
      if (x === this.doorX && y === this.doorY) continue;
      if (Math.abs(x - this.player.gridX) + Math.abs(y - this.player.gridY) < 5) continue;
      if (this.enemies.some(e => e.gridX === x && e.gridY === y)) continue;
      if (this.hasBomb(x, y)) continue;
      const sprite = this.add.image(
        x * CONFIG.tile + CONFIG.tile / 2,
        y * CONFIG.tile + CONFIG.tile / 2,
        'enemy',
      ).setDepth(7).setScale(0.01);
      this.tweens.add({ targets: sprite, scale: 1, duration: 250, ease: 'Back.easeOut' });
      this.enemies.push({ gridX: x, gridY: y, sprite, moveTimer: CONFIG.enemyMoveInterval, alive: true });
      return;
    }
  }

  killEnemy(enemy: Enemy): void {
    enemy.alive = false;
    this.tweens.killTweensOf(enemy.sprite);
    enemy.sprite.destroy();
    this.enemies = this.enemies.filter(e => e !== enemy);
    this.spawnPickupSprite(enemy.gridX, enemy.gridY, 'coin');
    this.cameras.main.shake(60, 0.003);
  }

  moveEnemy(enemy: Enemy): void {
    const valid: Array<readonly [number, number]> = [];
    for (const [dx, dy] of DIRS) {
      const nx = enemy.gridX + dx;
      const ny = enemy.gridY + dy;
      if (nx === this.doorX && ny === this.doorY) continue;
      if (!this.isFree(nx, ny)) continue;
      if (this.enemies.some(e => e !== enemy && e.alive && e.gridX === nx && e.gridY === ny)) continue;
      valid.push([dx, dy]);
    }
    if (valid.length === 0) return;
    const [dx, dy] = Phaser.Utils.Array.GetRandom(valid);
    enemy.gridX += dx;
    enemy.gridY += dy;
    this.tweenSpriteTo(enemy.sprite, enemy.gridX, enemy.gridY, 300, 'Linear');
  }

  // ---------- Explosões e dano ----------

  spawnExplosion(x: number, y: number, color: number, glow: number): void {
    const px = x * CONFIG.tile + CONFIG.tile / 2;
    const py = y * CONFIG.tile + CONFIG.tile / 2;
    const sprite = this.add.image(px, py, 'explosion').setDepth(8).setTint(color);
    const ring = this.add.circle(px, py, 10, color, 0.18)
      .setStrokeStyle(2, glow, 0.95).setDepth(9);
    this.tweens.add({
      targets: sprite, alpha: 0, scale: 1.5, duration: 380,
      onComplete: () => sprite.destroy(),
    });
    this.tweens.add({
      targets: ring, scale: 2.2, alpha: 0, duration: 380,
      onComplete: () => ring.destroy(),
    });
    this.activeExplosions.push({ x, y, timer: 380, key: `${x},${y}`, hitPlayer: false });
  }

  damagePlayer(bypassInvuln = false): void {
    if (!bypassInvuln && this.player.invulnerable > 0) return;
    this.player.hp -= CONFIG.damagePerExplosion;
    this.player.invulnerable = CONFIG.invulnTime;
    this.updateHud();
    this.play('hurt');
    this.playerSprite.setTint(0xff5252);
    this.tweens.add({
      targets: this.playerSprite, alpha: 0.3,
      duration: 120, yoyo: true, repeat: 5,
      onComplete: () => {
        this.playerSprite.setAlpha(1);
        this.playerSprite.clearTint();
      },
    });
    if (this.player.hp <= 0) {
      this.player.hp = 0;
      this.updateHud();
      this.triggerGameOver();
    }
  }

  checkPlayerHit(): void {
    if (this.player.invulnerable > 0) return;
    const T = CONFIG.tile;
    const key = `${Math.floor(this.playerSprite.x / T)},${Math.floor(this.playerSprite.y / T)}`;
    const blast = this.activeExplosions.find(e => e.key === key && !e.hitPlayer);
    if (blast) {
      blast.hitPlayer = true;
      this.damagePlayer();
    }
  }

  // ---------- Movimento e entrada ----------

  moveDuration(): number {
    return CONFIG.baseMoveDuration / (1 + this.player.speedUp * 0.55);
  }

  tweenSpriteTo(
    sprite: Phaser.GameObjects.Image,
    gx: number,
    gy: number,
    duration: number,
    ease: string,
    onComplete?: () => void,
  ): Phaser.Tweens.Tween {
    return this.tweens.add({
      targets: sprite,
      x: gx * CONFIG.tile + CONFIG.tile / 2,
      y: gy * CONFIG.tile + CONFIG.tile / 2,
      duration,
      ease,
      onComplete,
    });
  }

  movePlayerTo(nx: number, ny: number, duration: number, ease: string): void {
    this.player.gridX = nx;
    this.player.gridY = ny;
    this.player.moving = true;
    this.playWalk();
    this.tweenSpriteTo(this.playerSprite, nx, ny, duration, ease, () => {
      this.player.moving = false;
      this.playIdle();
      this.checkPickups();
      this.checkWin();
    });
  }

  tryMove(dx: number, dy: number): void {
    if (this.player.moving) return;
    this.player.dir = { x: dx, y: dy };
    if (dx < 0) this.player.facing = 'left';
    else if (dx > 0) this.player.facing = 'right';
    else if (dy < 0) this.player.facing = 'up';
    else if (dy > 0) this.player.facing = 'down';
    const nx = this.player.gridX + dx;
    const ny = this.player.gridY + dy;
    if (!this.isFree(nx, ny)) {
      this.playIdle();
      return;
    }
    this.movePlayerTo(nx, ny, this.moveDuration(), 'Linear');
  }

  setupInput(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) throw new Error('Teclado não disponível');
    this.cursors = keyboard.createCursorKeys();
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = keyboard.addKeys({
      space: K.SPACE, x: K.X, d: K.D, r: K.R,
      one: K.ONE, two: K.TWO, three: K.THREE, four: K.FOUR,
      enter: K.ENTER,
    }) as unknown as MainKeys;
  }

  togglePause(): void {
    this.isPaused = !this.isPaused;
    setPauseVisible(this.isPaused);
    if (this.isPaused) {
      this.tweens.pauseAll();
      this.anims.pauseAll();
    } else {
      this.tweens.resumeAll();
      this.anims.resumeAll();
    }
  }

  handleInput(): void {
    const JD = Phaser.Input.Keyboard.JustDown;
    const c = this.cursors;
    if (JD(this.keys.enter)) {
      this.togglePause();
      return;
    }
    if (this.isPaused) return;
    if (JD(c.up)) this.lastDir = { x: 0, y: -1 };
    else if (JD(c.down)) this.lastDir = { x: 0, y: 1 };
    else if (JD(c.left)) this.lastDir = { x: -1, y: 0 };
    else if (JD(c.right)) this.lastDir = { x: 1, y: 0 };

    if (!this.player.moving) {
      const d = this.lastDir;
      const held =
        (d.x === 0 && d.y === -1 && c.up.isDown) ||
        (d.x === 0 && d.y === 1 && c.down.isDown) ||
        (d.x === -1 && d.y === 0 && c.left.isDown) ||
        (d.x === 1 && d.y === 0 && c.right.isDown);
      if (held) this.tryMove(d.x, d.y);
      else if (c.up.isDown) this.tryMove(0, -1);
      else if (c.down.isDown) this.tryMove(0, 1);
      else if (c.left.isDown) this.tryMove(-1, 0);
      else if (c.right.isDown) this.tryMove(1, 0);
    }

    if (JD(this.keys.space)) this.placeBomb();
    if (JD(this.keys.x)) this.pushAbility();
    if (JD(this.keys.d)) this.detonateRemote();
    if (JD(this.keys.one)) this.setBomb('normal');
    if (JD(this.keys.two)) this.setBomb('mega');
    if (JD(this.keys.three)) this.setBomb('pierce');
    if (JD(this.keys.four)) this.setBomb('remote');
  }

  // ---------- HUD e tempo ----------

  updateHud(): void {
    renderHud({
      hp: this.player.hp,
      coins: this.coins,
      gems: this.gems,
      blocks: this.blockSprites.size,
      bombsActive: this.bombs.length,
      bombsMax: this.player.bombsMax,
    });
    renderElement(this.bombType);
  }

  updateTimerHud(): void {
    const sec = Math.max(0, Math.ceil(this.timeLeft / 1000));
    if (sec === this.lastTimerSec) return;
    this.lastTimerSec = sec;
    renderTimer(this.timeLeft, sec);
  }

  updateTimer(delta: number): void {
    this.timeLeft -= delta;
    if (this.timeLeft <= 0 && !this.gameOver) {
      this.overtimeDamageTimer -= delta;
      if (this.overtimeDamageTimer <= 0) {
        this.overtimeDamageTimer = CONFIG.overtimeDamageInterval;
        this.damagePlayer(true);
      }
    }
    this.updateTimerHud();
  }

  updateBombs(delta: number): void {
    for (const bomb of this.bombs) {
      if (bomb.detonated) continue;
      bomb.timer -= delta;
      if (bomb.timer <= 0) this.detonate(bomb);
    }
    const before = this.bombs.length;
    this.bombs = this.bombs.filter(b => !b.detonated);
    if (this.bombs.length !== before) this.updateHud();
  }

  updateExplosions(delta: number): void {
    this.activeExplosions = this.activeExplosions.filter(e => (e.timer -= delta) > 0);
  }

  updateEnemies(delta: number): void {
    for (const enemy of [...this.enemies]) {
      if (!enemy.alive) continue;
      // chama residual também mata inimigos
      if (this.activeExplosions.some(e => e.x === enemy.gridX && e.y === enemy.gridY)) {
        this.killEnemy(enemy);
        continue;
      }
      const dist = Phaser.Math.Distance.Between(
        enemy.sprite.x, enemy.sprite.y, this.playerSprite.x, this.playerSprite.y,
      );
      if (dist < CONFIG.tile * 0.6) this.damagePlayer();
      enemy.moveTimer -= delta;
      if (enemy.moveTimer <= 0) {
        this.moveEnemy(enemy);
        enemy.moveTimer = CONFIG.enemyMoveInterval;
      }
    }
  }

  updateCooldowns(delta: number): void {
    this.cooldowns.push = Math.max(0, this.cooldowns.push - delta);
    this.player.invulnerable = Math.max(0, this.player.invulnerable - delta);
  }

  updateCooldownBar(): void {
    this.cdGraphics.clear();
    if (this.gameOver || this.won) return;
    const cd = this.cooldowns.push;
    if (cd <= 0) return;
    const ratio = 1 - cd / CONFIG.pushCd;
    const px = this.playerSprite.x - CONFIG.tile / 2 + 6;
    const py = this.playerSprite.y - CONFIG.tile / 2 + CONFIG.tile - 4;
    this.cdGraphics.fillStyle(0x000000, 0.65);
    this.cdGraphics.fillRect(px, py, CONFIG.tile - 12, 3);
    this.cdGraphics.fillStyle(0xff8c1a, 1);
    this.cdGraphics.fillRect(px, py, (CONFIG.tile - 12) * ratio, 3);
  }

  triggerGameOver(): void {
    if (this.gameOver) return;
    this.gameOver = true;
    this.isPaused = false;
    setPauseVisible(false);
    this.playerSprite.setVisible(false);
    if (this.won) audio.playWinMusic();
    else audio.playGameOverMusic();
    showGameOver({
      won: this.won,
      coins: this.coins,
      gems: this.gems,
      hp: this.player.hp,
      maxHp: CONFIG.maxHp,
      blocksDestroyed: this.blocksDestroyed,
      timeLeft: Math.max(0, this.timeLeft),
    });
  }

  floatingText(gx: number, gy: number, text: string, color: string): void {
    const t = this.add.text(
      gx * CONFIG.tile + CONFIG.tile / 2,
      gy * CONFIG.tile + CONFIG.tile / 2,
      text,
      { fontFamily: 'monospace', fontSize: '12px', color, fontStyle: 'bold' },
    ).setOrigin(0.5).setDepth(20);
    this.tweens.add({
      targets: t, y: t.y - 20, alpha: 0, duration: 700,
      onComplete: () => t.destroy(),
    });
  }

  play(name: SfxName): void {
    audio.play(name);
  }

  // ---------- Sono ----------

  // Qualquer tecla pressionada conta como atividade.
  inputActive(): boolean {
    const c = this.cursors;
    const k = this.keys;
    return c.up.isDown || c.down.isDown || c.left.isDown || c.right.isDown ||
      k.space.isDown || k.x.isDown || k.d.isDown || k.r.isDown ||
      k.one.isDown || k.two.isDown || k.three.isDown || k.four.isDown;
  }

  updateSleep(delta: number): void {
    if (this.player.moving || this.inputActive()) {
      this.idleMs = 0;
      if (this.isSleeping) this.wake();
      return;
    }
    this.idleMs += delta;
    if (!this.isSleeping) {
      if (this.idleMs >= CONFIG.sleepAfterMs) this.startSleep();
      return;
    }
    this.zzzMs += delta;
    if (this.zzzMs >= CONFIG.zzzIntervalMs) {
      this.zzzMs = 0;
      this.spawnZzz();
    }
  }

  startSleep(): void {
    this.isSleeping = true;
    this.zzzMs = CONFIG.zzzIntervalMs; // o primeiro 'z' sai na hora
    this.refreshSprite('sleep');
  }

  wake(): void {
    this.isSleeping = false;
    this.zzzMs = 0;
    // se o jogador começou a andar neste frame, mantém a animação de caminhada
    this.refreshSprite(this.player.moving ? 'walk' : 'idle');
  }

  spawnZzz(): void {
    const big = Math.random() < 0.5;
    const z = this.add.text(
      this.playerSprite.x + 9,
      this.playerSprite.y - 14,
      big ? 'Z' : 'z',
      { fontFamily: 'monospace', fontSize: big ? '12px' : '9px', color: '#bfd8ff', fontStyle: 'bold' },
    ).setOrigin(0.5).setDepth(21);
    this.tweens.add({
      targets: z,
      x: z.x + 8,
      y: z.y - 24,
      alpha: 0,
      duration: 1600,
      ease: 'Sine.easeOut',
      onComplete: () => z.destroy(),
    });
  }

  // ---------- Loop principal ----------

  update(_time: number, delta: number): void {
    if (isShopOpen()) return;
    if (Phaser.Input.Keyboard.JustDown(this.keys.r)) {
      hideGameOver();
      setPauseVisible(false);
      this.scene.restart();
      return;
    }
    if (this.gameOver || this.won) return;
    this.handleInput();
    if (this.isPaused) return;
    this.updateSleep(delta);
    this.updateTimer(delta);
    this.updateCooldowns(delta);
    this.updateCooldownBar();
    this.updateBombs(delta);
    this.updateExplosions(delta);
    this.updateEnemies(delta);
    this.checkPlayerHit();
    if (this.gameOver) return;
    this.checkPickups();
  }
}
