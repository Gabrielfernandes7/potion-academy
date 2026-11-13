// Quimera de Mercúrio, chefe do Vale: habilidades e falas. O resto (vida, fases, tempos, avisos,
// dano e derrota) vem de BossBase. As regras puras estão em rules.ts e são testadas.
//
// É de mercúrio (azougue): a água escorre por ela (imune) e a terra a prende (fraqueza).
// Habilidades (cada uma mostra um aviso no chão antes de acontecer; ver docs/03-mundo.md):
//   spit  : cospe um jato de prata em linha reta, passando pela casa em que você está.
//   drops : gotas de prata caem, uma depois da outra; a primeira, na sua casa.
//   slide : vira poça (protegida), escorre e ressurge perto de você, com um respingo.
//   wave  : (só furiosa) uma onda varre o campo em faixas; a linha verde fica seca.
import { CONFIG, ElementId } from '../../../../config';
import type { MainScene } from '../../../../scenes/MainScene';
import { BossBase, center } from '../BossBase';
import { BossPhase, Tile, blastTiles } from '../common';
import { rainTargets } from '../belladonna/rules';
import { ChimeraLine, pickChimeraLine } from './lines';
import {
  CHIMERA_DAMAGE, CHIMERA_HP, CHIMERA_NAME, ChimeraSkill,
  chimeraCooldown, pickChimeraSkill, slideDestination, spitTiles, waveBands, waveGapRow,
} from './rules';

const SILVER = 0xb0bec5;
const BLUE = 0x90caf9;
const DROP_STEP_MS = 230;
const WAVE_STEP_MS = 420;

export class ChimeraController extends BossBase {
  readonly name = CHIMERA_NAME;
  private lastSkill: ChimeraSkill | null = null;

  constructor(scene: MainScene) {
    super(scene, {
      prefix: 'chimera',
      spawn: { x: CONFIG.cols - 2, y: CONFIG.rows - 2 },
      maxHp: CHIMERA_HP,
      moveIntervalMs: 1000,
      firstCastMs: 2800,
      furiousTint: BLUE,
      furiousFlash: [60, 90, 140],
    });
  }

  protected damageFor(element: ElementId): number {
    return CHIMERA_DAMAGE[element];
  }

  protected cooldownFor(phase: BossPhase): number {
    return chimeraCooldown(phase);
  }

  protected lineFor(kind: string): string {
    return pickChimeraLine(kind as ChimeraLine);
  }

  protected onDefeated(): void {
    this.scene.onBossDefeated();
  }

  // A água escorre por ela: mostra "ESCORRE" em vez de "RESISTE".
  protected onResisted(_element: ElementId, _damage: number): void {
    this.scene.floatingText(this.gridX, this.gridY, 'ESCORRE', '#b0bec5');
  }

  // ---------- habilidades ----------

  protected castNext(): void {
    const skill = pickChimeraSkill(this.phase, this.lastSkill);
    this.lastSkill = skill;
    this.state = 'casting';
    this.say(skill);
    switch (skill) {
      case 'spit': this.castSpit(); break;
      case 'drops': this.castDrops(); break;
      case 'slide': this.castSlide(); break;
      case 'wave': this.castWave(); break;
    }
  }

  private castSpit(): void {
    this.setPose('cast');
    this.scene.play('powerup');
    const from = { x: this.gridX, y: this.gridY };
    const target = this.scene.playerTile();
    const tiles = spitTiles(from, target, this.isOpen);
    // furiosa: um segundo jato, do outro lado da jogadora, em cruz com o primeiro
    if (this.phase === 2) {
      const cross = { x: target.x - (target.y - from.y), y: target.y + (target.x - from.x) };
      for (const t of spitTiles(target, cross, this.isOpen)) {
        if (!tiles.some(o => o.x === t.x && o.y === t.y)) tiles.push(t);
      }
    }
    if (tiles.length === 0) { this.endCast(); return; }
    const ms = CONFIG.bossTelegraphMs;
    this.telegraph(tiles, 'water', target, ms);
    this.after(ms, () => { if (this.state !== 'defeated') this.explode(tiles, 'water'); });
    this.after(ms - 200, () => this.endCast());
  }

  private castDrops(): void {
    this.setPose('cast');
    this.scene.play('powerup');
    const count = this.phase === 2 ? 5 : 3;
    const targets = rainTargets(this.scene.playerTile(), count, this.isOpen);
    targets.forEach((t, i) => {
      const ms = CONFIG.bossTelegraphMs - 100 + i * DROP_STEP_MS;
      this.telegraph([t], 'water', t, ms);
      this.after(ms, () => { if (this.state !== 'defeated') this.explode([t], 'water'); });
    });
    this.after(CONFIG.bossTelegraphMs + (targets.length - 1) * DROP_STEP_MS, () => this.endCast());
  }

  private castSlide(): void {
    const player = this.scene.playerTile();
    const dest = slideDestination(player, this.isOpen);
    if (!dest) { this.state = 'idle'; this.cooldownMs = 1000; return; }
    this.state = 'blinking';
    this.hidden = true;
    this.scene.play('door');
    this.burst(this.sprite.x, this.sprite.y - 10, 'menu_puff', [SILVER, 0xffffff], 12, 60);
    this.scene.tweens.add({ targets: this.sprite, alpha: 0, duration: 300 });
    const tiles = blastTiles(dest.x, dest.y, 1, this.isOpen);
    const ms = 1400;
    this.telegraph(tiles, 'water', dest, ms);
    this.after(ms, () => {
      if (this.state === 'defeated') return;
      this.gridX = dest.x;
      this.gridY = dest.y;
      this.sprite.setPosition(center(dest.x), center(dest.y));
      this.burst(this.sprite.x, this.sprite.y - 10, 'menu_spark', [SILVER, BLUE, 0xffffff], 16, 120);
      this.scene.tweens.add({ targets: this.sprite, alpha: 1, duration: 250 });
      this.explode(tiles, 'water');
      this.hidden = false;
      this.state = 'idle';
      this.cooldownMs = this.cooldownFor(this.phase);
    });
  }

  private castWave(): void {
    this.setPose('cast');
    this.scene.play('powerup');
    const player: Tile = this.scene.playerTile();
    const gapY = waveGapRow(player, CONFIG.rows, this.isOpen);
    const fromLeft = this.sprite.x > (CONFIG.cols * CONFIG.tile) / 2; // varre a partir do lado oposto ao dela
    const bands = waveBands(CONFIG.cols, CONFIG.rows, fromLeft, gapY, this.isOpen);
    const safe: Tile[] = [];
    for (let x = 1; x < CONFIG.cols - 1; x++) if (this.isOpen(x, gapY)) safe.push({ x, y: gapY });
    const first = 1300;
    this.markTiles(safe, 0x9be564, first + (bands.length - 1) * WAVE_STEP_MS);
    bands.forEach((band, i) => {
      const ms = first + i * WAVE_STEP_MS;
      this.telegraph(band, 'water', undefined, ms);
      this.after(ms, () => { if (this.state !== 'defeated') this.explode(band, 'water'); });
    });
    this.after(first + (bands.length - 1) * WAVE_STEP_MS + 200, () => this.endCast());
  }
}
