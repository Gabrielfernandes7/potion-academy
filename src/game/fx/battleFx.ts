// Efeitos curtos do campo de batalha: poeira dos passos, lascas de bloco, clarão de golpe, sumiço do inimigo e brilho de
// item. Tudo sai do reservatório de partículas (fxPool, um emissor por tipo de efeito) e de tweens curtos; nada cria um
// emissor por efeito (docs/21-desempenho.md). As cores e os números são dados puros, testados em tests/battleFx.test.ts.
import type Phaser from 'phaser';
import type { ElementId } from '../../config';
import type { BlockStyle } from '../stages/blockStyles';
import { fxPool } from './particlePool';

/** Cores das lascas que voam quando cada bloco quebra (madeira, sal, pedra, cera, papel...). */
export const BLOCK_DEBRIS: Record<BlockStyle, number[]> = {
  wood: [0x8d6e63, 0x6d4c41, 0xa1887f],
  salt: [0xf5f5f5, 0xe0e0e0, 0xcfd8dc],
  moss: [0x8d6e63, 0x689f38, 0x558b2f],
  barrel: [0x795548, 0x90a4ae, 0xb0bec5],
  slab: [0x9e9e9e, 0x757575, 0xbdbdbd],
  wax: [0x8d6e63, 0xc62828, 0xffcc80],
  flasks: [0x8d6e63, 0x80deea, 0xb2ebf2],
  scroll: [0xf3e5ab, 0xd7c48a, 0xfff8e1],
  hay: [0xffe082, 0xd4b45a, 0xfff176],
  cairn: [0x8d8d8d, 0x6d6d6d, 0xa1887f],
  brick: [0xb5562f, 0x8d3f22, 0xd7a07a],
  garden: [0x66bb6a, 0xf48fb1, 0x8d6e63],
  books: [0x6d4c41, 0xa1462f, 0xf3e5ab],
};

/** Cor da fumaça em que o inimigo some, por elemento do golpe final. */
export const POOF_TINT: Record<ElementId, number[]> = {
  fire: [0x5d4037, 0xff8a65, 0x3e2723],
  water: [0xe1f5fe, 0x81d4fa, 0xffffff],
  earth: [0xbcaaa4, 0x8d6e63, 0xd7ccc8],
  air: [0xffffff, 0xe0d8ff, 0xd1c4e9],
};

/** Quanto dura o clarão branco de um golpe (ms): um quadro e pouco, o "acerto" que o olho lê. */
export const HIT_FLASH_MS = 70;
/** Quanto dura o sumiço do inimigo (ms): achata, sobe um pouco e some. */
export const POOF_MS = 220;

type Tintable = Phaser.GameObjects.Image;

/** Pinta o sprite de branco por um instante e devolve a cor que ele tinha (chefes expostos ficam dourados, por exemplo). */
export function hitFlash(scene: Phaser.Scene, sprite: Tintable, ms = HIT_FLASH_MS): void {
  if (!sprite.active) return;
  const had = sprite.isTinted && !sprite.tintFill ? sprite.tintTopLeft : null;
  sprite.setTintFill(0xffffff);
  scene.time.delayedCall(ms, () => {
    if (!sprite.active) return;
    if (had !== null) sprite.setTint(had);
    else sprite.clearTint();
  });
}

/** O inimigo derrotado: clarão, achata e sobe num sopro de fumaça do elemento, e só então o sprite é destruído. */
export function deathPoof(scene: Phaser.Scene, sprite: Tintable, element: ElementId): void {
  const { x, y } = sprite;
  sprite.setTintFill(0xffffff);
  scene.tweens.add({
    targets: sprite, scaleX: 1.3, scaleY: 0.5, y: y + 4, alpha: 0,
    duration: POOF_MS, ease: 'Quad.easeIn',
    onComplete: () => sprite.destroy(),
  });
  fxPool(scene).burst(`poof:${element}`, 'menu_puff', {
    speed: { min: 10, max: 40 },
    angle: { min: -160, max: -20 },
    lifespan: { min: 420, max: 650 },
    scale: { start: 0.3, end: 0.8 },
    alpha: { start: 0.7, end: 0 },
    tint: POOF_TINT[element],
  }, x, y, 6, 9);
}

/** O bloco quebra: lascas na cor dele caem com peso e uma nuvem de pó sobe. */
export function blockBreak(scene: Phaser.Scene, px: number, py: number, style: BlockStyle): void {
  const pool = fxPool(scene);
  pool.burst(`debris:${style}`, 'menu_spark', {
    speed: { min: 50, max: 120 },
    angle: { min: -160, max: -20 },
    gravityY: 420,
    lifespan: { min: 380, max: 620 },
    scale: { start: 1.6, end: 0.6 },
    alpha: { start: 1, end: 0 },
    tint: BLOCK_DEBRIS[style],
  }, px, py, 8, 6);
  pool.burst('debris:dust', 'menu_puff', {
    speed: { min: 6, max: 22 },
    angle: { min: -150, max: -30 },
    lifespan: { min: 500, max: 800 },
    scale: { start: 0.35, end: 0.9 },
    alpha: { start: 0.35, end: 0 },
    tint: [0xd7ccc8, 0xbcaaa4],
  }, px, py + 6, 3, 6);
}

/** Poeirinha nos pés da Roo a cada dois passos (na direção oposta à do passo). */
export function stepDust(scene: Phaser.Scene, px: number, py: number): void {
  fxPool(scene).burst('step:dust', 'menu_puff', {
    speed: { min: 4, max: 14 },
    angle: { min: -160, max: -20 },
    lifespan: { min: 300, max: 450 },
    scale: { start: 0.18, end: 0.4 },
    alpha: { start: 0.4, end: 0 },
    tint: [0xd7ccc8, 0xefebe9],
  }, px, py, 2, 6);
}

/** Item pego: estrelinhas na cor do brilho dele sobem em leque. */
export function collectSparkle(scene: Phaser.Scene, px: number, py: number, color: number): void {
  fxPool(scene).burst(`collect:${color}`, 'menu_spark', {
    speed: { min: 30, max: 80 },
    angle: { min: -150, max: -30 },
    gravityY: 60,
    lifespan: { min: 350, max: 600 },
    scale: { start: 1.3, end: 0 },
    alpha: { start: 1, end: 0 },
    blendMode: 'ADD',
    tint: [color, 0xffffff],
  }, px, py, 8, 11);
}
