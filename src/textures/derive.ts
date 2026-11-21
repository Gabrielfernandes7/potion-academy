// Quadros derivados (squash and stretch em pixels inteiros): em vez de redesenhar um corpo para cada pose, parte-se de um
// quadro que já existe e se comprime, estica, desloca ou acende em branco. Sem suavização, sem girar, só linhas inteiras de
// pixels, como pede o estilo (pixel art em escala inteira). Serve às poses de antecipação e impacto (agachar, pular, encolher).
import type Phaser from 'phaser';

export interface DeriveOp {
  /** Linha onde o corpo "dobra": acima fica a parte que se mexe; abaixo, os pés. Padrão: 55% da altura. */
  split?: number;
  /** Comprime: a parte de cima desce n linhas (agachar, encolher). */
  squash?: number;
  /** Estica: a parte de cima sobe n linhas e as linhas do meio se repetem (pular, esticar). */
  stretch?: number;
  /** Desloca o corpo inteiro n pixels para o lado. */
  dx?: number;
  /** Pinta o corpo de branco (clarão); só onde há pixel. */
  flash?: boolean;
}

type Img = CanvasImageSource & { width: number; height: number };

/** Cria `dstKey` a partir de `srcKey` com a operação pedida. Devolve false se o quadro de origem não existe. */
export function deriveTexture(scene: Phaser.Scene, srcKey: string, dstKey: string, op: DeriveOp): boolean {
  if (!scene.textures.exists(srcKey)) return false;
  const src = scene.textures.get(srcKey).getSourceImage() as Img;
  const w = src.width;
  const h = src.height;
  const split = op.split ?? Math.floor(h * 0.55);
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d');
  if (!ctx) return false;
  ctx.imageSmoothingEnabled = false;
  const dx = op.dx ?? 0;
  const squash = op.squash ?? 0;
  const stretch = op.stretch ?? 0;
  // pés: a metade de baixo, sempre onde estava
  ctx.drawImage(src, 0, split, w, h - split, dx, split, w, h - split);
  if (stretch > 0) {
    // as linhas logo acima dos pés se repetem para preencher o vão que o corpo deixou ao subir
    for (let i = 0; i < stretch; i++) ctx.drawImage(src, 0, split - 1, w, 1, dx, split - stretch + i, w, 1);
    ctx.drawImage(src, 0, 0, w, split - 1, dx, -stretch, w, split - 1);
  } else {
    ctx.drawImage(src, 0, 0, w, split, dx, squash, w, split);
  }
  if (op.flash) {
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
  }
  if (scene.textures.exists(dstKey)) scene.textures.remove(dstKey);
  scene.textures.addCanvas(dstKey, cv);
  return true;
}
