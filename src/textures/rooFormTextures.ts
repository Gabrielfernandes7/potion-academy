// Texturas das transformações da Roo para o jogo: um conjunto por forma (fogo, água), estágio (1 a 4), direção,
// quadro do corpo (0 a 3) e fase do tremor (0 a 7), geradas a partir dos quadros normais da Roo (depois do
// contorno). Chave: `roo_<forma>_<estágio>_<direção>_<quadro>_<tremor>`. O estágio 0 é a Roo normal, sem textura aqui.
// A lógica dos estágios está em game/forms/. Para uma forma nova, acrescente o gerador em FORM_PAINTERS.
import Phaser from 'phaser';
import type { FormId } from '../game/forms/types';
import { makeFireRoo, type FireDir } from './rooFire';
import { makeWaterRoo } from './rooWater';

export const FORM_DIRS: readonly FireDir[] = ['down', 'up', 'side'];
export const FORM_TREMOR_STEPS = 8; // fases do tremor
export const FORM_TREMOR_MS = 90; // tempo entre fases

type Src = CanvasImageSource & { width: number; height: number };
interface Paint { dir: FireDir; frame: number; tick: number; stage: number }

// Como pintar cada forma por cima da Roo normal.
const FORM_PAINTERS: Record<FormId, (src: Src, p: Paint) => HTMLCanvasElement> = {
  fire: (src, p) => makeFireRoo(src, { ...p, intensity: 'high' }),
  water: (src, p) => makeWaterRoo(src, p),
};

export function formTextureKey(form: FormId, stage: number, dir: string, frame: number | string, tremor: number): string {
  return `roo_${form}_${stage}_${dir}_${frame}_${tremor}`;
}

export interface FormTextureOptions { forms?: FormId[]; stages?: number[]; dirs?: FireDir[]; frames?: number[] }

/** Gera as texturas das formas: por padrão todas (2 formas x 4 estágios x 3 direções x 4 quadros x 8 fases). */
export function addRooFormTextures(scene: Phaser.Scene, o: FormTextureOptions = {}): void {
  const forms = o.forms ?? (Object.keys(FORM_PAINTERS) as FormId[]);
  const stages = o.stages ?? [1, 2, 3, 4];
  const dirs = o.dirs ?? FORM_DIRS;
  const frames = o.frames ?? [0, 1, 2, 3];
  for (const form of forms) {
    for (const stage of stages) {
      for (const dir of dirs) {
        for (const fr of frames) {
          const src = scene.textures.get(`roo_${dir}_${fr}`).getSourceImage() as HTMLCanvasElement;
          for (let t = 0; t < FORM_TREMOR_STEPS; t++) {
            const key = formTextureKey(form, stage, dir, fr, t);
            if (scene.textures.exists(key)) continue;
            scene.textures.addCanvas(key, FORM_PAINTERS[form](src, { dir, frame: fr, tick: t, stage }));
          }
        }
      }
    }
  }
}
