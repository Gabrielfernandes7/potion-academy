// Reaproveita objetos de cena (imagens das explosões, textos flutuantes) em vez de criar e destruir a cada efeito:
// criar um texto cria uma textura de canvas, e criar e destruir dezenas de imagens por explosão enche o coletor de
// lixo, que no celular aparece como engasgo. `release` esconde o objeto e o devolve; `acquire` pega um escondido (ou
// cria um novo se não houver).
import Phaser from 'phaser';

export class ObjectPool<T extends Phaser.GameObjects.GameObject & { setVisible(v: boolean): unknown }> {
  private readonly free: T[] = [];

  constructor(private readonly make: () => T) {}

  acquire(): T {
    // descarta o que a cena destruiu enquanto estava guardado (um reinício de fase, por exemplo)
    while (this.free.length > 0) {
      const o = this.free.pop() as T;
      if (o.scene) { o.setVisible(true); return o; }
    }
    return this.make();
  }

  release(o: T): void {
    o.setVisible(false);
    this.free.push(o);
  }

  /** Quantos objetos estão guardados (para os testes). */
  get idle(): number {
    return this.free.length;
  }
}
