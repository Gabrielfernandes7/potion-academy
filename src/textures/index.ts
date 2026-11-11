// Gera todas as texturas procedurais do jogo (sem assets externos).
import Phaser from 'phaser';
import { createMaker } from './make';
import { drawTerrain } from './terrain';
import { drawGarden } from './garden';
import { drawPotions } from './potions';
import { drawRooTextures } from './roo';
import { drawEntities } from './entities';
import { drawHudIcons } from './hud';
import { drawMenuTextures } from './menu';
import { drawWitchTextures } from './witch';
import { drawAnselmoTextures } from './anselmo';
import { outlineTexture } from './outline';
import { CONFIG } from '../config';

export function generateTextures(scene: Phaser.Scene): void {
  const { g, make } = createMaker(scene);
  drawTerrain(make);
  drawGarden(make);
  drawPotions(make);
  drawRooTextures(g, CONFIG.tile);
  // contorno só na Roo que anda (as poses de menu e de leitura têm fundo próprio)
  for (let fi = 0; fi < 4; fi++) for (const dir of ['down', 'up', 'side']) outlineTexture(scene, `roo_${dir}_${fi}`);
  drawEntities(make);
  drawHudIcons(g);
  drawMenuTextures(g);
  drawWitchTextures(g, CONFIG.tile);
  drawAnselmoTextures(scene);
  g.destroy();
}
