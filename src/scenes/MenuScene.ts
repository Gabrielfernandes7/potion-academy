// Cena do menu principal: o laboratório, com a Roo mexendo uma poção no caldeirão.
// O título e os botões são DOM (por cima do canvas, ver #menu em index.html).
//
// Composição (coordenadas do canvas): parede e prateleiras no alto, chão embaixo,
// Roo à esquerda com o braço estendido e a varinha mergulhada no caldeirão à direita.
// A ponta da varinha percorre uma elipse sobre o líquido; o líquido muda de cor entre os elementos.
import Phaser from 'phaser';
import { BOMB_TYPES, CANVAS, CONFIG, ELEMENTS } from '../config';
import { ROO_STIR_HAND, rooOriginY } from '../textures/roo';

const W = CANVAS.width;
const H = CANVAS.height;

const WALL_H = 330; // altura da parede; abaixo dela é chão
const SHELF_Y = 214;

const ROO_X = 205;
const ROO_SCALE = 3.3;
const FEET_Y = 411;
const ROO_Y = FEET_Y - 17 * ROO_SCALE; // 17 px da textura entre a origem do sprite e os pés

const CAULDRON_X = 412;
const RIM_Y = 368;
const BODY_W = 190;
const LIQ_W = 160;
const LIQ_H = 32;

const TIP_RX = 38; // raio horizontal do giro da ponta da varinha
const TIP_RY = 9;
const STIR_SPEED = 3.4; // rad/s

type Pt = { x: number; y: number };
type Gfx = Phaser.GameObjects.Graphics;

const SHELF_LEFT = ['bomb_normal', 'bomb_remote', 'bomb_mega', 'bomb_pierce', 'bomb_normal'];
const SHELF_RIGHT = ['bomb_pierce', 'bomb_mega', 'bomb_normal', 'bomb_remote', 'bomb_mega'];

// Cor do líquido: parte do verde do caldeirão e passa pelos 4 elementos.
const LIQUID_COLORS = [
  0x4fdc8a,
  ELEMENTS.fire.color,
  ELEMENTS.water.color,
  ELEMENTS.earth.color,
  ELEMENTS.air.color,
];
const COLOR_HOLD_MS = 3200;

function mixColor(a: number, b: number, t: number): number {
  const ca = Phaser.Display.Color.ValueToColor(a);
  const cb = Phaser.Display.Color.ValueToColor(b);
  const c = Phaser.Display.Color.Interpolate.ColorWithColor(ca, cb, 100, Math.round(t * 100));
  return Phaser.Display.Color.GetColor(c.r, c.g, c.b);
}

export class MenuScene extends Phaser.Scene {
  private t = 0;
  private colorMs = 0;
  private roo!: Phaser.GameObjects.Sprite;
  private liquid!: Gfx;
  private wand!: Gfx;
  private tip!: Phaser.GameObjects.Image;
  private tipGlow!: Phaser.GameObjects.Image;
  private trail: Pt[] = [];

  constructor() {
    super('Menu');
  }

  create(): void {
    this.t = 0;
    this.colorMs = 0;
    this.trail = [];
    this.buildBackground();
    this.buildTorch();
    this.buildCauldron();
    this.buildRoo();
    this.buildEffects();
  }

  // ---------------------------------------------------------------- cenário

  private buildBackground(): void {
    this.add.tileSprite(0, 0, W, WALL_H, 'wall').setOrigin(0).setTint(0x6f7186).setDepth(0);
    this.add.tileSprite(0, WALL_H, W, H - WALL_H, 'floor1').setOrigin(0).setTint(0x8a9a90).setDepth(0);

    const g = this.add.graphics().setDepth(1);
    g.fillStyle(0x1b1d24, 1);
    g.fillRect(0, WALL_H - 4, W, 6); // rodapé
    // vinheta: escurece o topo (título) e a base (botões)
    g.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.8, 0.8, 0, 0);
    g.fillRect(0, 0, W, 190);
    g.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.85, 0.85);
    g.fillRect(0, H - 150, W, 150);

    this.buildShelf(20, 262, SHELF_Y, SHELF_LEFT);
    this.buildShelf(338, 580, SHELF_Y, SHELF_RIGHT);
  }

  private buildShelf(x0: number, x1: number, y: number, potions: string[]): void {
    const g = this.add.graphics().setDepth(2);
    g.fillStyle(0x5a432a, 1);
    g.fillRect(x0, y, x1 - x0, 9);
    g.fillStyle(0x7a5c38, 1);
    g.fillRect(x0, y, x1 - x0, 3);
    g.fillStyle(0x3a2b1a, 1);
    g.fillRect(x0 + 10, y + 9, 6, 14);
    g.fillRect(x1 - 16, y + 9, 6, 14);

    const step = (x1 - x0 - 52) / (potions.length - 1);
    potions.forEach((key, i) => {
      const px = x0 + 26 + i * step;
      const id = key.replace('bomb_', '') as keyof typeof BOMB_TYPES;
      const color = ELEMENTS[BOMB_TYPES[id].element].color;
      const glow = this.add.image(px, y - 18, 'menu_puff').setScale(1.3).setTint(color)
        .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.18).setDepth(2);
      this.tweens.add({
        targets: glow, alpha: { from: 0.12, to: 0.34 }, duration: 1400 + i * 170,
        yoyo: true, repeat: -1, delay: i * 260, ease: 'Sine.easeInOut',
      });
      this.add.image(px, y - 19, key).setScale(1.25).setDepth(3);
    });
  }

  private buildTorch(): void {
    const x = W / 2;
    const y = 222;
    const g = this.add.graphics().setDepth(2);
    g.fillStyle(0x2a2118, 1);
    g.fillRect(x - 3, y, 6, 26);
    g.fillStyle(0x4a3a28, 1);
    g.fillTriangle(x - 9, y - 6, x + 9, y - 6, x, y + 8);

    const glow = this.add.image(x, y - 14, 'menu_puff').setScale(5).setTint(0xffa94d)
      .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.3).setDepth(2);
    this.tweens.add({
      targets: glow, alpha: { from: 0.2, to: 0.38 }, scale: { from: 4.6, to: 5.3 },
      duration: 230, yoyo: true, repeat: -1,
    });

    this.add.particles(x, y - 6, 'menu_spark', {
      lifespan: { min: 280, max: 520 },
      speedY: { min: -55, max: -28 },
      speedX: { min: -8, max: 8 },
      scale: { start: 1.6, end: 0 },
      alpha: { start: 0.95, end: 0 },
      frequency: 36,
      blendMode: 'ADD',
      tint: [0xff7043, 0xff9800, 0xffd54f],
    }).setDepth(3);
  }

  // ---------------------------------------------------------------- caldeirão

  private buildCauldron(): void {
    const cx = CAULDRON_X;
    const g = this.add.graphics().setDepth(4);

    // sombra no chão
    g.fillStyle(0x000000, 0.35);
    g.fillEllipse(cx, RIM_Y + 90, BODY_W + 30, 24);

    // pés
    g.fillStyle(0x2a2b33, 1);
    for (const dx of [-62, 0, 62]) {
      g.fillTriangle(cx + dx - 9, RIM_Y + 74, cx + dx + 9, RIM_Y + 74, cx + dx + 4, RIM_Y + 90);
      g.fillTriangle(cx + dx - 9, RIM_Y + 74, cx + dx - 4, RIM_Y + 90, cx + dx + 4, RIM_Y + 90);
    }

    // alças
    g.lineStyle(5, 0x3b3f4a, 1);
    g.strokeCircle(cx - BODY_W / 2 - 2, RIM_Y + 8, 11);
    g.strokeCircle(cx + BODY_W / 2 + 2, RIM_Y + 8, 11);

    // corpo: lados retos + fundo arredondado
    g.fillStyle(0x23262e, 1);
    g.fillRect(cx - BODY_W / 2, RIM_Y, BODY_W, 40);
    g.fillEllipse(cx, RIM_Y + 40, BODY_W, 84);
    // reflexo do metal
    g.lineStyle(4, 0x3d424f, 1);
    g.beginPath();
    g.arc(cx, RIM_Y + 38, BODY_W / 2 - 14, Math.PI * 0.62, Math.PI * 0.9, false);
    g.strokePath();
    // runa alquímica no ventre do caldeirão
    g.lineStyle(2, 0x8fc49a, 0.7);
    g.strokeCircle(cx, RIM_Y + 48, 12);
    g.beginPath();
    g.moveTo(cx - 8, RIM_Y + 54);
    g.lineTo(cx, RIM_Y + 38);
    g.lineTo(cx + 8, RIM_Y + 54);
    g.closePath();
    g.strokePath();

    // borda
    g.fillStyle(0x3b3f4a, 1);
    g.fillEllipse(cx, RIM_Y, BODY_W + 8, 42);
    g.fillStyle(0x14161b, 1);
    g.fillEllipse(cx, RIM_Y + 1, LIQ_W + 8, LIQ_H + 6); // interior escuro sob o líquido

    this.liquid = this.add.graphics().setDepth(5);
  }

  // ---------------------------------------------------------------- personagem

  private buildRoo(): void {
    if (!this.anims.exists('roo_stir')) {
      this.anims.create({
        key: 'roo_stir',
        frames: [{ key: 'roo_stir_0' }, { key: 'roo_stir_1' }],
        frameRate: 2,
        repeat: -1,
      });
    }

    const shadow = this.add.graphics().setDepth(7);
    shadow.fillStyle(0x000000, 0.3);
    shadow.fillEllipse(ROO_X, FEET_Y + 4, 104, 17);

    this.roo = this.add.sprite(ROO_X, ROO_Y, 'roo_stir_0')
      .setOrigin(0.5, rooOriginY(CONFIG.tile))
      .setScale(ROO_SCALE)
      .setDepth(8);
    this.roo.anims.play('roo_stir');

    this.wand = this.add.graphics().setDepth(9);
    this.tip = this.add.image(CAULDRON_X, RIM_Y, 'menu_spark').setVisible(false);
    this.tipGlow = this.add.image(CAULDRON_X, RIM_Y, 'menu_puff').setScale(0.7).setTint(0xffe082)
      .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.8).setDepth(10);
  }

  // ---------------------------------------------------------------- efeitos

  private buildEffects(): void {
    const cx = CAULDRON_X;

    // bolhas estourando na superfície
    this.add.particles(cx, RIM_Y, 'menu_bubble', {
      emitZone: { type: 'random', source: new Phaser.Geom.Ellipse(0, 0, LIQ_W - 24, LIQ_H - 8), quantity: 1 },
      lifespan: { min: 700, max: 1300 },
      speedY: { min: -55, max: -25 },
      speedX: { min: -8, max: 8 },
      scale: { start: 0.4, end: 1.0 },
      alpha: { start: 0.9, end: 0 },
      frequency: 130,
    }).setDepth(7);

    // fumaça subindo
    this.add.particles(cx, RIM_Y - 8, 'menu_puff', {
      emitZone: { type: 'random', source: new Phaser.Geom.Ellipse(0, 0, 110, 12), quantity: 1 },
      lifespan: 2600,
      speedY: { min: -30, max: -16 },
      speedX: { min: -6, max: 6 },
      scale: { start: 0.5, end: 1.9 },
      alpha: { start: 0.16, end: 0 },
      frequency: 340,
      tint: 0xcfd8dc,
    }).setDepth(11);

    // fagulhas na ponta da varinha
    this.add.particles(0, 0, 'menu_spark', {
      follow: this.tip,
      lifespan: 800,
      speed: { min: 15, max: 50 },
      angle: { min: -170, max: -10 },
      scale: { start: 1.1, end: 0 },
      alpha: { start: 1, end: 0 },
      frequency: 45,
      blendMode: 'ADD',
      tint: [0xffd54f, 0xfff59d, 0xffffff],
    }).setDepth(10);

    // fogo embaixo do caldeirão
    const fireY = RIM_Y + 92;
    this.add.image(cx, fireY, 'menu_puff').setScale(5, 1.6).setTint(0xff7043)
      .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.45).setDepth(3);
    this.add.particles(cx, fireY, 'menu_spark', {
      emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(-70, -4, 140, 8), quantity: 1 },
      lifespan: { min: 350, max: 800 },
      speedY: { min: -95, max: -45 },
      speedX: { min: -12, max: 12 },
      scale: { start: 2.2, end: 0 },
      alpha: { start: 0.85, end: 0 },
      frequency: 22,
      blendMode: 'ADD',
      tint: [0xff7043, 0xff9800, 0xffd54f],
    }).setDepth(3);
  }

  // ---------------------------------------------------------------- animação

  private liquidColor(): number {
    const n = LIQUID_COLORS.length;
    const slot = Math.floor(this.colorMs / COLOR_HOLD_MS) % n;
    const frac = (this.colorMs % COLOR_HOLD_MS) / COLOR_HOLD_MS;
    const blend = Phaser.Math.Clamp((frac - 0.6) / 0.4, 0, 1); // segura a cor e troca no fim
    return mixColor(LIQUID_COLORS[slot], LIQUID_COLORS[(slot + 1) % n], blend);
  }

  update(_time: number, delta: number): void {
    this.t += delta / 1000;
    this.colorMs += delta;

    // Roo balança de leve; a mão acompanha
    const bob = Math.sin(this.t * 2 * STIR_SPEED * 0.5) * 1.5;
    this.roo.y = ROO_Y + bob;
    const handX = this.roo.x + ROO_STIR_HAND.x * ROO_SCALE;
    const handY = this.roo.y + ROO_STIR_HAND.y * ROO_SCALE;

    // ponta da varinha gira sobre o líquido
    const a = this.t * STIR_SPEED;
    const tipX = CAULDRON_X + TIP_RX * Math.cos(a);
    const tipY = RIM_Y + 2 + TIP_RY * Math.sin(a);
    this.tip.setPosition(tipX, tipY);
    this.tipGlow.setPosition(tipX, tipY);
    this.trail.push({ x: tipX, y: tipY });
    if (this.trail.length > 16) this.trail.shift();

    // varinha: do punho até a ponta
    this.wand.clear();
    this.wand.lineStyle(6, 0x4a3822, 1);
    this.wand.lineBetween(handX, handY, tipX, tipY);
    this.wand.lineStyle(3, 0x9b7b4f, 1);
    this.wand.lineBetween(handX, handY, tipX, tipY);
    this.wand.fillStyle(0xffd54f, 1);
    this.wand.fillCircle(tipX, tipY, 3);

    // líquido, anéis na superfície e trilha da varinha
    const color = this.liquidColor();
    const light = mixColor(color, 0xffffff, 0.45);
    const g = this.liquid;
    g.clear();
    g.fillStyle(color, 1);
    g.fillEllipse(CAULDRON_X, RIM_Y + 1, LIQ_W, LIQ_H);
    g.fillStyle(light, 0.4);
    g.fillEllipse(CAULDRON_X - 10, RIM_Y - 3, LIQ_W * 0.66, LIQ_H * 0.5);
    for (let k = 0; k < 3; k++) {
      const phase = (this.t * 0.7 + k / 3) % 1;
      g.lineStyle(1.5, 0xffffff, (1 - phase) * 0.45);
      g.strokeEllipse(CAULDRON_X, RIM_Y + 1, LIQ_W * phase, LIQ_H * phase);
    }
    for (let i = 1; i < this.trail.length; i++) {
      g.lineStyle(3, light, (i / this.trail.length) * 0.7);
      g.lineBetween(this.trail[i - 1].x, this.trail[i - 1].y, this.trail[i].x, this.trail[i].y);
    }
  }
}
