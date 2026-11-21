// Poses novas da Roo e dos inimigos, derivadas dos quadros que já existem (textures/derive.ts). Chaves:
//   roo_hurt_{dir}              1 quadro: levou dano, encolhida
//   roo_cast_{dir}_0..1         2 quadros: pôs a poção (recua e solta)
//   roo_pickup_{dir}_0..1       2 quadros: pegou um item (um pulinho)
//   roo_win_0..2                3 quadros: chegou à porta (pula e comemora)
//   roo_fall_0..2               3 quadros: game over (desaba)
//   enemy_crouch                o sapo se agacha antes do salto
//   enemy_lantern_2             terceiro quadro da chama da lanterna
import type Phaser from 'phaser';
import { deriveTexture } from './derive';

const DIRS = ['down', 'up', 'side'] as const;

export function addDerivedPoses(scene: Phaser.Scene): void {
  for (const d of DIRS) {
    const base = `roo_${d}_0`;
    deriveTexture(scene, base, `roo_hurt_${d}`, { squash: 3 });
    deriveTexture(scene, base, `roo_cast_${d}_0`, { squash: 1, dx: d === 'side' ? -1 : 0 });
    deriveTexture(scene, base, `roo_cast_${d}_1`, { stretch: 1, dx: d === 'side' ? 1 : 0 });
    deriveTexture(scene, base, `roo_pickup_${d}_0`, { stretch: 2 });
    deriveTexture(scene, base, `roo_pickup_${d}_1`, { squash: 1 });
  }
  deriveTexture(scene, 'roo_down_0', 'roo_win_0', { squash: 2 });
  deriveTexture(scene, 'roo_down_0', 'roo_win_1', { stretch: 3 });
  deriveTexture(scene, 'roo_down_0', 'roo_win_2', { stretch: 1 });
  deriveTexture(scene, 'roo_down_0', 'roo_fall_0', { squash: 2 });
  deriveTexture(scene, 'roo_down_0', 'roo_fall_1', { squash: 5 });
  deriveTexture(scene, 'roo_down_0', 'roo_fall_2', { squash: 8, split: 28 });
  deriveTexture(scene, 'enemy', 'enemy_crouch', { squash: 3, split: 20 });
}
