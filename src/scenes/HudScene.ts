// HUD dentro do canvas: faixa no topo, acima da grade. Enxuta e em ícones, no clima do jogo:
//   Linha de cima: a vida (barra com faixa clara do dano), a ampulheta com o tempo, o OURO e as GEMAS (losangos).
//   Linha de baixo: o seletor de frascos (teclas 1-4 ou toque), o medidor da Roo Fire (4 degraus) e as bolinhas
//   dos frascos já colocados, na cor do elemento escolhido.
// Sem legendas de texto: ícone, número e cor dizem o resto. Na fase de chefe, a vida dele ocupa o lugar das gemas.
// Recebe o estado da MainScene por evento (HUD_UPDATE) e devolve a escolha de frasco por HUD_SELECT_BOMB.
import Phaser from 'phaser';
import { BOMB_ORDER, BOMB_TYPES, CANVAS, CONFIG, ELEMENTS, BombId } from '../config';
import { canUseBomb } from '../game/loadout';
import { HUD_SELECT_BOMB, HUD_UPDATE, HudState, pipsView, segmentFill, timerView } from '../game/hudState';
import { hpBarView } from '../game/entities/roo';
import type { FormView } from '../game/forms';
import { readTheme, Theme } from '../ui/theme';
import type { MainScene } from './MainScene';
import { LAST_STAGE } from '../game/stages/index';

const ROW_A = 17;
const ROW_B = 41;
const SLOT_W = 36;
const SLOT_H = 22;
const SLOT_GAP = 4;
const SLOT_X0 = 12;
const HEART_X = 16; // vida da Roo: coração e barra
const HP_X = 30;
const HP_Y = ROW_A - 5;
const HP_W = 134;
const HP_H = 10;
const SEP_1 = 188; // filetes entre as zonas
const SEP_2 = 384;
const TIMER_X = 204; // ampulheta e tempo
const FIRE_X = 204; // medidor da Roo Fire (linha de baixo)
const FIRE_BAR_X = FIRE_X + 26; // dois ícones (chama e gota) antes dos degraus
const FIRE_SEG_W = 22;
const FIRE_SEG_GAP = 3;
const COIN_X = 404;
const GEM_X = 488; // gemas em losangos
const BOSS_X = 462; // vida do chefe, no lugar das gemas
const BOSS_W = 124;

type Text = Phaser.GameObjects.Text;
type Img = Phaser.GameObjects.Image;

export class HudScene extends Phaser.Scene {
  private theme!: Theme;
  private hpGfx!: Phaser.GameObjects.Graphics;
  private fireGfx!: Phaser.GameObjects.Graphics;
  private fireKey!: Text;
  private pipsGfx!: Phaser.GameObjects.Graphics;
  private gemGfx!: Phaser.GameObjects.Graphics;
  private hpTrail = 1; // faixa clara atrás da barra: segue devagar a vida de verdade
  private hpTween: Phaser.Tweens.Tween | null = null;
  private hpView = { ratio: 1, low: false };
  private emptyFlask!: Img;
  private lastHp: number | null = null;
  private lastCoins: number | null = null;
  private timerText!: Text;
  private overtimeTween: Phaser.Tweens.Tween | null = null;
  private coinText!: Text;
  private coinIcon!: Img;
  private bossGfx!: Phaser.GameObjects.Graphics;
  private bossName!: Text;
  private slotGfx!: Phaser.GameObjects.Graphics;
  private slotIcons: Img[] = [];
  private slotKeys: Text[] = [];

  constructor() {
    super('Hud');
  }

  create(): void {
    this.theme = readTheme();
    this.slotIcons = [];
    this.slotKeys = [];
    this.lastHp = null;
    this.lastCoins = null;
    this.overtimeTween = null;
    this.hpTween = null;
    this.hpTrail = 1;

    this.drawBackground();
    this.createRowA();
    this.createRowB();

    const main = this.scene.get('Main') as MainScene;
    this.apply(main.buildHudState());
    this.game.events.on(HUD_UPDATE, this.apply, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(HUD_UPDATE, this.apply, this);
    });
  }

  private text(x: number, y: number, str: string, size: number, color: string, display = false): Text {
    return this.add.text(x, y, str, {
      fontFamily: display ? this.theme.fontDisplay : this.theme.fontBody,
      fontSize: `${size}px`,
      fontStyle: 'bold',
      color,
    }).setOrigin(0, 0.5).setResolution(2);
  }

  // Fundo escuro com moldura dourada fina, rebites nos cantos e filetes com losango entre as zonas.
  private drawBackground(): void {
    const t = this.theme;
    const W = CANVAS.width;
    const H = CONFIG.hudHeight;
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(t.panel, 1).fillRect(0, 0, W, H);
    g.fillStyle(0xffffff, 0.04).fillRect(0, 0, W, 1);
    g.fillStyle(t.panelEdge, 1).fillRect(0, H - 2, W, 2);
    g.fillStyle(t.gold, 0.5).fillRect(0, H - 3, W, 1);
    g.lineStyle(1, t.gold, 0.22).strokeRect(3.5, 3.5, W - 7, H - 9);
    g.fillStyle(t.gold, 0.55);
    for (const [x, y] of [[6, 6], [W - 6, 6], [6, H - 8], [W - 6, H - 8]]) g.fillCircle(x, y, 1.6);
    for (const x of [SEP_1, SEP_2]) {
      g.lineStyle(1, t.gold, 0.3).beginPath().moveTo(x, 8).lineTo(x, H - 12).strokePath();
      g.fillStyle(t.gold, 0.7).fillTriangle(x - 3, (H - 4) / 2, x, (H - 4) / 2 - 3, x + 3, (H - 4) / 2).fillTriangle(x - 3, (H - 4) / 2, x, (H - 4) / 2 + 3, x + 3, (H - 4) / 2);
    }
  }

  private createRowA(): void {
    const t = this.theme;
    const gold = '#' + t.goldBright.toString(16).padStart(6, '0');

    // vida da Roo: coração e barra contínua (a faixa clara mostra o que acabou de perder)
    this.add.image(HEART_X, ROW_A, 'hud_heart').setScale(0.75).setDepth(2);
    this.hpGfx = this.add.graphics().setDepth(2);

    // tempo
    this.add.image(TIMER_X, ROW_A, 'hud_hourglass').setDepth(2);
    this.timerText = this.text(TIMER_X + 16, ROW_A, '90', 22, t.info, true).setDepth(2);
    // frasco vazio: só aparece na última fase (lembrança do fim)
    this.emptyFlask = this.add.image(TIMER_X + 82, ROW_A, 'hud_flask_empty').setDepth(2).setVisible(false);

    // OURO (só o ícone e o número)
    this.coinIcon = this.add.image(COIN_X, ROW_A, 'pickup_coin').setScale(0.9).setDepth(2);
    this.coinText = this.text(COIN_X + 14, ROW_A, '0', 18, gold, true).setDepth(2);

    // GEMAS em losangos; na fase do chefe, a vida dele ocupa o lugar
    this.gemGfx = this.add.graphics().setDepth(2);
    this.bossGfx = this.add.graphics().setDepth(2).setVisible(false);
    this.bossName = this.text(BOSS_X, ROW_A - 7, '', 10, '#9be564').setDepth(2).setVisible(false);
  }

  private createRowB(): void {
    const t = this.theme;
    this.slotGfx = this.add.graphics().setDepth(1);

    BOMB_ORDER.forEach((id, i) => {
      const x0 = SLOT_X0 + i * (SLOT_W + SLOT_GAP);
      const y0 = ROW_B - SLOT_H / 2;
      this.slotIcons.push(this.add.image(x0 + 12, ROW_B, 'bomb_' + id).setScale(0.55).setDepth(2));
      this.slotKeys.push(this.text(x0 + 25, ROW_B, String(i + 1), 12, t.textMuted).setDepth(2));
      const zone = this.add.zone(x0, y0, SLOT_W, SLOT_H).setOrigin(0).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => this.game.events.emit(HUD_SELECT_BOMB, id));
    });

    // medidor da Roo Fire: chama, 4 degraus e a tecla que vale agora
    this.fireGfx = this.add.graphics().setDepth(2);
    this.fireKey = this.add.text(FIRE_BAR_X + 4 * FIRE_SEG_W + 3 * FIRE_SEG_GAP + 10, ROW_B, '', {
      fontFamily: t.fontBody, fontSize: '11px', fontStyle: 'bold', color: '#ffe9c4',
    }).setOrigin(0, 0.5).setResolution(2).setDepth(2);

    // frascos já colocados: uma bolinha por poção, na cor do elemento escolhido
    this.pipsGfx = this.add.graphics().setDepth(2);
  }

  // ---------- vida ----------

  // Barra de vida: o dano corta na hora; a faixa clara atrás o acompanha em seguida. A cura enche as duas.
  private setHp(hp: number, maxHp: number): void {
    const view = hpBarView(hp, maxHp);
    const first = this.lastHp === null;
    const hurt = !first && hp < (this.lastHp as number);
    this.lastHp = hp;
    this.hpView = view;
    this.hpTween?.stop();
    if (first || !hurt) {
      this.hpTrail = view.ratio;
      this.drawHp();
      return;
    }
    this.hpTrail = Math.max(this.hpTrail, view.ratio);
    const state = { t: this.hpTrail };
    this.hpTween = this.tweens.add({
      targets: state, t: view.ratio, delay: 260, duration: 520, ease: 'Quad.easeOut',
      onUpdate: () => { this.hpTrail = state.t; this.drawHp(); },
      onComplete: () => { this.hpTrail = view.ratio; this.drawHp(); },
    });
    this.drawHp();
  }

  private drawHp(): void {
    const g = this.hpGfx;
    const { ratio, low } = this.hpView;
    g.clear();
    g.fillStyle(0x2a0f12, 1).fillRoundedRect(HP_X, HP_Y, HP_W, HP_H, 3);
    if (this.hpTrail > ratio) {
      g.fillStyle(0xffd0c8, 0.9).fillRoundedRect(HP_X + 1, HP_Y + 1, (HP_W - 2) * this.hpTrail, HP_H - 2, 2);
    }
    if (ratio > 0) {
      g.fillStyle(low ? 0xff7043 : 0xe53935, 1).fillRoundedRect(HP_X + 1, HP_Y + 1, (HP_W - 2) * ratio, HP_H - 2, 2);
      g.fillStyle(0xffffff, 0.18).fillRect(HP_X + 2, HP_Y + 2, (HP_W - 4) * ratio, 2);
    }
    g.lineStyle(1, 0xff8a80, 0.9).strokeRoundedRect(HP_X, HP_Y, HP_W, HP_H, 3);
  }

  // ---------- transformações ----------

  // Medidor da transformação: a chama (T) e a gota (Y) e 4 degraus. Pronta: os dois ícones acesos e as duas teclas.
  // Transformada: o ícone da forma e o tempo que resta, esfriando de degrau em degrau (azul na água, laranja no
  // fogo), com o X quando a habilidade está pronta. Esfriando: enche devagar, tudo apagado.
  private drawForm(f: FormView): void {
    const g = this.fireGfx;
    g.clear();
    const water = f.form === 'water';
    let ratio = 1;
    let color = 0xf0c674;
    let key = 'T  Y';
    if (f.active) {
      ratio = f.ratio;
      color = water
        ? (f.stage >= 3 ? 0x4fc3f7 : f.stage === 2 ? 0x29a1e6 : 0x5a9fc4)
        : (f.stage >= 3 ? 0xff7043 : f.stage === 2 ? 0xffa94d : 0xd6a04a); // vai esfriando com os degraus
      key = f.abilityReady ? 'X' : '';
    } else if (f.cooldownRatio > 0) {
      ratio = 1 - f.cooldownRatio;
      color = 0x7a5a3a;
      key = '';
    }
    const lit = f.active || ratio >= 1;
    // ícones: chama (fogo) e gota (água), acesos conforme a forma
    const flameOn = lit && (!f.active || !water);
    const dropOn = lit && (!f.active || water);
    const fx = FIRE_X - 3;
    g.fillStyle(flameOn ? 0xd6452f : 0x4a3426).fillTriangle(fx - 4, ROW_B + 6, fx, ROW_B - 7, fx + 4, ROW_B + 6);
    g.fillStyle(flameOn ? 0xffa94d : 0x5a4030).fillTriangle(fx - 2, ROW_B + 6, fx, ROW_B - 1, fx + 2, ROW_B + 6);
    const dx = FIRE_X + 12;
    g.fillStyle(dropOn ? 0x29a1e6 : 0x2f3a44).fillTriangle(dx - 4, ROW_B + 1, dx, ROW_B - 7, dx + 4, ROW_B + 1).fillCircle(dx, ROW_B + 2.5, 4);
    g.fillStyle(dropOn ? 0xb7ecff : 0x4a5560).fillRect(dx - 2, ROW_B, 1.5, 3);
    // 4 degraus
    for (let i = 0; i < 4; i++) {
      const x = FIRE_BAR_X + i * (FIRE_SEG_W + FIRE_SEG_GAP);
      const y = ROW_B - 4;
      g.fillStyle(0x2a1a10, 1).fillRoundedRect(x, y, FIRE_SEG_W, 8, 2);
      const fill = segmentFill(ratio, i);
      if (fill > 0) g.fillStyle(color, 1).fillRoundedRect(x, y, Math.max(2, FIRE_SEG_W * fill), 8, 2);
      g.lineStyle(1, lit ? (water ? 0x3a7a9a : 0x8a5a2a) : 0x4a3426, 1).strokeRoundedRect(x, y, FIRE_SEG_W, 8, 2);
    }
    this.fireKey.setText(key).setColor(f.abilityReady ? '#ffd9a8' : '#ffe9c4');
  }

  // ---------- frascos, gemas, chefe ----------

  // Uma bolinha por frasco que cabe no chão; cheia = já colocada. Na cor do elemento da poção escolhida.
  private drawPips(s: HudState): void {
    const g = this.pipsGfx;
    g.clear();
    const color = ELEMENTS[BOMB_TYPES[s.selected].element].color;
    const pips = pipsView(s.bombsActive, s.bombsMax);
    const step = 13;
    pips.forEach((full, i) => {
      const x = CANVAS.width - 16 - (pips.length - 1 - i) * step;
      g.fillStyle(0x15110d, 1).fillCircle(x, ROW_B, 5.5);
      if (full) g.fillStyle(color, 1).fillCircle(x, ROW_B, 4);
      g.lineStyle(1.5, color, full ? 1 : 0.75).strokeCircle(x, ROW_B, 4.5);
    });
  }

  // Gemas em losangos: cheio = pegou. Some na fase do chefe.
  private drawGems(gems: number, total: number, visible: boolean): void {
    const g = this.gemGfx;
    g.clear();
    if (!visible) return;
    for (let i = 0; i < total; i++) {
      const x = GEM_X + i * 17;
      const full = i < gems;
      g.fillStyle(full ? 0x4dd0e1 : 0x15222a, 1);
      g.fillTriangle(x - 6, ROW_A, x, ROW_A - 8, x + 6, ROW_A).fillTriangle(x - 6, ROW_A, x, ROW_A + 8, x + 6, ROW_A);
      if (full) g.fillStyle(0xe0f7fa, 0.8).fillTriangle(x - 3, ROW_A - 1, x, ROW_A - 5, x + 1, ROW_A - 1);
      g.lineStyle(1.5, full ? 0xb2ebf2 : 0x3a6a78, 1);
      g.strokeTriangle(x - 6, ROW_A, x, ROW_A - 8, x + 6, ROW_A).strokeTriangle(x - 6, ROW_A, x, ROW_A + 8, x + 6, ROW_A);
    }
  }

  // Na fase do chefe, esconde as gemas e mostra a vida dele.
  private applyBoss(s: HudState): void {
    const boss = s.boss;
    this.drawGems(s.gems, s.gemsForDoor, !boss);
    this.bossGfx.setVisible(!!boss);
    this.bossName.setVisible(!!boss);
    this.bossGfx.clear();
    if (!boss) return;
    const y = ROW_A - 1;
    const h = 9;
    const ratio = Math.max(0, boss.hp / boss.maxHp);
    this.bossGfx.fillStyle(0x0b2420, 1).fillRoundedRect(BOSS_X, y, BOSS_W, h, 3);
    if (ratio > 0) this.bossGfx.fillStyle(ratio <= 0.5 ? 0xd81b60 : 0x76d83a, 1).fillRoundedRect(BOSS_X + 1, y + 1, (BOSS_W - 2) * ratio, h - 2, 2);
    this.bossGfx.lineStyle(1, 0x9be564, 0.9).strokeRoundedRect(BOSS_X, y, BOSS_W, h, 3);
    this.bossName.setText(boss.name);
  }

  private pulse(target: Phaser.GameObjects.Components.Transform & Phaser.GameObjects.GameObject): void {
    this.tweens.add({ targets: target, scale: { from: 1.45, to: 1 }, duration: 240, ease: 'Back.easeOut' });
  }

  private apply(s: HudState): void {
    const t = this.theme;

    this.emptyFlask.setVisible(s.stage === LAST_STAGE);

    this.setHp(s.hp, s.maxHp);
    this.drawForm(s.form);

    // tempo
    const tv = timerView(s.timeLeftMs);
    this.timerText.setText(String(tv.seconds));
    this.timerText.setColor(tv.overtime ? t.danger : (tv.warning ? t.warn : t.info));
    if (tv.overtime && !this.overtimeTween) {
      this.overtimeTween = this.tweens.add({ targets: this.timerText, alpha: 0.4, duration: 400, yoyo: true, repeat: -1 });
    } else if (!tv.overtime && this.overtimeTween) {
      this.overtimeTween.stop();
      this.overtimeTween = null;
      this.timerText.setAlpha(1);
    }

    // OURO
    this.coinText.setText(String(s.coins));
    if (this.lastCoins !== null && s.coins > this.lastCoins) this.pulse(this.coinIcon);
    this.lastCoins = s.coins;

    this.applyBoss(s);
    this.drawPips(s);
    this.drawSlots(s.selected);
  }

  private drawSlots(selected: BombId): void {
    const t = this.theme;
    this.slotGfx.clear();
    BOMB_ORDER.forEach((id, i) => {
      const owned = canUseBomb(id);
      const isSel = id === selected;
      const x0 = SLOT_X0 + i * (SLOT_W + SLOT_GAP);
      const y0 = ROW_B - SLOT_H / 2;
      this.slotGfx.fillStyle(isSel ? 0x3a2f1c : 0x1d2321, 1);
      this.slotGfx.fillRoundedRect(x0, y0, SLOT_W, SLOT_H, 4);
      this.slotGfx.lineStyle(isSel ? 2 : 1, isSel ? t.gold : t.panelEdge, owned ? 1 : 0.5);
      this.slotGfx.strokeRoundedRect(x0, y0, SLOT_W, SLOT_H, 4);
      this.slotIcons[i].setAlpha(owned ? 1 : 0.3);
      this.slotKeys[i].setAlpha(owned ? 1 : 0.5);
      this.slotKeys[i].setColor(isSel ? '#' + t.goldBright.toString(16).padStart(6, '0') : t.textMuted);
    });
  }
}
