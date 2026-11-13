// Experimento "Roo de fogo": um mapa em miniatura para testar a transformação da Roo (tecla T), a
// habilidade Brasas, a vida contínua com fraqueza e resistência, e o dano nos bonecos de treino.
// Abra /lab.html?exp=fire-roo com `npm run dev`. Não entra no build. As regras estão em game/rooFire.ts
// (puras, com teste); aqui só ficam o desenho e a entrada.
import Phaser from 'phaser';
import { generateTextures } from '../../textures';
import { makeFireRoo, type FireDir, type FireIntensity } from '../../textures/rooFire';
import { ROO_HEAD_ROOM, rooOriginY } from '../../textures/rooGeometry';
import { damageTo } from '../../game/entities/damage';
import { PROFILES } from '../../game/entities/profiles';
import { ROO_MAX_HP, hpBarView } from '../../game/entities/roo';
import type { ElementId } from '../../config';
import {
  EMBER_TICK_MS, EmberField, FORM_COOLDOWN_MS, FORM_MS, RooForm, boostedDamage, emberDamage, profileOf,
  type FormStage,
} from '../../game/forms';
import { damageToRoo } from '../../game/entities/roo';

const rooHit = (element: ElementId, stage: FormStage): number => damageToRoo(element, profileOf('fire', stage));
import type { LabExperiment } from '../types';

const TILE = 40;
const COLS = 11;
const ROWS = 9;
const DIRS: FireDir[] = ['down', 'up', 'side'];
const ANIM_STEPS = 8; // fases do tremor da chama (0 a 7)
const ANIM_MS = 90; // tempo entre fases: a chama treme mesmo com a Roo parada
const INVULN_MS = 1200;
const BLAST: Record<'fire' | 'water', { radius: number; fuse: number; color: number }> = {
  fire: { radius: 2, fuse: 1600, color: 0xffd54f },
  water: { radius: 3, fuse: 2000, color: 0x64b5f6 },
};
const BLOCKS: Array<[number, number]> = [
  [3, 1], [5, 1], [7, 1], [1, 3], [3, 3], [7, 3], [9, 3],
  [1, 5], [3, 5], [7, 5], [9, 5], [3, 7], [5, 7], [7, 7],
];
const DUMMY_SPOTS: Array<[number, number]> = [[9, 1], [9, 7], [5, 3]];
const FIRE_DARK = 0xd6452f;
const FIRE_MID = 0xffa94d;

interface Cfg { stage: number; intensity: FireIntensity; manual: boolean }
interface Bomb { x: number; y: number; element: 'fire' | 'water'; g: Phaser.GameObjects.Graphics; timer: Phaser.Time.TimerEvent }
interface Dummy { x: number; y: number; hp: number; max: number; sprite: Phaser.GameObjects.Image; bar: Phaser.GameObjects.Graphics; lastBurn: number }

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function readControls(): Cfg {
  const stage = Number((byId<HTMLSelectElement>('stage-select'))?.value ?? 4);
  const intensity = (byId<HTMLSelectElement>('intensity-select')?.value ?? 'high') as FireIntensity;
  const manual = byId<HTMLInputElement>('manual-check')?.checked ?? false;
  return { stage, intensity, manual };
}

const NAMES: Record<ElementId, string> = { fire: 'Fogo', water: 'Água', earth: 'Terra', air: 'Éter' };

class FireRooScene extends Phaser.Scene {
  private cfg!: Cfg;
  private player!: Phaser.GameObjects.Sprite;
  private gx = 1;
  private gy = 1;
  private dir: FireDir = 'down';
  private flip = false;
  private anim = 0; // fase de 0 a 7
  private busy = false;
  private walls = new Set<string>();
  private blocks = new Map<string, Phaser.GameObjects.Image>();
  private embers = new EmberField();
  private form = new RooForm();
  private lastStage: FormStage = 0;
  private hp = ROO_MAX_HP;
  private invuln = 0;
  private dummies: Dummy[] = [];
  private emberGfx!: Phaser.GameObjects.Graphics;
  private bombs: Bomb[] = [];
  private blasts = 0;
  private hudAcc = 0;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private bombKey!: Phaser.Input.Keyboard.Key;
  private waterKey!: Phaser.Input.Keyboard.Key;
  private tKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super('FireRoo');
  }

  create(): void {
    generateTextures(this);
    this.cfg = readControls();
    this.buildMap();
    this.buildFire();
    this.emberGfx = this.add.graphics().setDepth(1);
    this.buildDummies();
    this.player = this.add.sprite(this.gx * TILE + TILE / 2, this.gy * TILE + TILE / 2, 'roo_down_0')
      .setOrigin(0.5, rooOriginY(TILE))
      .setDepth(5);
    this.refresh();

    // tremor contínuo: a chama vibra mesmo parada; o corpo anda quando a Roo se move
    this.time.addEvent({
      delay: ANIM_MS,
      loop: true,
      callback: () => {
        this.anim = (this.anim + 1) % ANIM_STEPS;
        this.refresh();
      },
    });

    const kb = this.input.keyboard;
    if (kb) {
      this.cursors = kb.createCursorKeys();
      this.bombKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.waterKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.tKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.T);
    }

    byId('export-btn')?.addEventListener('click', () => this.exportGrid());
    byId('stage-select')?.addEventListener('change', () => this.applySettings());
    byId('intensity-select')?.addEventListener('change', () => this.applySettings());
    byId('manual-check')?.addEventListener('change', () => this.applySettings());
    for (const el of ['fire', 'water', 'earth', 'air'] as const) {
      byId(`hit-${el}`)?.addEventListener('click', () => this.hurtRoo(el));
    }
    byId('heal-btn')?.addEventListener('click', () => { this.hp = ROO_MAX_HP; this.setStatus(); });
    byId('transform-btn')?.addEventListener('click', () => this.transform());
    this.setStatus();
  }

  update(_time: number, delta: number): void {
    const now = this.time.now;
    this.form.tick(delta);
    this.invuln = Math.max(0, this.invuln - delta);
    const stage = this.form.stage;
    if (stage !== this.lastStage) { this.lastStage = stage; this.refresh(); }
    for (const b of this.bombs) this.drawBomb(b, now);
    this.drawEmbers(now);
    this.burnDummies(now);
    this.player.setAlpha(this.invuln > 0 && Math.floor(now / 90) % 2 === 0 ? 0.45 : 1);
    this.hudAcc += delta;
    if (this.hudAcc >= 100) { this.hudAcc = 0; this.setStatus(); }
    if (this.cursors) {
      if (this.cursors.left.isDown) this.move(-1, 0);
      else if (this.cursors.right.isDown) this.move(1, 0);
      else if (this.cursors.up.isDown) this.move(0, -1);
      else if (this.cursors.down.isDown) this.move(0, 1);
    }
    if (this.bombKey && Phaser.Input.Keyboard.JustDown(this.bombKey)) this.placeBomb('fire');
    if (this.waterKey && Phaser.Input.Keyboard.JustDown(this.waterKey)) this.placeBomb('water');
    if (this.tKey && Phaser.Input.Keyboard.JustDown(this.tKey)) this.transform();
  }

  private buildMap(): void {
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        this.add.image(x * TILE, y * TILE, (x + y) % 2 === 0 ? 'floor1' : 'floor2').setOrigin(0, 0);
        const border = x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1;
        const pillar = x % 2 === 0 && y % 2 === 0;
        if (border || pillar) {
          this.walls.add(`${x},${y}`);
          this.add.image(x * TILE, y * TILE, 'wall').setOrigin(0, 0).setDepth(1);
        }
      }
    }
    for (const [x, y] of BLOCKS) {
      this.blocks.set(`${x},${y}`, this.add.image(x * TILE, y * TILE, 'block').setOrigin(0, 0).setDepth(2));
    }
  }

  // Bonecos de treino: sapos parados que mostram o dano de cada golpe e se levantam ao cair.
  private buildDummies(): void {
    for (const [x, y] of DUMMY_SPOTS) {
      const max = PROFILES.frog.maxHp;
      this.dummies.push({
        x, y, hp: max, max, lastBurn: 0,
        sprite: this.add.image(x * TILE + TILE / 2, y * TILE + TILE / 2, 'enemy').setDepth(4),
        bar: this.add.graphics().setDepth(6),
      });
    }
    this.dummies.forEach(d => this.drawDummyBar(d));
  }

  private drawDummyBar(d: Dummy): void {
    d.bar.clear();
    const w = TILE - 10;
    const x = d.x * TILE + 5;
    const y = d.y * TILE + 2;
    d.bar.fillStyle(0x000000, 0.65).fillRect(x, y, w, 4);
    d.bar.fillStyle(0x76d83a, 1).fillRect(x, y, w * (d.hp / d.max), 4);
  }

  // Textura da Roo de fogo para cada estágio (1 a 4), direção, quadro do corpo (0 a 3) e fase do tremor (0 a 7).
  private buildFire(): void {
    for (let stage = 1; stage <= 4; stage++) {
      for (const dir of DIRS) {
        for (let fr = 0; fr < 4; fr++) {
          const src = this.textures.get(`roo_${dir}_${fr}`).getSourceImage() as HTMLCanvasElement;
          for (let t = 0; t < ANIM_STEPS; t++) {
            const key = `lab_${stage}_${dir}_${fr}_${t}`;
            if (this.textures.exists(key)) this.textures.remove(key);
            this.textures.addCanvas(key, makeFireRoo(src, { dir, frame: fr, tick: t, intensity: this.cfg.intensity, stage }));
          }
        }
      }
    }
  }

  // O estágio que aparece: o da transformação (T) ou, no modo manual, o escolhido no painel.
  private shownStage(): number {
    return this.cfg.manual ? this.cfg.stage : this.form.stage;
  }

  // Parada, o corpo fica no quadro 0 (sem bob nem respiração): só a chama treme.
  // Andando, o corpo usa o quadro 0 a 3 do passo.
  private refresh(): void {
    const fr = this.busy ? this.anim % 4 : 0;
    const stage = this.shownStage();
    const key = stage === 0
      ? `roo_${this.dir}_${fr}`
      : `lab_${stage}_${this.dir}_${fr}_${this.anim}`;
    this.player.setTexture(key);
    this.player.setFlipX(this.dir === 'side' && this.flip);
  }

  private applySettings(): void {
    this.cfg = readControls();
    this.buildFire();
    this.refresh();
  }

  private transform(): void {
    if (this.form.start('fire')) {
      this.embers.clear();
      this.say(this.player.x, this.player.y - 30, 'ROO FIRE!', '#ffa94d');
      this.refresh();
    } else {
      this.say(this.player.x, this.player.y - 30, this.form.active ? 'já transformada' : 'esperando...', '#b0bec5');
    }
  }

  private free(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return false;
    const k = `${x},${y}`;
    return !this.walls.has(k) && !this.blocks.has(k) && !this.bombs.some(b => b.x === x && b.y === y);
  }

  private move(dx: number, dy: number): void {
    if (this.busy) return;
    this.dir = dy < 0 ? 'up' : dy > 0 ? 'down' : 'side';
    if (dx !== 0) this.flip = dx < 0;
    const nx = this.gx + dx;
    const ny = this.gy + dy;
    if (!this.free(nx, ny) || this.dummies.some(d => d.x === nx && d.y === ny)) {
      this.refresh();
      return;
    }
    this.gx = nx;
    this.gy = ny;
    this.busy = true;
    this.refresh();
    this.tweens.add({
      targets: this.player,
      x: nx * TILE + TILE / 2,
      y: ny * TILE + TILE / 2,
      duration: 150,
      onComplete: () => {
        this.busy = false;
        this.refresh();
      },
    });
  }

  private placeBomb(element: 'fire' | 'water'): void {
    const { gx, gy } = this;
    if (this.bombs.some(b => b.x === gx && b.y === gy)) return;
    const g = this.add.graphics().setDepth(3);
    const bomb: Bomb = { x: gx, y: gy, element, g, timer: this.time.delayedCall(BLAST[element].fuse, () => this.explode(bomb)) };
    this.bombs.push(bomb);
  }

  private drawBomb(b: Bomb, now: number): void {
    const cx = b.x * TILE + TILE / 2;
    const cy = b.y * TILE + TILE / 2 + 2;
    const water = b.element === 'water';
    b.g.clear();
    b.g.fillStyle(water ? 0x0d2a4a : 0x1c1410);
    b.g.fillCircle(cx, cy, 10);
    b.g.fillStyle(water ? 0x1e5a99 : 0x3a1a10);
    b.g.fillCircle(cx - 3, cy - 3, 3);
    b.g.fillStyle(Math.floor(now / 150) % 2 === 0 ? (water ? 0x90caf9 : FIRE_MID) : (water ? 0x42a5f5 : FIRE_DARK));
    b.g.fillRect(cx + 4, cy - 12, 3, 3);
  }

  private explode(b: Bomb): void {
    this.bombs = this.bombs.filter(x => x !== b);
    b.g.destroy();
    const { radius, color } = BLAST[b.element];
    const tiles: Array<{ x: number; y: number }> = [{ x: b.x, y: b.y }];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      for (let k = 1; k <= radius; k++) {
        const x = b.x + dx * k;
        const y = b.y + dy * k;
        const key = `${x},${y}`;
        if (this.walls.has(key)) break;
        tiles.push({ x, y });
        const blk = this.blocks.get(key);
        if (blk) {
          blk.destroy();
          this.blocks.delete(key);
          break;
        }
      }
    }
    const stage = this.form.stage;
    for (const t of tiles) {
      const flash = this.add.rectangle(t.x * TILE + TILE / 2, t.y * TILE + TILE / 2, TILE, TILE, color, 0.85).setDepth(4);
      this.tweens.add({ targets: flash, alpha: 0, duration: 350, onComplete: () => flash.destroy() });
    }
    // habilidade Brasas: a água apaga; o fogo, transformada, deixa brasas
    if (b.element === 'water') {
      if (this.embers.douse(tiles) > 0) this.say(b.x * TILE + TILE / 2, b.y * TILE, 'APAGADAS', '#a8e6f5');
    } else {
      this.embers.ignite(tiles, this.time.now, stage);
    }
    // dano nos bonecos: tabela do sapo, com o bônus da transformação para o fogo
    for (const d of this.dummies) {
      if (!tiles.some(t => t.x === d.x && t.y === d.y)) continue;
      const base = damageTo(PROFILES.frog, b.element);
      this.hitDummy(d, boostedDamage('fire', base, b.element, stage), base);
    }
    // a Roo também se machuca com a própria explosão, pelo perfil do degrau atual
    if (tiles.some(t => t.x === this.gx && t.y === this.gy)) this.hurtRoo(b.element);
    this.blasts++;
    this.setStatus();
  }

  private hitDummy(d: Dummy, damage: number, base: number): void {
    if (damage <= 0) { this.say(d.sprite.x, d.sprite.y - 10, 'IMUNE', '#b0bec5'); return; }
    d.hp = Math.max(0, d.hp - damage);
    this.say(d.sprite.x, d.sprite.y - 10, damage > base ? `-${damage} (${base}+${damage - base})` : `-${damage}`, damage > base ? '#ffa94d' : '#ff8a80');
    this.drawDummyBar(d);
    if (d.hp <= 0) {
      this.time.delayedCall(700, () => { d.hp = d.max; this.drawDummyBar(d); });
      d.sprite.setAlpha(0.3);
      this.time.delayedCall(700, () => d.sprite.setAlpha(1));
    }
  }

  private hurtRoo(element: ElementId): void {
    if (this.invuln > 0) return;
    const damage = rooHit(element, this.form.stage);
    this.hp = Math.max(0, this.hp - damage);
    this.invuln = INVULN_MS;
    this.say(this.player.x, this.player.y - 30, `-${damage}`, '#ff8a80');
    if (this.hp <= 0) { this.hp = ROO_MAX_HP; this.say(this.player.x, this.player.y - 44, 'levantou de novo', '#b0bec5'); }
    this.setStatus();
  }

  // As brasas queimam quem está em cima, de tempos em tempos. A Roo nunca se queima nelas.
  private burnDummies(now: number): void {
    for (const d of this.dummies) {
      if (!this.embers.lit(d.x, d.y, now) || now - d.lastBurn < EMBER_TICK_MS) continue;
      d.lastBurn = now;
      this.hitDummy(d, emberDamage(PROFILES.frog), emberDamage(PROFILES.frog));
    }
  }

  private say(x: number, y: number, msg: string, color: string): void {
    const t = this.add.text(x, y, msg, { fontFamily: 'Nunito, sans-serif', fontSize: '12px', color, fontStyle: 'bold', backgroundColor: '#17110d', padding: { x: 3, y: 1 } })
      .setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: t, y: y - 18, alpha: 0, duration: 1100, onComplete: () => t.destroy() });
  }

  // Brasas em xadrez de pixels que alternam entre quadros (sem degradê). Piscam quando estão acabando.
  private drawEmbers(now: number): void {
    this.emberGfx.clear();
    const phase = Math.floor(now / 180);
    for (const e of this.embers.active(now)) {
      if (e.left < 600 && Math.floor(now / 100) % 2 === 0) continue;
      for (let py = 0; py < 4; py++) {
        for (let px = 0; px < 4; px++) {
          if ((px + py + phase) % 2 !== 0) continue;
          this.emberGfx.fillStyle((px + py) % 3 === 0 ? FIRE_DARK : FIRE_MID, 0.75);
          this.emberGfx.fillRect(e.x * TILE + px * 10, e.y * TILE + py * 10, 10, 10);
        }
      }
    }
  }

  // Folha: uma linha por estágio (0 a 4) e uma coluna por fase do tremor. Baixa em PNG, escala 3×.
  private exportGrid(): void {
    const SCALE = 3;
    const cw = TILE * SCALE;
    const ch = (TILE + ROO_HEAD_ROOM) * SCALE;
    const canvas = document.createElement('canvas');
    canvas.width = ANIM_STEPS * cw;
    canvas.height = 5 * ch;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    const src = this.textures.get('roo_down_0').getSourceImage() as HTMLCanvasElement;
    for (let stage = 0; stage < 5; stage++) {
      for (let t = 0; t < ANIM_STEPS; t++) {
        const fire = makeFireRoo(src, { dir: 'down', frame: 0, tick: t, intensity: this.cfg.intensity, stage });
        ctx.drawImage(fire, t * cw, stage * ch, cw, ch);
      }
    }
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'roo-transformacao.png';
    a.click();
  }

  // Painel: vida, transformação e a tabela de dano do degrau atual.
  private setStatus(): void {
    const stage = this.form.stage;
    const view = hpBarView(this.hp, ROO_MAX_HP);
    const fill = byId('hp-fill');
    if (fill) {
      fill.style.width = `${view.ratio * 100}%`;
      fill.style.background = view.low ? '#ff7043' : '#e53935';
    }
    const set = (id: string, text: string): void => { const el = byId(id); if (el) el.textContent = text; };
    set('hp-text', `${this.hp}/${ROO_MAX_HP}`);
    let form = 'Normal. T para transformar.';
    if (this.form.active) form = `Roo Fire, estágio ${stage}: ${(this.form.remainingMs / 1000).toFixed(1)} s de ${FORM_MS / 1000} s`;
    else if (this.form.cooldownMs > 0) form = `Esperando: ${(this.form.cooldownMs / 1000).toFixed(0)} s de ${FORM_COOLDOWN_MS / 1000} s`;
    set('form-text', form);
    const bar = byId('form-fill');
    if (bar) bar.style.width = `${(this.form.active ? this.form.remainingMs / FORM_MS : 0) * 100}%`;
    const profile = profileOf('fire', stage);
    const list = (els: ElementId[]): string => (els.length ? els.map(e => NAMES[e]).join(', ') : 'nada');
    set('profile-text', `Fraca a: ${list(profile.weak)} · Resiste a: ${list(profile.resist)}`);
    for (const el of ['fire', 'water', 'earth', 'air'] as const) set(`hit-${el}`, `${NAMES[el]} (-${rooHit(el, stage)})`);
    set('status', `Explosões: ${this.blasts}`);
  }
}

const PANEL_HTML = `
      <h2>Vida da Roo</h2>
      <div style="background:#2a0f12;border:1px solid #ff8a80;border-radius:4px;height:14px;overflow:hidden"><div id="hp-fill" style="height:100%;width:100%;background:#e53935"></div></div>
      <p id="hp-text" class="tip" style="margin:4px 0">24/24</p>
      <p class="tip" style="margin:0 0 6px">Levar um golpe (mostra o dano do estágio atual):</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
        <button type="button" id="hit-fire">Fogo</button><button type="button" id="hit-water">Água</button>
        <button type="button" id="hit-earth">Terra</button><button type="button" id="hit-air">Éter</button>
      </div>
      <button type="button" id="heal-btn" style="margin-top:6px;width:100%">Curar tudo</button>

      <h2>Transformação</h2>
      <div style="background:#2a1a10;border:1px solid #ffa94d;border-radius:4px;height:10px;overflow:hidden"><div id="form-fill" style="height:100%;width:0%;background:#ffa94d"></div></div>
      <p id="form-text" class="tip" style="margin:4px 0">Normal. T para transformar.</p>
      <p id="profile-text" class="tip" style="margin:0 0 6px"></p>
      <button type="button" id="transform-btn" style="width:100%">Transformar (T)</button>

      <h2>Aparência</h2>
      <label class="check">
        <input type="checkbox" id="manual-check">
        Manual: ignorar a transformação e usar o estágio abaixo
      </label>
      <label>
        Estágio
        <select id="stage-select">
          <option value="0">0 · Original (capa roxa)</option>
          <option value="1">1 · Capa vermelha em degradê</option>
          <option value="2">2 · Chapéu em chama, varinha e olhos</option>
          <option value="3">3 · Manto em chamas e orelhas</option>
          <option value="4" selected>4 · Faíscas e brasas</option>
        </select>
      </label>
      <label>
        Intensidade
        <select id="intensity-select">
          <option value="low">Baixa</option>
          <option value="medium">Média</option>
          <option value="high" selected>Alta</option>
        </select>
      </label>

      <h2>Controles</h2>
      <ul>
        <li><kbd>setas</kbd> andar (passo por casa)</li>
        <li><kbd>Espaço</kbd> Poção de Fogo (explode em 1,6 s)</li>
        <li><kbd>A</kbd> Poção Aqua (alcance 3; apaga as brasas)</li>
        <li><kbd>T</kbd> transformar (12 s, esfria em 4 degraus)</li>
        <li>Os sapos de treino mostram o dano; a explosão machuca a Roo também.</li>
      </ul>
      <p class="tip">Forma de fogo: poções de fogo +50% (cai por degrau), resiste ao fogo, fraca à água, e a explosão deixa brasas que queimam inimigos. Valores de teste: a regra final ainda não está em <code>docs/</code>.</p>

      <h2>Exportar</h2>
      <button type="button" id="export-btn" style="font:inherit;font-weight:700;background:var(--accent);color:#fff;border:0;border-radius:6px;padding:8px 12px;cursor:pointer">Baixar folha da transformação (PNG)</button>
      <p class="tip">Linhas: estágios 0 a 4. Colunas: as 8 fases do tremor. Escala 3×.</p>

      <h2>Resultado</h2>
      <p id="status">Explosões: 0</p>
`;

export const fireRooExperiment: LabExperiment = {
  id: 'fire-roo',
  title: 'Roo de fogo',
  summary: 'A transformação da Roo (T), as Brasas e a vida com fraqueza ao fogo, num mapa em miniatura.',
  size: { cols: COLS, rows: ROWS, tile: TILE },
  panelHtml: PANEL_HTML,
  scene: FireRooScene,
};
