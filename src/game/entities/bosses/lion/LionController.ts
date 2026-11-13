// Leão Verde, guardião da Biblioteca Proibida: habilidades e falas. O resto (vida, fases, tempos, avisos,
// dano e derrota) vem de BossBase. As regras puras estão em rules.ts e são testadas.
//
// É o solvente universal: dissolve tudo, até as poções da Roo. A terra é imune; o éter o fere muito.
// Habilidades (cada uma mostra um aviso no chão antes de acontecer; ver docs/03-mundo.md):
//   pounce  : some e salta sobre a casa em que você está, com um abalo em cruz. Depois fica EXPOSTO.
//   dissolve: um ácido verde corre pela linha da sua casa (furioso, também pela coluna) e dissolve
//             qualquer poção sua que estiver no caminho.
//   roar    : (só furioso) um rugido que atinge quase tudo; as casas verdes são seguras.
import { CONFIG, ElementId } from '../../../../config';
import type { MainScene } from '../../../../scenes/MainScene';
import { BossBase, center } from '../BossBase';
import { BossPhase, Tile, blastTiles } from '../common';
import { shriekPlan } from '../mandrake/rules';
import { LionLine, pickLionLine } from './lines';
import {
  LION_DAMAGE, LION_EXPOSED_BONUS, LION_EXPOSED_MS, LION_HP, LION_NAME, LionSkill,
  dissolveTiles, lionCooldown, pickLionSkill,
} from './rules';

const GREEN = 0x9be564;

export class LionController extends BossBase {
  readonly name = LION_NAME;
  private lastSkill: LionSkill | null = null;
  private exposedMs = 0;

  constructor(scene: MainScene) {
    super(scene, {
      prefix: 'lion',
      spawn: { x: CONFIG.cols - 2, y: CONFIG.rows - 2 },
      maxHp: LION_HP,
      moveIntervalMs: 1100,
      firstCastMs: 2800,
      furiousTint: GREEN,
    });
  }

  protected damageFor(element: ElementId): number {
    const base = LION_DAMAGE[element];
    // exposto (depois do Bote): dano extra, mas só onde a poção já machuca (imune continua imune)
    return base > 0 && this.exposedMs > 0 ? base + LION_EXPOSED_BONUS : base;
  }

  protected cooldownFor(phase: BossPhase): number {
    return lionCooldown(phase);
  }

  protected lineFor(kind: string): string {
    return pickLionLine(kind as LionLine);
  }

  protected onDefeated(): void {
    this.scene.onBossDefeated();
  }

  protected onResisted(element: ElementId, damage: number): void {
    // a terra é o sal que ele já dissolveu: não o toca
    this.scene.floatingText(this.gridX, this.gridY, element === 'earth' ? 'DISSOLVE' : damage < 0 ? `+${-damage}` : 'RESISTE', '#b0bec5');
  }

  update(delta: number): void {
    if (this.exposedMs > 0) {
      this.exposedMs = Math.max(0, this.exposedMs - delta);
      if (this.exposedMs === 0) this.sprite.clearTint();
    }
    super.update(delta);
  }

  // ---------- habilidades ----------

  protected castNext(): void {
    const skill = pickLionSkill(this.phase, this.lastSkill);
    this.lastSkill = skill;
    this.state = 'casting';
    this.say(skill);
    switch (skill) {
      case 'pounce': this.castPounce(); break;
      case 'dissolve': this.castDissolve(); break;
      case 'roar': this.castRoar(); break;
    }
  }

  private castPounce(): void {
    this.state = 'blinking';
    this.hidden = true;
    this.scene.play('door');
    this.burst(this.sprite.x, this.sprite.y - 10, 'menu_puff', [0x4f8a3a, 0xffffff], 12, 70);
    this.scene.tweens.add({ targets: this.sprite, alpha: 0, duration: 300 });
    const target = this.scene.playerTile();
    const tiles = blastTiles(target.x, target.y, 1, this.isOpen);
    const ms = 1500;
    this.telegraph(tiles, 'earth', target, ms);
    this.after(ms, () => {
      if (this.state === 'defeated') return;
      this.gridX = target.x;
      this.gridY = target.y;
      this.sprite.setPosition(center(target.x), center(target.y));
      this.burst(this.sprite.x, this.sprite.y - 10, 'menu_spark', [GREEN, 0xffd54f, 0xffffff], 16, 120);
      this.scene.tweens.add({ targets: this.sprite, alpha: 1, duration: 250 });
      this.explode(tiles, 'earth');
      this.hidden = false;
      this.state = 'idle';
      // exposto: leva dano extra e demora a agir de novo
      this.exposedMs = LION_EXPOSED_MS;
      this.sprite.setTint(0xffe9a0);
      this.scene.floatingText(this.gridX, this.gridY - 1, 'EXPOSTO!', '#ffd54f');
      this.cooldownMs = LION_EXPOSED_MS;
    });
  }

  private castDissolve(): void {
    this.setPose('cast');
    this.scene.play('powerup');
    const target = this.scene.playerTile();
    const horizontal = Math.random() < 0.5;
    const tiles = dissolveTiles(target, horizontal, this.phase === 2, this.isOpen);
    const ms = CONFIG.bossTelegraphMs + 200;
    this.telegraph(tiles, 'earth', target, ms);
    this.after(ms, () => {
      if (this.state === 'defeated') return;
      // o ácido dissolve as poções da Roo no caminho (sem explodir)
      for (const bomb of [...this.scene.bombSystem.bombs]) {
        if (tiles.some(t => t.x === bomb.gridX && t.y === bomb.gridY)) this.scene.bombSystem.neutralizeBomb(bomb, 'DISSOLVIDA');
      }
      this.explode(tiles, 'earth');
    });
    this.after(ms - 200, () => this.endCast());
  }

  private castRoar(): void {
    this.setPose('cast');
    this.scene.play('powerup');
    const player = this.scene.playerTile();
    const open: Tile[] = [];
    for (let y = 1; y < CONFIG.rows - 1; y++) {
      for (let x = 1; x < CONFIG.cols - 1; x++) if (this.isOpen(x, y)) open.push({ x, y });
    }
    const { danger, safe } = shriekPlan(open, player, 3);
    const ms = 1900;
    this.telegraph(danger, 'earth', undefined, ms);
    this.markTiles(safe, GREEN, ms);
    this.after(ms, () => {
      if (this.state === 'defeated') return;
      this.explode(danger, 'earth');
    });
    this.after(ms + 200, () => this.endCast());
  }
}
