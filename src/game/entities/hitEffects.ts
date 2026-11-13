// Efeitos de ser atingido por um elemento (inimigo ou Roo): partículas e cor própria de cada um.
import Phaser from 'phaser';
import type { ElementId } from '../../config';

// Efeito de quem é atingido, por elemento: o que sobra depois da explosão.
// fogo: brasas e fumaça subindo; água: respingos que caem; terra: lascas de pedra e poeira;
// éter: faíscas que giram no ar.
const HIT_FX: Record<ElementId, {
  texture: string; speed: { min: number; max: number }; angle: { min: number; max: number };
  gravity: number; life: { min: number; max: number }; size: number; count: number; tint: number[]; blend: string;
}> = {
  fire: { texture: 'menu_spark', speed: { min: 40, max: 110 }, angle: { min: -120, max: -60 }, gravity: -60, life: { min: 500, max: 900 }, size: 1.8, count: 9, tint: [0xff7043, 0xffb74d, 0xffd54f], blend: 'ADD' },
  water: { texture: 'menu_bubble', speed: { min: 60, max: 140 }, angle: { min: 200, max: 340 }, gravity: 260, life: { min: 450, max: 700 }, size: 1.1, count: 10, tint: [0x4fc3f7, 0xb3e5fc, 0xffffff], blend: 'NORMAL' },
  earth: { texture: 'menu_spark', speed: { min: 30, max: 100 }, angle: { min: -170, max: -10 }, gravity: 380, life: { min: 400, max: 650 }, size: 1.8, count: 8, tint: [0x8d6e63, 0x6d4c41, 0xa1887f], blend: 'NORMAL' },
  air: { texture: 'menu_spark', speed: { min: 30, max: 90 }, angle: { min: 0, max: 360 }, gravity: -30, life: { min: 500, max: 900 }, size: 1.5, count: 12, tint: [0xffffff, 0xe0d8ff, 0xb3e5fc], blend: 'ADD' },
};

// Cor que tinge a Roo ao ser atingida por cada elemento.
export const HIT_TINT: Record<ElementId, number> = {
  fire: 0xff7043,
  water: 0x4fc3f7,
  earth: 0xa1887f,
  air: 0xe0d8ff,
};

// Punhado de partículas do elemento: brasas (fogo), gotas (água), pedriscos (terra), brilhos (éter).
export function hitFx(scene: Phaser.Scene, px: number, py: number, element: ElementId): void {
  const c = HIT_FX[element];
  const emitter = scene.add.particles(px, py, c.texture, {
    speed: c.speed,
    angle: c.angle,
    gravityY: c.gravity,
    lifespan: c.life,
    scale: { start: c.size, end: 0 },
    alpha: { start: 1, end: 0 },
    tint: c.tint,
    blendMode: c.blend,
    emitting: false,
  }).setDepth(10);
  emitter.explode(c.count);
  scene.time.delayedCall(1000, () => emitter.destroy());
}
