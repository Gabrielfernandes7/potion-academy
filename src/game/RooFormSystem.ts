// As transformações da Roo na partida (Phaser): a forma ativa, a habilidade (X), as brasas, as bolhas, o sprite
// e a luz. As regras puras estão em game/forms/ (testadas); aqui só há desenho, som e ligação com a cena.
// A MainScene cria um destes em create() e só delega: transform(), useAbility(), update(), boost(), onBlast().
import Phaser from 'phaser';
import { BOMB_ORDER, CONFIG, EMPTY, ElementId } from '../config';
import type { MainScene } from '../scenes/MainScene';
import { hitFx } from './entities/hitEffects';
import { canUseBomb, setForbiddenElement } from './loadout';
import {
  BUBBLE_STEP_MS, EmberField, iridescent, FORMS, FormId, FormView, RooForm, boostedDamage, bubbleAt, bubblePath, fireLight,
  flameTiles, formView, profileOf, trapMs,
} from './forms';
import { NO_FORM_LABEL, setAbilityLabel } from '../ui/abilityButton';
import { FORM_TREMOR_MS, FORM_TREMOR_STEPS, formTextureKey } from '../textures/rooFormTextures';
import type { DamageProfile } from './entities/damage';

const T = CONFIG.tile;
const center = (n: number): number => n * T + T / 2;

interface Bubble { path: Array<{ x: number; y: number }>; from: { x: number; y: number }; t: number }

export class RooFormSystem {
  readonly form = new RooForm();
  readonly embers = new EmberField();
  private bubbles: Bubble[] = [];
  private clockMs = 0; // relógio do jogo (não anda na pausa): as brasas e as bolhas contam o tempo por ele
  private tremor = 0;
  private tremorMs = 0;
  private applied = false;
  private hudMs = 0;
  private readonly emberGfx: Phaser.GameObjects.Graphics;
  private readonly bubbleGfx: Phaser.GameObjects.Graphics;

  constructor(private readonly scene: MainScene) {
    this.emberGfx = scene.add.graphics().setDepth(3);
    this.bubbleGfx = scene.add.graphics().setDepth(11);
    setForbiddenElement(null);
    setAbilityLabel(NO_FORM_LABEL);
  }

  // ---------- leitura ----------

  /** O perfil de dano da Roo agora (muda com a forma e o degrau). */
  profile(): DamageProfile {
    return profileOf(this.form.id, this.form.stage);
  }

  hudView(): FormView {
    return formView(this.form);
  }

  /** Bônus das poções do elemento da forma para as explosões da Roo (poção e Labareda). */
  boost(base: number, element: ElementId): number {
    return boostedDamage(this.form.id, base, element, this.form.stage);
  }

  // ---------- ações ----------

  /** Tecla da forma: transforma, se der. */
  transform(id: FormId): void {
    const s = this.scene;
    const def = FORMS[id];
    const { gridX, gridY } = s.player;
    if (!this.form.start(id)) {
      if (!this.form.active) s.floatingText(gridX, gridY - 1, 'ESFRIANDO...', '#bfae8a', 12, 900);
      return;
    }
    this.embers.clear();
    const warm = id === 'fire';
    s.floatingText(gridX, gridY - 1, `${def.nome.toUpperCase()}!`, warm ? '#ffa94d' : '#7fd6ff', 16, 1200);
    s.play('transform', def.element);
    s.cameras.main.flash(200, warm ? 255 : 90, warm ? 140 : 190, warm ? 40 : 255);
    this.syncForbidden();
    setAbilityLabel(def.ability.short);
    // a forma de fogo recusa a água: se era a poção escolhida, troca por uma que pode
    if (!canUseBomb(s.bombType)) {
      const next = BOMB_ORDER.find(b => canUseBomb(b));
      if (next) s.setBomb(next);
    }
    s.updateHud();
  }

  /** X: a habilidade da forma (Labareda ou Bolha de sabão). */
  useAbility(): void {
    const s = this.scene;
    const { gridX, gridY, dir } = s.player;
    const def = this.form.def;
    if (!def) {
      s.floatingText(gridX, gridY - 1, 'T: FOGO · Y: ÁGUA', '#bfae8a', 11, 1000);
      return;
    }
    if (s.player.moving) return;
    const open = (x: number, y: number): boolean => s.getTile(x, y) === EMPTY;
    const tiles = def.ability.id === 'flame'
      ? flameTiles({ x: gridX, y: gridY }, dir, def.ability.range, open)
      : bubblePath({ x: gridX, y: gridY }, dir, def.ability.range, open);
    if (tiles.length === 0) return;
    if (!this.form.useAbility()) {
      s.floatingText(gridX, gridY - 1, 'ESPERA...', '#bfae8a', 12, 700);
      return;
    }
    if (def.ability.id === 'flame') {
      s.bombSystem.flameBlast(tiles);
    } else {
      this.bubbles.push({ path: tiles, from: { x: gridX, y: gridY }, t: 0 });
      s.play('bubble');
    }
    s.updateHud();
  }

  /** Uma explosão da Roo: o fogo acende brasas (só na forma de fogo); a água apaga as brasas. */
  onBlast(tiles: Array<{ x: number; y: number }>, element: ElementId): void {
    const s = this.scene;
    if (element === 'fire' && this.form.id === 'fire') this.embers.ignite(tiles, this.clockMs, this.form.stage);
    else if (element === 'water' && this.embers.douse(tiles) > 0) {
      s.floatingText(tiles[0].x, tiles[0].y, 'APAGADAS', '#a8e6f5');
      s.play('fizzle');
    }
  }

  /** A bolha de um inimigo preso estourou (ou a bolha chegou ao fim): estalo e respingo. */
  pop(px: number, py: number): void {
    hitFx(this.scene, px, py, 'water');
    this.scene.play('pop');
  }

  // ---------- por quadro ----------

  update(delta: number): void {
    const s = this.scene;
    this.clockMs += delta;
    const was = { stage: this.form.stage, active: this.form.active, ability: this.form.abilityReady, id: this.form.id };
    this.form.tick(delta);
    this.tremorMs += delta;
    if (this.tremorMs >= FORM_TREMOR_MS) {
      this.tremorMs = 0;
      this.tremor = (this.tremor + 1) % FORM_TREMOR_STEPS;
    }
    if (was.active && !this.form.active && was.id) {
      s.play('formEnd', FORMS[was.id].element);
      setAbilityLabel(NO_FORM_LABEL);
    }
    this.syncForbidden();
    // as brasas queimam inimigos comuns que pisam nelas
    for (const enemy of [...s.enemySystem.enemies]) {
      if (enemy.alive && this.embers.lit(enemy.gridX, enemy.gridY, this.clockMs)) s.enemySystem.burnEnemy(enemy);
    }
    this.updateBubbles(delta);
    this.applyTexture();
    this.drawEmbers();
    this.drawBubbles();
    // Luz de chama: transformada em fogo, a névoa abre mais (a fase define a visão normal)
    if (s.fog && s.def.fog) s.fog.setRadius(s.def.fog.radius + (this.form.id === 'fire' ? fireLight(this.form.stage) : 0));
    // a HUD só é reenviada quando algo muda, e a cada 100 ms enquanto a barra anda
    this.hudMs += delta;
    const changed = was.stage !== this.form.stage || was.active !== this.form.active || was.ability !== this.form.abilityReady;
    if (changed || ((this.form.active || this.form.cooldownMs > 0) && this.hudMs >= 100)) {
      this.hudMs = 0;
      s.updateHud();
    }
  }

  private syncForbidden(): void {
    setForbiddenElement(this.form.forbiddenElement);
  }

  // Troca o quadro da Roo pelo da forma do degrau atual (mesma direção e quadro de caminhada), sem mexer na
  // animação: o corpo anda como sempre e o efeito vibra por cima.
  private applyTexture(): void {
    const sprite = this.scene.playerSprite;
    const id = this.form.id;
    const stage = this.form.stage;
    const base = sprite.anims.currentFrame?.textureKey ?? '';
    const m = /^roo_(down|up|side)_([0-3])$/.exec(base);
    if (id && stage > 0 && m) {
      sprite.setTexture(formTextureKey(id, stage, m[1], m[2], this.tremor));
      this.applied = true;
    } else if (stage === 0 && this.applied) {
      if (m) sprite.setTexture(base);
      this.applied = false;
    }
  }

  // ---------- bolhas ----------

  private updateBubbles(delta: number): void {
    const s = this.scene;
    for (const b of [...this.bubbles]) {
      b.t += delta;
      const { index, done } = bubbleAt(b.path.length, b.t);
      const frac = (b.t / BUBBLE_STEP_MS) - Math.floor(b.t / BUBBLE_STEP_MS);
      // a bolha "entra" na casa na metade do passo
      const tile = done ? b.path[b.path.length - 1] : (frac >= 0.5 ? b.path[index] : b.path[Math.max(0, index - 1)]);
      const boss = s.boss;
      if (boss && !boss.defeated && boss.gridX === tile.x && boss.gridY === tile.y) {
        s.floatingText(tile.x, tile.y, 'IMUNE', '#c5e1a5');
        this.endBubble(b, tile);
        continue;
      }
      const enemy = s.enemySystem.enemies.find(e => e.alive && e.trapMs <= 0 && e.gridX === tile.x && e.gridY === tile.y);
      if (enemy) {
        s.enemySystem.trapEnemy(enemy, trapMs(this.form.stage || 1));
        this.bubbles = this.bubbles.filter(x => x !== b);
        continue;
      }
      if (done && b.t >= b.path.length * BUBBLE_STEP_MS) this.endBubble(b, tile);
    }
  }

  private endBubble(b: Bubble, tile: { x: number; y: number }): void {
    this.bubbles = this.bubbles.filter(x => x !== b);
    this.pop(center(tile.x), center(tile.y));
  }

  private bubblePos(b: Bubble): { x: number; y: number } {
    const pts = [b.from, ...b.path];
    const s = Math.min(b.path.length, b.t / BUBBLE_STEP_MS);
    const k = Math.min(pts.length - 2, Math.floor(s));
    const f = s - k;
    return { x: center(pts[k].x) + (center(pts[k + 1].x) - center(pts[k].x)) * f, y: center(pts[k].y) + (center(pts[k + 1].y) - center(pts[k].y)) * f };
  }

  // Bolha de sabão iridescente: miolo quase transparente com películas coloridas que giram devagar, um anel em
  // 12 trechos de cores diferentes (rosa, amarelo, ciano, violeta, verde) que roda com o tempo, e dois brilhos.
  private drawBubble(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number): void {
    const shift = Math.floor(this.clockMs / 130);
    const spin = this.clockMs / 900;
    g.fillStyle(0xdaf4ff, 0.14).fillCircle(x, y, r);
    for (let i = 0; i < 3; i++) {
      const a = spin + i * 2.1;
      g.fillStyle(iridescent(i * 2, shift), 0.26).fillCircle(x + Math.cos(a) * r * 0.42, y + Math.sin(a) * r * 0.42, r * 0.36);
    }
    const seg = 12;
    for (let i = 0; i < seg; i++) {
      const a0 = (i / seg) * Math.PI * 2;
      g.lineStyle(2.4, iridescent(i, shift), 0.95).beginPath().arc(x, y, r, a0, a0 + (Math.PI * 2) / seg + 0.05).strokePath();
    }
    g.fillStyle(0xffffff, 0.95).fillRect(Math.round(x - r * 0.55), Math.round(y - r * 0.65), 3, 2);
    g.fillStyle(0xffffff, 0.7).fillRect(Math.round(x + r * 0.4), Math.round(y + r * 0.35), 2, 2);
  }

  private drawBubbles(): void {
    const g = this.bubbleGfx;
    g.clear();
    for (const b of this.bubbles) {
      const p = this.bubblePos(b);
      this.drawBubble(g, p.x, p.y + Math.sin(this.clockMs / 140) * 1.5, 11);
    }
    // inimigos presos: uma bolha grande em volta, que pulsa e pisca quando está acabando
    for (const e of this.scene.enemySystem.enemies) {
      if (!e.alive || e.trapMs <= 0) continue;
      if (e.trapMs < 600 && Math.floor(this.clockMs / 90) % 2 === 0) continue;
      this.drawBubble(g, e.sprite.x, e.sprite.y - 2, 19 + Math.sin(this.clockMs / 160));
    }
  }

  // ---------- brasas ----------

  // Brasas em xadrez de pixels que alternam entre quadros (sem degradê); piscam quando estão acabando.
  private drawEmbers(): void {
    const g = this.emberGfx;
    g.clear();
    const phase = Math.floor(this.clockMs / 180);
    for (const e of this.embers.active(this.clockMs)) {
      if (e.left < 600 && Math.floor(this.clockMs / 100) % 2 === 0) continue;
      for (let py = 0; py < 4; py++) {
        for (let px = 0; px < 4; px++) {
          if ((px + py + phase) % 2 !== 0) continue;
          g.fillStyle((px + py) % 3 === 0 ? 0xd6452f : 0xffa94d, 0.75);
          g.fillRect(e.x * T + px * (T / 4), e.y * T + py * (T / 4), T / 4, T / 4);
        }
      }
    }
  }
}

