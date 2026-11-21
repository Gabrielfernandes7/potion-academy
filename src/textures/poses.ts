// Poses novas da Roo e dos inimigos, derivadas dos quadros que já existem (textures/derive.ts). Chaves:
//   roo_hurt_{dir}              1 quadro: levou dano, encolhida
//   roo_cast_{dir}_0..1         2 quadros: pôs a poção (recua e solta)
//   roo_pickup_{dir}_0..1       2 quadros: pegou um item (um pulinho)
//   roo_win_0..2                3 quadros: chegou à porta (pula e comemora)
//   roo_fall_0..2               3 quadros: game over (desaba)
//   enemy_crouch                o sapo se agacha antes do salto
//   enemy_lantern_2             terceiro quadro da chama da lanterna
import type Phaser from 'phaser';
import { ANSELMO_COLOR } from './anselmo';
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

const css = (n: number): string => `#${n.toString(16).padStart(6, '0')}`;

/**
 * Frei Anselmo abençoa: o braço direito sobe em três quadros (anselmo_bless_0..2) e a mão larga um brilho dourado. O
 * corpo é o de `anselmo_front_0`; só o braço e a luz são pintados por cima, em pixels (uma manga de hábito e uma mão).
 */
export function addAnselmoBless(scene: Phaser.Scene): void {
  if (!scene.textures.exists('anselmo_front_0')) return;
  const src = scene.textures.get('anselmo_front_0').getSourceImage() as CanvasImageSource & { width: number; height: number };
  const hand: Array<[number, number]> = [[32, 25], [33, 18], [34, 11]]; // onde a mão fica em cada quadro
  hand.forEach(([hx, hy], i) => {
    const cv = document.createElement('canvas');
    cv.width = src.width;
    cv.height = src.height;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(src, 0, 0);
    const px = (x: number, y: number, w: number, h: number, color: string, a = 1): void => {
      ctx.globalAlpha = a; ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), w, h); ctx.globalAlpha = 1;
    };
    // a manga sobe do ombro (28, 23) até a mão, em degraus de 1 px: primeiro o contorno, depois o pano
    const n = Math.max(Math.abs(hx - 28), 23 - hy);
    for (const pass of ['out', 'cloth'] as const) {
      for (let k = 0; k <= n; k++) {
        const x = 28 + ((hx - 28) * k) / n;
        const y = 23 + ((hy - 23) * k) / n;
        if (pass === 'out') px(x - 2, y - 1, 5, 4, css(ANSELMO_COLOR.contorno));
        else px(x - 1, y, 3, 2, css(ANSELMO_COLOR.habito));
      }
    }
    px(hx - 2, hy - 3, 4, 4, css(ANSELMO_COLOR.contorno)); // a mão
    px(hx - 1, hy - 2, 2, 2, css(ANSELMO_COLOR.pele));
    // o brilho cresce com o braço
    // o brilho cresce com o braço: um losango de degraus de 1 px (nada de quadrado), com um núcleo mais claro
    const glow = (r: number, color: string, a: number): void => {
      for (let dy = -r; dy <= r; dy++) { const w = r - Math.abs(dy); px(hx - 1 - w, hy - 2 + dy, 2 * w + 2, 1, color, a); }
    };
    if (i > 0) { glow(2 + 2 * i, css(0xffe9a8), 0.2); glow(1 + i, css(ANSELMO_COLOR.brilho), 0.45); }
    if (scene.textures.exists(`anselmo_bless_${i}`)) scene.textures.remove(`anselmo_bless_${i}`);
    scene.textures.addCanvas(`anselmo_bless_${i}`, cv);
  });
}

/**
 * Poses derivadas dos chefes (`prefix` = belladonna: witch, etc.): preparo do golpe (`_windup_0..1`: agacha e recolhe),
 * fôlego depois dele (`_recover`), a queda em dois quadros (`_fall_0..1`) e mais dois quadros de respiração (`_idle_2..3`),
 * que levam o ciclo de 2 para 4 quadros. Partem dos quadros de `idle`, já com contorno.
 */
export function addBossPoses(scene: Phaser.Scene, prefixes: string[]): void {
  for (const p of prefixes) {
    const idle0 = `${p}_idle_0`;
    deriveTexture(scene, idle0, `${p}_windup_0`, { squash: 2 });
    deriveTexture(scene, idle0, `${p}_windup_1`, { squash: 4 });
    deriveTexture(scene, idle0, `${p}_recover`, { stretch: 1 });
    deriveTexture(scene, idle0, `${p}_fall_0`, { squash: 3 });
    deriveTexture(scene, idle0, `${p}_fall_1`, { squash: 6 });
    // a Mandrágora já tem seis quadros de respiração; os outros ganham dois
    if (!scene.textures.exists(`${p}_idle_2`)) {
      deriveTexture(scene, idle0, `${p}_idle_2`, { stretch: 1 });
      deriveTexture(scene, `${p}_idle_1`, `${p}_idle_3`, { squash: 1 });
    }
  }
}
