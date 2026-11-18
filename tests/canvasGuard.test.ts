// Leitura de pixels bloqueada pelo navegador (Safari com proteção de impressão digital): o jogo tem de abrir mesmo assim.
import { beforeEach, describe, expect, it, vi } from 'vitest';

class FakeImageData { constructor(readonly width: number, readonly height: number) {} readonly data = new Uint8ClampedArray(4); }
class FakeContext {
  puts = 0;
  getImageData(): never { throw new DOMException('The object is in an invalid state.', 'InvalidStateError'); }
  putImageData(): void { this.puts++; }
}
class WorkingContext {
  puts = 0;
  getImageData(_x: number, _y: number, w: number, h: number): FakeImageData { return new FakeImageData(w, h); }
  putImageData(): void { this.puts++; }
}

describe('canvasGuard', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('ImageData', FakeImageData);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('com a leitura bloqueada, devolve uma imagem vazia em vez de lançar, e avisa uma vez', async () => {
    vi.stubGlobal('CanvasRenderingContext2D', FakeContext);
    const guard = await import('../src/canvasGuard');
    const ctx = new FakeContext() as unknown as CanvasRenderingContext2D;
    expect(guard.canvasReadBlocked()).toBe(false);
    const img = ctx.getImageData(0, 0, 3, 2);
    expect(img.width).toBe(3);
    expect(img.height).toBe(2);
    ctx.getImageData(0, 0, 1, 1);
    expect(guard.canvasReadBlocked()).toBe(true);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it('não escreve a imagem vazia de volta (o desenho que já está no canvas fica)', async () => {
    vi.stubGlobal('CanvasRenderingContext2D', FakeContext);
    await import('../src/canvasGuard');
    const ctx = new FakeContext();
    const img = (ctx as unknown as CanvasRenderingContext2D).getImageData(0, 0, 2, 2);
    (ctx as unknown as CanvasRenderingContext2D).putImageData(img, 0, 0);
    expect(ctx.puts).toBe(0);
  });

  it('com a leitura funcionando, não muda nada (lê e escreve normalmente)', async () => {
    vi.stubGlobal('CanvasRenderingContext2D', WorkingContext);
    const guard = await import('../src/canvasGuard');
    const ctx = new WorkingContext();
    const img = (ctx as unknown as CanvasRenderingContext2D).getImageData(0, 0, 2, 2);
    (ctx as unknown as CanvasRenderingContext2D).putImageData(img, 0, 0);
    expect(guard.canvasReadBlocked()).toBe(false);
    expect(ctx.puts).toBe(1);
  });

  it('sem canvas (ambiente sem DOM), o módulo só carrega', async () => {
    vi.stubGlobal('CanvasRenderingContext2D', undefined);
    await expect(import('../src/canvasGuard')).resolves.toBeDefined();
  });
});
