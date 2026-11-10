// Cena do menu principal: o laboratório, com a Roo mexendo uma poção no caldeirão.
// O título e os botões são DOM (por cima do canvas, ver #menu em index.html).
//
// Movimento da Roo:
// - o corpo se inclina a partir dos pés no ritmo da varinha e "respira" (leve esticar);
// - o braço é desenhado pela cena (ombro até a mão), e a mão faz um círculo pequeno em sincronia
//   com a ponta da varinha, então o braço de fato acompanha o movimento;
// - de tempos em tempos ela joga um ingrediente (um frasco da prateleira) no caldeirão: ela pula,
//   mexe mais rápido por um instante e o líquido muda para a cor do elemento do frasco.
import Phaser from 'phaser';
import { BOMB_TYPES, CANVAS, CONFIG, ELEMENTS } from '../config';
import { rooFootOriginY, rooStirPoints, rooTextureHeight } from '../textures/rooGeometry';

const W = CANVAS.width;
const H = CANVAS.height;

const WALL_H = 330; // altura da parede; abaixo dela é chão
const SHELF_Y = 214;

const ROO_X = 205;
const ROO_SCALE = 3.3;
const FEET_Y = 411;

const CAULDRON_X = 412;
const RIM_Y = 368;
const BODY_W = 190;
const LIQ_W = 160;
const LIQ_H = 32;

const TIP_RX = 38; // raio horizontal do giro da ponta da varinha
const TIP_RY = 9;
const STIR_SPEED = 2.6; // rad/s
const HAND_RX = 5.5; // a mão faz um círculo pequeno (px da textura)
const HAND_RY = 3.2;
const FUR = 0xff9a3a;

type Pt = { x: number; y: number };
type Gfx = Phaser.GameObjects.Graphics;
interface ShelfPotion { x: number; y: number; key: string }

const SHELF_LEFT = ['bomb_normal', 'bomb_remote', 'bomb_mega', 'bomb_pierce', 'bomb_normal'];
const SHELF_RIGHT = ['bomb_pierce', 'bomb_mega', 'bomb_normal', 'bomb_remote', 'bomb_mega'];
const START_LIQUID = 0x4fdc8a;

function elementOf(textureKey: string): (typeof ELEMENTS)[keyof typeof ELEMENTS] {
  const id = textureKey.replace('bomb_', '') as keyof typeof BOMB_TYPES;
  return ELEMENTS[BOMB_TYPES[id].element];
}

function mixColor(a: number, b: number, t: number): number {
  const ca = Phaser.Display.Color.ValueToColor(a);
  const cb = Phaser.Display.Color.ValueToColor(b);
  const c = Phaser.Display.Color.Interpolate.ColorWithColor(ca, cb, 100, Math.round(t * 100));
  return Phaser.Display.Color.GetColor(c.r, c.g, c.b);
}

export class MenuScene extends Phaser.Scene {
  private t = 0;
  private stirAngle = 0;
  private boost = 0; // 0 a 1: mexe mais rápido logo depois de jogar um ingrediente
  private tossMs = 0;
  private liquidFrom = START_LIQUID;
  private liquidTo = START_LIQUID;
  private liquidMix = 1;
  private roo!: Phaser.GameObjects.Sprite;
  private arm!: Gfx;
  private liquid!: Gfx;
  private wand!: Gfx;
  private tip!: Phaser.GameObjects.Image;
  private tipGlow!: Phaser.GameObjects.Image;
  private trail: Pt[] = [];
  private shelfPotions: ShelfPotion[] = [];

  constructor() {
    super('Menu');
  }

  create(): void {
    this.t = 0;
    this.stirAngle = 0;
    this.boost = 0;
    this.tossMs = 1800; // o primeiro ingrediente cai logo, para o menu mostrar vida
    this.liquidFrom = START_LIQUID;
    this.liquidTo = START_LIQUID;
    this.liquidMix = 1;
    this.trail = [];
    this.shelfPotions = [];
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
      const color = elementOf(key).color;
      const glow = this.add.image(px, y - 18, 'menu_puff').setScale(1.3).setTint(color)
        .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.18).setDepth(2);
      this.tweens.add({
        targets: glow, alpha: { from: 0.12, to: 0.34 }, duration: 1400 + i * 170,
        yoyo: true, repeat: -1, delay: i * 260, ease: 'Sine.easeInOut',
      });
      this.add.image(px, y - 19, key).setScale(1.1).setDepth(3);
      this.shelfPotions.push({ x: px, y: y - 19, key });
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

    // origem nos pés: ao girar, o corpo se inclina a partir do chão
    this.roo = this.add.sprite(ROO_X, FEET_Y, 'roo_stir_0')
      .setOrigin(0.5, rooFootOriginY(CONFIG.tile))
      .setScale(ROO_SCALE)
      .setDepth(8);
    this.roo.anims.play('roo_stir');

    this.arm = this.add.graphics().setDepth(9);
    this.wand = this.add.graphics().setDepth(10);
    this.tip = this.add.image(CAULDRON_X, RIM_Y, 'menu_spark').setVisible(false);
    this.tipGlow = this.add.image(CAULDRON_X, RIM_Y, 'menu_puff').setScale(0.7).setTint(0xffe082)
      .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.8).setDepth(11);
  }

  // Ponto da textura da Roo -> posição na tela, considerando escala, origem e inclinação.
  private toWorld(lx: number, ly: number): Pt {
    const tile = CONFIG.tile;
    const ox = tile / 2;
    const oy = rooFootOriginY(tile) * rooTextureHeight(tile);
    const dx = (lx - ox) * ROO_SCALE;
    const dy = (ly - oy) * ROO_SCALE;
    const a = Phaser.Math.DegToRad(this.roo.angle);
    return {
      x: this.roo.x + dx * Math.cos(a) - dy * Math.sin(a),
      y: this.roo.y + dx * Math.sin(a) + dy * Math.cos(a),
    };
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
    }).setDepth(12);

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
    }).setDepth(11);

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

  // ---------------------------------------------------------------- ingrediente

  // Um frasco da prateleira voa em arco até o caldeirão.
  private toss(): void {
    const src = Phaser.Utils.Array.GetRandom(this.shelfPotions) as ShelfPotion;
    const element = elementOf(src.key);
    const ex = CAULDRON_X + Phaser.Math.Between(-18, 18);
    const ey = RIM_Y - 4;
    const flask = this.add.image(src.x, src.y, src.key).setScale(1.1).setDepth(13);
    this.tweens.addCounter({
      from: 0, to: 1, duration: 1050, ease: 'Sine.easeInOut',
      onUpdate: tw => {
        const p = tw.getValue() ?? 0;
        flask.setPosition(Phaser.Math.Linear(src.x, ex, p), Phaser.Math.Linear(src.y, ey, p) - Math.sin(p * Math.PI) * 95);
        flask.setRotation(p * 9);
        flask.setScale(1.1 - 0.5 * p);
      },
      onComplete: () => {
        flask.destroy();
        this.splash(ex, ey, element.color, element.glow);
      },
    });
  }

  // O ingrediente cai: respingo, o líquido muda de cor, a Roo comemora com um pulinho.
  private splash(x: number, y: number, color: number, glow: number): void {
    const e = this.add.particles(x, y, 'menu_bubble', {
      speed: { min: 40, max: 120 },
      angle: { min: -150, max: -30 },
      gravityY: 220,
      lifespan: { min: 500, max: 900 },
      scale: { start: 1.3, end: 0.2 },
      alpha: { start: 1, end: 0 },
      tint: [color, glow, 0xffffff],
      emitting: false,
    }).setDepth(12);
    e.explode(16);
    this.time.delayedCall(1000, () => e.destroy());

    const flash = this.add.image(x, y, 'menu_puff').setTint(color).setBlendMode(Phaser.BlendModes.ADD)
      .setScale(0.8).setAlpha(0.9).setDepth(12);
    this.tweens.add({ targets: flash, scale: 3.2, alpha: 0, duration: 520, onComplete: () => flash.destroy() });

    this.liquidFrom = this.currentLiquid();
    this.liquidTo = color;
    this.liquidMix = 0;
    this.boost = 1;
    this.tweens.add({ targets: this.roo, y: FEET_Y - 11, duration: 150, yoyo: true, ease: 'Quad.easeOut' });
  }

  private currentLiquid(): number {
    const k = Phaser.Math.Easing.Sine.InOut(this.liquidMix);
    return mixColor(this.liquidFrom, this.liquidTo, k);
  }

  // ---------------------------------------------------------------- animação

  update(_time: number, delta: number): void {
    const dt = delta / 1000;
    this.t += dt;
    this.boost = Math.max(0, this.boost - dt / 1.4);
    this.stirAngle += dt * STIR_SPEED * (1 + 0.9 * this.boost);
    this.liquidMix = Math.min(1, this.liquidMix + delta / 900);
    this.tossMs -= delta;
    if (this.tossMs <= 0) {
      this.tossMs = 4600 + Math.random() * 1800;
      this.toss();
    }
    const a = this.stirAngle;

    // corpo: inclina a partir dos pés no ritmo da varinha e "respira"
    this.roo.setAngle(Math.sin(a - 0.5) * 2.4);
    this.roo.setScale(ROO_SCALE, ROO_SCALE * (1 + 0.012 * Math.sin(2 * a)));

    // ombro e mão (a mão gira em um círculo pequeno, adiantada em relação à ponta)
    const pts = rooStirPoints(CONFIG.tile);
    const shoulder = this.toWorld(pts.shoulder.x, pts.shoulder.y);
    const hand = this.toWorld(
      pts.hand.x + Math.cos(a - 0.9) * HAND_RX,
      pts.hand.y + Math.sin(a - 0.9) * HAND_RY,
    );

    // a ponta da varinha gira sobre o líquido
    const tipX = CAULDRON_X + TIP_RX * Math.cos(a);
    const tipY = RIM_Y + 2 + TIP_RY * Math.sin(a);
    this.tip.setPosition(tipX, tipY);
    this.tipGlow.setPosition(tipX, tipY);
    this.trail.push({ x: tipX, y: tipY });
    if (this.trail.length > 16) this.trail.shift();

    // braço: do ombro até a mão
    this.arm.clear();
    this.arm.lineStyle(5.6 * ROO_SCALE * 0.55, FUR, 1);
    this.arm.lineBetween(shoulder.x, shoulder.y, hand.x, hand.y);
    this.arm.fillStyle(FUR, 1);
    this.arm.fillCircle(shoulder.x, shoulder.y, 3.1 * ROO_SCALE * 0.55);
    this.arm.fillStyle(0xffb066, 1);
    this.arm.fillCircle(hand.x, hand.y, 3.4 * ROO_SCALE * 0.6);

    // varinha: da mão até a ponta
    this.wand.clear();
    this.wand.lineStyle(6, 0x4a3822, 1);
    this.wand.lineBetween(hand.x, hand.y, tipX, tipY);
    this.wand.lineStyle(3, 0x9b7b4f, 1);
    this.wand.lineBetween(hand.x, hand.y, tipX, tipY);
    this.wand.fillStyle(0xffd54f, 1);
    this.wand.fillCircle(tipX, tipY, 3);

    // líquido, anéis na superfície e trilha da varinha
    const color = this.currentLiquid();
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
