// Classe-pai dos chefes (Belladona, Mandrágora...). Guarda o que todo chefe tem em comum:
// vida, fases, tempos que pausam com o jogo, avisos no chão, explosões, dano, fúria e derrota.
// Cada chefe só define o que o torna único: nome, tabela de dano, habilidades, falas e sprites.
//
// Todos os tempos usam o `delta` do jogo (e não timers do navegador), então o chefe pausa junto
// com a partida (pausa, janela de ajuda). Regras puras (sorteios, áreas) ficam em arquivos
// próprios de cada chefe e são testadas (boss.ts, mandrake.ts).
import Phaser from 'phaser';
import { CONFIG, DIRS, ELEMENTS, EMPTY, ElementId } from '../../../config';
import { rooOriginY } from '../../../textures/rooGeometry';
import { readTheme } from '../../../ui/theme';
import type { MainScene } from '../../../scenes/MainScene';
import { BossPhase, Tile, phaseFor } from './common';

export type { BossPhase, Tile };
export type BossPose = 'idle' | 'cast' | 'hurt' | 'talk' | 'defeat';
export type BossState = 'idle' | 'casting' | 'blinking' | 'stunned' | 'defeated';
export interface BossHudView { hp: number; maxHp: number; name: string }

interface Timer { ms: number; fn: () => void }

export const TILE = CONFIG.tile;
export const center = (n: number): number => n * TILE + TILE / 2;

export interface BossSetup {
  prefix: string;      // prefixo das texturas: `${prefix}_idle_0`, `_idle_1`, `_talk_0/1`, `_cast`, `_hurt`, `_defeat`
  spawn: Tile;         // casa onde nasce
  maxHp: number;
  moveIntervalMs: number;
  firstCastMs: number;
  furiousTint: number; // cor da aura da fase 2
}

export abstract class BossBase {
  abstract readonly name: string;

  gridX: number;
  gridY: number;
  hp: number;
  readonly maxHp: number;
  phase: BossPhase = 1;
  state: BossState = 'idle';
  readonly sprite: Phaser.GameObjects.Sprite;

  protected hidden = false;
  protected moveMs: number;
  protected cooldownMs: number;
  protected invulnMs = 0;
  protected timers: Timer[] = [];
  protected telegraphs = new Set<Phaser.GameObjects.GameObject>();
  protected aura: Phaser.GameObjects.Image | null = null;
  private bubble: Phaser.GameObjects.Text | null = null;

  protected constructor(protected readonly scene: MainScene, protected readonly setup: BossSetup) {
    this.gridX = setup.spawn.x;
    this.gridY = setup.spawn.y;
    this.hp = setup.maxHp;
    this.maxHp = setup.maxHp;
    this.moveMs = setup.moveIntervalMs;
    this.cooldownMs = setup.firstCastMs;
    const p = setup.prefix;
    if (!scene.anims.exists(`${p}_idle`)) {
      scene.anims.create({ key: `${p}_idle`, frames: [{ key: `${p}_idle_0` }, { key: `${p}_idle_1` }], frameRate: 2, repeat: -1 });
    }
    if (!scene.anims.exists(`${p}_talk`)) {
      scene.anims.create({ key: `${p}_talk`, frames: [{ key: `${p}_talk_0` }, { key: `${p}_talk_1` }], frameRate: 6, repeat: -1 });
    }
    this.sprite = scene.add.sprite(center(this.gridX), center(this.gridY), `${p}_idle_0`)
      .setOrigin(0.5, rooOriginY(TILE)).setDepth(9).setScale(0.01);
    this.sprite.anims.play(`${p}_idle`);
    scene.tweens.add({ targets: this.sprite, scale: 1.12, duration: 500, ease: 'Back.easeOut' });
  }

  // ---------- o que cada chefe define ----------

  /** Dano de uma explosão do elemento. Zero = resiste; negativo = a explosão a cura. */
  protected abstract damageFor(element: ElementId): number;
  /** Intervalo entre habilidades, conforme a fase. */
  protected abstract cooldownFor(phase: BossPhase): number;
  /** Escolhe e inicia a próxima habilidade (deve pôr `state = 'casting'` e terminar com `endCast()`). */
  protected abstract castNext(): void;
  /** Frase curta de um tipo de fala (legenda sobre o chefe). */
  protected abstract lineFor(kind: string): string;
  /** Chamado quando o chefe é derrotado, depois da pose de derrota. */
  protected abstract onDefeated(): void;
  /** Explosão de um elemento que resiste (dano zero) ou cura. Padrão: só um aviso. */
  protected onResisted(_element: ElementId, damage: number): void {
    this.scene.floatingText(this.gridX, this.gridY, damage < 0 ? `+${-damage}` : 'RESISTE', '#b0bec5');
  }

  // ---------- interface com a cena ----------

  hudView(): BossHudView {
    return { hp: Math.max(0, this.hp), maxHp: this.maxHp, name: this.name };
  }

  get defeated(): boolean {
    return this.state === 'defeated';
  }

  // Chamado a cada explosão de poção da jogadora, com as casas atingidas.
  onExplosion(tiles: Tile[], element: ElementId = 'fire'): void {
    if (this.hidden || this.invulnMs > 0 || this.state === 'defeated') return;
    if (!tiles.some(t => t.x === this.gridX && t.y === this.gridY)) return;
    const damage = this.damageFor(element);
    if (damage <= 0) {
      this.onResisted(element, damage);
      this.invulnMs = 500; // evita repetir o aviso a cada quadro da mesma explosão
      return;
    }
    this.hit(damage);
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
      if (d < TILE * 0.6) this.scene.damagePlayer();
    }

    if (this.state !== 'idle') return;
    this.moveMs -= delta;
    if (this.moveMs <= 0) {
      this.move();
      this.moveMs = this.setup.moveIntervalMs;
    }
    this.cooldownMs -= delta;
    if (this.cooldownMs <= 0) this.castNext();
  }

  // ---------- tempo e utilidades ----------

  protected after(ms: number, fn: () => void): void {
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

  // Legenda curta sobre o chefe. Só uma por vez; some sozinha e não interrompe nada.
  protected say(kind: string): void {
    this.bubble?.destroy();
    const theme = readTheme();
    const t = this.scene.add.text(this.sprite.x, this.sprite.y - 46, this.lineFor(kind), {
      fontFamily: theme.fontBody, fontSize: '11px', color: '#f1e9d8', fontStyle: 'bold',
      backgroundColor: '#17110d', padding: { x: 4, y: 2 },
    }).setOrigin(0.5).setDepth(21);
    this.bubble = t;
    if (this.state === 'idle') {
      this.setPose('talk');
      this.after(1300, () => { if (this.state === 'idle') this.setPose('idle'); });
    }
    this.scene.tweens.add({
      targets: t, alpha: 0, delay: 1300, duration: 400,
      onComplete: () => { if (this.bubble === t) this.bubble = null; t.destroy(); },
    });
  }

  protected setPose(pose: BossPose): void {
    const p = this.setup.prefix;
    if (pose === 'idle' || pose === 'talk') {
      this.sprite.anims.play(pose === 'idle' ? `${p}_idle` : `${p}_talk`, true);
      return;
    }
    this.sprite.anims.stop();
    this.sprite.setTexture(`${p}_${pose}`);
  }

  protected burst(x: number, y: number, texture: string, tint: number[], count: number, speed = 90): void {
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

  protected isOpen = (x: number, y: number): boolean => this.scene.getTile(x, y) === EMPTY;

  // ---------- movimento ----------

  protected move(): void {
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

  // ---------- habilidades: ferramentas comuns ----------

  protected endCast(): void {
    if (this.state !== 'casting') return;
    this.state = 'idle';
    this.cooldownMs = this.cooldownFor(this.phase);
    this.setPose('idle');
  }

  // Marca no chão onde a explosão vai cair: um quadrado em cada casa e, se houver alvo, um anel que encolhe.
  protected telegraph(tiles: Tile[], element: ElementId, target?: Tile, ms: number = CONFIG.bossTelegraphMs): void {
    const el = ELEMENTS[element];
    const marks: Phaser.GameObjects.GameObject[] = [];
    for (const t of tiles) {
      const sq = this.scene.add.rectangle(center(t.x), center(t.y), TILE - 6, TILE - 6, el.color, 0.2).setDepth(4);
      this.scene.tweens.add({ targets: sq, alpha: 0.42, duration: 220, yoyo: true, repeat: -1 });
      marks.push(sq);
    }
    if (target) {
      const ring = this.scene.add.circle(center(target.x), center(target.y), 17, el.color, 0)
        .setStrokeStyle(2, el.glow, 1).setDepth(4);
      this.scene.tweens.add({ targets: ring, scale: { from: 1.6, to: 0.7 }, duration: ms, ease: 'Linear' });
      marks.push(ring);
    }
    this.clearMarksAfter(marks, ms);
  }

  // Quadrados de uma cor qualquer (ex.: casas seguras, em verde).
  protected markTiles(tiles: Tile[], color: number, ms: number): void {
    const marks: Phaser.GameObjects.GameObject[] = [];
    for (const t of tiles) {
      const sq = this.scene.add.rectangle(center(t.x), center(t.y), TILE - 6, TILE - 6, color, 0.3)
        .setStrokeStyle(2, color, 0.9).setDepth(5);
      this.scene.tweens.add({ targets: sq, alpha: 0.55, duration: 260, yoyo: true, repeat: -1 });
      marks.push(sq);
    }
    this.clearMarksAfter(marks, ms);
  }

  private clearMarksAfter(marks: Phaser.GameObjects.GameObject[], ms: number): void {
    for (const m of marks) this.telegraphs.add(m);
    this.after(ms, () => {
      for (const m of marks) {
        this.scene.tweens.killTweensOf(m);
        m.destroy();
        this.telegraphs.delete(m);
      }
    });
  }

  protected explode(tiles: Tile[], element: ElementId): void {
    const el = ELEMENTS[element];
    const lite = tiles.length > 24; // muitas casas de uma vez: sem partículas, para não pesar
    for (const t of tiles) this.scene.bombSystem.spawnExplosion(t.x, t.y, el.color, el.glow, element, lite);
    this.scene.play('explosion', element);
    this.scene.cameras.main.shake(80, 0.004);
  }

  // ---------- dano, fúria e derrota ----------

  protected hit(damage: number): void {
    this.hp = Math.max(0, this.hp - damage);
    this.invulnMs = CONFIG.bossHitInvuln;
    if (this.hp > 0) this.say('hurt');
    this.scene.floatingText(this.gridX, this.gridY, `-${damage}`, '#ff80ab');
    this.scene.play('pickup');
    this.burst(this.sprite.x, this.sprite.y - 10, 'menu_spark', [0xffd54f, 0xffffff, this.setup.furiousTint], 12, 100);
    this.scene.tweens.add({
      targets: this.sprite, alpha: 0.35, duration: 110, yoyo: true, repeat: 5,
      onComplete: () => { if (!this.hidden) this.sprite.setAlpha(1); },
    });
    if (this.hp <= 0) {
      this.defeat();
      return;
    }
    // golpe interrompe o que o chefe estava fazendo (os avisos já postos ainda explodem)
    this.state = 'stunned';
    this.setPose('hurt');
    this.cooldownMs = Math.max(this.cooldownMs, 1600);
    this.after(900, () => {
      if (this.state !== 'stunned') return;
      this.state = 'idle';
      this.setPose('idle');
    });
    this.checkPhase();
    this.scene.updateHud();
  }

  protected heal(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount);
    this.scene.floatingText(this.gridX, this.gridY, `+${amount}`, '#9be564');
    this.checkPhase();
    this.scene.updateHud();
  }

  // Cura pode tirar o chefe da fúria; só entra de novo ao cair abaixo da metade.
  private checkPhase(): void {
    const next = phaseFor(this.hp, this.maxHp);
    if (next === this.phase) return;
    this.phase = next;
    if (next === 2) this.furious();
    else if (this.aura) { this.aura.destroy(); this.aura = null; }
  }

  protected furious(): void {
    this.say('furious');
    this.scene.floatingText(this.gridX, this.gridY - 1, 'FURIOSA!', '#9be564');
    this.scene.cameras.main.flash(260, 60, 140, 40);
    this.aura = this.scene.add.image(this.sprite.x, this.sprite.y - 12, 'menu_puff')
      .setTint(this.setup.furiousTint).setBlendMode(Phaser.BlendModes.ADD).setScale(1.5).setAlpha(0.45).setDepth(8);
    this.scene.tweens.add({ targets: this.aura, alpha: 0.2, scale: 1.3, duration: 500, yoyo: true, repeat: -1 });
  }

  protected defeat(): void {
    this.state = 'defeated';
    this.say('defeat');
    this.hidden = false;
    this.timers = [];
    for (const m of this.telegraphs) {
      this.scene.tweens.killTweensOf(m);
      m.destroy();
    }
    this.telegraphs.clear();
    this.setPose('defeat');
    this.scene.updateHud();
    this.burst(this.sprite.x, this.sprite.y - 10, 'menu_spark', [this.setup.furiousTint, 0xffd54f, 0xffffff, 0xd81b60], 40, 170);
    this.scene.tweens.killTweensOf(this.sprite);
    // sem girar nem encolher: o chefe fica de pé, cabeça baixa, e só se apaga quando a Roo parte
    if (this.aura) this.aura.destroy();
    this.scene.play('door');
    this.after(1500, () => this.onDefeated());
  }
}
