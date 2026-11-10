// Belladona, a alquimista rival: movimento, habilidades, dano e derrota.
//
// Todos os tempos usam o `delta` do jogo (e não timers do navegador), então o chefe pausa junto
// com a partida (pausa, janela de ajuda). As regras puras (escolha de habilidade, área da cruz,
// alvos) estão em boss.ts e são testadas.
//
// Habilidades (cada uma mostra um aviso no chão antes de acontecer; ver docs/03-mundo.md):
//   fire  : arremessa uma poção de fogo na casa onde você está; explode em cruz (raio 1).
//           Furiosa: arremessa duas, uma depois da outra.
//   rain  : (só furiosa) gotas de água caem em casas ao redor de você.
//   blink : some e reaparece longe, protegida enquanto está escondida.
import Phaser from 'phaser';
import { CONFIG, DIRS, ELEMENTS, EMPTY, ElementId } from '../config';
import { rooOriginY } from '../textures/rooGeometry';
import { readTheme } from '../ui/theme';
import type { MainScene } from '../scenes/MainScene';
import {
  BOSS_NAME, BossPhase, BossSkill, ELEMENT_POTION_TEXTURE, SKILL_ELEMENT, Tile,
  blastTiles, blinkDestination, cooldownFor, phaseFor, pickBossSkill, rainTargets,
} from './boss';

type State = 'idle' | 'casting' | 'blinking' | 'stunned' | 'defeated';
interface Timer { ms: number; fn: () => void }
export interface BossHudView { hp: number; maxHp: number; name: string }

const LIME = 0x9be564;
const T = CONFIG.tile;
const center = (n: number): number => n * T + T / 2;

export class BossController {
  gridX = CONFIG.cols - 2;
  gridY = CONFIG.rows - 2;
  hp = CONFIG.bossHp;
  readonly maxHp = CONFIG.bossHp;
  phase: BossPhase = 1;
  state: State = 'idle';
  readonly sprite: Phaser.GameObjects.Sprite;

  private hidden = false;
  private moveMs = CONFIG.bossMoveInterval;
  private cooldownMs = CONFIG.bossFirstCastMs;
  private invulnMs = 0;
  private lastSkill: BossSkill | null = null;
  private timers: Timer[] = [];
  private telegraphs = new Set<Phaser.GameObjects.GameObject>();
  private aura: Phaser.GameObjects.Image | null = null;

  constructor(private readonly scene: MainScene) {
    if (!scene.anims.exists('witch_idle')) {
      scene.anims.create({
        key: 'witch_idle',
        frames: [{ key: 'witch_idle_0' }, { key: 'witch_idle_1' }],
        frameRate: 2,
        repeat: -1,
      });
    }
    this.sprite = scene.add.sprite(center(this.gridX), center(this.gridY), 'witch_idle_0')
      .setOrigin(0.5, rooOriginY(T)).setDepth(9).setScale(0.01);
    this.sprite.anims.play('witch_idle');
    scene.tweens.add({ targets: this.sprite, scale: 1.12, duration: 500, ease: 'Back.easeOut' });
    this.intro();
  }

  // ------------------------------------------------------------------ interface com a cena

  hudView(): BossHudView {
    return { hp: Math.max(0, this.hp), maxHp: this.maxHp, name: BOSS_NAME };
  }

  get defeated(): boolean {
    return this.state === 'defeated';
  }

  // Chamado a cada explosão de poção da jogadora, com as casas atingidas.
  onExplosion(tiles: Tile[]): void {
    if (this.hidden || this.invulnMs > 0 || this.state === 'defeated') return;
    if (!tiles.some(t => t.x === this.gridX && t.y === this.gridY)) return;
    this.hit();
  }

  update(delta: number): void {
    this.tickTimers(delta);
    if (this.state === 'defeated') return;
    this.invulnMs = Math.max(0, this.invulnMs - delta);
    if (this.aura) this.aura.setPosition(this.sprite.x, this.sprite.y - 12);

    // encostar na jogadora também machuca (como os outros inimigos)
    if (!this.hidden) {
      const d = Phaser.Math.Distance.Between(
        this.sprite.x, this.sprite.y, this.scene.playerSprite.x, this.scene.playerSprite.y,
      );
      if (d < T * 0.6) this.scene.damagePlayer();
    }

    if (this.state !== 'idle') return;
    this.moveMs -= delta;
    if (this.moveMs <= 0) {
      this.move();
      this.moveMs = CONFIG.bossMoveInterval;
    }
    this.cooldownMs -= delta;
    if (this.cooldownMs <= 0) this.castNext();
  }

  // ------------------------------------------------------------------ tempo e utilidades

  private after(ms: number, fn: () => void): void {
    this.timers.push({ ms, fn });
  }

  private tickTimers(delta: number): void {
    for (const t of [...this.timers]) {
      t.ms -= delta;
      if (t.ms <= 0) {
        this.timers = this.timers.filter(x => x !== t);
        t.fn();
      }
    }
  }

  private setPose(pose: 'idle' | 'cast' | 'hurt'): void {
    if (pose === 'idle') {
      this.sprite.anims.play('witch_idle', true);
      return;
    }
    this.sprite.anims.stop();
    this.sprite.setTexture(pose === 'cast' ? 'witch_cast' : 'witch_hurt');
  }

  private burst(x: number, y: number, texture: string, tint: number[], count: number, speed = 90): void {
    const e = this.scene.add.particles(x, y, texture, {
      speed: { min: 20, max: speed },
      lifespan: { min: 350, max: 800 },
      scale: { start: 1.5, end: 0 },
      alpha: { start: 1, end: 0 },
      blendMode: 'ADD',
      tint,
      emitting: false,
    }).setDepth(14);
    e.explode(count);
    this.scene.time.delayedCall(1000, () => e.destroy());
  }

  private isOpen = (x: number, y: number): boolean => this.scene.getTile(x, y) === EMPTY;

  // ------------------------------------------------------------------ movimento

  private move(): void {
    const player = this.scene.playerTile();
    const options: Array<readonly [number, number]> = [];
    for (const [dx, dy] of DIRS) {
      const nx = this.gridX + dx;
      const ny = this.gridY + dy;
      if (!this.scene.isFree(nx, ny)) continue;
      if (nx === player.x && ny === player.y) continue;
      options.push([dx, dy]);
    }
    if (options.length === 0) return;
    const [dx, dy] = Phaser.Utils.Array.GetRandom(options);
    this.gridX += dx;
    this.gridY += dy;
    this.scene.tweenSpriteTo(this.sprite, this.gridX, this.gridY, 520, 'Sine.easeInOut');
  }

  // ------------------------------------------------------------------ habilidades

  private castNext(): void {
    const skill = pickBossSkill(this.phase, this.lastSkill);
    this.lastSkill = skill;
    this.state = 'casting';
    if (skill === 'fire') this.castFire(this.phase === 2 ? 2 : 1);
    else if (skill === 'rain') this.castRain();
    else this.castBlink();
  }

  private endCast(): void {
    if (this.state !== 'casting') return;
    this.state = 'idle';
    this.cooldownMs = cooldownFor(this.phase);
    this.setPose('idle');
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

  // ------------------------------------------------------------------ avisos e explosões

  // Marca no chão onde a poção vai cair: um quadrado em cada casa da explosão e um anel que encolhe.
  private telegraph(tiles: Tile[], element: ElementId, target: Tile): void {
    const el = ELEMENTS[element];
    const marks: Phaser.GameObjects.GameObject[] = [];
    for (const t of tiles) {
      const sq = this.scene.add.rectangle(center(t.x), center(t.y), T - 6, T - 6, el.color, 0.2).setDepth(4);
      this.scene.tweens.add({ targets: sq, alpha: 0.42, duration: 220, yoyo: true, repeat: -1 });
      marks.push(sq);
    }
    const ring = this.scene.add.circle(center(target.x), center(target.y), 17, el.color, 0)
      .setStrokeStyle(2, el.glow, 1).setDepth(4);
    this.scene.tweens.add({ targets: ring, scale: { from: 1.6, to: 0.7 }, duration: CONFIG.bossTelegraphMs, ease: 'Linear' });
    marks.push(ring);
    for (const m of marks) this.telegraphs.add(m);
    this.after(CONFIG.bossTelegraphMs, () => {
      for (const m of marks) {
        this.scene.tweens.killTweensOf(m);
        m.destroy();
        this.telegraphs.delete(m);
      }
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

  private explode(tiles: Tile[], element: ElementId): void {
    const el = ELEMENTS[element];
    for (const t of tiles) this.scene.spawnExplosion(t.x, t.y, el.color, el.glow, element);
    this.scene.play('explosion', element);
    this.scene.cameras.main.shake(80, 0.004);
  }

  // ------------------------------------------------------------------ dano, fúria e derrota

  private hit(): void {
    this.hp--;
    this.invulnMs = CONFIG.bossHitInvuln;
    this.scene.floatingText(this.gridX, this.gridY, '-1', '#ff80ab');
    this.scene.play('pickup');
    this.burst(this.sprite.x, this.sprite.y - 10, 'menu_spark', [0xffd54f, 0xffffff, LIME], 12, 100);
    this.scene.tweens.add({
      targets: this.sprite, alpha: 0.35, duration: 110, yoyo: true, repeat: 5,
      onComplete: () => { if (!this.hidden) this.sprite.setAlpha(1); },
    });
    if (this.hp <= 0) {
      this.defeat();
      return;
    }
    // golpe interrompe o que ela estava fazendo (os avisos já postos ainda explodem)
    this.state = 'stunned';
    this.setPose('hurt');
    this.cooldownMs = Math.max(this.cooldownMs, 1600);
    this.after(900, () => {
      if (this.state !== 'stunned') return;
      this.state = 'idle';
      this.setPose('idle');
    });
    const next = phaseFor(this.hp, this.maxHp);
    if (next !== this.phase) {
      this.phase = next;
      this.furious();
    }
    this.scene.updateHud();
  }

  private furious(): void {
    this.scene.floatingText(this.gridX, this.gridY - 1, 'FURIOSA!', '#9be564');
    this.scene.cameras.main.flash(260, 60, 140, 40);
    this.aura = this.scene.add.image(this.sprite.x, this.sprite.y - 12, 'menu_puff')
      .setTint(LIME).setBlendMode(Phaser.BlendModes.ADD).setScale(1.5).setAlpha(0.45).setDepth(8);
    this.scene.tweens.add({ targets: this.aura, alpha: 0.2, scale: 1.3, duration: 500, yoyo: true, repeat: -1 });
  }

  private defeat(): void {
    this.state = 'defeated';
    this.hidden = false;
    this.timers = [];
    for (const m of this.telegraphs) {
      this.scene.tweens.killTweensOf(m);
      m.destroy();
    }
    this.telegraphs.clear();
    this.setPose('hurt');
    this.scene.updateHud();
    this.burst(this.sprite.x, this.sprite.y - 10, 'menu_spark', [LIME, 0xffd54f, 0xffffff, 0xd81b60], 40, 170);
    this.scene.tweens.killTweensOf(this.sprite);
    this.scene.tweens.add({
      targets: this.sprite, angle: 540, scale: 0.05, alpha: 0, duration: 1300, ease: 'Cubic.easeIn',
    });
    if (this.aura) this.aura.destroy();
    this.scene.play('door');
    this.after(1500, () => this.scene.onBossDefeated());
  }

  // ------------------------------------------------------------------ introdução

  private intro(): void {
    const th = readTheme();
    const cx = (CONFIG.cols * T) / 2;
    const cy = (CONFIG.rows * T) / 2 - 20;
    const make = (y: number, text: string, style: Phaser.Types.GameObjects.Text.TextStyle): Phaser.GameObjects.Text =>
      this.scene.add.text(cx, y, text, style).setOrigin(0.5).setDepth(30).setAlpha(0);
    const small = make(cy - 34, 'FASE 2', { fontFamily: th.fontBody, fontSize: '14px', color: '#d9b98a', fontStyle: 'bold' });
    const big = make(cy, BOSS_NAME, {
      fontFamily: th.fontDisplay, fontSize: '40px', color: '#9be564', fontStyle: 'bold',
      stroke: '#0b2420', strokeThickness: 7,
    });
    const sub = make(cy + 34, 'A ALQUIMISTA RIVAL', { fontFamily: th.fontBody, fontSize: '13px', color: '#e8dcc0', fontStyle: 'bold' });
    for (const [i, obj] of [small, big, sub].entries()) {
      this.scene.tweens.add({
        targets: obj, alpha: { from: 0, to: 1 }, duration: 350, delay: i * 120, hold: 1500,
        yoyo: true, onComplete: () => obj.destroy(),
      });
    }
  }
}
