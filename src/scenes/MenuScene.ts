// Cena do menu principal: o laboratório, com a Roo mexendo uma poção no caldeirão.
// O título e os botões são DOM (por cima do canvas, ver #menu em index.html).
//
// Movimento da Roo:
// - o corpo se inclina a partir dos pés no ritmo da varinha e "respira" (leve esticar);
// - o braço é desenhado pela cena (ombro até a mão), e a mão faz um círculo pequeno em sincronia
//   com a ponta da varinha, então o braço de fato acompanha o movimento;
// - de tempos em tempos (ou quando se clica num frasco da prateleira) ela chama um ingrediente:
//   aponta a varinha para o frasco, ele levita brilhando e voa guiado por ela até o caldeirão;
// - ao cair, o caldeirão reage de um jeito próprio de cada elemento (labareda, respingo, pedras,
//   redemoinho de névoa), o líquido muda de cor e a Roo reage junto (recua, pula, pisa, flutua).
import Phaser from 'phaser';
import { BOMB_TYPES, CANVAS, CONFIG, ELEMENTS, ElementId } from '../config';
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

function elementIdOf(textureKey: string): ElementId {
  const id = textureKey.replace('bomb_', '') as keyof typeof BOMB_TYPES;
  return BOMB_TYPES[id].element;
}

function elementOf(textureKey: string): (typeof ELEMENTS)[keyof typeof ELEMENTS] {
  return ELEMENTS[elementIdOf(textureKey)];
}

// Como o caldeirão e a Roo reagem a cada elemento quando o frasco cai.
interface Reaction {
  texture: string; speed: { min: number; max: number }; angle: { min: number; max: number };
  gravity: number; life: { min: number; max: number }; size: { start: number; end: number };
  count: number; tint: number[]; blend: string;
  lean: number; // inclinação da Roo (graus; negativo = recua para trás)
  hop: number; // altura do pulo (px)
  shake: number; // tremor da câmera (0 = nenhum)
}
const REACTIONS: Record<ElementId, Reaction> = {
  // fogo: labareda alta; a Roo dá um passo atrás
  fire: { texture: 'menu_spark', speed: { min: 120, max: 260 }, angle: { min: -112, max: -68 }, gravity: 140, life: { min: 500, max: 950 }, size: { start: 2.4, end: 0 }, count: 26, tint: [0xff7043, 0xffb74d, 0xffd54f], blend: 'ADD', lean: -7, hop: 14, shake: 0 },
  // água: respingo largo
  water: { texture: 'menu_bubble', speed: { min: 60, max: 170 }, angle: { min: -160, max: -20 }, gravity: 320, life: { min: 600, max: 1000 }, size: { start: 1.5, end: 0.2 }, count: 28, tint: [0x4fc3f7, 0xb3e5fc, 0xffffff], blend: 'NORMAL', lean: -3, hop: 12, shake: 0 },
  // terra: pedras que saltam; a Roo pisa e a câmera treme
  earth: { texture: 'menu_spark', speed: { min: 80, max: 190 }, angle: { min: -150, max: -30 }, gravity: 480, life: { min: 450, max: 800 }, size: { start: 2.2, end: 0.6 }, count: 16, tint: [0x8d6e63, 0x6d4c41, 0xa1887f], blend: 'NORMAL', lean: 0, hop: 6, shake: 0.0025 },
  // éter: redemoinho de brilhos que sobe; a Roo flutua
  air: { texture: 'menu_spark', speed: { min: 30, max: 90 }, angle: { min: 0, max: 360 }, gravity: -90, life: { min: 900, max: 1500 }, size: { start: 1.8, end: 0 }, count: 24, tint: [0xffffff, 0xe0d8ff, 0xb3e5fc], blend: 'ADD', lean: 5, hop: 20, shake: 0 },
};

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
  private lean = 0; // inclinação extra da Roo (graus), usada nas reações
  private aim: Pt | null = null; // para onde a varinha aponta ao chamar um frasco
  private aimBlend = 0; // 0 = mexendo a poção, 1 = apontando
  private busy = false; // há um frasco a caminho do caldeirão
  private bubbles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private glow!: Phaser.GameObjects.Image;

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
    this.lean = 0;
    this.aim = null;
    this.aimBlend = 0;
    this.busy = false;
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
      const entry: ShelfPotion = { x: px, y: y - 19, key };
      // clicar no frasco chama esse ingrediente
      this.add.image(px, y - 19, key).setScale(1.1).setDepth(3)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.toss(entry));
      this.shelfPotions.push(entry);
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

    // brilho da boca do caldeirão: acompanha a cor do líquido (ver update)
    this.glow = this.add.image(cx, RIM_Y - 6, 'menu_puff').setScale(3.4, 1.2)
      .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.2).setDepth(6);

    // bolhas estourando na superfície
    this.bubbles = this.add.particles(cx, RIM_Y, 'menu_bubble', {
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

  // A Roo chama um frasco: aponta a varinha, ele levita brilhando e voa guiado por ela até o caldeirão.
  private toss(pick?: ShelfPotion): void {
    if (this.busy) return; // um de cada vez
    this.busy = true;
    const src = pick ?? (Phaser.Utils.Array.GetRandom(this.shelfPotions) as ShelfPotion);
    const element = elementOf(src.key);
    const kind = elementIdOf(src.key);
    const ex = CAULDRON_X + Phaser.Math.Between(-18, 18);
    const ey = RIM_Y - 4;
    const flask = this.add.image(src.x, src.y, src.key).setScale(1.1).setDepth(13);
    const aura = this.add.image(src.x, src.y, 'menu_puff').setTint(element.color)
      .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0).setScale(0.7).setDepth(12);

    // 1) a Roo aponta para o frasco; ele se acende e sobe um pouco
    this.aim = { x: src.x, y: src.y - 8 };
    const lean = Phaser.Math.Clamp((src.x - ROO_X) / 300, -1, 1) * 3;
    this.tweens.add({ targets: this, aimBlend: 1, lean, duration: 420, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: aura, alpha: 0.85, scale: 1.5, duration: 420 });
    this.tweens.add({ targets: flask, y: src.y - 9, duration: 420, ease: 'Sine.easeOut' });

    // 2) o frasco voa em arco; a varinha acompanha
    this.time.delayedCall(460, () => {
      const y0 = src.y - 9;
      this.tweens.addCounter({
        from: 0, to: 1, duration: 1050, ease: 'Sine.easeInOut',
        onUpdate: tw => {
          const p = tw.getValue() ?? 0;
          const fx = Phaser.Math.Linear(src.x, ex, p);
          const fy = Phaser.Math.Linear(y0, ey, p) - Math.sin(p * Math.PI) * 95;
          flask.setPosition(fx, fy);
          aura.setPosition(fx, fy);
          flask.setRotation(p * 9);
          flask.setScale(1.1 - 0.5 * p);
          aura.setScale(1.5 - 0.6 * p);
          this.aim = { x: fx, y: fy };
        },
        onComplete: () => {
          flask.destroy();
          aura.destroy();
          this.aim = null;
          this.tweens.add({ targets: this, aimBlend: 0, duration: 450, ease: 'Sine.easeInOut' });
          this.react(kind, ex, ey, element.color, element.glow);
          this.time.delayedCall(900, () => { this.busy = false; });
        },
      });
    });
  }

  // O ingrediente cai: o caldeirão reage de um jeito próprio do elemento, o líquido muda de cor e a Roo reage.
  private react(kind: ElementId, x: number, y: number, color: number, glow: number): void {
    const r = REACTIONS[kind];
    const burst = this.add.particles(x, y, r.texture, {
      speed: r.speed,
      angle: r.angle,
      gravityY: r.gravity,
      lifespan: r.life,
      scale: r.size,
      alpha: { start: 1, end: 0 },
      tint: r.tint,
      blendMode: r.blend,
      emitting: false,
    }).setDepth(12);
    burst.explode(r.count);
    this.time.delayedCall(1700, () => burst.destroy());

    // clarão da cor do elemento e anéis que se abrem na superfície
    const flash = this.add.image(x, y, 'menu_puff').setTint(color).setBlendMode(Phaser.BlendModes.ADD)
      .setScale(0.8).setAlpha(0.9).setDepth(12);
    this.tweens.add({ targets: flash, scale: kind === 'fire' ? 4.2 : 3.2, alpha: 0, duration: 560, onComplete: () => flash.destroy() });
    for (let k = 0; k < 2; k++) {
      const ring = this.add.ellipse(x, RIM_Y + 1, 30, 10).setStrokeStyle(2, glow, 0.9).setDepth(7);
      this.tweens.add({
        targets: ring, scaleX: 5.2, scaleY: 3.4, alpha: 0, duration: 760, delay: k * 170,
        onComplete: () => ring.destroy(),
      });
    }

    // detalhes de cada elemento
    if (kind === 'fire') {
      // as chamas de baixo também crescem por um instante
      const flare = this.add.image(CAULDRON_X, RIM_Y + 92, 'menu_puff').setScale(6, 2.4).setTint(0xff7043)
        .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.7).setDepth(3);
      this.tweens.add({ targets: flare, alpha: 0, scaleY: 3.4, duration: 800, onComplete: () => flare.destroy() });
    } else if (kind === 'earth') {
      const dust = this.add.particles(x, y, 'menu_puff', {
        speed: { min: 20, max: 60 }, angle: { min: -160, max: -20 },
        lifespan: { min: 700, max: 1200 }, scale: { start: 0.3, end: 1.2 }, alpha: { start: 0.45, end: 0 },
        tint: [0xa1887f, 0xbcaaa4], emitting: false,
      }).setDepth(12);
      dust.explode(8);
      this.time.delayedCall(1300, () => dust.destroy());
    } else if (kind === 'air') {
      // um anel de névoa sobe girando
      const ring = this.add.ellipse(x, y - 6, 34, 11).setStrokeStyle(2, 0xe0d8ff, 0.9).setDepth(12);
      this.tweens.add({ targets: ring, y: y - 90, scaleX: 3, alpha: 0, duration: 1100, ease: 'Sine.easeOut', onComplete: () => ring.destroy() });
    }
    if (r.shake > 0) this.cameras.main.shake(130, r.shake);

    // o líquido troca de cor e ferve
    this.liquidFrom = this.currentLiquid();
    this.liquidTo = color;
    this.liquidMix = 0;
    this.boost = 1;
    this.bubbles.setFrequency(35);
    this.time.delayedCall(1400, () => this.bubbles.setFrequency(130));

    // a Roo reage: pulo e inclinação própria do elemento (recua, pisa ou flutua)
    this.tweens.add({ targets: this.roo, y: FEET_Y - r.hop, duration: kind === 'air' ? 320 : 150, yoyo: true, ease: 'Quad.easeOut' });
    this.tweens.add({
      targets: this, lean: { from: r.lean, to: 0 }, duration: 900, ease: 'Back.easeOut',
    });
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
    this.roo.setAngle(Math.sin(a - 0.5) * 2.4 + this.lean);
    this.roo.setScale(ROO_SCALE, ROO_SCALE * (1 + 0.012 * Math.sin(2 * a)));

    // ombro e mão (a mão gira em um círculo pequeno, adiantada em relação à ponta)
    const pts = rooStirPoints(CONFIG.tile);
    const shoulder = this.toWorld(pts.shoulder.x, pts.shoulder.y);
    const hand = this.toWorld(
      pts.hand.x + Math.cos(a - 0.9) * HAND_RX,
      pts.hand.y + Math.sin(a - 0.9) * HAND_RY,
    );

    // a ponta da varinha gira sobre o líquido; ao chamar um frasco, aponta para ele (mesmo comprimento de varinha)
    const stirX = CAULDRON_X + TIP_RX * Math.cos(a);
    const stirY = RIM_Y + 2 + TIP_RY * Math.sin(a);
    let tipX = stirX;
    let tipY = stirY;
    if (this.aim && this.aimBlend > 0.001) {
      const len = Math.hypot(stirX - hand.x, stirY - hand.y);
      const dx = this.aim.x - hand.x;
      const dy = this.aim.y - hand.y;
      const d = Math.hypot(dx, dy) || 1;
      tipX = Phaser.Math.Linear(stirX, hand.x + (dx / d) * len, this.aimBlend);
      tipY = Phaser.Math.Linear(stirY, hand.y + (dy / d) * len, this.aimBlend);
    }
    this.tip.setPosition(tipX, tipY);
    this.tipGlow.setPosition(tipX, tipY);
    // a trilha no líquido só existe enquanto a varinha mexe a poção
    if (this.aimBlend < 0.1) this.trail.push({ x: tipX, y: tipY });
    else this.trail.shift();
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
    this.glow.setTint(color).setAlpha(0.16 + 0.3 * this.boost);
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
