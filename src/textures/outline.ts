// Contorno escuro de 1 px em volta de uma textura já gerada (legibilidade sobre chão claro, como o jardim).
import Phaser from 'phaser';

export const OUTLINE_COLOR = '#1c1410';

// Offsets dos 8 vizinhos: copiar a imagem nessas posições, pintada de escuro, desenha o contorno.
export const OUTLINE_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1],
];

/**
 * `minAlpha` (0..1): só pixels com pelo menos essa opacidade entram no contorno. Com 0 (padrão) qualquer pixel
 * visível conta; use um valor maior quando a textura tem sombra ou brilho translúcido que não deve ganhar borda.
 */
export function outlineTexture(scene: Phaser.Scene, key: string, minAlpha = 0): void {
  const tex = scene.textures.get(key);
  const src = tex.getSourceImage() as HTMLCanvasElement;
  if (!src || !('getContext' in src)) return;
  const w = src.width;
  const h = src.height;
  // camada escura: a silhueta pintada de escuro
  const dark = document.createElement('canvas');
  dark.width = w;
  dark.height = h;
  const dctx = dark.getContext('2d');
  const sctx = src.getContext('2d');
  if (!dctx || !sctx) return;
  dctx.drawImage(src, 0, 0);
  if (minAlpha > 0) {
    // limiar: apaga os pixels translúcidos da camada escura (a sombra e o brilho não ganham contorno)
    const data = dctx.getImageData(0, 0, w, h);
    const cut = minAlpha * 255;
    for (let i = 3; i < data.data.length; i += 4) if (data.data[i] < cut) data.data[i] = 0;
    dctx.putImageData(data, 0, 0);
  }
  dctx.globalCompositeOperation = 'source-in';
  dctx.fillStyle = OUTLINE_COLOR;
  dctx.fillRect(0, 0, w, h);
  // original por cima de 8 cópias escuras deslocadas
  const original = document.createElement('canvas');
  original.width = w;
  original.height = h;
  original.getContext('2d')?.drawImage(src, 0, 0);
  sctx.clearRect(0, 0, w, h);
  for (const [dx, dy] of OUTLINE_OFFSETS) sctx.drawImage(dark, dx, dy);
  sctx.drawImage(original, 0, 0);
  tex.source[0].update(); // reenvia o canvas alterado à GPU
}
