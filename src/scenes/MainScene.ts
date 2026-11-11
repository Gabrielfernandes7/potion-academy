// Cena de gameplay: grade, bombas, inimigos, itens, porta e entrada.
// Regras importantes:
// - player/enemy.gridX/gridY mudam quando o movimento COMEÇA; o sprite interpola depois.
// - Dano usa a posição visual do sprite (o que o jogador vê bate com o que acontece).
// - Pickups, bombas e vitória usam coordenadas de grade.
// - update() retorna cedo com a loja aberta e, após gameOver/won, só trata a tecla R.
import Phaser from 'phaser';
import {
  BLOCK, BOMB_ORDER, BombId, CANVAS, CONFIG, ElementId, EMPTY, ENEMY_TYPES, EnemyKind,
  LAST_STAGE, StageDef, StageTheme, WALL, stageDef,
} from '../config';
import { audio, SfxName } from '../audio/AudioEngine';
import { Bank, hasBombType } from '../storage';
import { rooOriginY } from '../textures/rooGeometry';
import type { Facing, Player, PowerupCounts, StageData } from '../game/types';
import { HUD_SELECT_BOMB, HUD_UPDATE, HudState } from '../game/hudState';
import { touch } from '../input/touch';
import { hideGameOver, setPauseVisible, showGameOver } from '../ui/overlays';
import { isShopOpen } from '../ui/shop';
import { isHelpOpen } from '../ui/help';
import { readTheme } from '../ui/theme';
import { BossController } from '../game/BossController';
import { BombSystem } from '../game/BombSystem';
import { PickupSystem } from '../game/PickupSystem';
import { EnemySystem } from '../game/EnemySystem';
import { SleepSystem } from '../game/SleepSystem';
import { markStageCompleted } from '../storage';
import { cloneUpgrades, createUpgrades } from '../game/upgrades';
import { SCENE_TRACKS } from '../audio/tracks';
import { showDialogue } from '../ui/dialogue';
import { ANSELMO, BELLADONA_CARDS, ENDING_CARDS, PASSAGE_CARDS, type StoryCard } from '../game/story';

// Cor que tinge a Roo ao ser atingida por cada elemento.
const HIT_TINT: Record<ElementId, number> = {
  fire: 0xff7043,
  water: 0x4fc3f7,
  earth: 0xa1887f,
  air: 0xe0d8ff,
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

export class MainScene extends Phaser.Scene {
  grid: number[][] = [];
  blockSprites = new Map<string, Phaser.GameObjects.Image>();
  bombSystem!: BombSystem;
  pickupSystem!: PickupSystem;
  enemySystem!: EnemySystem;
  sleepSystem!: SleepSystem;
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
  lastTimerSec: number | null = null;
  powerupsCollected: PowerupCounts = { bomb_up: 0, fire_up: 0, speed_up: 0, time_up: 0 };
  isPaused = false;
  gemBlocks = new Set<string>();
  playerSprite!: Phaser.GameObjects.Sprite;
  cdGraphics!: Phaser.GameObjects.Graphics;
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  keys!: MainKeys;
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
    this.coins = 0;
    this.gems = 0;
    this.bombType = 'normal';
    this.cooldowns = { push: 0 };
    this.gameOver = false;
    this.won = false;
    this.moveCarry = 0;
    this.player = {
      gridX: 1, gridY: 1,
      dir: { x: 0, y: 1 }, facing: 'down', moving: false,
      hp: CONFIG.maxHp, invulnerable: 0,
      upgrades: createUpgrades(),
      speedUp: 0,
    };
    if (data?.carry) {
      // o que ela conquistou na fase 1 continua na fase 2
      const c = data.carry;
      this.player.hp = c.hp;
      this.player.upgrades = cloneUpgrades(c.upgrades);
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
    touch.releaseAll();
    touch.clearJust();
    audio.playTrack(this.def.track); // cada fase tem a sua faixa
    this.powerupsCollected = { bomb_up: 0, fire_up: 0, speed_up: 0, time_up: 0 };
    this.isPaused = false;
    this.gemBlocks = new Set();
    setPauseVisible(false);
    this.tweens.resumeAll();
    this.anims.resumeAll();
  }

  create(): void {
    this.bombSystem = new BombSystem(this);
    this.pickupSystem = new PickupSystem(this);
    this.enemySystem = new EnemySystem(this);
    this.sleepSystem = new SleepSystem(this);
    this.createHeroAnims();
    this.buildGrid();
    if (this.def.door) {
      this.placeDoor();
      this.assignHiddenGems();
    }
    this.enemySystem.spawnEnemies();
    this.playerSprite = this.add.sprite(
      this.player.gridX * CONFIG.tile + CONFIG.tile / 2,
      this.player.gridY * CONFIG.tile + CONFIG.tile / 2,
      'roo_down_0',
    ).setOrigin(0.5, rooOriginY(CONFIG.tile)).setDepth(10);
    this.cdGraphics = this.add.graphics().setDepth(15);
    this.enemySystem.createLashGfx();
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

  // Cartão de entrada da fase: número e lugar, nome, uma frase da história e (se houver) a dica.
  showStageBanner(): void {
    const theme = readTheme();
    const cx = (CONFIG.cols * CONFIG.tile) / 2;
    const cy = (CONFIG.rows * CONFIG.tile) / 2;
    const textW = CONFIG.cols * CONFIG.tile - 48;
    const items: Phaser.GameObjects.GameObject[] = [];
    const hasTip = !!this.def.tip;
    const bandH = hasTip ? 150 : 124;
    items.push(this.add.rectangle(cx, cy, CONFIG.cols * CONFIG.tile, bandH, 0x120d08, 0.78).setDepth(29));
    let y = cy - bandH / 2 + 22;
    items.push(this.add.text(cx, y, `FASE ${this.stage} · ${this.def.place.toUpperCase()}`, {
      fontFamily: theme.fontDisplay, fontSize: '12px', color: theme.textMuted, fontStyle: '700',
    }).setOrigin(0.5).setDepth(30));
    y += 28;
    items.push(this.add.text(cx, y, this.def.name, {
      fontFamily: theme.fontDisplay, fontSize: '26px', color: '#f0c674', fontStyle: '700',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(30));
    y += 22;
    const story = this.add.text(cx, y, this.def.story, {
      fontFamily: theme.fontBody, fontSize: '13px', fontStyle: 'italic', color: '#f1e6c9',
      align: 'center', wordWrap: { width: textW },
    }).setOrigin(0.5, 0).setDepth(30);
    items.push(story);
    if (this.def.tip) {
      items.push(this.add.text(cx, y + story.height + 8, this.def.tip, {
        fontFamily: theme.fontBody, fontSize: '12px', color: '#c9b98f',
        align: 'center', wordWrap: { width: textW },
      }).setOrigin(0.5, 0).setDepth(30));
    }
    this.tweens.add({
      targets: items, alpha: 0, delay: 3200, duration: 600,
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
    if (mode !== 'walk') this.playerSprite.anims.timeScale = 1;
    const animationKey = mode === 'sleep' ? 'roo_sleep_' + direction : (mode === 'walk' ? 'roo_walk_' : 'roo_idle_') + direction;
    if (this.anims.exists(animationKey)) this.playerSprite.anims.play(animationKey, true);
    else this.playerSprite.setTexture('roo_' + direction + '_' + (mode === 'walk' ? 0 : 1));
    this.playerSprite.setFlipX(direction === 'side' && f === 'left');
  }

  playIdle(): void { this.refreshSprite('idle'); }
  playWalk(): void { this.refreshSprite('walk'); }

  // ---------- Bombas e poções ----------

  // Próximo tipo de frasco que a jogadora possui (botão TROCAR no toque; os slots da HUD são pequenos demais para o dedo).
  cycleBomb(): void {
    const owned = BOMB_ORDER.filter(t => hasBombType(t));
    if (owned.length === 0) return;
    const at = owned.indexOf(this.bombType);
    this.setBomb(owned[(at + 1) % owned.length]);
  }

  setBomb(type: BombId): void {
    if (!hasBombType(type)) {
      this.floatingText(this.player.gridX, this.player.gridY, 'BLOQUEADA', '#bfae8a');
      return;
    }
    this.bombType = type;
    this.updateHud();
  }

  // A água apagou uma poção de fogo: ela se desfaz em vapor, sem explodir.
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
      if (this.blocksDestroyed >= threshold && this.enemySystem.countEnemies(rule.kind) < rule.max) {
        this.enemySystem.spawnEnemy(rule.kind);
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
    return this.bombSystem.bombs.some(b => b.gridX === x && b.gridY === y);
  }

  isFree(x: number, y: number): boolean {
    if (this.getTile(x, y) !== EMPTY) return false;
    if (this.hasBomb(x, y)) return false;
    if (!this.doorOpen && x === this.doorX && y === this.doorY) return false;
    if (this.enemySystem.enemies.some(e => e.alive && ENEMY_TYPES[e.kind].rooted && e.gridX === x && e.gridY === y)) return false;
    return true;
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
    // o aviso nasce sobre a porta, onde a jogadora precisa ir, e fica mais tempo na tela
    if (this.def.kind === 'garden') {
      this.floatingText(this.doorX, this.doorY, 'FREI ANSELMO ESPERA NO PORTÃO', '#f0c674', 12, 1800);
      this.spawnAnselmoAtGate();
    } else {
      this.floatingText(this.doorX, this.doorY, 'PORTA ABERTA!', '#4caf50', 16, 1400);
    }
  }

  // Frei Anselmo aparece no portão do jardim quando ele se abre; respira em dois quadros.
  spawnAnselmoAtGate(): void {
    const T = CONFIG.tile;
    const monk = this.add.sprite(this.doorX * T + T / 2, this.doorY * T + T / 2 + 15, 'anselmo_front_0')
      .setOrigin(0.5, 47 / 50).setDepth(3.5).setAlpha(0);
    this.tweens.add({ targets: monk, alpha: 1, duration: 700 });
    let f = 0;
    this.time.addEvent({
      delay: 650, loop: true,
      callback: () => { f = 1 - f; monk.setTexture(f ? 'anselmo_front_1' : 'anselmo_front_0'); },
    });
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
      // portão do jardim: frei Anselmo espera. A confissão fecha a história.
      this.floatingText(this.player.gridX, this.player.gridY, 'O PORTÃO SE ABRE', '#9be564');
      this.coins += CONFIG.gardenVictoryBonus;
      Bank.add(CONFIG.gardenVictoryBonus);
      this.time.delayedCall(900, () => { void this.playEnding(); });
      return;
    }
    markStageCompleted(this.stage);
    this.floatingText(this.player.gridX, this.player.gridY, 'FASE COMPLETA!', '#9be564');
    void this.playPassage();
  }

  // Passagem entre fases: a Roo lê ou ouve algo (se a fase tem cartões) e só então segue.
  playPassage(): void {
    const cards = PASSAGE_CARDS[this.stage];
    if (cards) void this.showPassage(cards);
    else this.advanceStage();
  }

  async showPassage(cards: StoryCard[]): Promise<void> {
    this.scene.pause();
    await showDialogue(cards, 'SEGUIR');
    this.scene.resume();
    this.advanceStage();
  }

  // Final: frei Anselmo confessa e devolve o frasco vazio. A cena fica parada durante a conversa
  // (nada acontece com a Roo) e só depois aparece a tela de fim.
  async playEnding(): Promise<void> {
    audio.playTrack(SCENE_TRACKS.ending);
    const portrait = this.textures.getBase64('anselmo_retrato') || undefined;
    this.scene.pause();
    await showDialogue(ENDING_CARDS.map(c => ({ ...c, portrait: c.speaker === ANSELMO ? portrait : undefined })), 'FIM');
    // última cena: a Roo de volta ao Caldeirão (a partida segue pausada por baixo);
    // só depois vem a tela "Jornada cumprida"
    this.game.events.once('end:done', () => {
      this.scene.resume();
      this.won = true;
      this.triggerGameOver();
    });
    this.scene.launch('End');
  }

  // Fade e recomeço da cena na fase seguinte, levando vida, power-ups, moedas e o frasco escolhido.
  advanceStage(): void {
    this.enemySystem.clearLash();
    this.cameras.main.fadeOut(900, 8, 14, 12);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.restart({
        stage: this.stage + 1,
        carry: {
          hp: Math.min(CONFIG.maxHp, this.player.hp + CONFIG.stageClearHeal),
          upgrades: this.player.upgrades,
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
    markStageCompleted(this.stage);
    this.floatingText(this.player.gridX, this.player.gridY, 'BELLADONA DERROTADA!', '#9be564');
    // espera a queda dela terminar; então ela se despede (cartões) e a Roo segue para o jardim
    this.time.delayedCall(1600, () => { void this.playBossFarewell(); });
  }

  async playBossFarewell(): Promise<void> {
    this.scene.pause();
    await showDialogue(BELLADONA_CARDS, 'SEGUIR');
    this.scene.resume();
    this.advanceStage();
  }

  // Casa onde a jogadora está de fato (posição do sprite, como o dano).
  playerTile(): { x: number; y: number } {
    const T = CONFIG.tile;
    return { x: Math.floor(this.playerSprite.x / T), y: Math.floor(this.playerSprite.y / T) };
  }

  // ---------- Explosões e dano ----------

  // Punhado de partículas do elemento: brasas (fogo), gotas (água), pedriscos (terra), brilhos (éter).
  damagePlayer(bypassInvuln = false, element?: ElementId): void {
    if (!bypassInvuln && this.player.invulnerable > 0) return;
    this.player.hp -= CONFIG.damagePerExplosion;
    this.player.invulnerable = CONFIG.invulnTime;
    this.updateHud();
    this.play('hurt');
    this.playerSprite.setTint(element ? HIT_TINT[element] : 0xff5252);
    if (element) this.enemySystem.hitFx(this.playerSprite.x, this.playerSprite.y - 8, element);
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
    const blast = this.bombSystem.explosions.find(e => e.key === key && !e.hitPlayer);
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

  // Movimento da Roo feito à mão (não por tween): o tempo que sobra ao chegar numa casa
  // (`moveCarry`) vai para o passo seguinte, então andar em linha reta tem velocidade constante,
  // sem a pausa de ~1 quadro entre casas que fazia parecer pulo de bloco em bloco.
  private moveFrom = { x: 0, y: 0 };
  private moveTo = { x: 0, y: 0 };
  private moveElapsed = 0;
  private moveLength = 220;
  private moveCarry = 0;

  movePlayerTo(nx: number, ny: number, duration: number): void {
    this.player.gridX = nx;
    this.player.gridY = ny;
    this.player.moving = true;
    this.moveFrom = { x: this.playerSprite.x, y: this.playerSprite.y };
    this.moveTo = { x: nx * CONFIG.tile + CONFIG.tile / 2, y: ny * CONFIG.tile + CONFIG.tile / 2 };
    this.moveLength = duration;
    this.moveElapsed = this.moveCarry;
    this.moveCarry = 0;
    this.playWalk();
    // um ciclo de 4 quadros a cada 2 casas (passo esquerdo + direito), sincronizado com o passo
    this.playerSprite.anims.timeScale = 4 / (2 * (duration / 1000)) / 12;
  }

  // Avança o passo atual; ao chegar, guarda o excedente de tempo e libera o próximo passo.
  private stepPlayerMove(delta: number): void {
    if (!this.player.moving) return;
    this.moveElapsed += delta;
    const t = Math.min(1, this.moveElapsed / this.moveLength);
    this.playerSprite.x = this.moveFrom.x + (this.moveTo.x - this.moveFrom.x) * t;
    this.playerSprite.y = this.moveFrom.y + (this.moveTo.y - this.moveFrom.y) * t;
    if (t < 1) return;
    // sem playIdle aqui: se a tecla segue pressionada, o próximo passo continua o mesmo ciclo
    this.moveCarry = Math.min(this.moveElapsed - this.moveLength, 34);
    this.player.moving = false;
    this.pickupSystem.checkPickups();
    this.checkWin();
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
    this.movePlayerTo(nx, ny, this.moveDuration());
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

    if (JD(this.keys.space) || touch.consumeAction('bomb')) this.bombSystem.placeBomb();
    if (touch.consumeAction('cycle')) this.cycleBomb();
    if (JD(this.keys.x) || touch.consumeAction('push')) this.bombSystem.pushAbility();
    if (JD(this.keys.d) || touch.consumeAction('detonate')) this.bombSystem.detonateRemote();
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
      bombsMax: this.player.upgrades[this.bombType].bombsMax,
      bombsActive: this.bombSystem.bombs.filter(b => b.type === this.bombType).length,
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
    this.enemySystem.clearLash();
    if (this.won) {
      // sem fanfarra: as "Vésperas" da confissão seguem tocando no fim
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

  // Aviso que sobe e some. Fica parado (hold) antes de subir para dar tempo de ler.
  floatingText(gx: number, gy: number, text: string, color: string, size = 12, hold = 650): void {
    const t = this.add.text(
      gx * CONFIG.tile + CONFIG.tile / 2,
      gy * CONFIG.tile + CONFIG.tile / 2,
      text,
      { fontFamily: 'monospace', fontSize: `${size}px`, color, fontStyle: 'bold' },
    ).setOrigin(0.5).setDepth(20);
    // sobe e some só depois da permanência
    this.tweens.add({
      targets: t, y: t.y - 24, alpha: 0,
      duration: 450, delay: hold, ease: 'Quad.easeIn',
      onComplete: () => t.destroy(),
    });
  }

  play(name: SfxName, variant?: ElementId): void {
    audio.play(name, variant);
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
    if (!this.isPaused) this.stepPlayerMove(delta);
    if (this.gameOver || this.won || this.transitioning) return;
    this.handleInput();
    // se não começou outro passo neste quadro, o tempo sobrando não vale
    if (!this.player.moving) this.moveCarry = 0;
    if (!this.player.moving && this.playerSprite.anims.currentAnim?.key.startsWith('roo_walk_')) {
      this.playerSprite.anims.timeScale = 1;
      this.playIdle();
    }
    if (this.isPaused) return;
    this.sleepSystem.update(delta);
    this.updateTimer(delta);
    this.updateCooldowns(delta);
    this.updateCooldownBar();
    this.bombSystem.update(delta);
    this.enemySystem.update(delta);
    this.boss?.update(delta);
    this.checkPlayerHit();
    if (this.gameOver) return;
    this.pickupSystem.checkPickups();
  }
}
