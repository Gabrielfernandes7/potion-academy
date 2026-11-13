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
import { drawMandrakeTextures } from './mandrake';
import { drawAnselmoTextures } from './anselmo';
import { BUBBLE_POSES, drawRooBubbleFrames } from './rooBubble';
import { outlineTexture } from './outline';
import { CONFIG } from '../config';

// Roo bebê dentro da bolha: quadros roo_bubble_<pose>_0..15 (laço dos GIFs).
function addRooBubble(scene: Phaser.Scene): void {
  for (const pose of BUBBLE_POSES) drawRooBubbleFrames(pose).forEach((canvas, i) => scene.textures.addCanvas(`roo_bubble_${pose}_${i}`, canvas));
}

export function generateTextures(scene: Phaser.Scene): void {
  const { g, make } = createMaker(scene);
  drawTerrain(make);
  drawGarden(make);
  drawPotions(make);
  drawRooTextures(g, CONFIG.tile);
  // contorno só na Roo que anda (as poses de menu e de leitura têm fundo próprio)
  for (let fi = 0; fi < 4; fi++) for (const dir of ['down', 'up', 'side']) outlineTexture(scene, `roo_${dir}_${fi}`);
  addRooBubble(scene);
  drawEntities(make);
  drawHudIcons(g);
  drawMenuTextures(g);
  drawWitchTextures(g, CONFIG.tile);
  drawMandrakeTextures(g, CONFIG.tile);
  drawAnselmoTextures(scene);
  g.destroy();
}
