// Gera todas as texturas procedurais do jogo (sem assets externos).
import Phaser from 'phaser';
import { createMaker } from './make';
import { drawTerrain } from './terrain';
import { drawGarden } from './garden';
import { drawBlocks } from './blocks';
import { drawPotions } from './potions';
import { drawRooTextures } from './roo';
import { drawEntities } from './entities';
import { drawNewEnemies } from './enemiesNew';
import { drawMestre } from './mestre';
import { drawHudIcons } from './hud';
import { drawMenuTextures } from './menu';
import { BOSS_DEFS, BOSS_IDS } from '../game/entities/bosses/defs';
import { drawAnselmoTextures } from './anselmo';
import { drawWeaknessBadges } from './weaknessBadge';
import { drawBraziers } from './brazier';
import { addAnselmoBless, addBossPoses, addDerivedPoses } from './poses';
import { drawTransformCircles } from './transformFx';
import { BUBBLE_POSES, drawRooBubbleFrames } from './rooBubble';
import { outlineTexture } from './outline';
import { CONFIG } from '../config';

// Roo bebê dentro da bolha: quadros roo_bubble_<pose>_0..15 (laço dos GIFs).
function addRooBubble(scene: Phaser.Scene): void {
  for (const pose of BUBBLE_POSES) drawRooBubbleFrames(pose).forEach((canvas, i) => scene.textures.addCanvas(`roo_bubble_${pose}_${i}`, canvas));
}

export interface GenerateOptions {
  /** As 16 poses da Roo bebê na bolha (só o Livro de Roo e o catálogo usam; custavam ~180 ms no boot de todas as páginas e do jogo). */
  bubble?: boolean;
}

export function generateTextures(scene: Phaser.Scene, o: GenerateOptions = {}): void {
  const { g, make } = createMaker(scene);
  drawTerrain(make);
  drawGarden(make);
  drawBlocks(make);
  drawPotions(make);
  drawRooTextures(g, CONFIG.tile);
  // contorno só na Roo que anda (as poses de menu e de leitura têm fundo próprio)
  for (let fi = 0; fi < 4; fi++) for (const dir of ['down', 'up', 'side']) outlineTexture(scene, `roo_${dir}_${fi}`);
  if (o.bubble) addRooBubble(scene);
  drawEntities(make);
  drawNewEnemies(make);
  drawMestre(make);
  drawBraziers(make);
  drawTransformCircles(make);
  // o anel que se abre em cada casa de uma explosão (uma imagem, no lugar de um círculo vetorial por casa)
  make('fx_ring', (g, T) => { g.lineStyle(2, 0xffffff, 0.95); g.strokeCircle(T / 2, T / 2, 10.5); g.fillStyle(0xffffff, 0.18); g.fillCircle(T / 2, T / 2, 10.5); });
  drawHudIcons(g);
  drawMenuTextures(g);
  for (const id of BOSS_IDS) {
    const { prefix, draw } = BOSS_DEFS[id].sprite; // os chefes vêm do registro
    draw(g, CONFIG.tile);
    // contorno escuro em todos os quadros do chefe (legível sobre qualquer chão). `minAlpha`: a sombra e o brilho
    // translúcidos não ganham borda. scripts/silhouettes.cjs confere o contraste da borda.
    for (const key of scene.textures.getTextureKeys()) if (key.startsWith(prefix + '_')) outlineTexture(scene, key, 0.5);
  }
  addBossPoses(scene, BOSS_IDS.map(id => BOSS_DEFS[id].sprite.prefix));
  drawAnselmoTextures(scene);
  drawWeaknessBadges(scene);
  addAnselmoBless(scene);
  addDerivedPoses(scene); // poses derivadas dos quadros acima (precisa dos contornos já feitos)
  g.destroy();
}
