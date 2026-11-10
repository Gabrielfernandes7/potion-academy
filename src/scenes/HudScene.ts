// HUD dentro do canvas: faixa no topo, acima da grade.
// Linha de cima: vida (corações), tempo (ampulheta), POÇÃO e GEMAS.
// Linha de baixo: seletor de frascos (teclas 1-4 ou toque), elemento atual, BLOCOS e FRASCOS.
// Recebe o estado da MainScene por evento (HUD_UPDATE) e devolve a escolha de frasco por HUD_SELECT_BOMB.
import Phaser from 'phaser';
import { BOMB_ORDER, BOMB_TYPES, CANVAS, CONFIG, ELEMENTS, BombId } from '../config';
import { hasBombType } from '../storage';
import { HUD_SELECT_BOMB, HUD_UPDATE, HudState, timerView } from '../game/hudState';
import { readTheme, Theme } from '../ui/theme';
import type { MainScene } from './MainScene';

const ROW_A = 18;
const ROW_B = 41;
const SLOT_W = 36;
const SLOT_H = 22;
const SLOT_GAP = 4;
const SLOT_X0 = 12;

type Text = Phaser.GameObjects.Text;
type Img = Phaser.GameObjects.Image;

// Valor numérico com legenda ao lado, reposicionada conforme a largura do número.
class ValueWithCaption {
  readonly value: Text;
  readonly caption: Text;
  constructor(value: Text, caption: Text) {
    this.value = value;
    this.caption = caption;
  }
  set(text: string): void {
    this.value.setText(text);
    this.caption.setX(this.value.x + this.value.width + 4);
  }
}

export class HudScene extends Phaser.Scene {
  private theme!: Theme;
  private hearts: Img[] = [];
  private lastHp: number | null = null;
  private lastCoins: number | null = null;
  private timerText!: Text;
  private overtimeTween: Phaser.Tweens.Tween | null = null;
  private coins!: ValueWithCaption;
  private gems!: ValueWithCaption;
  private coinIcon!: Img;
  private elementText!: Text;
  private blocksValue!: Text;
  private blocksLabel!: Text;
  private bombsValue!: Text;
  private bombsLabel!: Text;
  private slotGfx!: Phaser.GameObjects.Graphics;
  private slotIcons: Img[] = [];
  private slotKeys: Text[] = [];

  constructor() {
    super('Hud');
  }

  create(): void {
    this.theme = readTheme();
    this.hearts = [];
    this.slotIcons = [];
    this.slotKeys = [];
    this.lastHp = null;
    this.lastCoins = null;
    this.overtimeTween = null;

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

  private drawBackground(): void {
    const t = this.theme;
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(t.panel, 1);
    g.fillRect(0, 0, CANVAS.width, CONFIG.hudHeight);
    g.fillStyle(0xffffff, 0.04);
    g.fillRect(0, 0, CANVAS.width, 1);
    g.fillStyle(t.panelEdge, 1);
    g.fillRect(0, CONFIG.hudHeight - 2, CANVAS.width, 2);
    g.fillStyle(t.gold, 0.5);
    g.fillRect(0, CONFIG.hudHeight - 3, CANVAS.width, 1);
  }

  private createRowA(): void {
    const t = this.theme;
    const gold = '#' + t.goldBright.toString(16).padStart(6, '0');

    for (let i = 0; i < CONFIG.maxHp; i++) {
      this.hearts.push(this.add.image(21 + i * 21, ROW_A, 'hud_heart').setDepth(2));
    }

    this.add.image(266, ROW_A, 'hud_hourglass').setDepth(2);
    this.timerText = this.text(282, ROW_A, '90', 24, t.info, true).setDepth(2);

    this.coinIcon = this.add.image(398, ROW_A, 'pickup_coin').setScale(0.9).setDepth(2);
    this.coins = new ValueWithCaption(
      this.text(412, ROW_A, '0', 18, gold, true).setDepth(2),
      this.text(0, ROW_A + 1, 'POÇÃO', 10, t.textMuted).setDepth(2),
    );
    this.coins.set('0');

    this.add.image(492, ROW_A, 'pickup_gem').setScale(0.8).setDepth(2);
    this.gems = new ValueWithCaption(
      this.text(506, ROW_A, '0/3', 18, t.info, true).setDepth(2),
      this.text(0, ROW_A + 1, 'GEMAS', 10, t.textMuted).setDepth(2),
    );
    this.gems.set('0/3');
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

    this.elementText = this.text(SLOT_X0 + 4 * (SLOT_W + SLOT_GAP) + 10, ROW_B, '', 13, t.textMuted, true).setDepth(2);

    this.bombsValue = this.text(0, ROW_B, '0/2', 14, '#' + t.text.toString(16).padStart(6, '0'), true)
      .setOrigin(1, 0.5).setX(CANVAS.width - 14).setDepth(2);
    this.bombsLabel = this.text(0, ROW_B + 1, 'FRASCOS', 10, t.textMuted).setOrigin(1, 0.5).setDepth(2);
    this.blocksValue = this.text(0, ROW_B, '0', 14, '#' + t.text.toString(16).padStart(6, '0'), true)
      .setOrigin(1, 0.5).setDepth(2);
    this.blocksLabel = this.text(0, ROW_B + 1, 'BLOCOS', 10, t.textMuted).setOrigin(1, 0.5).setDepth(2);
  }

  private pulse(target: Phaser.GameObjects.Components.Transform & Phaser.GameObjects.GameObject): void {
    this.tweens.add({ targets: target, scale: { from: 1.45, to: 1 }, duration: 240, ease: 'Back.easeOut' });
  }

  private apply(s: HudState): void {
    const t = this.theme;

    // vida
    for (let i = 0; i < this.hearts.length; i++) {
      const full = i < s.hp;
      this.hearts[i].setTexture(full ? 'hud_heart' : 'hud_heart_empty');
      if (this.lastHp !== null && s.hp !== this.lastHp) {
        const changed = s.hp > this.lastHp ? i === s.hp - 1 : i === s.hp;
        if (changed) this.pulse(this.hearts[i]);
      }
    }
    this.lastHp = s.hp;

    // tempo
    const tv = timerView(s.timeLeftMs);
    this.timerText.setText(String(tv.seconds));
    const color = tv.overtime ? t.danger : (tv.warning ? t.warn : t.info);
    this.timerText.setColor(color);
    if (tv.overtime && !this.overtimeTween) {
      this.overtimeTween = this.tweens.add({
        targets: this.timerText, alpha: 0.4, duration: 400, yoyo: true, repeat: -1,
      });
    } else if (!tv.overtime && this.overtimeTween) {
      this.overtimeTween.stop();
      this.overtimeTween = null;
      this.timerText.setAlpha(1);
    }

    // POÇÃO e GEMAS
    this.coins.set(String(s.coins));
    if (this.lastCoins !== null && s.coins > this.lastCoins) this.pulse(this.coinIcon);
    this.lastCoins = s.coins;
    this.gems.set(`${s.gems}/${s.gemsForDoor}`);

    // frascos e blocos (alinhados à direita)
    this.bombsValue.setText(`${s.bombsActive}/${s.bombsMax}`);
    this.bombsLabel.setX(this.bombsValue.x - this.bombsValue.width - 5);
    this.blocksValue.setText(String(s.blocks));
    this.blocksValue.setX(this.bombsLabel.x - this.bombsLabel.width - 18);
    this.blocksLabel.setX(this.blocksValue.x - this.blocksValue.width - 5);

    this.drawSlots(s.selected);
  }

  private drawSlots(selected: BombId): void {
    const t = this.theme;
    this.slotGfx.clear();
    BOMB_ORDER.forEach((id, i) => {
      const owned = hasBombType(id);
      const isSel = id === selected;
      const x0 = SLOT_X0 + i * (SLOT_W + SLOT_GAP);
      const y0 = ROW_B - SLOT_H / 2;
      this.slotGfx.fillStyle(isSel ? 0x3a2f1c : 0x1d2321, 1);
      this.slotGfx.fillRoundedRect(x0, y0, SLOT_W, SLOT_H, 4);
      this.slotGfx.lineStyle(isSel ? 2 : 1, isSel ? t.gold : t.panelEdge, owned ? 1 : 0.5);
      this.slotGfx.strokeRoundedRect(x0, y0, SLOT_W, SLOT_H, 4);
      this.slotIcons[i].setAlpha(owned ? 1 : 0.3);
      this.slotKeys[i].setAlpha(owned ? 1 : 0.5);
      if (isSel) this.slotKeys[i].setColor('#' + t.goldBright.toString(16).padStart(6, '0'));
      else this.slotKeys[i].setColor(t.textMuted);
    });

    const el = ELEMENTS[BOMB_TYPES[selected].element];
    this.elementText.setText(`${el.symbol} ${el.name}`);
    this.elementText.setColor('#' + el.color.toString(16).padStart(6, '0'));
  }
}
