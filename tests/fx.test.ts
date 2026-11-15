import { describe, expect, it } from 'vitest';
import { ObjectPool } from '../src/game/fx/objectPool';

// objeto de mentira com o que o reservatório usa: `scene` (vivo ou destruído) e `setVisible`
function fake(alive = true): { scene: object | undefined; visible: boolean; setVisible(v: boolean): void } {
  return { scene: alive ? {} : undefined, visible: true, setVisible(v: boolean) { this.visible = v; } };
}

describe('reservatório de objetos', () => {
  it('cria só quando não há nenhum guardado e reaproveita o que foi devolvido', () => {
    let made = 0;
    const pool = new ObjectPool(() => { made++; return fake() as never; });
    const a = pool.acquire();
    const b = pool.acquire();
    expect(made).toBe(2);
    pool.release(a);
    expect(pool.idle).toBe(1);
    expect(pool.acquire()).toBe(a); // o mesmo objeto volta
    expect(made).toBe(2);
    pool.release(b);
  });
  it('devolver esconde o objeto e pegar o mostra de novo', () => {
    const pool = new ObjectPool(() => fake() as never);
    const o = pool.acquire() as unknown as { visible: boolean };
    pool.release(o as never);
    expect(o.visible).toBe(false);
    expect(pool.acquire()).toBe(o as never);
    expect(o.visible).toBe(true);
  });
  it('descarta o que a cena destruiu enquanto estava guardado (um reinício de fase)', () => {
    let made = 0;
    const pool = new ObjectPool(() => { made++; return fake() as never; });
    const dead = fake(false);
    pool.release(dead as never);
    const fresh = pool.acquire();
    expect(fresh).not.toBe(dead as never);
    expect(made).toBe(1);
    expect(pool.idle).toBe(0);
  });
});
