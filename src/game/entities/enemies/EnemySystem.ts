// Inimigos: sapo, fantasma e flor do mal. Nascem no começo da fase (e conforme os caixotes quebram),
// andam em passos animados, morrem nas explosões (menos quando imunes) e machucam a Roo.
// As regras puras (contagem, casa de nascimento, direções) estão em game/entities/enemies/enemyRules.ts.
// Dano usa a posição visual do sprite; gridX/gridY mudam quando o passo COMEÇA.
import Phaser from 'phaser';
import { CONFIG, ElementId, EMPTY, WALL, DIRS } from '../../../config';
import { damageTo } from '../damage';
import {
  CLOCK_PAUSE_MS, CLOCK_STEPS_BETWEEN_PAUSES, MOLE_BURROW_MS, MOLE_WALK_MS, OWL_AIM_MS, OWL_CYCLE_MS, RAT_ESCAPE_MS, RAT_FLEE_DISTANCE,
  SALAMANDER_HEAL, SLIME_MAX_TOTAL,
  canSpawnEnemyAt, countKind, enemyMoveOptions, moleSpot, nearestOf, patrolDir, splitHp, stealable, stepAway, stepToward,
} from './enemyRules';
import type { Enemy } from '../../types';
import { hitFx } from '../hitEffects';
import type { MainScene } from '../../../scenes/MainScene';
import { ENEMY_TYPES, EnemyKind } from './defs';
import { PROFILES } from '../profiles';
import { fxPool } from '../../fx/particlePool';
import { EMBER_TICK_MS, PUDDLE_SLOW, emberDamage } from '../../forms';
import { random } from '../../rng';

// Movimento de cada inimigo: pulo vertical e horizontal do passo, e o balanço parado (altura e velocidade).
const MOTION: Record<EnemyKind, { hopV: number; hopH: number; bob: number; bobMs: number }> = {
  frog: { hopV: 7, hopH: 3, bob: 1.2, bobMs: 260 },
  ghost: { hopV: 0, hopH: 0, bob: 2.6, bobMs: 420 },
  flower: { hopV: 0, hopH: 0, bob: 0, bobMs: 500 },
  lantern: { hopV: 0, hopH: 0, bob: 2, bobMs: 220 }, // a chama oscila
  clock: { hopV: 2, hopH: 1.5, bob: 0.6, bobMs: 300 }, // passo pesado
  mole: { hopV: 3, hopH: 2, bob: 0.8, bobMs: 320 },
  owl: { hopV: 0, hopH: 0, bob: 3, bobMs: 360 }, // voa
  slime: { hopV: 4, hopH: 2, bob: 1.6, bobMs: 300 }, // escorre
  sentinel: { hopV: 1.5, hopH: 1, bob: 0.4, bobMs: 420 }, // marcha
  rat: { hopV: 3, hopH: 2, bob: 1, bobMs: 140 }, // corridinha
  salamander: { hopV: 1, hopH: 1, bob: 0.8, bobMs: 520 },
};

// O segundo quadro de vida de cada criatura nova (o que muda: a chama, os ponteiros, o focinho, a pálpebra).
const ALT_FRAME: Partial<Record<EnemyKind, string>> = {
  lantern: 'enemy_lantern_1', clock: 'enemy_clock_1', mole: 'enemy_mole_1', owl: 'enemy_owl_1',
  slime: 'enemy_slime_1', sentinel: 'enemy_sentinel_1', rat: 'enemy_rat_1', salamander: 'enemy_salamander_1',
};

// O que a Roo "faz" a cada criatura quando acerta o elemento certo: um aviso que ensina a regra.
const KILL_TEXT: Partial<Record<EnemyKind, Partial<Record<ElementId, string>>>> = {
  lantern: { water: 'APAGADA' },
  clock: { water: 'ENFERRUJOU' },
  mole: { air: 'DESENTOCADA' },
  owl: { earth: 'DERRUBADA' },
  slime: { earth: 'PRESA' },
  sentinel: { fire: 'DERRETEU' },
  rat: { fire: 'ESPANTADO' },
  salamander: { water: 'SE APAGOU' },
};

export class EnemySystem {
  enemies: Enemy[] = [];
  private lashGfx!: Phaser.GameObjects.Graphics; // avisos dos chicotes das flores do mal
  private lashDirty = false; // o gráfico dos avisos recebeu desenho neste quadro (ver lg)
  private tickMs = 0; // relógio dos quadros de vida (balanço da chama, piscada da coruja...)

  constructor(private readonly scene: MainScene) {}

  // Camada dos avisos de chicote (criada pela cena em create(), na mesma ordem de antes).
  createLashGfx(): void {
    this.lashGfx = this.scene.add.graphics().setDepth(4);
  }

  // O gráfico dos avisos, marcando que tem desenho (para limpar só quando precisar).
  private lg(): Phaser.GameObjects.Graphics {
    this.lashDirty = true;
    return this.lashGfx;
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
      this.createEnemy(kind, x, y);
      return;
    }
  }

  // Cria o inimigo na casa (x, y); `hp` é a vida de nascimento (a gosma que se divide nasce com a metade).
  createEnemy(kind: EnemyKind, x: number, y: number, hp = PROFILES[kind].maxHp): Enemy {
    const s = this.scene;
    const def = ENEMY_TYPES[kind];
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
    const enemy: Enemy = {
      kind, gridX: x, gridY: y, sprite, moveTimer: def.moveInterval, alive: true,
      moveT: def.stepMs, fromX: sprite.x, fromY: sprite.y, hopY: false, phase: random() * 1000,
      lashMs: CONFIG.flowerLashCycleMs * (0.5 + random() * 0.5), fxCooldown: 0, trapMs: 0,
      dir: Phaser.Utils.Array.GetRandom([{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }]), steps: 0,
      actMs: def.behavior === 'dive' ? OWL_CYCLE_MS : MOLE_WALK_MS * (0.5 + random() * 0.5), state: 'walk', target: null,
      loot: null, used: false,
      hp, maxHp: PROFILES[kind].maxHp, bar: s.add.graphics().setDepth(12).setVisible(false),
    };
    this.enemies.push(enemy);
    return enemy;
  }

  killEnemy(enemy: Enemy, element: ElementId = 'fire'): void {
    enemy.alive = false;
    if (enemy.loot) {
      // o ratinho derrubou o que levava: o item volta ao chão, onde ele caiu
      const l = enemy.loot;
      this.scene.pickupSystem.spawnPickupSprite(enemy.gridX, enemy.gridY, l.type, l.prize, l.potion);
      this.scene.floatingText(enemy.gridX, enemy.gridY - 1, 'DEVOLVEU!', '#9be564', 11, 900);
      enemy.loot = null;
    }
    const label = KILL_TEXT[enemy.kind]?.[element];
    if (label) this.scene.floatingText(enemy.gridX, enemy.gridY - 1, label, '#bfe6ff', 11, 800);
    this.scene.tweens.killTweensOf(enemy.sprite);
    const px = enemy.sprite.x;
    const py = enemy.sprite.y;
    enemy.sprite.destroy();
    enemy.bar.destroy();
    this.enemies = this.enemies.filter(e => e !== enemy);
    hitFx(this.scene, px, py, element);
    this.scene.cameras.main.shake(60, 0.003);
  }

  // Uma explosão alcançou o inimigo: tira vida conforme a tabela de dano (game/entities/damage.ts). Fraqueza
  // tira mais, resistência menos, imunidade nada (flor do mal e a água, fantasma e a terra).
  hitEnemy(enemy: Enemy, element: ElementId, fromRoo = false): void {
    if (enemy.fxCooldown > 0 || enemy.state === 'burrowed') return; // a explosão dura 380 ms; debaixo da terra, nada o alcança
    enemy.fxCooldown = 700;
    const base = damageTo(PROFILES[enemy.kind], element);
    const damage = fromRoo ? this.scene.boostBlast(base, element) : base; // Roo Fire: poção de fogo mais forte
    if (damage === 0) {
      hitFx(this.scene, enemy.sprite.x, enemy.sprite.y - 6, element);
      this.scene.floatingText(enemy.gridX, enemy.gridY, 'IMUNE', '#c5e1a5');
      this.scene.tweens.add({ targets: enemy.sprite, alpha: 0.55, duration: 90, yoyo: true, repeat: 1 });
      return;
    }
    if (fromRoo) this.scene.forms.noteHit(element); // conta para a lição da forma desse elemento (game/learning.ts)
    enemy.hp -= damage;
    if (enemy.hp <= 0) {
      this.killEnemy(enemy, element);
      return;
    }
    if (enemy.kind === 'slime' && element === 'fire') this.splitSlime(enemy); // o fogo divide a gosma em duas
    hitFx(this.scene, enemy.sprite.x, enemy.sprite.y - 6, element);
    this.scene.floatingText(enemy.gridX, enemy.gridY, `-${damage}`, '#ff80ab');
    this.scene.tweens.add({ targets: enemy.sprite, alpha: 0.45, duration: 90, yoyo: true, repeat: 1 });
  }

  // A bolha de sabão da Roo Água prende o inimigo: ele fica parado e inofensivo até a bolha estourar.
  trapEnemy(enemy: Enemy, ms: number): void {
    if (!enemy.alive || ms <= 0) return;
    enemy.trapMs = ms;
    this.scene.floatingText(enemy.gridX, enemy.gridY, 'PRESO!', '#7fd6ff');
    this.scene.play('bubble');
  }

  // Queimadura das brasas da Roo Fire: dano de fogo da tabela, sem o bônus, de tempos em tempos.
  burnEnemy(enemy: Enemy): void {
    if (enemy.fxCooldown > 0 || !enemy.alive) return;
    enemy.fxCooldown = EMBER_TICK_MS;
    const damage = emberDamage(PROFILES[enemy.kind]);
    if (damage === 0) return;
    enemy.hp -= damage;
    if (enemy.hp <= 0) {
      this.killEnemy(enemy, 'fire');
      return;
    }
    hitFx(this.scene, enemy.sprite.x, enemy.sprite.y - 6, 'fire');
    this.scene.floatingText(enemy.gridX, enemy.gridY, `-${damage}`, '#ffa94d');
    this.scene.tweens.add({ targets: enemy.sprite, alpha: 0.45, duration: 90, yoyo: true, repeat: 1 });
  }

  // Barra de vida sobre o inimigo ferido (some enquanto ele está inteiro).
  drawBar(enemy: Enemy): void {
    const bar = enemy.bar;
    if (enemy.hp >= enemy.maxHp) { bar.setVisible(false); return; }
    const w = 24;
    const x = enemy.sprite.x - w / 2;
    const y = enemy.sprite.y - CONFIG.tile * (ENEMY_TYPES[enemy.kind].rooted ? 0.95 : 0.6);
    bar.setVisible(true).clear();
    bar.fillStyle(0x17110d, 0.9).fillRect(x - 1, y - 1, w + 2, 5);
    bar.fillStyle(0x66bb6a, 1).fillRect(x, y, Math.max(0, (w * enemy.hp) / enemy.maxHp), 3);
  }

  moveEnemy(enemy: Enemy): void {
    const s = this.scene;
    const def = ENEMY_TYPES[enemy.kind];
    if (def.behavior === 'patrol') {
      this.patrolStep(enemy);
      return;
    }
    if (def.behavior === 'thief') {
      this.ratStep(enemy);
      return;
    }
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

  // A gosma que leva fogo e sobrevive se divide: a vida restante é repartida com uma gosma nova, numa casa vizinha livre.
  private splitSlime(enemy: Enemy): void {
    const s = this.scene;
    if (this.countEnemies('slime') >= SLIME_MAX_TOTAL) return;
    const split = splitHp(enemy.hp);
    if (!split) return;
    const me = s.playerTile();
    const spots = DIRS
      .map(([dx, dy]) => ({ x: enemy.gridX + dx, y: enemy.gridY + dy }))
      .filter(p => s.isFree(p.x, p.y) && !(p.x === s.doorX && p.y === s.doorY) && !(p.x === me.x && p.y === me.y)
        && !this.enemies.some(e => e.alive && e.gridX === p.x && e.gridY === p.y));
    if (spots.length === 0) return;
    const at = Phaser.Utils.Array.GetRandom(spots);
    enemy.hp = split.keep;
    const clone = this.createEnemy('slime', at.x, at.y, split.spawn);
    clone.fxCooldown = 700;
    s.floatingText(at.x, at.y - 1, 'SE DIVIDIU', '#cfe3f2', 11, 800);
  }

  // Ratinho do celeiro: vai ao item mais perto (menos gema) e foge da Roo; com o item, corre e some pela parede.
  private ratStep(enemy: Enemy): void {
    const s = this.scene;
    const canEnter = (x: number, y: number): boolean => s.isFree(x, y) && !(x === s.doorX && y === s.doorY)
      && !this.enemies.some(e => e !== enemy && e.alive && e.gridX === x && e.gridY === y);
    const me = s.playerTile();
    const from = { x: enemy.gridX, y: enemy.gridY };
    const near = Math.abs(me.x - from.x) + Math.abs(me.y - from.y) <= RAT_FLEE_DISTANCE;
    let d: { x: number; y: number } | null = null;
    if (near || enemy.loot) d = stepAway(from, me, canEnter);
    if (!d && !enemy.loot) {
      const target = nearestOf(from, s.pickupSystem.pickups.filter(p => stealable(p.type)).map(p => ({ x: p.gridX, y: p.gridY })));
      if (target) d = stepToward(from, target, canEnter);
    }
    if (!d) {
      const options = DIRS.filter(([dx, dy]) => canEnter(from.x + dx, from.y + dy));
      if (options.length === 0) return;
      const [dx, dy] = Phaser.Utils.Array.GetRandom(options);
      d = { x: dx, y: dy };
    }
    enemy.fromX = enemy.sprite.x;
    enemy.fromY = enemy.sprite.y;
    enemy.hopY = d.y !== 0;
    enemy.moveT = 0;
    enemy.gridX += d.x;
    enemy.gridY += d.y;
    // chegou a um item que pode levar: pega
    if (!enemy.loot) {
      const p = s.pickupSystem.pickups.find(q => q.gridX === enemy.gridX && q.gridY === enemy.gridY && stealable(q.type));
      if (p) {
        enemy.loot = s.pickupSystem.removePickup(p);
        enemy.actMs = RAT_ESCAPE_MS;
        s.floatingText(enemy.gridX, enemy.gridY - 1, 'ROUBOU!', '#ff9e80', 12, 900);
      }
    }
  }

  // Com o item, o ratinho some pela parede depois de um tempo (a Roo ainda pode derrubá-lo antes).
  private ratEscape(enemy: Enemy, delta: number): void {
    if (!enemy.loot) return;
    enemy.actMs -= delta;
    if (enemy.actMs > 0) return;
    this.scene.floatingText(enemy.gridX, enemy.gridY - 1, 'FUGIU', '#bfae8a', 11, 700);
    enemy.loot = null; // o item se perde com ele
    this.killEnemy(enemy);
  }

  // Salamandra amiga: aquece a Roo uma vez por fase, quando ela chega perto.
  private salamanderWarm(enemy: Enemy): void {
    const s = this.scene;
    if (enemy.used) return;
    const me = s.playerTile();
    if (Math.abs(me.x - enemy.gridX) + Math.abs(me.y - enemy.gridY) > 1) return;
    enemy.used = true;
    const heal = Math.min(SALAMANDER_HEAL, CONFIG.maxHp - s.player.hp);
    if (heal > 0) s.player.hp += heal;
    s.floatingText(enemy.gridX, enemy.gridY - 1, heal > 0 ? `QUENTINHO! +${heal}` : 'QUENTINHO!', '#ffd27a', 12, 1200);
    s.play('pickup');
    s.updateHud();
    s.tweens.add({ targets: enemy.sprite, scaleX: 1.2, scaleY: 0.85, duration: 140, yoyo: true, repeat: 2 });
    enemy.sprite.setAlpha(0.8);
  }

  // O quadro do inimigo agora: dois quadros de vida e, para alguns, um de estado (o relógio dando corda, a coruja
  // mirando). A lanterna ainda ilumina o chão em volta com um brilho.
  private applyFrame(enemy: Enemy): void {
    const def = ENEMY_TYPES[enemy.kind];
    let key = def.texture;
    const alt = ALT_FRAME[enemy.kind];
    if (alt) {
      const t = this.tickMs + enemy.phase;
      // a coruja só pisca de vez em quando; os outros alternam sempre
      const flip = enemy.kind === 'owl' ? Math.floor(t / 300) % 9 === 0 : Math.floor(t / 380) % 2 === 1;
      if (flip) key = alt;
    }
    if (enemy.kind === 'clock' && enemy.moveTimer > def.moveInterval) key = 'enemy_clock_pause'; // trava para dar corda
    if (enemy.kind === 'owl' && enemy.state === 'aim') key = 'enemy_owl_aim';
    if (enemy.sprite.texture.key !== key) enemy.sprite.setTexture(key);
    if (enemy.kind === 'lantern' && enemy.sprite.visible) {
      const k = 0.5 + 0.5 * Math.sin((this.tickMs + enemy.phase) / 170);
      this.lg().fillStyle(0xffa94d, 0.07 + 0.05 * k).fillCircle(enemy.sprite.x, enemy.sprite.y, 30);
      this.lg().fillStyle(0xffd27a, 0.10 + 0.06 * k).fillCircle(enemy.sprite.x, enemy.sprite.y, 19);
    }
  }

  // Patrulha: segue em linha reta; ao bater, volta (ou vira). O relógio de cobre trava por 2 s a cada volta.
  private patrolStep(enemy: Enemy): void {
    const s = this.scene;
    const canEnter = (x: number, y: number): boolean => s.isFree(x, y)
      && !(x === s.doorX && y === s.doorY)
      && !this.enemies.some(e => e !== enemy && e.alive && e.gridX === x && e.gridY === y);
    const d = patrolDir({ x: enemy.gridX, y: enemy.gridY }, enemy.dir, canEnter);
    if (!d) return;
    enemy.dir = d;
    enemy.fromX = enemy.sprite.x;
    enemy.fromY = enemy.sprite.y;
    enemy.hopY = d.y !== 0;
    enemy.moveT = 0;
    enemy.gridX += d.x;
    enemy.gridY += d.y;
    // o passo do relógio se ouve, mas só de perto (senão a fase vira um tique-taque sem fim)
    if (enemy.kind === 'clock' && Math.abs(enemy.gridX - s.player.gridX) + Math.abs(enemy.gridY - s.player.gridY) <= 5) s.play('tick');
    if (enemy.kind === 'clock' && ++enemy.steps >= CLOCK_STEPS_BETWEEN_PAUSES) {
      enemy.steps = 0;
      enemy.actMs = CLOCK_PAUSE_MS; // marca a pausa; o update() a aplica ao intervalo do passo seguinte
    }
  }

  // Toupeira: depois de andar um tempo, afunda e deixa um monte que avisa onde vai brotar (a 2 ou 3 casas da Roo).
  private updateMole(enemy: Enemy, delta: number): boolean {
    const s = this.scene;
    const T = CONFIG.tile;
    if (enemy.state === 'burrowed') {
      enemy.actMs -= delta;
      const t = enemy.target;
      if (t) {
        // o monte de terra no lugar onde ela vai brotar (xadrez de pixels que treme)
        const wob = Math.floor(enemy.actMs / 90) % 2;
        this.lg().fillStyle(0x5d4228, 0.9).fillRect(t.x * T + 9, t.y * T + 20 + wob, 22, 11);
        this.lg().fillStyle(0x8d6e43, 0.95).fillRect(t.x * T + 13, t.y * T + 16 + wob, 14, 8);
        this.lg().lineStyle(2, 0xf0e6c8, 0.9).strokeRect(t.x * T + 3, t.y * T + 3, T - 6, T - 6);
        // o rastro: um monte que anda por baixo da terra, da casa onde afundou até o lugar onde vai brotar
        const p = 1 - Math.max(0, enemy.actMs) / MOLE_BURROW_MS;
        const ox = enemy.gridX * T + T / 2, oy = enemy.gridY * T + T / 2;
        const mx = ox + (t.x * T + T / 2 - ox) * p, my = oy + (t.y * T + T / 2 - oy) * p;
        this.lg().fillStyle(0x5d4228, 0.85).fillRect(Math.round(mx) - 7, Math.round(my) + 2, 14, 6);
        this.lg().fillStyle(0x8d6e43, 0.9).fillRect(Math.round(mx) - 4, Math.round(my) - 1, 8, 4);
      }
      if (enemy.actMs <= 0 && t) {
        enemy.gridX = t.x;
        enemy.gridY = t.y;
        enemy.fromX = enemy.sprite.x = t.x * T + T / 2;
        enemy.fromY = enemy.sprite.y = t.y * T + T / 2;
        enemy.sprite.setVisible(true);
        enemy.state = 'walk';
        enemy.target = null;
        enemy.actMs = MOLE_WALK_MS;
        this.thornFx(enemy.sprite.x, enemy.sprite.y);
        s.play('root');
      }
      return true; // debaixo da terra: não anda nem machuca
    }
    enemy.actMs -= delta;
    if (enemy.actMs > 0) return false;
    const me = s.playerTile();
    const spot = moleSpot(me, (x, y) => s.isFree(x, y) && !(x === s.doorX && y === s.doorY)
      && !this.enemies.some(e => e !== enemy && e.alive && e.gridX === x && e.gridY === y), CONFIG.cols, CONFIG.rows, random());
    if (!spot) {
      enemy.actMs = 1500; // sem lugar para brotar agora: tenta de novo daqui a pouco
      return false;
    }
    enemy.state = 'burrowed';
    enemy.target = spot;
    enemy.actMs = MOLE_BURROW_MS;
    enemy.sprite.setVisible(false);
    enemy.bar.setVisible(false);
    this.thornFx(enemy.sprite.x, enemy.sprite.y);
    s.play('root');
    return true;
  }

  // Coruja: a cada 6 s marca a casa da Roo com um círculo que encolhe; 1 s depois, mergulha. Quem saiu da casa escapa.
  private updateOwl(enemy: Enemy, delta: number): void {
    const s = this.scene;
    const T = CONFIG.tile;
    enemy.actMs -= delta;
    if (enemy.state === 'walk') {
      if (enemy.actMs <= 0) {
        enemy.state = 'aim';
        enemy.target = s.playerTile();
        enemy.actMs = OWL_AIM_MS;
        s.play('hoot');
      }
      return;
    }
    const t = enemy.target;
    if (!t) { enemy.state = 'walk'; return; }
    const k = Math.max(0, enemy.actMs / OWL_AIM_MS); // 1 -> 0
    this.lg().lineStyle(2, 0xeef4f8, 0.95).strokeCircle(t.x * T + T / 2, t.y * T + T / 2, 8 + 12 * k);
    this.lg().fillStyle(0xc9d6df, 0.18 + 0.25 * (1 - k)).fillRect(t.x * T + 3, t.y * T + 3, T - 6, T - 6);
    // a sombra da coruja cresce no chão: ela vem de cima
    this.lg().fillStyle(0x000000, 0.2 + 0.25 * (1 - k)).fillEllipse(t.x * T + T / 2, t.y * T + T / 2 + 8, 8 + 24 * (1 - k), 4 + 10 * (1 - k));
    if (enemy.actMs > 0) return;
    const me = s.playerTile();
    this.thornFx(t.x * T + T / 2, t.y * T + T / 2);
    if (me.x === t.x && me.y === t.y) s.damagePlayer(false, 'air');
    enemy.state = 'walk';
    enemy.target = null;
    enemy.actMs = OWL_CYCLE_MS;
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
        this.lg().fillStyle(0xd81b60, pulse);
        this.lg().fillRect(c.x * T + 2, c.y * T + 2, T - 4, T - 4);
        this.lg().lineStyle(2, 0xff80ab, 0.9);
        this.lg().strokeRect(c.x * T + 2, c.y * T + 2, T - 4, T - 4);
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
    fxPool(this.scene).burst('thorn', 'menu_spark', {
      speed: { min: 40, max: 110 },
      angle: { min: 0, max: 360 },
      lifespan: { min: 300, max: 520 },
      scale: { start: 1.8, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [0x66bb6a, 0x2e7d32, 0xad1457],
    }, px, py, 6, 10);
  }

  update(delta: number): void {
    const s = this.scene;
    if (this.lashDirty) { this.lashGfx.clear(); this.lashDirty = false; } // só limpa se o quadro anterior desenhou algo
    this.tickMs += delta;
    for (const enemy of [...this.enemies]) {
      if (!enemy.alive) continue;
      const def = ENEMY_TYPES[enemy.kind];
      enemy.fxCooldown = Math.max(0, enemy.fxCooldown - delta);
      // chama residual também atinge inimigos
      const blast = s.bombSystem.explosions.find(e => e.x === enemy.gridX && e.y === enemy.gridY);
      if (blast) {
        this.hitEnemy(enemy, blast.element, blast.fromRoo);
        if (!enemy.alive) continue;
      }
      this.animateEnemy(enemy, delta);
      this.applyFrame(enemy);
      this.drawBar(enemy);
      if (enemy.trapMs > 0) {
        // preso na bolha: não anda, não machuca e não chicoteia; quando acaba, a bolha estoura
        enemy.trapMs = Math.max(0, enemy.trapMs - delta);
        if (enemy.trapMs === 0) s.forms.pop(enemy.sprite.x, enemy.sprite.y);
        continue;
      }
      if (def.rooted) {
        this.updateFlower(enemy, delta);
        continue;
      }
      if (def.behavior === 'friend') this.salamanderWarm(enemy);
      if (def.behavior === 'thief') {
        this.ratEscape(enemy, delta);
        if (!enemy.alive) continue;
      }
      if (def.behavior === 'burrow' && this.updateMole(enemy, delta)) continue;
      if (def.behavior === 'dive') this.updateOwl(enemy, delta);
      const dist = Phaser.Math.Distance.Between(
        enemy.sprite.x, enemy.sprite.y, s.playerSprite.x, s.playerSprite.y,
      );
      if (!def.harmless && dist < CONFIG.tile * 0.6) s.damagePlayer();
      // dentro de uma poça da Roo Água, o inimigo anda bem mais devagar
      enemy.moveTimer -= s.forms.inPuddle(enemy.gridX, enemy.gridY) ? delta * PUDDLE_SLOW : delta;
      if (enemy.moveTimer <= 0) {
        this.moveEnemy(enemy);
        const pause = enemy.kind === 'clock' && enemy.actMs === CLOCK_PAUSE_MS; // o relógio trava a cada volta
        if (pause) enemy.actMs = 0;
        enemy.moveTimer = pause ? CLOCK_PAUSE_MS : def.moveInterval;
      }
    }
  }
}
