import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CONFIG } from '../../src/config';
import { makeFakeScene, type FakeScene } from './fakeScene';

vi.mock('../../src/game/entities/hitEffects', () => ({ HIT_TINT: { fire: 1, water: 2, earth: 3, air: 4 }, hitFx: vi.fn() }));

import { PlayerController } from '../../src/game/PlayerController';

const T = CONFIG.tile;
let scene: FakeScene;
let ctl: PlayerController;

beforeEach(() => {
  scene = makeFakeScene();
  ctl = new PlayerController(scene as never);
});

describe('movimento', () => {
  it('anda uma casa e chega no centro dela', () => {
    ctl.tryMove(1, 0);
    expect(scene.player.moving).toBe(true);
    expect(scene.player.gridX).toBe(2);
    ctl.advance(10_000);
    expect(scene.player.moving).toBe(false);
    expect(scene.playerSprite.x).toBe(T * 2 + T / 2);
    expect(scene.pickupSystem.checkPickups).toHaveBeenCalled();
    expect(scene.checkWin).toHaveBeenCalled();
  });

  it('casa bloqueada: não anda, só vira e fica parada', () => {
    scene.isFree = () => false;
    ctl.tryMove(0, -1);
    expect(scene.player.moving).toBe(false);
    expect(scene.player.gridY).toBe(1);
    expect(scene.player.dir).toEqual({ x: 0, y: -1 });
    expect(scene.playIdle).toHaveBeenCalled();
  });

  it('não começa outro passo no meio de um passo', () => {
    ctl.tryMove(1, 0);
    ctl.tryMove(1, 0);
    expect(scene.player.gridX).toBe(2);
  });

  it('a pé em linha reta, o tempo que sobra vai para o passo seguinte', () => {
    ctl.tryMove(1, 0);
    const d = ctl.moveDuration();
    ctl.advance(d + 20); // sobra 20 ms
    ctl.tryMove(1, 0);
    ctl.advance(d - 20); // com a sobra, fecha o segundo passo
    expect(scene.player.moving).toBe(false);
    expect(scene.player.gridX).toBe(3);
  });

  it('parada sem passo novo, a sobra é descartada e a caminhada vira parada', () => {
    ctl.tryMove(1, 0);
    ctl.advance(ctl.moveDuration() + 50);
    scene.playerSprite.anims.currentAnim = { key: 'roo_walk_side' };
    scene.playerSprite.anims.timeScale = 2;
    ctl.settle();
    expect(scene.playerSprite.anims.timeScale).toBe(1);
    expect(scene.playIdle).toHaveBeenCalled();
  });

  it('velocidade e peso mudam o tempo da casa', () => {
    const base = ctl.moveDuration();
    scene.player.speedUp = 2;
    expect(ctl.moveDuration()).toBeLessThan(base);
    scene.forms.walkFactor = () => 1.2;
    scene.player.speedUp = 0;
    expect(ctl.moveDuration()).toBeCloseTo(base * 1.2, 6);
  });

  it('steer: a última seta apertada manda; sem nada segurado, fica parada', () => {
    const none = { up: false, down: false, left: false, right: false };
    ctl.steer(none, none);
    expect(scene.player.moving).toBe(false);
    ctl.steer({ ...none, right: true }, { ...none, right: true });
    expect(scene.player.gridX).toBe(2);
  });

  it('tile() vem da posição do sprite, não da grade', () => {
    scene.playerSprite.x = T * 3 + 5;
    scene.playerSprite.y = T * 2 + 1;
    expect(ctl.tile()).toEqual({ x: 3, y: 2 });
  });
});

describe('dano', () => {
  it('contato tira um golpe neutro e dá invulnerabilidade', () => {
    ctl.damage();
    expect(scene.player.hp).toBeLessThan(24);
    expect(scene.player.invulnerable).toBe(CONFIG.invulnTime);
    expect(ctl.lastCause).toBe('contact');
    expect(scene.play).toHaveBeenCalledWith('hurt');
  });

  it('invulnerável: não leva dano, a não ser que seja o tempo extra', () => {
    scene.player.invulnerable = 500;
    ctl.damage();
    expect(scene.player.hp).toBe(24);
    ctl.damage(true);
    expect(scene.player.hp).toBeLessThan(24);
    expect(ctl.lastCause).toBe('overtime');
  });

  it('o fogo machuca mais que a água', () => {
    const fire = makeFakeScene();
    new PlayerController(fire as never).damage(false, 'fire');
    const water = makeFakeScene();
    new PlayerController(water as never).damage(false, 'water');
    expect(fire.player.hp).toBeLessThan(water.player.hp);
  });

  it('a defesa da forma reduz o dano e mostra DEFENDIDO', () => {
    scene.forms.reduceDamage = (d: number) => d / 2;
    ctl.damage();
    expect(scene.floats).toContain('DEFENDIDO');
  });

  it('no duelo a Roo só assiste', () => {
    scene.duel = {};
    ctl.damage();
    expect(scene.player.hp).toBe(24);
  });

  it('vida zerada chama o fim de jogo e nunca fica negativa', () => {
    scene.player.hp = 1;
    ctl.damage(false, 'fire');
    expect(scene.player.hp).toBe(0);
    expect(scene.triggerGameOver).toHaveBeenCalled();
  });

  it('explosão na casa da Roo acerta uma vez só', () => {
    const t = ctl.tile();
    scene.bombSystem.explosions.push({ key: `${t.x},${t.y}`, element: 'fire' });
    ctl.checkHit();
    const hp = scene.player.hp;
    expect(hp).toBeLessThan(24);
    scene.player.invulnerable = 0;
    ctl.checkHit();
    expect(scene.player.hp).toBe(hp);
  });

  it('explosão em outra casa não acerta', () => {
    scene.bombSystem.explosions.push({ key: '9,9', element: 'fire' });
    ctl.checkHit();
    expect(scene.player.hp).toBe(24);
  });

  it('reset limpa a causa e a direção', () => {
    ctl.damage();
    ctl.reset();
    expect(ctl.lastCause).toBeNull();
    expect(ctl.lastDir).toEqual({ x: 0, y: 0 });
  });
});

describe('pose de dano', () => {
  it('levar dano pede a pose de encolher', () => {
    ctl.damage(false, undefined);
    expect(scene.playPose).toHaveBeenCalledWith('hurt');
  });
});
