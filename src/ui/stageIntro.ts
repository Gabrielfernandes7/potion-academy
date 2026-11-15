// O cartão de entrada de cada fase, em DOM: uma gravura animada do Livro de Roo (a mesma arte do livro, ver
// game/stageArt.ts), o lugar, o nome, a frase da história e a dica. Fica na tela até a jogadora começar (botão, ENTER
// ou toque), e a fase espera por isso (MainScene.introOpen). Os personagens das gravuras são as texturas do próprio
// jogo, copiadas para canvases comuns uma vez (o Phaser já as gerou).
import type Phaser from 'phaser';
import { placaDaFase } from '../game/stageArt';
import { H, W, type Sprites } from '../pages/livroDraw';
import { SPRITES_DAS_CENAS } from '../pages/livroScenes';
import { PLACAS, SPRITES_DAS_PLACAS } from '../pages/placas';
import { byId, setShown } from './dom';

export interface StageIntro {
  textures: Phaser.Textures.TextureManager;
  stage: number; // 1 a 20; 0 (a Arena e o duelo) usa a gravura do duelo
  head: string; // "O VALE · 1/4 · LABORATÓRIO DO CALDEIRÃO"
  name: string;
  story: string;
  tip?: string;
  onStart: () => void; // a jogadora apertou COMEÇAR
}

let sprites: Sprites | null = null;
let rafId = 0;
let aberto = false;

// Copia, uma vez, as texturas que as gravuras usam (as que ainda não existirem ficam de fora: a gravura se vira sem).
function carregar(textures: Phaser.Textures.TextureManager): Sprites {
  if (sprites) return sprites;
  const out: Sprites = {};
  for (const key of [...SPRITES_DAS_CENAS, ...SPRITES_DAS_PLACAS]) {
    if (!textures.exists(key) || out[key]) continue;
    const src = textures.get(key).getSourceImage() as HTMLCanvasElement;
    const copia = document.createElement('canvas');
    copia.width = src.width;
    copia.height = src.height;
    copia.getContext('2d')?.drawImage(src, 0, 0);
    out[key] = copia;
  }
  sprites = out;
  return out;
}

export function isStageIntroOpen(): boolean {
  return aberto;
}

export function showStageIntro(o: StageIntro): void {
  const canvas = byId<HTMLCanvasElement>('intro-canvas');
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext('2d');
  const s = carregar(o.textures);
  const { placa, variante } = placaDaFase(o.stage);
  byId('intro-head').textContent = o.head;
  byId('intro-name').textContent = o.name;
  byId('intro-story').textContent = o.story;
  const tip = byId('intro-tip');
  tip.textContent = o.tip ?? '';
  tip.hidden = !o.tip;
  byId('intro-btn').onclick = o.onStart;
  aberto = true;
  setShown('intro-overlay', true);
  byId('intro-btn').focus({ preventScroll: true });
  cancelAnimationFrame(rafId);
  if (!c) return;
  c.imageSmoothingEnabled = false;
  const t0 = performance.now();
  const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let ultimo = 0;
  const passo = (agora: number): void => {
    if (!aberto) return;
    if (agora - ultimo > 33) {
      ultimo = agora;
      PLACAS[placa](c, reduzido ? 4 : (performance.now() - t0) / 1000, s, variante);
    }
    if (!reduzido || ultimo === 0) rafId = requestAnimationFrame(passo);
  };
  rafId = requestAnimationFrame(passo);
}

export function hideStageIntro(): void {
  aberto = false;
  cancelAnimationFrame(rafId);
  setShown('intro-overlay', false);
}
