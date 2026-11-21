import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeFakeScene, type FakeScene } from './fakeScene';

vi.mock('phaser', () => ({ default: { BlendModes: {}, Math: {}, Display: { Color: {} } } }));
vi.mock('../../src/game/entities/hitEffects', () => ({ HIT_TINT: {}, hitFx: vi.fn() }));
vi.mock('../../src/game/fx/particlePool', () => ({ fxPool: () => ({ burst: vi.fn() }) }));
vi.mock('../../src/ui/abilityButton', () => ({
  NO_FORM_LABEL: '', setAbilityLabel: vi.fn(), setAbility2Label: vi.fn(), setDefenseLabel: vi.fn(),
}));
vi.mock('../../src/textures/rooFormTextures', () => ({
  FORM_TREMOR_MS: 0, FORM_TREMOR_STEPS: 1, formTextureKey: () => 'x', addRooFormTextures: vi.fn(),
}));
const learned = new Set<string>();
vi.mock('../../src/storage', () => ({
  knowsForm: (id: string) => learned.has(id),
  learnForm: (id: string) => { learned.add(id); },
}));

import { RooFormSystem } from '../../src/game/RooFormSystem';
import { FORM_COOLDOWN_MS } from '../../src/game/forms';

let scene: FakeScene;
let sys: RooFormSystem;

beforeEach(() => {
  learned.clear();
  scene = makeFakeScene({ bombType: 'normal' });
  scene.bombSystem.flameBlast = vi.fn();
  scene.enemySystem = { enemies: [] };
  scene.bombSystem.bombs = [];
  scene.boss = null;
  scene.fog = null;
  scene.def = {};
  sys = new RooFormSystem(scene as never);
});

describe('transformação', () => {
  it('sem a forma aprendida, não transforma', () => {
    scene.bombType = 'mega'; // água: ainda não aprendida (o fogo já vem sabido)
    sys.transform();
    expect(sys.form.active).toBe(false);
    expect(scene.floats).toContain('AINDA NÃO APRENDIDA');
  });

  it('com a forma aprendida, transforma e avisa', () => {
    scene.bombType = 'mega';
    learned.add('water');
    sys.transform();
    expect(sys.form.active).toBe(true);
    expect(sys.form.id).toBe('water');
    expect(scene.play).toHaveBeenCalledWith('transform', 'water');
    expect(scene.cameras.main.flash).toHaveBeenCalled();
    expect(scene.playerSprite.setTintFill).toHaveBeenCalledWith(0xffffff); // o clarão branco da transformação
  });

  it('o tempo da forma acaba e ela esfria', () => {
    sys.transform(); // o fogo já vem aprendido
    expect(sys.form.active).toBe(true);
    for (let i = 0; i < 400; i++) sys.update(100);
    expect(sys.form.active).toBe(false);
    sys.transform();
    expect(sys.form.active).toBe(false); // ainda esfriando
    expect(FORM_COOLDOWN_MS).toBeGreaterThan(0);
  });
});

describe('leitura', () => {
  it('sem forma: passo normal, dano inteiro, sem bônus', () => {
    expect(sys.walkFactor()).toBe(1);
    expect(sys.reduceDamage(4)).toBe(4);
    expect(sys.boost(3, 'fire')).toBe(3);
    expect(sys.isAiming()).toBe(false);
  });

  it('Roo Terra anda mais devagar; Roo Ar, mais rápido', () => {
    sys.pinForm('earth');
    expect(sys.walkFactor()).toBeGreaterThan(1);
    sys.pinForm('air');
    expect(sys.walkFactor()).toBeLessThan(1);
  });

  it('a poção do elemento da forma ganha bônus', () => {
    sys.pinForm('fire');
    expect(sys.boost(2, 'fire')).toBeGreaterThan(2);
    expect(sys.boost(2, 'water')).toBe(2);
  });

  it('pinForm põe na mão a poção do elemento', () => {
    sys.pinForm('water');
    expect(scene.bombType).toBe('mega');
    expect(sys.form.id).toBe('water');
  });
});

describe('habilidade (X)', () => {
  it('sem forma, só lembra do T', () => {
    sys.useAbility();
    expect(scene.floats).toContain('T: TRANSFORMA-SE');
  });

  it('Labareda da Roo Fire solta fogo e depois espera', () => {
    sys.pinForm('fire');
    sys.useAbility();
    expect(scene.bombSystem.flameBlast).toHaveBeenCalledTimes(1);
    sys.useAbility();
    expect(scene.bombSystem.flameBlast).toHaveBeenCalledTimes(1);
    expect(scene.floats).toContain('ESPERA...');
  });

  it('andando, não usa a habilidade', () => {
    sys.pinForm('fire');
    scene.player.moving = true;
    sys.useAbility();
    expect(scene.bombSystem.flameBlast).not.toHaveBeenCalled();
  });

  it('sem espaço à frente, não gasta a espera', () => {
    sys.pinForm('fire');
    scene.getTile = () => 1; // tudo parede
    sys.useAbility();
    expect(scene.bombSystem.flameBlast).not.toHaveBeenCalled();
    scene.getTile = () => 0;
    sys.useAbility();
    expect(scene.bombSystem.flameBlast).toHaveBeenCalledTimes(1);
  });
});

describe('defesa (V)', () => {
  it('com a defesa de pé, o dano cai; ao desfazer, volta inteiro', () => {
    sys.pinForm('earth');
    expect(sys.reduceDamage(4)).toBe(4);
    sys.useDefense();
    expect(sys.reduceDamage(4)).toBeLessThan(4);
    expect(sys.hudView().guarding).toBe(true);
  });
});
