// Gera todas as texturas procedurais do jogo (sem assets externos).
import Phaser from 'phaser';
import { createMaker } from './make';
import { drawTerrain } from './terrain';
import { drawPotions } from './potions';
import { drawRooTextures } from './roo';
import { drawEntities } from './entities';
import { drawHudIcons } from './hud';
import { drawMenuTextures } from './menu';
import { drawWitchTextures } from './witch';
import { CONFIG } from '../config';

export function generateTextures(scene: Phaser.Scene): void {
  const { g, make } = createMaker(scene);
  drawTerrain(make);
  drawPotions(make);
  drawRooTextures(g, CONFIG.tile);
  drawEntities(make);
  drawHudIcons(g);
  drawMenuTextures(g);
  drawWitchTextures(g, CONFIG.tile);
  g.destroy();
}
