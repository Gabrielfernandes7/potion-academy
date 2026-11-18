// Leitura de pixels do canvas bloqueada: alguns navegadores (Safari com a proteção contra rastreamento e
// impressão digital, modo de bloqueio, extensões de privacidade) fazem `getImageData` lançar "InvalidStateError:
// The object is in an invalid state." Sem isto, o próprio Phaser cai ao carregar (ele testa a leitura de pixels ao
// ser importado) e NADA aparece na tela.
//
// Este módulo precisa ser o PRIMEIRO import de cada página (antes de qualquer coisa que importe o Phaser).
// Se a leitura falhar, devolve uma imagem vazia marcada, e `putImageData` ignora imagens marcadas: o canvas
// mantém o que já foi desenhado nele. O custo é só visual (sem a recoloração das formas da Roo e sem o contorno
// dos chefes), mas o jogo abre e os personagens aparecem.

const blank = new WeakSet<ImageData>();
let blocked = false;

/** Verdadeiro se o navegador recusou ler pixels de um canvas (os efeitos que dependem disso ficam desligados). */
export function canvasReadBlocked(): boolean {
  return blocked;
}

if (typeof CanvasRenderingContext2D !== 'undefined') {
  const proto = CanvasRenderingContext2D.prototype;
  const originalGet = proto.getImageData;
  const originalPut = proto.putImageData;

  proto.getImageData = function (this: CanvasRenderingContext2D, ...args: Parameters<typeof originalGet>): ImageData {
    try {
      return originalGet.apply(this, args);
    } catch (error) {
      if (!blocked) console.warn('[canvasGuard] O navegador bloqueou a leitura de pixels do canvas; seguindo sem recoloração e contornos.', error);
      blocked = true;
      const [, , sw, sh] = args;
      const img = new ImageData(Math.max(1, Math.abs(Math.round(sw))), Math.max(1, Math.abs(Math.round(sh))));
      blank.add(img);
      return img;
    }
  };

  proto.putImageData = function (this: CanvasRenderingContext2D, imageData: ImageData, ...rest: unknown[]): void {
    if (blank.has(imageData)) return; // não apaga o que já está desenhado com uma imagem vazia
    (originalPut as (...a: unknown[]) => void).apply(this, [imageData, ...rest]);
  } as typeof originalPut;
}
