// Mandrágora, feiticeira do jardim: habilidades e falas. O resto (vida, fases, tempos, avisos,
// dano e derrota) vem de BossBase. As regras puras estão em mandrake.ts e são testadas.
//
// Ela domina terra e água (a terra não a machuca; a água a cura) e teme o fogo.
// Habilidades (cada uma mostra um aviso no chão antes de acontecer; ver docs/03-mundo.md):
//   roots  : raízes de terra sobem na linha (ou coluna) em que você está.
//   tide   : anéis de água se expandem a partir dela, um depois do outro; uma faixa fica seca.
//   burrow : some no chão e ressurge onde você estava, com um abalo de terra. Depois de
//            ressurgir fica EXPOSTA por um tempo: leva dano extra. É a hora de atacar.
//   shriek : (só furiosa) um grito que atinge quase tudo; casas verdes são seguras.
//   sprouts: (só furiosa) faz brotar flores do mal.
import { CONFIG, ElementId } from '../../../../config';
import type { MainScene } from '../../../../scenes/MainScene';
import { BossBase, center } from '../BossBase';
import { BossPhase, Tile, blastTiles } from '../common';
import { MandrakeLine, pickMandrakeLine } from './lines';
import {
  MANDRAKE_DAMAGE, MANDRAKE_HP, MANDRAKE_NAME, MandrakeSkill,
  lineTiles, mandrakeCooldown, pickMandrakeSkill, ringTiles, shriekPlan,
} from './rules';

const GREEN = 0x9be564;
const EXPOSED_MS = 2400;
const MAX_SPROUTS = 3;

export class MandrakeController extends BossBase {
  readonly name = MANDRAKE_NAME;
  private lastSkill: MandrakeSkill | null = null;
  private exposedMs = 0;

  constructor(scene: MainScene) {
    super(scene, {
      prefix: 'mandrake',
      spawn: { x: CONFIG.cols - 2, y: 1 },
      maxHp: MANDRAKE_HP,
      moveIntervalMs: 1300,
      firstCastMs: 3000,
      furiousTint: GREEN,
    });
  }

  protected damageFor(element: ElementId): number {
    // exposta (depois de Cavar): +2 de dano em qualquer golpe
    return MANDRAKE_DAMAGE[element] + (this.exposedMs > 0 ? 2 : 0);
  }

  protected cooldownFor(phase: BossPhase): number {
    return mandrakeCooldown(phase);
  }

  protected lineFor(kind: string): string {
    return pickMandrakeLine(kind as MandrakeLine);
  }

  protected onDefeated(): void {
    this.scene.onBossDefeated();
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
    const canSprout = this.scene.enemySystem.countEnemies('flower') < MAX_SPROUTS;
    const skill = pickMandrakeSkill(this.phase, this.lastSkill, canSprout);
    this.lastSkill = skill;
    this.state = 'casting';
    this.say(skill);
    switch (skill) {
      case 'roots': this.castRoots(); break;
      case 'tide': this.castTide(); break;
      case 'burrow': this.castBurrow(); break;
      case 'shriek': this.castShriek(); break;
      case 'sprouts': this.castSprouts(); break;
    }
  }

  private castRoots(): void {
    this.setPose('cast');
    this.scene.play('powerup');
    const target = this.scene.playerTile();
    const horizontal = Math.random() < 0.5;
    const tiles = lineTiles(target.x, target.y, horizontal, this.isOpen);
    // furiosa: raízes nos dois sentidos, em cruz
    if (this.phase === 2) {
      for (const t of lineTiles(target.x, target.y, !horizontal, this.isOpen)) {
        if (!tiles.some(o => o.x === t.x && o.y === t.y)) tiles.push(t);
      }
    }
    const ms = 1300;
    this.telegraph(tiles, 'earth', target, ms);
    this.after(ms, () => { if (this.state !== 'defeated') this.explode(tiles, 'earth'); });
    this.after(ms - 200, () => this.endCast());
  }

  private castTide(): void {
    this.setPose('cast');
    this.scene.play('powerup');
    const center0 = { x: this.gridX, y: this.gridY };
    const gap = Math.random() < 0.5 ? 'vertical' : 'horizontal';
    const rings = this.phase === 2 ? [2, 3, 4, 5] : [2, 3, 4];
    rings.forEach((d, i) => {
      const tiles = ringTiles(center0, d, this.isOpen, gap);
      const ms = 1100 + i * 480;
      this.telegraph(tiles, 'water', undefined, ms);
      this.after(ms, () => { if (this.state !== 'defeated') this.explode(tiles, 'water'); });
    });
    this.after(1100 + (rings.length - 1) * 480 + 200, () => this.endCast());
  }

  private castBurrow(): void {
    this.state = 'blinking';
    this.hidden = true;
    this.scene.play('door');
    this.burst(this.sprite.x, this.sprite.y - 10, 'menu_puff', [0x8d6e63, 0xffffff], 12, 60);
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
      this.burst(this.sprite.x, this.sprite.y - 10, 'menu_spark', [0x8d6e63, GREEN, 0xffffff], 16, 120);
      this.scene.tweens.add({ targets: this.sprite, alpha: 1, duration: 250 });
      this.explode(tiles, 'earth');
      this.hidden = false;
      this.state = 'idle';
      // exposta: leva dano extra e demora a agir de novo
      this.exposedMs = EXPOSED_MS;
      this.sprite.setTint(0xffe0a0);
      this.scene.floatingText(this.gridX, this.gridY - 1, 'EXPOSTA!', '#ffd54f');
      this.cooldownMs = EXPOSED_MS;
    });
  }

  private castShriek(): void {
    this.setPose('cast');
    this.scene.play('powerup');
    const player = this.scene.playerTile();
    const open: Tile[] = [];
    for (let y = 1; y < CONFIG.rows - 1; y++) {
      for (let x = 1; x < CONFIG.cols - 1; x++) if (this.isOpen(x, y)) open.push({ x, y });
    }
    const { danger, safe } = shriekPlan(open, player, 3);
    const ms = 1900;
    this.telegraph(danger, 'air', undefined, ms);
    this.markTiles(safe, GREEN, ms);
    this.after(ms, () => {
      if (this.state === 'defeated') return;
      this.explode(danger, 'air');
    });
    this.after(ms + 200, () => this.endCast());
  }

  private castSprouts(): void {
    this.setPose('cast');
    this.scene.play('powerup');
    this.burst(this.sprite.x, this.sprite.y - 10, 'menu_puff', [GREEN, 0xffffff], 12, 80);
    for (let i = 0; i < 2; i++) this.scene.enemySystem.spawnEnemy('flower');
    this.after(900, () => this.endCast());
  }
}
