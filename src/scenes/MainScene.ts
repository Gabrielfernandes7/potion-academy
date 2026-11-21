// Cena de gameplay: grade, bombas, inimigos, itens, porta e entrada.
// Regras importantes:
// - player/enemy.gridX/gridY mudam quando o movimento COMEÇA; o sprite interpola depois.
// - Dano usa a posição visual do sprite (o que o jogador vê bate com o que acontece).
// - Pickups, bombas e vitória usam coordenadas de grade.
// - update() espera o cartão de entrada da fase (ENTER ou toque) e, após gameOver/won, só trata a tecla R.
import Phaser from 'phaser';
import { BLOCK, BOMB_ORDER, BombId, BRAZIER, CANVAS, CONFIG, ElementId, EMPTY, WALL } from '../config';
import { audio, SfxName } from '../audio/AudioEngine';
import { stepOvertime } from '../game/timerRules';
import { ARENA_STAGE, arenaStageDef, duelStageDef } from '../game/arena';
import { ObjectPool } from '../game/fx/objectPool';
import { duelOutcome, validDuel } from '../game/duel';
import { currentSeed, seedFromUrl, startRun } from '../game/rng';
import { PlayerController } from '../game/PlayerController';
import { canUseBomb, isBlockedBomb, setArenaLoadout } from '../game/loadout';
import { rooOriginY } from '../textures/rooGeometry';
import type { Facing, Player, PowerupCounts, StageData } from '../game/types';
import type { FormId } from '../game/forms';
import { retryData } from '../game/retry';
import { HUD_SELECT_BOMB, HUD_UPDATE, HudState } from '../game/hudState';
import { applyTouchContext } from '../ui/touchContext';
import { goalView, isComplete, objectiveOf, pickBrazierCells, waveKind, wavesDue, type Objective } from '../game/objective';
import { random } from '../game/rng';
import { touch } from '../input/touch';
import { hideGameOver, setPauseVisible, showDuelResult, showGameOver } from '../ui/overlays';
import { isHelpOpen } from '../ui/help';
import { isSettingsOpen } from '../ui/settings';
import { getKeymap } from '../input/keymap';
import { Fog } from '../game/effects/Fog';
import { BossBase } from '../game/entities/bosses/BossBase';
import { BOSS_DEFS } from '../game/entities/bosses/defs';
import { createBoss } from '../game/entities/bosses/registry';
import { RooFormSystem } from '../game/RooFormSystem';
import { StoryDirector } from '../game/StoryDirector';
import { BombSystem } from '../game/BombSystem';
import { PickupSystem } from '../game/PickupSystem';
import { EnemySystem } from '../game/entities/enemies/EnemySystem';
import { SleepSystem } from '../game/SleepSystem';
import { markStageCompleted } from '../storage';
import { ENEMY_TYPES, EnemyKind } from '../game/entities/enemies/defs';
import { LAST_STAGE, stageDef } from '../game/stages/index';
import { blockStyleOf, blockTextureOf } from '../game/stages/blockStyles';
import { blockBreak } from '../game/fx/battleFx';
import { BossId, StageDef, StageTheme } from '../game/stages/types';
import { buildTiles, cellKey, clampCenter, doorCell, isPassable, isSpawnSafe, tileAt } from '../game/grid';
import { carryForward, doorOutcome, startingState } from '../game/stageFlow';

type MainKeys = Record<'space' | 'x' | 'c' | 'v' | 't' | 'd' | 'r' | 'one' | 'two' | 'three' | 'four' | 'enter', Phaser.Input.Keyboard.Key>;

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
  // observatório: a mesma pedra, azul-noite
  observatory: {
    floor1: 'floor1', floor2: 'floor2', wall: 'wall', block: 'block', door: ['door_closed', 'door_open'],
    floorTint: 0xa8b6f0, wallTint: 0x7886c8, blockTint: 0xc8d0ee,
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
  gems = 0;
  bombType: BombId = 'normal';
  gameOver = false;
  won = false;
  player!: Player;
  readonly playerCtl = new PlayerController(this);
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
  // objetivo da fase (game/objective.ts): braseiros acesos, tempo resistido, ondas já chegadas e inimigos a caçar
  litBraziers = new Set<string>();
  brazierSprites = new Map<string, Phaser.GameObjects.Image>();
  surviveMs = 0;
  wavesSpawned = 0;
  huntTotal = 0;
  objectiveDone = false;
  private brazierFlip = 0;
  private brazierMs = 0;
  playerSprite!: Phaser.GameObjects.Sprite;
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  keys!: MainKeys;
  stage = 1; // 1 laboratório, 2 salão dos fantasmas, 3 duelo com a Belladona, 4 jardim (ver STAGES em config.ts)
  boss: BossBase | null = null;
  fog: Fog | null = null; // névoa da fase (se a fase tiver `fog`)
  transitioning = false; // passando de fase: ignora entrada
  introOpen = false; // o cartão de entrada da fase está na tela
  private helpPaused = false;
  // As transformações da Roo (T: a forma da poção na mão; X: a habilidade da forma). Criado em create().
  forms!: RooFormSystem;
  // A direção da história (cartão de fase, passagens, final, despedida dos chefes). Criado em create().
  story!: StoryDirector;

  constructor() {
    super('Main');
  }

  // Treino na Arena: o chefe escolhido (ou null na campanha). A luta é uma fase montada na hora (game/arena.ts).
  arena: BossId | null = null;
  // Duelo de chefes na Arena (game/duel.ts): o segundo chefe (o primeiro é `arena`). A Roo só assiste.
  duel: BossId | null = null;
  boss2: BossBase | null = null;
  arenaForm: FormId | null = null; // Arena: a transformação fixa em que a Roo luta (sem fim)
  private duelDone = false;
  private arenaDef: StageDef | null = null;

  get def(): StageDef {
    if (this.arena) return (this.arenaDef ??= this.duel ? duelStageDef(this.arena, this.duel) : arenaStageDef(this.arena));
    return stageDef(this.stage);
  }

  // Dados explícitos para recomeçar (o Phaser reaproveita os do último reinício): a Arena recomeça a luta; a campanha, na fase em que a Roo perdeu.
  restartData(): StageData {
    return retryData(this.stage, this.arena, ARENA_STAGE, this.duel, this.arenaForm);
  }

  get isBossStage(): boolean {
    return !!this.def.boss;
  }

  init(data?: StageData): void {
    // a semente vale para o mapa e os sorteios da fase: `?seed=123` na URL repete a mesma fase (bugs e equilíbrio)
    startRun(data?.seed ?? seedFromUrl(window.location.search));
    if (import.meta.env.DEV) console.info(`[semente] ${currentSeed()}`);
    this.arena = data?.arena ?? null;
    this.duel = this.arena && validDuel(this.arena, data?.duel) ? data?.duel ?? null : null;
    this.boss2 = null;
    this.arenaForm = this.arena && !this.duel ? data?.form ?? null : null;
    this.duelDone = false;
    this.arenaDef = null;
    setArenaLoadout(!!this.arena); // na Arena, todas as poções estão liberadas
    this.stage = this.arena ? ARENA_STAGE : (data?.stage ?? 1);
    this.boss = null;
    this.fog = null;
    this.transitioning = false;
    this.helpPaused = false;
    this.grid = [];
    this.blockSprites = new Map();
    // o que ela conquistou na fase anterior continua aqui (game/stageFlow.ts)
    const start = startingState(data?.carry, CONFIG.maxHp);
    this.gems = 0;
    this.bombType = start.bombType;
    this.gameOver = false;
    this.playerCtl.reset();
    this.won = false;
    this.player = {
      gridX: 1, gridY: 1,
      dir: { x: 0, y: 1 }, facing: 'down', moving: false,
      hp: start.hp, invulnerable: 0,
      upgrades: start.upgrades,
      speedUp: start.speedUp,
    };
    // sem porta na fase do chefe (-1 nunca coincide com uma casa)
    const door = doorCell(CONFIG.cols, CONFIG.rows, this.def.door);
    this.doorX = door.x;
    this.doorY = door.y;
    this.doorOpen = false;
    // o chão e a muralha vêm do tema; o bloco é o da fase (cada fase tem o seu: game/stages/blockStyles.ts)
    this.look = { ...LOOKS[this.def.theme], block: blockTextureOf(this.def), blockTint: undefined };
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
    this.litBraziers = new Set();
    this.poseQueue = [];
    this.brazierSprites = new Map();
    this.surviveMs = 0;
    this.wavesSpawned = 0;
    this.huntTotal = 0;
    this.objectiveDone = false;
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
      if (!this.isBossStage && this.objective.type === 'gems') this.assignHiddenGems(); // chefe com porta: ela abre quando ele cai
    }
    this.enemySystem.spawnEnemies();
    const o = this.objective;
    if (o.type === 'hunt') this.huntTotal = this.enemySystem.countEnemies(o.kind);
    this.playerSprite = this.add.sprite(
      this.player.gridX * CONFIG.tile + CONFIG.tile / 2,
      this.player.gridY * CONFIG.tile + CONFIG.tile / 2,
      'roo_down_0',
    ).setOrigin(0.5, rooOriginY(CONFIG.tile)).setDepth(10);
    this.enemySystem.createLashGfx();
    this.forms = new RooFormSystem(this);
    this.story = new StoryDirector(this);
    if (this.arenaForm) this.forms.pinForm(this.arenaForm); // Arena: transformada desde o começo
    if (this.def.fog) this.fog = new Fog(this, CONFIG.cols * CONFIG.tile, CONFIG.rows * CONFIG.tile, this.def.fog.radius, CONFIG.tile);
    if (this.def.boss) this.boss = createBoss(this.def.boss, this);
    if (this.duel && this.boss) this.setupDuel(this.boss, createBoss(this.duel, this));
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
    this.story.showBanner();
    // a fase espera a jogadora começar (ENTER ou toque no cartão de entrada)
    this.introOpen = true;
    const onTap = (): void => this.endIntro();
    this.input.on('pointerdown', onTap);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.input.off('pointerdown', onTap));
    if (!this.scene.isActive('Hud')) this.scene.launch('Hud');
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

  // Poses da Roo (textures/poses.ts, derivadas dos quadros que já existem): uma fila curta de quadros que congela a
  // animação enquanto dura (levou dano, pôs a poção, pegou um item, chegou à porta, desabou). Transformada, o sprite é o da
  // forma (RooFormSystem) e as poses não valem.
  private poseQueue: Array<{ key: string; ms: number }> = [];
  private poseLeft = 0;
  private poseFlip = false;

  playPose(kind: 'hurt' | 'cast' | 'pickup' | 'win' | 'fall'): void {
    if (this.forms?.form.active || !this.playerSprite?.active) return;
    const d = this.spriteDirection();
    const flip = d === 'side' && this.player.facing === 'left';
    const seq: Record<typeof kind, Array<[string, number]>> = {
      hurt: [[`roo_hurt_${d}`, 260]],
      cast: [[`roo_cast_${d}_0`, 70], [`roo_cast_${d}_1`, 110]],
      pickup: [[`roo_pickup_${d}_0`, 90], [`roo_pickup_${d}_1`, 90]],
      win: [['roo_win_0', 130], ['roo_win_1', 130], ['roo_win_2', 130], ['roo_win_0', 130], ['roo_win_1', 130], ['roo_win_2', 600]],
      fall: [['roo_fall_0', 140], ['roo_fall_1', 160], ['roo_fall_2', 60000]],
    };
    this.poseQueue = seq[kind].map(([key, ms]) => ({ key, ms }));
    this.poseFlip = kind === 'win' || kind === 'fall' ? false : flip;
    this.showPoseFrame();
  }

  private showPoseFrame(): void {
    const f = this.poseQueue[0];
    this.poseLeft = f.ms;
    if (!this.textures.exists(f.key)) { this.poseQueue = []; return; }
    this.playerSprite.anims.stop();
    this.playerSprite.setTexture(f.key).setFlipX(this.poseFlip);
  }

  private updatePose(delta: number): void {
    if (!this.poseQueue.length) return;
    this.poseLeft -= delta;
    if (this.poseLeft > 0) return;
    this.poseQueue.shift();
    if (this.poseQueue.length) this.showPoseFrame();
    else this.refreshSprite(this.player.moving ? 'walk' : 'idle');
  }

  refreshSprite(mode: 'walk' | 'idle' | 'sleep'): void {
    if (this.poseQueue.length && mode !== 'sleep') return; // uma pose em curso não é cortada pelo passo
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
    const owned = BOMB_ORDER.filter(t => canUseBomb(t));
    if (owned.length === 0) return;
    const at = owned.indexOf(this.bombType);
    this.setBomb(owned[(at + 1) % owned.length]);
  }

  setBomb(type: BombId): void {
    if (!canUseBomb(type)) {
      // a chama recusa a água; as outras poções só estão bloqueadas por não terem sido compradas
      this.floatingText(this.player.gridX, this.player.gridY, isBlockedBomb(type) ? 'SÓ A POÇÃO DA FORMA' : 'BLOQUEADA', '#bfae8a', 12, 900);
      return;
    }
    this.bombType = type;
    this.updateHud();
  }

  // A água apagou uma poção de fogo: ela se desfaz em vapor, sem explodir.
  // ---------- Grade, blocos e porta ----------

  // Sorteio e regras da grade em game/grid.ts; aqui só cria os sprites.
  buildGrid(): void {
    // no duelo, os dois cantos de frente um para o outro ficam livres: a Roo (que só assiste) e o canto de baixo
    const bossSpawn = this.duel ? 'bottom' : this.def.boss ? BOSS_DEFS[this.def.boss].spawn : undefined;
    const { tiles } = buildTiles(
      CONFIG.cols, CONFIG.rows, this.def.blockChance,
      (x, y) => isSpawnSafe(x, y, CONFIG.cols, CONFIG.rows, bossSpawn),
    );
    this.grid = tiles;
    for (let y = 0; y < CONFIG.rows; y++) {
      for (let x = 0; x < CONFIG.cols; x++) {
        const px = x * CONFIG.tile;
        const py = y * CONFIG.tile;
        const floor = this.add.image(px, py, (x + y) % 2 === 0 ? this.look.floor1 : this.look.floor2).setOrigin(0).setDepth(0);
        if (this.look.floorTint !== undefined) floor.setTint(this.look.floorTint);
        if (tiles[y][x] === WALL) {
          const wall = this.add.image(px, py, this.look.wall).setOrigin(0).setDepth(1);
          if (this.look.wallTint !== undefined) wall.setTint(this.look.wallTint);
        } else if (tiles[y][x] === BLOCK) {
          const sprite = this.add.image(px, py, this.look.block).setOrigin(0).setDepth(2);
          if (this.look.blockTint !== undefined) sprite.setTint(this.look.blockTint);
          this.blockSprites.set(cellKey(x, y), sprite);
        }
      }
    }
    this.placeBraziers();
  }

  get objective(): Objective {
    return objectiveOf(this.def);
  }

  // Fase de braseiros: sorteia as casas (com a semente da partida), tira o caixote que houver e põe o braseiro apagado.
  private placeBraziers(): void {
    const o = this.objective;
    if (o.type !== 'braziers') return;
    const door = doorCell(CONFIG.cols, CONFIG.rows, this.def.door);
    for (const c of pickBrazierCells(this.grid, o.count, door, random)) {
      const key = cellKey(c.x, c.y);
      this.blockSprites.get(key)?.destroy();
      this.blockSprites.delete(key);
      this.grid[c.y][c.x] = BRAZIER;
      this.brazierSprites.set(key, this.add.image(c.x * CONFIG.tile, c.y * CONFIG.tile, 'brazier_off').setOrigin(0).setDepth(2));
    }
  }

  /** Uma explosão de fogo alcançou a casa: se há um braseiro apagado nela, acende. */
  lightBrazier(x: number, y: number): void {
    const key = cellKey(x, y);
    const sprite = this.brazierSprites.get(key);
    if (!sprite || this.litBraziers.has(key)) return;
    this.litBraziers.add(key);
    sprite.setTexture('brazier_on');
    this.floatingText(x, y - 1, 'ACESO!', '#ffd27a', 12, 900);
    this.play('flame');
    this.checkObjective();
    this.updateHud();
  }

  // O objetivo foi cumprido? Então a porta abre (uma vez só). As gemas abrem a porta no PickupSystem.
  checkObjective(): void {
    const o = this.objective;
    if (this.objectiveDone || !this.def.door || this.isBossStage || o.type === 'gems') return;
    const alive = o.type === 'hunt' ? this.enemySystem.countEnemies(o.kind) : 0;
    const progress = { gems: this.gems, gemsNeeded: CONFIG.gemsForDoor, lit: this.litBraziers.size, surviveMs: this.surviveMs, huntAlive: alive, huntTotal: this.huntTotal };
    if (!isComplete(o, progress)) return;
    this.objectiveDone = true;
    if (!this.doorOpen) this.openDoor();
  }

  /** Um inimigo caiu: na caçada, pode ter sido o último. */
  onEnemyKilled(): void {
    this.checkObjective();
    this.updateHud();
  }

  // Sobreviver: conta o tempo e chama as ondas. Braseiros acesos tremem (dois quadros, a cada 250 ms).
  private updateObjective(delta: number): void {
    const o = this.objective;
    if (o.type === 'survive' && !this.objectiveDone) {
      const due = wavesDue(o, this.surviveMs + delta, this.wavesSpawned);
      this.surviveMs += delta;
      for (let i = 0; i < due; i++) {
        const kind = waveKind(o, this.wavesSpawned + i);
        if (kind) this.enemySystem.spawnEnemy(kind);
      }
      this.wavesSpawned += due;
      this.checkObjective();
      if (Math.floor(this.surviveMs / 1000) !== Math.floor((this.surviveMs - delta) / 1000)) this.updateHud();
    }
    if (this.litBraziers.size) {
      this.brazierMs += delta;
      if (this.brazierMs >= 250) {
        this.brazierMs = 0;
        this.brazierFlip ^= 1;
        for (const k of this.litBraziers) this.brazierSprites.get(k)?.setTexture(this.brazierFlip ? 'brazier_on_1' : 'brazier_on');
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

  removeBlock(x: number, y: number): void {
    const key = `${x},${y}`;
    const sprite = this.blockSprites.get(key);
    if (sprite) {
      this.tweens.killTweensOf(sprite);
      sprite.destroy();
      this.blockSprites.delete(key);
      blockBreak(this, x * CONFIG.tile + CONFIG.tile / 2, y * CONFIG.tile + CONFIG.tile / 2, blockStyleOf(this.def));
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
    return tileAt(this.grid, CONFIG.cols, CONFIG.rows, x, y);
  }

  hasBomb(x: number, y: number): boolean {
    return this.bombSystem.bombs.some(b => b.gridX === x && b.gridY === y);
  }

  isFree(x: number, y: number): boolean {
    if (this.forms?.isSaltWall(x, y)) return false; // muro de sal da Roo Terra
    return isPassable({
      tile: this.getTile(x, y),
      bomb: this.hasBomb(x, y),
      doorClosed: !this.doorOpen && x === this.doorX && y === this.doorY,
      rootedEnemy: this.enemySystem.enemies.some(e => e.alive && ENEMY_TYPES[e.kind].rooted && e.gridX === x && e.gridY === y),
    });
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
    let blessing = true; // enquanto abençoa, a respiração espera
    this.time.addEvent({
      delay: 650, loop: true,
      callback: () => { f = 1 - f; if (!blessing) monk.setTexture(f ? 'anselmo_front_1' : 'anselmo_front_0'); },
    });
    // ao ver a Roo, ele ergue a mão e abençoa: o braço sobe em três quadros, fica um instante e desce
    const gesture = ['anselmo_bless_0', 'anselmo_bless_1', 'anselmo_bless_2', 'anselmo_bless_2', 'anselmo_bless_2', 'anselmo_bless_1', 'anselmo_bless_0'];
    gesture.forEach((key, i) => this.time.delayedCall(900 + i * 260, () => { if (monk.active) monk.setTexture(key); }));
    this.time.delayedCall(900 + gesture.length * 260, () => { blessing = false; if (monk.active) monk.setTexture('anselmo_front_0'); });
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
    this.playPose('win');
    this.play('door');
    if (doorOutcome(this.stage, LAST_STAGE) === 'finish') {
      this.story.gateReached(); // portão do jardim: frei Anselmo espera e a confissão fecha a história
      return;
    }
    markStageCompleted(this.stage);
    this.floatingText(this.player.gridX, this.player.gridY, 'FASE COMPLETA!', '#9be564');
    this.story.passage();
  }

  // Fade e recomeço da cena na fase seguinte, levando vida, power-ups e o frasco escolhido.
  advanceStage(): void {
    this.enemySystem.clearLash();
    this.cameras.main.fadeOut(900, 8, 14, 12);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.restart({
        stage: this.stage + 1,
        carry: carryForward(
          { hp: this.player.hp, upgrades: this.player.upgrades, speedUp: this.player.speedUp, bombType: this.bombType },
          CONFIG.stageClearHeal,
          CONFIG.maxHp,
        ),
      } satisfies StageData);
    });
  }

  // Um chefe foi derrotado (chamado pelo controlador dele): a direção da história decide o resto.
  onBossDefeated(): void {
    this.story.bossDefeated();
  }

  // Casa onde a jogadora está de fato (posição do sprite, como o dano).
  playerTile(): { x: number; y: number } { return this.playerCtl.tile(); }

  // ---------- Explosões e dano (game/PlayerController.ts) ----------

  damagePlayer(bypassInvuln = false, element?: ElementId): void { this.playerCtl.damage(bypassInvuln, element); }

  checkPlayerHit(): void { this.playerCtl.checkHit(); }

  // ---------- Movimento e entrada ----------

  moveDuration(): number { return this.playerCtl.moveDuration(); }

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

  movePlayerTo(nx: number, ny: number, duration: number): void { this.playerCtl.moveToTile(nx, ny, duration); }
  tryMove(dx: number, dy: number): void { this.playerCtl.tryMove(dx, dy); }

  // Começa a fase: fecha o cartão de entrada (ver StoryDirector.showBanner).
  endIntro(): void {
    if (!this.introOpen) return;
    this.introOpen = false;
    this.story.dismissBanner();
    this.forms.onStageBegin(); // lições que vêm ao começar a fase (Roo Terra, antes da Quimera)
  }

  setupInput(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) throw new Error('Teclado não disponível');
    this.cursors = keyboard.createCursorKeys();
    const K = Phaser.Input.Keyboard.KeyCodes;
    const km = getKeymap(); // as teclas das ações podem ter sido trocadas em AJUSTES
    this.keys = keyboard.addKeys({
      space: km.bomb, x: km.ability, c: km.ability2, v: km.defense, t: km.transform, d: km.detonate, r: K.R,
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

    // mirando a Raiz da Roo Terra: as setas movem o cursor, C confirma, X ou V cancelam
    if (this.forms.isAiming()) {
      const confirm = JD(this.keys.c) || touch.consumeAction('ability2');
      const cancel = JD(this.keys.x) || JD(this.keys.v) || touch.consumeAction('ability') || touch.consumeAction('defense');
      this.forms.aimInput({ x: justLeft ? -1 : justRight ? 1 : 0, y: justUp ? -1 : justDown ? 1 : 0 }, confirm, cancel);
      touch.clearJust();
      return;
    }
    this.playerCtl.steer(
      { up: justUp, down: justDown, left: justLeft, right: justRight },
      { up, down, left, right },
    );

    if (JD(this.keys.space) || touch.consumeAction('bomb')) this.bombSystem.placeBomb();
    if (touch.consumeAction('cycle')) this.cycleBomb();
    if (JD(this.keys.t) || touch.consumeAction('transform')) this.forms.transform();
    if (JD(this.keys.x) || touch.consumeAction('ability')) this.forms.useAbility();
    if (JD(this.keys.c) || touch.consumeAction('ability2')) this.forms.useAbility2();
    if (JD(this.keys.v) || touch.consumeAction('defense')) this.forms.useDefense();
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
      gems: this.gems,
      gemsForDoor: CONFIG.gemsForDoor,
      goal: this.goalView(),
      blocks: this.blockSprites.size,
      bombsMax: this.player.upgrades[this.bombType].bombsMax,
      bombsActive: this.bombSystem.bombs.filter(b => b.type === this.bombType).length,
      timeLeftMs: this.timeLeft,
      selected: this.bombType,
      stage: this.stage,
      boss: this.boss ? this.boss.hudView() : null,
      boss2: this.boss2 ? this.boss2.hudView() : null,
      form: this.forms.hudView(),
    };
  }

  private goalView(): ReturnType<typeof goalView> {
    const o = this.objective;
    return goalView(o, {
      gems: this.gems, gemsNeeded: CONFIG.gemsForDoor, lit: this.litBraziers.size, surviveMs: this.surviveMs,
      huntAlive: o.type === 'hunt' ? this.enemySystem.countEnemies(o.kind) : 0, huntTotal: this.huntTotal,
    });
  }

  updateHud(): void {
    const state = this.buildHudState();
    applyTouchContext(state.form.active);
    this.game.events.emit(HUD_UPDATE, state);
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
    const step = stepOvertime(this.overtimeDamageTimer, delta, CONFIG.overtimeDamageInterval, this.timeLeft <= 0 && !this.gameOver);
    this.overtimeDamageTimer = step.timer;
    if (step.hit) this.damagePlayer(true);
    this.updateTimerHud();
  }

  updateCooldowns(delta: number): void {
    this.player.invulnerable = Math.max(0, this.player.invulnerable - delta);
  }

  triggerGameOver(): void {
    if (this.gameOver) return;
    this.gameOver = true;
    this.isPaused = false;
    setPauseVisible(false);
    if (this.won) this.playerSprite.setVisible(false);
    else {
      // derrotada, a Roo desaba antes de sumir
      this.playPose('fall');
      this.time.delayedCall(900, () => { if (this.playerSprite?.active) this.playerSprite.setVisible(false); });
    }
    this.enemySystem.clearLash();
    if (this.won) {
      // sem fanfarra: as "Vésperas" da confissão seguem tocando no fim
      if (!this.arena) markStageCompleted(this.stage);
    } else {
      audio.playGameOverMusic();
    }
    showGameOver({
      won: this.won,
      gems: this.gems,
      hp: this.player.hp,
      maxHp: CONFIG.maxHp,
      blocksDestroyed: this.blocksDestroyed,
      timeLeft: Math.max(0, this.timeLeft),
      stage: this.stage,
      arenaBoss: this.arena ? (this.boss?.name ?? this.def.name) : undefined,
      ...(this.won ? {} : { cause: this.playerCtl.tip().by, tip: this.playerCtl.tip().tip }),
    });
  }

  // Aviso que sobe e some. Fica parado (hold) antes de subir para dar tempo de ler.
  // Os textos são reaproveitados (ver fx/objectPool.ts): criar um texto cria uma textura de canvas, e os avisos são
  // dezenas por minuto.
  private readonly textPool = new ObjectPool(() => this.add.text(0, 0, '', { fontFamily: 'monospace' }).setOrigin(0.5).setDepth(20));

  floatingText(gx: number, gy: number, text: string, color: string, size = 12, hold = 650): void {
    const t = this.textPool.acquire();
    // contorno escuro: o aviso lê sobre qualquer chão (o verde do jardim apagava o +1 e o -2)
    t.setStyle({ fontFamily: 'monospace', fontSize: `${size}px`, color, fontStyle: 'bold', stroke: '#14100c', strokeThickness: Math.max(3, Math.round(size / 4)) });
    t.setText(text).setPosition(gx * CONFIG.tile + CONFIG.tile / 2, gy * CONFIG.tile + CONFIG.tile / 2).setAlpha(1);
    // um aviso largo perto da borda não sai da grade (o 'APRENDEU: ROO TERRA' da primeira coluna saía cortado)
    t.setX(clampCenter(t.x, t.width, CONFIG.cols * CONFIG.tile));
    // sobe e some só depois da permanência
    this.tweens.add({
      targets: t, y: t.y - 24, alpha: 0,
      duration: 450, delay: hold, ease: 'Quad.easeIn',
      onComplete: () => this.textPool.release(t),
    });
  }

  play(name: SfxName, variant?: ElementId): void {
    audio.play(name, variant);
  }

  // ---------- Roo Fire, Aqua, Terra e Ar (as transformações: ver game/RooFormSystem.ts) ----------

  // Bônus de dano da forma para as explosões da Roo (poção e Labareda); chamado por inimigos e chefes.
  boostBlast(base: number, element: ElementId): number {
    return this.forms.boost(base, element);
  }

  // Uma explosão da Roo: o fogo acende brasas (forma de fogo) e a água as apaga.
  onRooBlast(tiles: Array<{ x: number; y: number }>, element: ElementId): void {
    this.forms.onBlast(tiles, element);
  }

  // ---------- Duelo de chefes (Arena) ----------

  // Os dois chefes nos cantos opostos, cada um mirando no outro; a Roo some da tela.
  private setupDuel(a: BossBase, b: BossBase): void {
    a.foe = b;
    b.foe = a;
    a.placeAt(1, 1);
    b.placeAt(CONFIG.cols - 2, CONFIG.rows - 2);
    this.boss2 = b;
    this.playerSprite.setVisible(false);
  }

  private updateDuel(delta: number): void {
    const JD = Phaser.Input.Keyboard.JustDown;
    if (this.duelDone) return;
    if (JD(this.keys.enter) || touch.consumeAction('pause')) this.togglePause();
    if (this.isPaused) return;
    this.timeLeft -= delta;
    this.updateTimerHud();
    this.bombSystem.update(delta);
    this.enemySystem.update(delta);
    this.boss?.update(delta);
    this.boss2?.update(delta);
    const a = this.boss;
    const b = this.boss2;
    if (!a || !b) return;
    // um nocaute espera a queda (1,5 s) e chama onDuelEnd; o tempo esgotado decide na hora
    if (this.timeLeft <= 0) this.onDuelEnd(true);
  }

  /** O duelo terminou (um chefe caiu ou o tempo acabou): mostra quem venceu. */
  onDuelEnd(timeUp = false): void {
    const a = this.boss;
    const b = this.boss2;
    if (this.duelDone || !a || !b) return;
    const outcome = duelOutcome({ hp: a.hp, defeated: a.defeated }, { hp: b.hp, defeated: b.defeated }, timeUp || this.timeLeft <= 0);
    if (!outcome) return;
    this.duelDone = true;
    this.gameOver = true;
    this.isPaused = false;
    setPauseVisible(false);
    audio.playWinMusic();
    showDuelResult({
      winner: outcome.winner === null ? null : [a, b][outcome.winner].name,
      reason: outcome.reason,
      a: { name: a.name, hp: Math.max(0, a.hp), maxHp: a.maxHp },
      b: { name: b.name, hp: Math.max(0, b.hp), maxHp: b.maxHp },
      timeLeft: Math.max(0, this.timeLeft),
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
    if (isHelpOpen() || isSettingsOpen()) {
      this.holdForHelp();
      return;
    }
    this.releaseHelpHold();
    if (Phaser.Input.Keyboard.JustDown(this.keys.r)) {
      hideGameOver();
      setPauseVisible(false);
      // dados explícitos: sem eles o Phaser reaproveita os do último reinício (e voltaria à fase 2)
      this.scene.restart(this.restartData());
      return;
    }
    if (this.introOpen) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.enter)) this.endIntro();
      return; // o mundo espera: tempo, inimigos e a Roo
    }
    if (this.duel) {
      this.updateDuel(delta);
      return;
    }
    if (!this.isPaused) { this.playerCtl.advance(delta); this.updatePose(delta); }
    if (this.gameOver || this.won || this.transitioning) return;
    this.handleInput();
    this.playerCtl.settle();
    if (this.isPaused) return;
    this.sleepSystem.update(delta);
    this.updateTimer(delta);
    this.updateCooldowns(delta);
    this.forms.update(delta);
    this.bombSystem.update(delta);
    this.enemySystem.update(delta);
    this.updateObjective(delta);
    this.boss?.update(delta);
    this.fog?.update(this.playerSprite.x, this.playerSprite.y);
    this.checkPlayerHit();
    if (this.gameOver) return;
    this.pickupSystem.checkPickups();
  }
}
