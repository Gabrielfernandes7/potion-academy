// Ouroboros, a serpente do ciclo no alto do Observatório: habilidades e falas. O resto (vida, fases, tempos, avisos,
// dano e derrota) vem de BossBase. As regras puras estão em rules.ts e são testadas.
//
// A fraqueza gira (fogo, terra, água, ar) e um brilho em volta dele mostra o elemento da vez. Ele veste esse elemento:
// os golpes dele são desse elemento. Habilidades (cada uma mostra um aviso no chão antes de acontecer):
//   ring  : dois anéis que se abrem a partir dele, um depois do outro. Só o anel machuca: dá para ficar dentro ou fora.
//   bite  : uma mordida em linha, que passa pela casa em que você está.
//   cycle : (só furioso) o ciclo vira de uma vez e quase o campo todo é atingido; as casas verdes são seguras.
import { CONFIG, ELEMENTS, ElementId } from '../../../../config';
import type { MainScene } from '../../../../scenes/MainScene';
import { BossBase } from '../BossBase';
import { BossPhase, Tile } from '../common';
import { dissolveTiles } from '../lion/rules';
import { shriekPlan } from '../mandrake/rules';
import { OuroborosLine, pickOuroborosLine } from './lines';
import {
  OUROBOROS_NAME, OUROBOROS_HP, OuroborosSkill, cycleMs, ouroborosCooldown, ouroborosDamage, pickOuroborosSkill, ringTiles, weakAt,
} from './rules';

const TEAL = 0x3fa58f;

export class OuroborosController extends BossBase {
  readonly name = OUROBOROS_NAME;
  private lastSkill: OuroborosSkill | null = null;
  private cycleIndex = 0;
  private cycleLeftMs = cycleMs(1);
  private readonly glow: Phaser.GameObjects.Image;

  constructor(scene: MainScene) {
    super(scene, {
      prefix: 'ouro',
      spawn: { x: CONFIG.cols - 2, y: CONFIG.rows - 2 },
      maxHp: OUROBOROS_HP,
      moveIntervalMs: 1200,
      firstCastMs: 3000,
      furiousTint: TEAL,
      furiousFlash: [40, 120, 110],
    });
    // o brilho do elemento da vez, atrás do corpo
    this.glow = scene.add.image(this.sprite.x, this.sprite.y - 10, 'menu_puff')
      .setBlendMode(Phaser.BlendModes.ADD).setScale(1.9).setDepth(8).setAlpha(0.5);
    this.refreshGlow();
    scene.tweens.add({ targets: this.glow, alpha: 0.25, scale: 1.65, duration: 700, yoyo: true, repeat: -1 });
  }

  /** O elemento que o fere agora (e que ele veste). */
  get weak(): ElementId {
    return weakAt(this.cycleIndex);
  }

  private refreshGlow(): void {
    this.glow.setTint(ELEMENTS[this.weak].color);
  }

  protected damageFor(element: ElementId): number {
    return ouroborosDamage(element, this.weak);
  }

  protected cooldownFor(phase: BossPhase): number {
    return ouroborosCooldown(phase);
  }

  protected lineFor(kind: string): string {
    return pickOuroborosLine(kind as OuroborosLine);
  }

  protected onDefeated(): void {
    this.scene.onBossDefeated();
  }

  protected onResisted(element: ElementId, damage: number): void {
    // o oposto no ciclo: ele o devora
    this.scene.floatingText(this.gridX, this.gridY, damage < 0 ? `+${-damage}` : 'DEVORADO', '#b0bec5');
    void element;
  }

  protected defeat(): void {
    this.scene.tweens.killTweensOf(this.glow);
    this.glow.destroy();
    super.defeat();
  }

  update(delta: number): void {
    if (this.state !== 'defeated') {
      this.glow.setPosition(this.sprite.x, this.sprite.y - 10);
      this.cycleLeftMs -= delta;
      if (this.cycleLeftMs <= 0) this.turn();
    }
    super.update(delta);
  }

  // A roda gira: a fraqueza passa para o elemento seguinte, com um aviso claro.
  private turn(): void {
    this.cycleIndex++;
    this.cycleLeftMs = cycleMs(this.phase);
    this.refreshGlow();
    const el = ELEMENTS[this.weak];
    this.scene.floatingText(this.gridX, this.gridY - 1, `FRACO A ${el.name}`, '#' + el.glow.toString(16).padStart(6, '0'), 12, 1100);
    this.scene.play('powerup');
  }

  // ---------- habilidades ----------

  protected castNext(): void {
    const skill = pickOuroborosSkill(this.phase, this.lastSkill);
    this.lastSkill = skill;
    this.state = 'casting';
    this.say(skill);
    switch (skill) {
      case 'ring': this.castRing(); break;
      case 'bite': this.castBite(); break;
      case 'cycle': this.castCycle(); break;
    }
  }

  // Dois anéis que se abrem a partir da casa dele, um depois do outro (raio 2 e raio 4). O elemento é o da vez.
  private castRing(): void {
    this.setPose('cast');
    this.scene.play('powerup');
    const at: Tile = { x: this.gridX, y: this.gridY };
    const element = this.weak;
    const waves = [ringTiles(at, 2, this.isOpen), ringTiles(at, 4, this.isOpen)];
    const ms = CONFIG.bossTelegraphMs + 200;
    const gap = 650;
    waves.forEach((tiles, i) => {
      this.after(i * gap, () => { if (this.state !== 'defeated') this.telegraph(tiles, element, undefined, ms); });
      this.after(i * gap + ms, () => { if (this.state !== 'defeated') this.explode(tiles, element); });
    });
    this.after(gap + ms, () => this.endCast());
  }

  // Uma mordida em linha (ou, furioso, em cruz) que passa pela casa em que a Roo está.
  private castBite(): void {
    this.setPose('cast');
    this.scene.play('powerup');
    const target = this.targetTile();
    const element = this.weak;
    const tiles = dissolveTiles(target, Math.random() < 0.5, this.phase === 2, this.isOpen);
    const ms = CONFIG.bossTelegraphMs + 100;
    this.telegraph(tiles, element, target, ms);
    this.after(ms, () => { if (this.state !== 'defeated') this.explode(tiles, element); });
    this.after(ms - 100, () => this.endCast());
  }

  // O Ciclo: o elemento vira de uma vez e quase todo o campo é atingido; as casas verdes são seguras.
  private castCycle(): void {
    this.setPose('cast');
    this.scene.play('powerup');
    this.turn();
    const element = this.weak;
    const target = this.targetTile();
    const open: Tile[] = [];
    for (let y = 1; y < CONFIG.rows - 1; y++) {
      for (let x = 1; x < CONFIG.cols - 1; x++) if (this.isOpen(x, y)) open.push({ x, y });
    }
    const { danger, safe } = shriekPlan(open, target, 3);
    const ms = 1900;
    this.telegraph(danger, element, undefined, ms);
    this.markTiles(safe, 0x9be564, ms);
    this.after(ms, () => { if (this.state !== 'defeated') this.explode(danger, element); });
    this.after(ms + 200, () => this.endCast());
  }
}
