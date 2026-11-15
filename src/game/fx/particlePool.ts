// Partículas compartilhadas. Criar um emissor por efeito (um por casa atingida de uma explosão, um por golpe, um por
// poeira) enchia o quadro de objetos novos, temporizadores e coleta de lixo: era o que travava nas explosões, sobretudo
// no celular. Aqui há um emissor por tipo de efeito, criado na primeira vez e reaproveitado: cada efeito é só um
// `explode(contagem, x, y)` nele.
import Phaser from 'phaser';

type EmitterConfig = Phaser.Types.GameObjects.Particles.ParticleEmitterConfig;

const pools = new WeakMap<Phaser.Scene, ParticlePool>();

export class ParticlePool {
  private readonly emitters = new Map<string, Phaser.GameObjects.Particles.ParticleEmitter>();

  constructor(private readonly scene: Phaser.Scene) {}

  /** Solta `count` partículas em (x, y). `key` identifica o efeito: a configuração só vale na primeira vez. */
  burst(key: string, texture: string, config: EmitterConfig, x: number, y: number, count: number, depth = 10): void {
    let e = this.emitters.get(key);
    if (!e || !e.scene) {
      e = this.scene.add.particles(0, 0, texture, { ...config, emitting: false }).setDepth(depth);
      this.emitters.set(key, e);
    }
    e.explode(count, x, y);
  }

  /** Quantos emissores existem agora (para os testes e para olhar vazamentos). */
  get size(): number {
    return this.emitters.size;
  }
}

/** O conjunto de partículas da cena (criado na primeira vez e descartado quando a cena encerra). */
export function fxPool(scene: Phaser.Scene): ParticlePool {
  let pool = pools.get(scene);
  if (!pool) {
    pool = new ParticlePool(scene);
    pools.set(scene, pool);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => pools.delete(scene));
  }
  return pool;
}
