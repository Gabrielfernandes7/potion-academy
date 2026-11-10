// Cena de gameplay: grade, bombas, inimigos, itens, porta e entrada.
// Regras importantes:
// - player/enemy.gridX/gridY mudam quando o movimento COMEÇA; o sprite interpola depois.
// - Dano usa a posição visual do sprite (o que o jogador vê bate com o que acontece).
// - Pickups, bombas e vitória usam coordenadas de grade.
// - update() retorna cedo com a loja aberta e, após gameOver/won, só trata a tecla R.
import Phaser from 'phaser';
import {
  BLOCK, BOMB_TYPES, BombId, CANVAS, CONFIG, DIRS, ELEMENTS, ElementId, EMPTY, ENEMY_TYPES, EnemyKind,
  LAST_STAGE, StageDef, StageTheme, WALL, isImmune, stageDef,
} from '../config';
import { audio, SfxName } from '../audio/AudioEngine';
import { Bank, hasBombType } from '../storage';
import { rooOriginY } from '../textures/roo';
import { PICKUP_HALO, PICKUP_TEXTURE, PickupType, rollReward } from '../game/rewards';
import type { Bomb, Enemy, Explosion, Facing, Pickup, Player, PowerupCounts, StageData } from '../game/types';
import { HUD_SELECT_BOMB, HUD_UPDATE, HudState } from '../game/hudState';
import { touch } from '../input/touch';
import { hideGameOver, setPauseVisible, showGameOver } from '../ui/overlays';
import { isShopOpen } from '../ui/shop';
import { isHelpOpen } from '../ui/help';
import { readTheme } from '../ui/theme';
import { BossController } from '../game/BossController';
import { chainOutcome } from '../game/chain';
import { markStageCompleted } from '../storage';

// Partículas de cada elemento na explosão (cada casa atingida solta um punhado delas).
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

// Cor que tinge a Roo ao ser atingida por cada elemento.
const HIT_TINT: Record<ElementId, number> = {
  fire: 0xff7043,
  water: 0x4fc3f7,
  earth: 0xa1887f,
  air: 0xe0d8ff,
};

const EXPLOSION_FX: Record<ElementId, {
  texture: string; speed: { min: number; max: number }; angle: { min: number; max: number };
  gravity: number; life: { min: number; max: number }; size: number; count: number; extra: number[]; blend: string;
}> = {
  fire: { texture: 'menu_spark', speed: { min: 30, max: 90 }, angle: { min: -130, max: -50 }, gravity: -40, life: { min: 450, max: 900 }, size: 2, count: 7, extra: [0xffd54f], blend: 'ADD' },
  water: { texture: 'menu_bubble', speed: { min: 20, max: 80 }, angle: { min: 0, max: 360 }, gravity: 120, life: { min: 400, max: 800 }, size: 1.1, count: 8, extra: [0xffffff], blend: 'NORMAL' },
  earth: { texture: 'menu_spark', speed: { min: 30, max: 90 }, angle: { min: -150, max: -30 }, gravity: 260, life: { min: 400, max: 700 }, size: 1.6, count: 7, extra: [0x8d6e63, 0x6d4c41], blend: 'NORMAL' },
  air: { texture: 'menu_spark', speed: { min: 20, max: 70 }, angle: { min: 0, max: 360 }, gravity: -10, life: { min: 600, max: 1000 }, size: 1.8, count: 8, extra: [0xffffff, 0xe0d8ff], blend: 'ADD' },
};

type MainKeys = Record<'space' | 'x' | 'd' | 'r' | 'one' | 'two' | 'three' | 'four' | 'enter', Phaser.Input.Keyboard.Key>;

// Aparência de cada fase: texturas do chão, da muralha, do caixote e da porta (e um tom, se houver).
interface Look {
  floor1: string; floor2: string; wall: string; block: string; door: [string, string];
  floorTint?: number; wallTint?: number; blockTint?: number;
}
const LOOKS: Record<StageTheme, Look> = {
  stone: { floor1: 'floor1', floor2: 'floor2', wall: 'wall', block: 'block', door: ['door_closed', 'door_open'] },
  // salão dos fantasmas: a mesma pedra, mais fria e azulada
  crypt: {
    floor1: 'floor1', floor2: 'floor2', wall: 'wall', block: 'block', door: ['door_closed', 'door_open'],
    floorTint: 0x8f96d4, wallTint: 0x8a88c0, blockTint: 0xb9aadb,
  },
  garden: { floor1: 'g_floor1', floor2: 'g_floor2', wall: 'g_wall', block: 'g_block', door: ['gate_closed', 'gate_open'] },
};

// Movimento de cada inimigo: pulo vertical e horizontal do passo, e o balanço parado (altura e velocidade).
const MOTION: Record<EnemyKind, { hopV: number; hopH: number; bob: number; bobMs: number }> = {
  frog: { hopV: 7, hopH: 3, bob: 1.2, bobMs: 260 },
  ghost: { hopV: 0, hopH: 0, bob: 2.6, bobMs: 420 },
  flower: { hopV: 0, hopH: 0, bob: 0, bobMs: 500 },
};

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
  enemyThresholds = new Map<EnemyKind, number>(); // caixotes quebrados para o próximo inimigo de cada tipo
  look: Look = LOOKS.stone;
  lashGfx!: Phaser.GameObjects.Graphics; // avisos dos chicotes das flores do mal
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
  stage = 1; // 1 laboratório, 2 salão dos fantasmas, 3 duelo com a Belladona, 4 jardim (ver STAGES em config.ts)
  boss: BossController | null = null;
  transitioning = false; // passando de fase: ignora entrada
  private helpPaused = false;

  constructor() {
    super('Main');
  }

  get def(): StageDef {
    return stageDef(this.stage);
  }

  get isBossStage(): boolean {
    return this.def.kind === 'boss';
  }

  init(data?: StageData): void {
    this.stage = data?.stage ?? 1;
    this.boss = null;
    this.transitioning = false;
    this.helpPaused = false;
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
    if (data?.carry) {
      // o que ela conquistou na fase 1 continua na fase 2
      const c = data.carry;
      this.player.hp = c.hp;
      this.player.bombsMax = c.bombsMax;
      this.player.fireLevel = c.fireLevel;
      this.player.speedUp = c.speedUp;
      this.coins = c.coins;
      this.bombType = c.bombType;
    }
    this.lastDir = { x: 0, y: 0 };
    // sem porta na fase do chefe (-1 nunca coincide com uma casa)
    this.doorX = this.def.door ? CONFIG.cols - 2 : -1;
    this.doorY = this.def.door ? CONFIG.rows - 2 : -1;
    this.doorOpen = false;
    this.look = LOOKS[this.def.theme];
    this.timeLeft = this.def.time;
    this.overtimeDamageTimer = CONFIG.overtimeDamageInterval;
    this.blocksDestroyed = 0;
    this.enemyThresholds = new Map();
    for (const rule of this.def.enemies) {
      if (rule.every) this.enemyThresholds.set(rule.kind, rule.every);
    }
    this.lastTimerSec = null;
    this.idleMs = 0;
    this.isSleeping = false;
    this.zzzMs = 0;
    touch.releaseAll();
    touch.clearJust();
    audio.nextTrack(this.isBossStage, this.def.track); // o duelo e algumas fases têm faixa própria; no resto, sorteia
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
    if (this.def.door) {
      this.placeDoor();
      this.assignHiddenGems();
    }
    this.spawnEnemies();
    this.playerSprite = this.add.sprite(
      this.player.gridX * CONFIG.tile + CONFIG.tile / 2,
      this.player.gridY * CONFIG.tile + CONFIG.tile / 2,
      'roo_down_0',
    ).setOrigin(0.5, rooOriginY(CONFIG.tile)).setDepth(10);
    this.cdGraphics = this.add.graphics().setDepth(15);
    this.lashGfx = this.add.graphics().setDepth(4);
    if (this.isBossStage) this.boss = new BossController(this);
    if (this.stage > 1) this.cameras.main.fadeIn(600, 8, 14, 12);
    // a grade é desenhada abaixo da faixa da HUD (cena 'Hud', por cima)
    this.cameras.main.setViewport(0, CONFIG.hudHeight, CANVAS.width, CONFIG.rows * CONFIG.tile);
    this.setupInput();
    this.game.events.on(HUD_SELECT_BOMB, this.setBomb, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(HUD_SELECT_BOMB, this.setBomb, this);
    });
    this.updateHud();
    this.playIdle();
    this.showStageBanner();
    if (!this.scene.isActive('Hud')) this.scene.launch('Hud');
  }

  // Cartão de entrada da fase: número, nome e (se houver) uma dica sobre a novidade dela.
  showStageBanner(): void {
    const theme = readTheme();
    const cx = (CONFIG.cols * CONFIG.tile) / 2;
    const cy = (CONFIG.rows * CONFIG.tile) / 2;
    const items: Phaser.GameObjects.GameObject[] = [];
    const band = this.add.rectangle(cx, cy, CONFIG.cols * CONFIG.tile, 96, 0x000000, 0.62).setDepth(29);
    items.push(band);
    items.push(this.add.text(cx, cy - 26, `FASE ${this.stage}`, {
      fontFamily: theme.fontDisplay, fontSize: '14px', color: theme.textMuted, fontStyle: '700',
    }).setOrigin(0.5).setDepth(30));
    items.push(this.add.text(cx, cy - 2, this.def.name, {
      fontFamily: theme.fontDisplay, fontSize: '24px', color: '#f0c674', fontStyle: '700',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(30));
    if (this.def.tip) {
      items.push(this.add.text(cx, cy + 28, this.def.tip, {
        fontFamily: theme.fontBody, fontSize: '12px', color: '#e8dcc0',
        align: 'center', wordWrap: { width: CONFIG.cols * CONFIG.tile - 48 },
      }).setOrigin(0.5).setDepth(30));
    }
    this.tweens.add({
      targets: items, alpha: 0, delay: 2200, duration: 600,
      onComplete: () => items.forEach(i => i.destroy()),
    });
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
    this.updateHud();
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
    // brilho do elemento + faíscas no pavio; a pulsação acelera perto de explodir (updateBombs)
    const el = ELEMENTS[type.element];
    const halo = this.add.image(sprite.x, sprite.y, 'menu_puff').setTint(el.color)
      .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.25).setScale(0.85).setDepth(4);
    const fx = this.add.particles(0, 0, 'menu_spark', {
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
      gridX: this.player.gridX, gridY: this.player.gridY,
      type: this.bombType, element: type.element, sprite, halo, fx,
      fuseMs: type.fuse, age: 0,
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
        // reação entre poções: fogo acende, água apaga o fogo, terra é imune (ver game/chain.ts)
        const chainBomb = this.bombs.find(b => b !== bomb && b.gridX === nx && b.gridY === ny && !b.detonated);
        if (chainBomb) {
          const outcome = chainOutcome(bomb.element, chainBomb.element);
          if (outcome === 'trigger') this.detonate(chainBomb);
          else if (outcome === 'neutralize') this.neutralizeBomb(chainBomb);
        }
        tiles.push({ x: nx, y: ny });
        if (tile === BLOCK) {
          this.removeBlock(nx, ny);
          this.spawnReward(nx, ny);
          if (!type.pierce) break;
        }
      }
    }
    const element = ELEMENTS[bomb.element] ?? ELEMENTS.fire;
    this.boss?.onExplosion(tiles);
    for (const t of tiles) {
      for (const enemy of this.enemies) {
        if (enemy.alive && enemy.gridX === t.x && enemy.gridY === t.y) this.hitEnemy(enemy, bomb.element);
      }
      this.spawnExplosion(t.x, t.y, element.color, element.glow, bomb.element);
    }
    this.tweens.killTweensOf(bomb.sprite);
    bomb.sprite.destroy();
    bomb.halo.destroy();
    bomb.fx.destroy();
    this.play('explosion', bomb.element);
    this.cameras.main.shake(70, 0.003);
  }

  // A água apagou uma poção de fogo: ela se desfaz em vapor, sem explodir.
  neutralizeBomb(bomb: Bomb): void {
    if (bomb.detonated) return;
    bomb.detonated = true;
    const { x, y } = bomb.sprite;
    this.tweens.killTweensOf(bomb.sprite);
    bomb.sprite.destroy();
    bomb.halo.destroy();
    bomb.fx.destroy();
    const steam = this.add.particles(x, y, 'menu_puff', {
      speed: { min: 8, max: 30 },
      angle: { min: -120, max: -60 },
      lifespan: { min: 700, max: 1100 },
      scale: { start: 0.35, end: 1.1 },
      alpha: { start: 0.55, end: 0 },
      tint: [0xe3f2fd, 0xb0bec5, 0xffffff],
      emitting: false,
    }).setDepth(10);
    steam.explode(7);
    this.time.delayedCall(1300, () => steam.destroy());
    this.floatingText(Math.floor(x / CONFIG.tile), Math.floor(y / CONFIG.tile), 'APAGADA', '#a8e6f5');
    this.play('fizzle');
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
        const floor = this.add.image(px, py, (x + y) % 2 === 0 ? this.look.floor1 : this.look.floor2).setOrigin(0).setDepth(0);
        if (this.look.floorTint !== undefined) floor.setTint(this.look.floorTint);
        const isWall = x === 0 || y === 0 || x === CONFIG.cols - 1 || y === CONFIG.rows - 1 ||
                       (x % 2 === 0 && y % 2 === 0);
        if (isWall) {
          this.grid[y][x] = WALL;
          const wall = this.add.image(px, py, this.look.wall).setOrigin(0).setDepth(1);
          if (this.look.wallTint !== undefined) wall.setTint(this.look.wallTint);
        } else if (Math.random() < this.def.blockChance && !this.isSpawnSafe(x, y)) {
          this.grid[y][x] = BLOCK;
          const sprite = this.add.image(px, py, this.look.block).setOrigin(0).setDepth(2);
          if (this.look.blockTint !== undefined) sprite.setTint(this.look.blockTint);
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
      this.look.door[0],
    ).setDepth(3);
  }

  assignHiddenGems(): void {
    // garante gemas suficientes para abrir a porta
    const keys = Phaser.Utils.Array.Shuffle([...this.blockSprites.keys()]);
    this.gemBlocks = new Set(keys.slice(0, CONFIG.gemsForDoor));
  }

  isSpawnSafe(x: number, y: number): boolean {
    // área livre em L ao redor do spawn, para sempre haver rota de fuga
    if (this.isBossStage) {
      // a Belladona nasce no canto oposto: deixa as casas ao redor dela livres
      const r = CONFIG.rows - 2;
      const c = CONFIG.cols - 2;
      if ((y === r && x >= c - 2) || (x === c && y >= r - 2)) return true;
    }
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
    for (const rule of this.def.enemies) {
      const threshold = this.enemyThresholds.get(rule.kind);
      if (threshold === undefined || !rule.every) continue;
      if (this.blocksDestroyed >= threshold && this.countEnemies(rule.kind) < rule.max) {
        this.spawnEnemy(rule.kind);
        this.enemyThresholds.set(rule.kind, threshold + rule.every);
      }
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
    if (this.enemies.some(e => e.alive && ENEMY_TYPES[e.kind].rooted && e.gridX === x && e.gridY === y)) return false;
    return true;
  }

  // ---------- Itens ----------

  spawnReward(x: number, y: number): void {
    if (this.gemBlocks.has(`${x},${y}`)) {
      this.spawnPickupSprite(x, y, 'gem');
      return;
    }
    const type = rollReward();
    // na fase do chefe não há porta: gema vira moeda
    this.spawnPickupSprite(x, y, !this.def.door && type === 'gem' ? 'coin' : type);
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
    const haloColor = PICKUP_HALO[type];
    let halo: Phaser.GameObjects.Image | undefined;
    if (haloColor !== undefined) {
      halo = this.add.image(sprite.x, sprite.y, 'menu_puff').setScale(0.95).setTint(haloColor)
        .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.3).setDepth(5);
      this.tweens.add({
        targets: halo, alpha: { from: 0.18, to: 0.42 }, scale: { from: 0.85, to: 1.05 },
        duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }
    this.pickups.push({ gridX: x, gridY: y, type, sprite, halo });
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
        this.player.hp = Math.min(CONFIG.maxHp, this.player.hp + 1);
        this.play('powerup');
        break;
      case 'heart':
        this.player.hp = Math.min(CONFIG.maxHp, this.player.hp + 1);
        this.play('pickup');
        break;
      case 'bomb_up':
        this.player.bombsMax = Math.min(CONFIG.maxBombs + CONFIG.maxBombUp, this.player.bombsMax + 1);
        this.powerupsCollected.bomb_up++;
        this.floatingText(pickup.gridX, pickup.gridY, '+1 FRASCO', '#b39ddb');
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
        this.timeLeft = Math.min(this.timeLeft + CONFIG.timeUpBonus, this.def.time * 2);
        this.powerupsCollected.time_up++;
        this.floatingText(pickup.gridX, pickup.gridY, '+15s', '#fff59d');
        this.play('powerup');
        break;
    }
    this.tweens.killTweensOf(pickup.sprite);
    pickup.sprite.destroy();
    if (pickup.halo) {
      this.tweens.killTweensOf(pickup.halo);
      pickup.halo.destroy();
    }
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
    this.doorSprite.setTexture(this.look.door[1]);
    this.tweens.add({
      targets: this.doorSprite, scale: { from: 1, to: 1.15 },
      duration: 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    this.cameras.main.flash(220, 100, 200, 100);
    this.play('door');
    const cx = (CONFIG.cols * CONFIG.tile) / 2;
    const cy = (CONFIG.rows * CONFIG.tile) / 2;
    const txt = this.add.text(cx, cy, 'PORTA ABERTA!', {
      fontFamily: 'monospace', fontSize: '28px', color: '#4caf50', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(25);
    this.tweens.add({ targets: txt, y: cy - 40, alpha: 0, duration: 1500, onComplete: () => txt.destroy() });
  }

  checkWin(): void {
    if (this.player.moving) return;
    if (this.doorOpen && this.player.gridX === this.doorX && this.player.gridY === this.doorY) {
      this.stageClear();
    }
  }

  // Chegou à porta. Nas fases intermediárias leva o que conquistou para a seguinte; na última, vence.
  stageClear(): void {
    if (this.transitioning || !this.def.door) return;
    this.transitioning = true;
    this.play('door');
    if (this.stage >= LAST_STAGE) {
      // portão do jardim: fim do jogo
      this.floatingText(this.player.gridX, this.player.gridY, 'JARDIM LIVRE!', '#9be564');
      this.coins += CONFIG.gardenVictoryBonus;
      Bank.add(CONFIG.gardenVictoryBonus);
      this.time.delayedCall(900, () => {
        this.won = true;
        this.triggerGameOver();
      });
      return;
    }
    this.floatingText(this.player.gridX, this.player.gridY, 'FASE COMPLETA!', '#9be564');
    this.advanceStage();
  }

  // Fade e recomeço da cena na fase seguinte, levando vida, power-ups, moedas e o frasco escolhido.
  advanceStage(): void {
    this.lashGfx.clear();
    this.cameras.main.fadeOut(900, 8, 14, 12);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.restart({
        stage: this.stage + 1,
        carry: {
          hp: Math.min(CONFIG.maxHp, this.player.hp + CONFIG.stageClearHeal),
          bombsMax: this.player.bombsMax,
          fireLevel: this.player.fireLevel,
          speedUp: this.player.speedUp,
          coins: this.coins,
          bombType: this.bombType,
        },
      } satisfies StageData);
    });
  }

  // A Belladona foi derrotada: bônus de POÇÃO e a Roo segue para o jardim, fora do castelo.
  onBossDefeated(): void {
    if (this.gameOver || this.transitioning) return;
    this.transitioning = true;
    this.coins += CONFIG.bossVictoryBonus;
    Bank.add(CONFIG.bossVictoryBonus);
    this.floatingText(this.player.gridX, this.player.gridY, 'BELLADONA DERROTADA!', '#9be564');
    this.advanceStage();
  }

  // Casa onde a jogadora está de fato (posição do sprite, como o dano).
  playerTile(): { x: number; y: number } {
    const T = CONFIG.tile;
    return { x: Math.floor(this.playerSprite.x / T), y: Math.floor(this.playerSprite.y / T) };
  }

  // ---------- Inimigos ----------

  spawnEnemies(): void {
    for (const rule of this.def.enemies) {
      for (let i = 0; i < rule.start; i++) this.spawnEnemy(rule.kind);
    }
  }

  countEnemies(kind: EnemyKind): number {
    return this.enemies.filter(e => e.kind === kind).length;
  }

  spawnEnemy(kind: EnemyKind): void {
    const rule = this.def.enemies.find(r => r.kind === kind);
    if (!rule || this.countEnemies(kind) >= rule.max) return;
    const def = ENEMY_TYPES[kind];
    for (let attempt = 0; attempt < 80; attempt++) {
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
        def.texture,
      ).setDepth(7).setScale(0.01);
      if (def.rooted) {
        // a flor balança presa ao chão: o pivô fica perto da base
        sprite.setOrigin(0.5, 0.88);
        sprite.y += 0.38 * CONFIG.tile;
      }
      this.tweens.add({ targets: sprite, scale: 1, duration: 250, ease: 'Back.easeOut' });
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
    this.tweens.killTweensOf(enemy.sprite);
    const px = enemy.sprite.x;
    const py = enemy.sprite.y;
    enemy.sprite.destroy();
    this.enemies = this.enemies.filter(e => e !== enemy);
    this.hitFx(px, py, element);
    this.spawnPickupSprite(enemy.gridX, enemy.gridY, 'coin');
    this.cameras.main.shake(60, 0.003);
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
    this.floatingText(enemy.gridX, enemy.gridY, 'IMUNE', '#c5e1a5');
    this.tweens.add({ targets: enemy.sprite, alpha: 0.55, duration: 90, yoyo: true, repeat: 1 });
  }

  // Efeito de ser atingido por um elemento (inimigo ou Roo): partículas próprias do elemento.
  hitFx(px: number, py: number, element: ElementId): void {
    const c = HIT_FX[element];
    const emitter = this.add.particles(px, py, c.texture, {
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
    this.time.delayedCall(1000, () => emitter.destroy());
  }

  moveEnemy(enemy: Enemy): void {
    const def = ENEMY_TYPES[enemy.kind];
    const valid: Array<readonly [number, number]> = [];
    for (const [dx, dy] of DIRS) {
      const nx = enemy.gridX + dx;
      const ny = enemy.gridY + dy;
      if (nx === this.doorX && ny === this.doorY) continue;
      if (def.passWalls) {
        // fantasma: atravessa muralhas, caixotes e poções, mas não sai da sala
        if (nx < 1 || ny < 1 || nx > CONFIG.cols - 2 || ny > CONFIG.rows - 2) continue;
      } else if (!this.isFree(nx, ny)) {
        continue;
      }
      if (this.enemies.some(e => e !== enemy && e.alive && e.gridX === nx && e.gridY === ny)) continue;
      valid.push([dx, dy]);
    }
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
      const tile = this.getTile(enemy.gridX, enemy.gridY);
      enemy.sprite.setAlpha(tile === EMPTY ? 0.92 : 0.45);
    }
    if (def.rooted) enemy.sprite.setAngle(Math.sin(enemy.phase / 380) * 4);
  }

  // Flor do mal: de tempos em tempos avisa no chão e chicoteia as quatro casas ao redor.
  updateFlower(enemy: Enemy, delta: number): void {
    enemy.lashMs -= delta;
    const around: Array<{ x: number; y: number }> = [];
    for (const [dx, dy] of DIRS) {
      const x = enemy.gridX + dx;
      const y = enemy.gridY + dy;
      const tile = this.getTile(x, y);
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
    const me = this.playerTile();
    for (const c of around) {
      this.thornFx(c.x * T + T / 2, c.y * T + T / 2);
      if (c.x === me.x && c.y === me.y) this.damagePlayer(false, 'earth');
    }
    this.tweens.add({ targets: enemy.sprite, scaleX: 1.25, scaleY: 0.85, duration: 90, yoyo: true });
    enemy.lashMs = CONFIG.flowerLashCycleMs;
  }

  // Espinhos e folhas que saltam quando a flor chicoteia.
  thornFx(px: number, py: number): void {
    const emitter = this.add.particles(px, py, 'menu_spark', {
      speed: { min: 40, max: 110 },
      angle: { min: 0, max: 360 },
      lifespan: { min: 300, max: 520 },
      scale: { start: 1.8, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [0x66bb6a, 0x2e7d32, 0xad1457],
      emitting: false,
    }).setDepth(10);
    emitter.explode(6);
    this.time.delayedCall(700, () => emitter.destroy());
  }

  // ---------- Explosões e dano ----------

  spawnExplosion(x: number, y: number, color: number, glow: number, element: ElementId = 'fire'): void {
    const px = x * CONFIG.tile + CONFIG.tile / 2;
    const py = y * CONFIG.tile + CONFIG.tile / 2;
    const core = this.add.image(px, py, 'menu_puff').setTint(color)
      .setBlendMode(Phaser.BlendModes.ADD).setDepth(8).setScale(0.9).setAlpha(0.95);
    const ring = this.add.circle(px, py, 10, color, 0.18)
      .setStrokeStyle(2, glow, 0.95).setDepth(9);
    this.tweens.add({
      targets: core, alpha: 0, scale: 1.9, duration: 420,
      onComplete: () => core.destroy(),
    });
    this.tweens.add({
      targets: ring, scale: 2.2, alpha: 0, duration: 380,
      onComplete: () => ring.destroy(),
    });
    this.explosionFx(px, py, color, glow, element);
    this.activeExplosions.push({ x, y, timer: 380, key: `${x},${y}`, hitPlayer: false, element });
  }

  // Punhado de partículas do elemento: brasas (fogo), gotas (água), pedriscos (terra), brilhos (éter).
  private explosionFx(px: number, py: number, color: number, glow: number, element: ElementId): void {
    const c = EXPLOSION_FX[element];
    const emitter = this.add.particles(px, py, c.texture, {
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
    this.time.delayedCall(1100, () => emitter.destroy());
  }

  damagePlayer(bypassInvuln = false, element?: ElementId): void {
    if (!bypassInvuln && this.player.invulnerable > 0) return;
    this.player.hp -= CONFIG.damagePerExplosion;
    this.player.invulnerable = CONFIG.invulnTime;
    this.updateHud();
    this.play('hurt');
    this.playerSprite.setTint(element ? HIT_TINT[element] : 0xff5252);
    if (element) this.hitFx(this.playerSprite.x, this.playerSprite.y - 8, element);
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
      this.damagePlayer(false, blast.element);
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
    if (JD(this.keys.enter) || touch.consumeAction('pause')) {
      this.togglePause();
      touch.clearJust();
      return;
    }
    if (this.isPaused) {
      touch.clearJust();
      return;
    }

    // teclado ou toque: ambos alimentam as mesmas regras
    const justUp = JD(c.up) || touch.consumeDir('up');
    const justDown = JD(c.down) || touch.consumeDir('down');
    const justLeft = JD(c.left) || touch.consumeDir('left');
    const justRight = JD(c.right) || touch.consumeDir('right');
    const up = c.up.isDown || touch.held.up;
    const down = c.down.isDown || touch.held.down;
    const left = c.left.isDown || touch.held.left;
    const right = c.right.isDown || touch.held.right;

    if (justUp) this.lastDir = { x: 0, y: -1 };
    else if (justDown) this.lastDir = { x: 0, y: 1 };
    else if (justLeft) this.lastDir = { x: -1, y: 0 };
    else if (justRight) this.lastDir = { x: 1, y: 0 };

    if (!this.player.moving) {
      const d = this.lastDir;
      const held =
        (d.x === 0 && d.y === -1 && up) ||
        (d.x === 0 && d.y === 1 && down) ||
        (d.x === -1 && d.y === 0 && left) ||
        (d.x === 1 && d.y === 0 && right);
      if (held) this.tryMove(d.x, d.y);
      else if (up) this.tryMove(0, -1);
      else if (down) this.tryMove(0, 1);
      else if (left) this.tryMove(-1, 0);
      else if (right) this.tryMove(1, 0);
    }

    if (JD(this.keys.space) || touch.consumeAction('bomb')) this.placeBomb();
    if (JD(this.keys.x) || touch.consumeAction('push')) this.pushAbility();
    if (JD(this.keys.d) || touch.consumeAction('detonate')) this.detonateRemote();
    if (JD(this.keys.one)) this.setBomb('normal');
    if (JD(this.keys.two)) this.setBomb('mega');
    if (JD(this.keys.three)) this.setBomb('pierce');
    if (JD(this.keys.four)) this.setBomb('remote');
    touch.clearJust();
  }

  // ---------- HUD e tempo ----------

  // Estado enviado à cena da HUD (também lido por ela ao iniciar).
  buildHudState(): HudState {
    return {
      hp: this.player.hp,
      maxHp: CONFIG.maxHp,
      coins: this.coins,
      gems: this.gems,
      gemsForDoor: CONFIG.gemsForDoor,
      blocks: this.blockSprites.size,
      bombsActive: this.bombs.length,
      bombsMax: this.player.bombsMax,
      timeLeftMs: this.timeLeft,
      selected: this.bombType,
      stage: this.stage,
      boss: this.boss ? this.boss.hudView() : null,
    };
  }

  updateHud(): void {
    this.game.events.emit(HUD_UPDATE, this.buildHudState());
  }

  // O cronômetro só reenvia o estado quando o segundo exibido muda.
  updateTimerHud(): void {
    const sec = Math.max(0, Math.ceil(this.timeLeft / 1000));
    if (sec === this.lastTimerSec) return;
    this.lastTimerSec = sec;
    this.updateHud();
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
    if (this.bombs.length !== before) this.updateHud();
  }

  updateExplosions(delta: number): void {
    this.activeExplosions = this.activeExplosions.filter(e => (e.timer -= delta) > 0);
  }

  updateEnemies(delta: number): void {
    this.lashGfx.clear();
    for (const enemy of [...this.enemies]) {
      if (!enemy.alive) continue;
      const def = ENEMY_TYPES[enemy.kind];
      enemy.fxCooldown = Math.max(0, enemy.fxCooldown - delta);
      // chama residual também atinge inimigos
      const blast = this.activeExplosions.find(e => e.x === enemy.gridX && e.y === enemy.gridY);
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
        enemy.sprite.x, enemy.sprite.y, this.playerSprite.x, this.playerSprite.y,
      );
      if (dist < CONFIG.tile * 0.6) this.damagePlayer();
      enemy.moveTimer -= delta;
      if (enemy.moveTimer <= 0) {
        this.moveEnemy(enemy);
        enemy.moveTimer = def.moveInterval;
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
    this.lashGfx.clear();
    if (this.won) {
      audio.playWinMusic();
      markStageCompleted(this.stage);
    } else {
      audio.playGameOverMusic();
    }
    showGameOver({
      won: this.won,
      coins: this.coins,
      gems: this.gems,
      hp: this.player.hp,
      maxHp: CONFIG.maxHp,
      blocksDestroyed: this.blocksDestroyed,
      timeLeft: Math.max(0, this.timeLeft),
      stage: this.stage,
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

  play(name: SfxName, variant?: ElementId): void {
    audio.play(name, variant);
  }

  // ---------- Sono ----------

  // Qualquer tecla ou toque conta como atividade.
  inputActive(): boolean {
    const c = this.cursors;
    const k = this.keys;
    return c.up.isDown || c.down.isDown || c.left.isDown || c.right.isDown ||
      k.space.isDown || k.x.isDown || k.d.isDown || k.r.isDown ||
      k.one.isDown || k.two.isDown || k.three.isDown || k.four.isDown ||
      touch.anyHeld || touch.consumeActivity();
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
      {
        fontFamily: 'monospace', fontSize: big ? '18px' : '13px', color: '#d6e6ff', fontStyle: 'bold',
        stroke: '#0e1613', strokeThickness: 3,
      },
    ).setOrigin(0.5).setDepth(21);
    this.tweens.add({
      targets: z,
      x: z.x + 8,
      y: z.y - 24,
      alpha: 0,
      duration: 1900,
      ease: 'Sine.easeOut',
      onComplete: () => z.destroy(),
    });
  }

  // ---------- Janela de ajuda ----------

  // Com a janela "Como jogar" aberta, o jogo congela por inteiro (tempo, animações e entrada).
  private holdForHelp(): void {
    if (!this.helpPaused) {
      this.helpPaused = true;
      this.tweens.pauseAll();
      this.anims.pauseAll();
    }
    this.input.keyboard?.resetKeys(); // teclas apertadas com a janela aberta não valem depois
    touch.clearJust();
  }

  private releaseHelpHold(): void {
    if (!this.helpPaused) return;
    this.helpPaused = false;
    if (!this.isPaused) {
      this.tweens.resumeAll();
      this.anims.resumeAll();
    }
  }

  // ---------- Loop principal ----------

  update(_time: number, delta: number): void {
    if (isShopOpen()) return;
    if (isHelpOpen()) {
      this.holdForHelp();
      return;
    }
    this.releaseHelpHold();
    if (Phaser.Input.Keyboard.JustDown(this.keys.r)) {
      hideGameOver();
      setPauseVisible(false);
      // dados explícitos: sem eles o Phaser reaproveita os do último reinício (e voltaria à fase 2)
      this.scene.restart({ stage: 1 } satisfies StageData);
      return;
    }
    if (this.gameOver || this.won || this.transitioning) return;
    this.handleInput();
    if (this.isPaused) return;
    this.updateSleep(delta);
    this.updateTimer(delta);
    this.updateCooldowns(delta);
    this.updateCooldownBar();
    this.updateBombs(delta);
    this.updateExplosions(delta);
    this.updateEnemies(delta);
    this.boss?.update(delta);
    this.checkPlayerHit();
    if (this.gameOver) return;
    this.checkPickups();
  }
}
