import Phaser from 'phaser';
import { CONFIG } from '../config';

export type DrawFn = (g: Phaser.GameObjects.Graphics, T: number) => void;
export type MakeFn = (key: string, draw: DrawFn) => void;

// Helper que gera uma textura quadrada de CONFIG.tile a partir de uma função de desenho.
export function createMaker(scene: Phaser.Scene): { g: Phaser.GameObjects.Graphics; make: MakeFn } {
  // false = não adiciona à cena (é só um canvas de desenho temporário)
  const g = scene.make.graphics({}, false);
  const make: MakeFn = (key, draw) => {
    g.clear();
    draw(g, CONFIG.tile);
    g.generateTexture(key, CONFIG.tile, CONFIG.tile);
  };
  return { g, make };
}
