// Criação do Phaser.Game (uma única vez, ao abrir a página) e navegação entre menu e partida.
//
// Cenas: Boot -> Menu (animada, com o título/botões em DOM por cima) -> Main (+ Hud em paralelo) -> Map (após vencer).
import Phaser from 'phaser';
import { CANVAS } from '../config';
import { BootScene } from '../scenes/BootScene';
import { HudScene } from '../scenes/HudScene';
import { MainScene } from '../scenes/MainScene';
import { MenuScene } from '../scenes/MenuScene';
import { EndScene } from '../scenes/EndScene';
import { MapScene } from '../scenes/MapScene';
import { TEXTURES_READY } from './events';
import { hideGameOver, setPauseVisible } from '../ui/overlays';
import { closeShop } from '../ui/shop';
import { setMenuVisible } from '../ui/menu';
import { ensureFonts } from '../ui/fonts';
import { showLetter } from '../ui/letter';
import { audio } from '../audio/AudioEngine';
import { SCENE_TRACKS } from '../audio/tracks';
import { ARENA_STAGE } from './arena';
import type { BossId } from './stages/types';

let phaserGame: Phaser.Game | null = null;
let texturesReady: Promise<void> = Promise.resolve();

export function bootGame(): void {
  if (phaserGame) return;
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    width: CANVAS.width,
    height: CANVAS.height,
    backgroundColor: '#0e1613',
    powerPreference: 'high-performance',
    pixelArt: true,
    antialias: false,
    parent: 'game',
    audio: { noAudio: true }, // o áudio é todo do AudioEngine (WebAudio próprio)
    // o canvas se ajusta ao contêiner #game (CSS), em qualquer tela
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [BootScene, MenuScene, MainScene, HudScene, MapScene, EndScene],
  });
  phaserGame = game;
  texturesReady = new Promise<void>(resolve => game.events.once(TEXTURES_READY, resolve));
  setMenuVisible(true);
  // só em desenvolvimento: permite inspecionar o jogo pelo console/testes (window.__game)
  if (import.meta.env.DEV) Object.assign(window, { __game: game });
}

// Imagem (data URL) de uma textura gerada pelo Phaser; null se ainda não existe.
export function textureDataUrl(key: string): string | null {
  if (!phaserGame || !phaserGame.textures.exists(key)) return null;
  const url = phaserGame.textures.getBase64(key);
  return url || null;
}

// Começa (ou reinicia) uma partida a partir do menu, da loja ou do fim de jogo.
let startingGame = false;

export async function startGame(): Promise<void> {
  if (startingGame) return; // a carta já está aberta (ex.: Enter repetido)
  startingGame = true;
  if (!phaserGame) bootGame();
  await texturesReady;
  await ensureFonts(); // a HUD no canvas precisa das fontes já carregadas
  const game = phaserGame as Phaser.Game;
  closeShop();
  hideGameOver();
  setMenuVisible(false);
  await showLetter(textureDataUrl('anselmo_retrato'));
  startingGame = false;
  if (game.scene.isActive('Main')) {
    game.scene.getScene('Main').scene.restart({ stage: 1 });
  } else {
    game.scene.stop('Menu');
    game.scene.start('Main', { stage: 1 });
  }
}

export function retryGame(): void {
  hideGameOver();
  // recomeça da fase 1, ou a mesma luta, se for treino na Arena (dados explícitos: o Phaser guarda os do último reinício)
  const main = phaserGame?.scene.getScene('Main') as MainScene | undefined;
  main?.scene.restart(main.restartData());
}

// Começa uma luta de treino na Arena, a partir do menu. Não toca na carta nem no progresso da campanha.
export async function startArena(boss: BossId): Promise<void> {
  if (!phaserGame) bootGame();
  await texturesReady;
  await ensureFonts();
  const game = phaserGame as Phaser.Game;
  closeShop();
  hideGameOver();
  setMenuVisible(false);
  const data = { stage: ARENA_STAGE, arena: boss };
  if (game.scene.isActive('Main')) {
    game.scene.getScene('Main').scene.restart(data);
  } else {
    game.scene.stop('Menu');
    game.scene.start('Main', data);
  }
}

// Volta ao menu principal (da pausa, do fim de jogo ou da loja).
export function showMenu(): void {
  const game = phaserGame;
  if (!game) return;
  hideGameOver();
  closeShop();
  setPauseVisible(false);
  game.scene.stop('Hud');
  game.scene.stop('Main');
  game.scene.stop('End');
  if (!game.scene.isActive('Menu')) game.scene.start('Menu');
  setMenuVisible(true);
  audio.playTrack(SCENE_TRACKS.menu);
}

// Mostra o mapa de seleção de fases (do menu).
export function showMap(): void {
  const game = phaserGame;
  if (!game) return;
  closeShop();
  setMenuVisible(false);
  if (game.scene.isActive('Main')) {
    game.scene.stop('Hud');
    game.scene.stop('Main');
  }
  game.scene.stop('Menu'); // o menu animado não fica rodando por baixo do mapa
  if (!game.scene.isActive('Map')) game.scene.start('Map');
}
