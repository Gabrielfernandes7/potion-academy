// O que as páginas de apoio (catálogo de sprites, manuscrito, ideias de sprites, livro da história) repetiam:
// subir um Phaser escondido só para gerar as texturas do jogo e lê-las como imagens.
//   bootPage(Cena)      : cria o Phaser.Game escondido (CANVAS 1x1, pixel art, sem áudio) com a cena da página.
//   prepareTextures(this): gera as texturas do jogo, e, se pedido, as das formas da Roo e o filtro de tinta dos ícones.
// Uma página nova: um .html na raiz, um .ts aqui, uma linha em vite.config.ts (ver docs/16-guia-de-extensao.md).
import Phaser from 'phaser';
import { generateTextures } from '../textures';
import { addRooFormTextures, type FormTextureOptions } from '../textures/rooFormTextures';
import { ROUGH_FILTER } from '../ui/elementIcons';

export interface PrepareOptions {
  forms?: FormTextureOptions; // gera também as texturas das formas da Roo (só as pedidas)
  roughFilter?: boolean; // põe o filtro de tinta (#rough) dos ícones SVG no documento
}

export function prepareTextures(scene: Phaser.Scene, o: PrepareOptions = {}): void {
  generateTextures(scene);
  if (o.forms) addRooFormTextures(scene, o.forms);
  if (o.roughFilter && !document.getElementById('rough')) document.body.insertAdjacentHTML('afterbegin', ROUGH_FILTER);
}

export function bootPage(scene: Phaser.Types.Scenes.SceneType, parent = 'stage'): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.CANVAS, width: 1, height: 1, parent, pixelArt: true, audio: { noAudio: true }, scene: [scene],
  });
}

/** Só as texturas que as páginas de personagem mostram: o auge de cada forma, de frente, no primeiro quadro. */
export const FORM_PREVIEW: FormTextureOptions = { stages: [4], dirs: ['down'], frames: [0] };
