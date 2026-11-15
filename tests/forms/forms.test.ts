import { describe, expect, it } from 'vitest';
import { PROFILES } from '../../src/game/entities/profiles';
import { damageTo } from '../../src/game/entities/damage';
import { damageToRoo } from '../../src/game/entities/roo';
import {
  EmberField, FORMS, FORM_COOLDOWN_MS, FORM_IDS, FORM_MS, FORM_STAGES, RooForm, boostFactor, boostedDamage,
  bubbleAt, bubblePath, emberDamage, emberMs, embersHurt, fireLight, flameTiles, formStage, formView, profileOf, trapMs,
  BUBBLE_STEP_MS, IRIDESCENT, iridescent, formForElement,
  GUARD_COOLDOWN_MS, GUARD_MS, GUARD_REDUCE, RING_PUSH_STEPS, aimMove, guardedDamage, ringNeighbors, rootCandidates,
  AIR_SIGHT_RADIUS, LEAP_MS, ROOT_MS, SaltWallField, airSeesThroughFog, airWalkFactor, gustStunMs, leapTarget, rootBurstTiles, rootTarget, earthWalkFactor, gustPush, gustTarget, gustTiles, saltWallMs, saltWallTiles,
} from '../../src/game/forms';

const hit = (form: 'fire' | 'water' | 'earth' | 'air' | null, el: 'fire' | 'water' | 'earth' | 'air', stage: 0 | 1 | 2 | 3 | 4): number =>
  damageToRoo(el, profileOf(form, stage));

describe('tempo e degraus das transformações', () => {
  it('duram 20 s (mais que os 16 e os 12 s de antes), em 4 degraus de 5 s', () => {
    expect(FORM_MS).toBe(20000);
    expect(FORM_MS).toBeGreaterThan(16000);
    expect(FORM_STAGES).toBe(4);
    expect(formStage(20000)).toBe(4);
    expect(formStage(15001)).toBe(4);
    expect(formStage(15000)).toBe(3);
    expect(formStage(10000)).toBe(2);
    expect(formStage(5000)).toBe(1);
    expect(formStage(1)).toBe(1);
    expect(formStage(0)).toBe(0);
    expect(formStage(-5)).toBe(0);
  });
  it('só desce: o degrau nunca sobe com o tempo diminuindo', () => {
    let last = 4;
    for (let t = FORM_MS; t >= 0; t -= 100) {
      const s = formStage(t);
      expect(s).toBeLessThanOrEqual(last);
      last = s;
    }
  });
});

describe('o molde das formas', () => {
  it('há uma entrada por forma, com id igual à chave, elemento próprio e uma habilidade', () => {
    expect([...FORM_IDS].sort()).toEqual(['air', 'earth', 'fire', 'water']);
    for (const id of FORM_IDS) {
      const d = FORMS[id];
      expect(d.id).toBe(id);
      expect(d.nome.trim()).not.toBe('');
      expect(d.ability.costMs).toBeGreaterThan(0);
      expect(d.ability.cooldownMs).toBeGreaterThan(d.ability.costMs);
      expect(d.ability.range).toBeGreaterThan(0);
      expect(d.boost).toBeGreaterThan(0);
    }
    expect(new Set(FORM_IDS.map(i => FORMS[i].element)).size).toBe(FORM_IDS.length);
  });
  it('o degrau 0 é sempre a Roo normal, e esfriando não tem fraqueza nem imunidade nova', () => {
    for (const id of FORM_IDS) {
      expect(FORMS[id].profile(0)).toBe(PROFILES.roo);
      for (const s of [1, 2] as const) expect(FORMS[id].profile(s).weak).toEqual([]);
    }
  });
});

describe('Roo Fire', () => {
  it('forma de fogo: resiste ao fogo, fraca à água; normal: o contrário', () => {
    expect(hit('fire', 'fire', 4)).toBeLessThan(hit(null, 'fire', 0));
    expect(hit('fire', 'water', 4)).toBeGreaterThan(hit(null, 'water', 0));
    expect(profileOf('fire', 4).element).toBe('fire');
    expect(profileOf('fire', 0)).toBe(PROFILES.roo);
  });
  it('só usa poção de fogo enquanto transformada (e só enquanto)', () => {
    const f = new RooForm();
    expect(f.formElement).toBeNull();
    f.start('fire');
    expect(f.formElement).toBe('fire');
    f.spend(FORM_MS);
    expect(f.formElement).toBeNull();
  });
  it('as poções de fogo ganham o bônus (1,5 no auge, caindo por degrau); só elas', () => {
    expect(boostFactor('fire', 'fire', 4)).toBe(1.5);
    expect(boostFactor('fire', 'fire', 0)).toBe(1);
    expect(boostFactor('fire', 'water', 4)).toBe(1);
    expect(boostedDamage('fire', 4, 'fire', 4)).toBe(6);
    expect(boostedDamage('fire', 4, 'water', 4)).toBe(4);
    expect(boostedDamage('fire', 0, 'fire', 4)).toBe(0);
    expect(boostedDamage('fire', 6, 'fire', 4)).toBe(9);
    expect(boostedDamage(null, 4, 'fire', 4)).toBe(4);
  });
  it('brasas: duram menos a cada degrau, a água apaga, queimam inimigos e não chefes', () => {
    expect(emberMs(0)).toBe(0);
    expect(emberMs(4)).toBeGreaterThan(emberMs(3));
    const tiles = [{ x: 2, y: 2 }, { x: 3, y: 2 }];
    const f = new EmberField();
    f.ignite(tiles, 0, 0);
    expect(f.active(0)).toHaveLength(0);
    f.ignite(tiles, 1000, 4);
    expect(f.lit(2, 2, 1000)).toBe(true);
    expect(f.lit(2, 2, 1000 + emberMs(4))).toBe(false);
    expect(f.douse([{ x: 2, y: 2 }, { x: 8, y: 8 }])).toBe(1);
    expect(f.lit(3, 2, 1010)).toBe(true);
    expect(embersHurt('enemy')).toBe(true);
    expect(embersHurt('boss')).toBe(false);
    expect(emberDamage(PROFILES.flower)).toBeGreaterThan(emberDamage(PROFILES.frog));
  });
  it('Labareda: à frente até o alcance, parando na primeira casa que não é livre', () => {
    const open = (x: number, y: number): boolean => x >= 1 && x <= 9 && y >= 1 && y <= 9;
    expect(flameTiles({ x: 3, y: 3 }, { x: 1, y: 0 }, 3, open)).toEqual([{ x: 4, y: 3 }, { x: 5, y: 3 }, { x: 6, y: 3 }]);
    expect(flameTiles({ x: 8, y: 3 }, { x: 1, y: 0 }, 3, open)).toEqual([{ x: 9, y: 3 }]);
    expect(flameTiles({ x: 9, y: 3 }, { x: 1, y: 0 }, 3, open)).toEqual([]);
    expect(flameTiles({ x: 3, y: 3 }, { x: 0, y: 0 }, 3, open)).toEqual([]);
  });
  it('Luz de chama: 0,5 casa por degrau, até 2', () => {
    expect(fireLight(0)).toBe(0);
    expect(fireLight(4)).toBe(2);
  });
});

describe('Roo Aqua', () => {
  it('forma de água: IMUNE à água, mas segue fraca ao fogo', () => {
    expect(hit('water', 'water', 4)).toBe(0);
    expect(hit('water', 'water', 3)).toBe(0);
    expect(hit('water', 'fire', 4)).toBe(hit(null, 'fire', 0));
    expect(profileOf('water', 4).weak).toEqual(['fire']);
    expect(profileOf('water', 4).immune).toEqual(['water']);
  });
  it('esfriando, a imunidade vira resistência; no degrau 0, a Roo normal', () => {
    expect(hit('water', 'water', 2)).toBeGreaterThan(0);
    expect(hit('water', 'water', 2)).toBeLessThan(damageTo({ ...PROFILES.roo, resist: [], weak: [] }, 'water'));
    expect(profileOf('water', 0)).toBe(PROFILES.roo);
  });
  it('só usa poção de água enquanto transformada', () => {
    const f = new RooForm();
    f.start('water');
    expect(f.formElement).toBe('water');
  });
  it('as poções de água ganham o bônus; as de fogo, não', () => {
    expect(boostedDamage('water', 4, 'water', 4)).toBe(6);
    expect(boostedDamage('water', 4, 'fire', 4)).toBe(4);
  });
  it('a bolha anda pelas casas livres à frente e para antes de parede', () => {
    const open = (x: number, y: number): boolean => x >= 1 && x <= 9 && y >= 1 && y <= 9;
    expect(bubblePath({ x: 2, y: 5 }, { x: 1, y: 0 }, 4, open)).toHaveLength(4);
    expect(bubblePath({ x: 8, y: 5 }, { x: 1, y: 0 }, 4, open)).toEqual([{ x: 9, y: 5 }]);
    expect(bubblePath({ x: 2, y: 5 }, { x: 0, y: 0 }, 4, open)).toEqual([]);
  });
  it('o tempo da bolha: uma casa por passo, e acaba ao passar da última', () => {
    expect(bubbleAt(4, 0)).toEqual({ index: 0, done: false });
    expect(bubbleAt(4, BUBBLE_STEP_MS * 2.5)).toEqual({ index: 2, done: false });
    expect(bubbleAt(4, BUBBLE_STEP_MS * 4)).toEqual({ index: 3, done: true });
    expect(bubbleAt(0, 0).done).toBe(true);
  });
  it('a bolha segura mais tempo nos degraus altos, e nada sem forma', () => {
    expect(trapMs(0)).toBe(0);
    expect(trapMs(4)).toBeGreaterThan(trapMs(1));
    expect(trapMs(1)).toBeGreaterThan(0);
  });
});

describe('a máquina das formas (uma por vez, espera comum)', () => {
  it('só transforma quando pronta; dura 20 s; depois espera o cooldown; a forma não troca no meio', () => {
    const f = new RooForm();
    expect(f.ready).toBe(true);
    expect(f.start('fire')).toBe(true);
    expect(f.start('water')).toBe(false); // uma por vez
    expect(f.id).toBe('fire');
    expect(f.stage).toBe(4);
    f.tick(5000);
    expect(f.stage).toBe(3);
    f.tick(FORM_MS);
    expect(f.active).toBe(false);
    expect(f.id).toBe('fire'); // lembra a última, mas inativa
    expect(f.ready).toBe(false);
    expect(f.cooldownMs).toBe(FORM_COOLDOWN_MS);
    expect(f.start('water')).toBe(false); // a espera vale para as duas formas
    f.tick(FORM_COOLDOWN_MS);
    expect(f.start('water')).toBe(true);
    expect(f.id).toBe('water');
  });
  it('a habilidade só vale transformada, gasta parte da forma e tem espera própria', () => {
    const f = new RooForm();
    expect(f.useAbility()).toBe(false);
    f.start('water');
    const cost = FORMS.water.ability.costMs;
    expect(f.abilityReady).toBe(true);
    expect(f.useAbility()).toBe(true);
    expect(f.remainingMs).toBe(FORM_MS - cost);
    expect(f.useAbility()).toBe(false);
    f.tick(FORMS.water.ability.cooldownMs);
    expect(f.abilityReady).toBe(true);
  });
  it('usar a habilidade encurta o poder: poucos usos no ritmo máximo e a forma acaba', () => {
    for (const id of FORM_IDS) {
      const f = new RooForm();
      f.start(id);
      let uses = 0;
      for (let i = 0; i < 20 && f.active; i++) {
        if (f.useAbility()) uses++;
        f.tick(FORMS[id].ability.cooldownMs);
      }
      expect(uses, id).toBeLessThanOrEqual(4);
      expect(f.active).toBe(false);
    }
  });
  it('o que a HUD vê: forma, tempo, espera e elemento da forma', () => {
    const f = new RooForm();
    expect(formView(f)).toEqual({ form: null, active: false, stage: 0, ratio: 0, cooldownRatio: 0, abilityReady: false, ability2Ready: false, defenseReady: false, guarding: false, element: null });
    f.start('fire');
    expect(formView(f)).toMatchObject({ form: 'fire', active: true, stage: 4, ratio: 1, abilityReady: true, element: 'fire' });
    f.tick(10000);
    expect(formView(f).ratio).toBeCloseTo(0.5);
    f.tick(10000);
    expect(formView(f)).toMatchObject({ form: null, active: false, cooldownRatio: 1, element: null });
    f.tick(FORM_COOLDOWN_MS);
    f.start('water');
    expect(formView(f)).toMatchObject({ form: 'water', element: 'water' });
  });
});

describe('bolhas iridescentes', () => {
  it('a paleta tem várias cores diferentes (rosa, amarelo, ciano, violeta, verde)', () => {
    expect(IRIDESCENT.length).toBeGreaterThanOrEqual(4);
    expect(new Set(IRIDESCENT).size).toBe(IRIDESCENT.length);
  });
  it('a cor muda de trecho para trecho e com o tempo, e dá a volta (inclusive com negativos)', () => {
    expect(iridescent(0)).not.toBe(iridescent(1));
    expect(iridescent(0, 1)).toBe(iridescent(1, 0)); // o deslocamento gira o anel
    expect(iridescent(IRIDESCENT.length)).toBe(iridescent(0));
    expect(IRIDESCENT).toContain(iridescent(-3, -7));
    expect(iridescent(2.9)).toBe(iridescent(2));
  });
});

describe('a poção na mão escolhe a forma (tecla T)', () => {
  it('cada elemento tem a sua forma', () => {
    expect(formForElement('fire')).toBe('fire');
    expect(formForElement('water')).toBe('water');
    expect(formForElement('earth')).toBe('earth');
    expect(formForElement('air')).toBe('air');
  });
});

const open = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < 9 && y < 9;

describe('Roo Terra', () => {
  it('no auge: imune à terra (as flores não a chicoteiam) e fraca ao ar', () => {
    expect(hit('earth', 'earth', 4)).toBe(0);
    expect(hit('earth', 'earth', 3)).toBe(0);
    expect(hit('earth', 'air', 4)).toBeGreaterThan(hit(null, 'air', 0));
    expect(profileOf('earth', 4).weak).toEqual(['air']);
  });
  it('esfriando: resiste à terra, sem fraqueza; no degrau 0, a Roo normal', () => {
    expect(hit('earth', 'earth', 2)).toBeGreaterThan(0);
    expect(hit('earth', 'earth', 2)).toBeLessThan(hit(null, 'earth', 0));
    expect(hit('earth', 'air', 2)).toBe(hit(null, 'air', 0));
    expect(profileOf('earth', 0)).toBe(PROFILES.roo);
  });
  it('o peso: 20% mais devagar transformada, normal sem a forma', () => {
    expect(earthWalkFactor(4)).toBeCloseTo(1.2);
    expect(earthWalkFactor(1)).toBeCloseTo(1.2);
    expect(earthWalkFactor(0)).toBe(1);
  });
  it('poções de terra +50% no auge, e só as de terra', () => {
    expect(boostFactor('earth', 'earth', 4)).toBeCloseTo(1.5);
    expect(boostFactor('earth', 'fire', 4)).toBe(1);
  });
  it('o muro dura 4 s no auge e menos ao esfriar', () => {
    expect(saltWallMs(4)).toBe(4000);
    expect(saltWallMs(1)).toBeLessThan(saltWallMs(2));
    expect(saltWallMs(0)).toBe(0);
  });
  it('o muro tem 3 casas, de lado a lado, à frente da Roo', () => {
    expect(saltWallTiles({ x: 4, y: 4 }, { x: 1, y: 0 }, open)).toEqual([{ x: 5, y: 4 }, { x: 5, y: 3 }, { x: 5, y: 5 }]);
    expect(saltWallTiles({ x: 4, y: 4 }, { x: 0, y: -1 }, open)).toEqual([{ x: 4, y: 3 }, { x: 3, y: 3 }, { x: 5, y: 3 }]);
  });
  it('o muro pula as casas ocupadas e não nasce se a do centro estiver ocupada', () => {
    const noTop = (x: number, y: number): boolean => open(x, y) && !(x === 5 && y === 3);
    expect(saltWallTiles({ x: 4, y: 4 }, { x: 1, y: 0 }, noTop)).toEqual([{ x: 5, y: 4 }, { x: 5, y: 5 }]);
    expect(saltWallTiles({ x: 4, y: 4 }, { x: 1, y: 0 }, (x, y) => open(x, y) && x !== 5)).toEqual([]);
    expect(saltWallTiles({ x: 4, y: 4 }, { x: 0, y: 0 }, open)).toEqual([]);
  });
  it('o campo de muros: de pé até vencer, e o degrau baixo dura menos', () => {
    const f = new SaltWallField();
    f.raise([{ x: 1, y: 1 }], 1000, 4);
    expect(f.has(1, 1, 1000)).toBe(true);
    expect(f.has(1, 1, 4999)).toBe(true);
    expect(f.has(1, 1, 5000)).toBe(false);
    expect(f.has(2, 2, 1000)).toBe(false);
    f.raise([{ x: 3, y: 3 }], 0, 0); // degrau 0 não levanta muro
    expect(f.has(3, 3, 1)).toBe(false);
    expect(f.active(6000)).toEqual([]);
  });
});

describe('Roo Terra: Raiz', () => {
  it('brota na casa livre mais distante da linha (até 4), por baixo de qualquer obstáculo', () => {
    expect(rootTarget({ x: 1, y: 4 }, { x: 1, y: 0 }, 4, open)).toEqual({ x: 5, y: 4 });
    expect(rootTarget({ x: 1, y: 4 }, { x: 1, y: 0 }, 4, (x, y) => open(x, y) && x < 5)).toEqual({ x: 4, y: 4 });
    expect(rootTarget({ x: 1, y: 4 }, { x: 1, y: 0 }, 4, () => false)).toBeNull();
    expect(rootTarget({ x: 1, y: 4 }, { x: 0, y: 0 }, 4, open)).toBeNull();
  });
  it('a borda da grade não serve de destino', () => {
    expect(rootTarget({ x: 7, y: 4 }, { x: 1, y: 0 }, 4, open)).toEqual({ x: 8, y: 4 });
  });
  it('a terra racha nas quatro casas vizinhas livres (a dela não entra)', () => {
    expect(rootBurstTiles({ x: 4, y: 4 }, open)).toHaveLength(4);
    expect(rootBurstTiles({ x: 0, y: 0 }, open)).toEqual([{ x: 0, y: 1 }, { x: 1, y: 0 }]);
  });
  it('o tempo debaixo da terra é curto e a Raiz custa tempo da forma', () => {
    expect(ROOT_MS).toBeLessThan(1500);
    expect(FORMS.earth.ability2!.costMs).toBeGreaterThan(0);
    expect(FORMS.earth.ability2!.cooldownMs).toBeGreaterThan(FORMS.earth.ability2!.costMs);
  });
  it('a segunda habilidade tem espera própria e gasta tempo da forma', () => {
    const f = new RooForm();
    f.start('earth');
    expect(f.ability2Ready).toBe(true);
    expect(f.useAbility2()).toBe(true);
    expect(f.ability2Ready).toBe(false);
    expect(f.useAbility2()).toBe(false);
    expect(f.abilityReady).toBe(true); // a primeira segue pronta
    f.tick(5000);
    expect(f.ability2Ready).toBe(true);
    const fire = new RooForm();
    fire.start('fire');
    expect(fire.ability2Ready).toBe(false);
    expect(fire.useAbility2()).toBe(false);
  });
});

describe('Roo Ar', () => {
  it('no auge: resiste ao ar e é fraca à terra; esfriando, sem fraqueza', () => {
    expect(hit('air', 'air', 4)).toBeLessThan(hit(null, 'air', 0));
    expect(hit('air', 'earth', 4)).toBeGreaterThan(hit(null, 'earth', 0));
    expect(profileOf('air', 2).weak).toEqual([]);
    expect(profileOf('air', 0)).toBe(PROFILES.roo);
  });
  it('a visão de cima: sem névoa enquanto a forma dura (e os baús seguem ao alcance)', () => {
    expect(airSeesThroughFog(1)).toBe(true);
    expect(airSeesThroughFog(0)).toBe(false);
    expect(AIR_SIGHT_RADIUS).toBeGreaterThan(15); // cobre a grade de 15 colunas
  });
  it('a leveza: o passo demora 20% menos transformada, normal sem a forma', () => {
    expect(airWalkFactor(4)).toBeCloseTo(0.8);
    expect(airWalkFactor(1)).toBeCloseTo(0.8);
    expect(airWalkFactor(0)).toBe(1);
  });
  it('o sopro atordoa mais no auge e nada sem a forma', () => {
    expect(gustStunMs(4)).toBeGreaterThan(gustStunMs(1));
    expect(gustStunMs(0)).toBe(0);
  });
  it('Salto de vento: vai à casa livre mais distante da linha, por cima do que não é parede', () => {
    const fly = (x: number, y: number): boolean => open(x, y); // sem paredes na grade de teste
    const free = (x: number, y: number): boolean => open(x, y) && !(x === 3 && y === 2); // há um inimigo em (3,2)
    expect(leapTarget({ x: 2, y: 2 }, { x: 1, y: 0 }, 3, fly, free)).toEqual({ x: 5, y: 2 });
    expect(leapTarget({ x: 2, y: 2 }, { x: 1, y: 0 }, 3, fly, (x, y) => free(x, y) && x !== 5)).toEqual({ x: 4, y: 2 });
    expect(leapTarget({ x: 2, y: 2 }, { x: 0, y: 0 }, 3, fly, free)).toBeNull();
  });
  it('Salto de vento: a parede corta o salto (para antes dela) e nada de pousar do outro lado', () => {
    const fly = (x: number, y: number): boolean => open(x, y) && x !== 4; // parede em x = 4
    expect(leapTarget({ x: 2, y: 2 }, { x: 1, y: 0 }, 3, fly, open)).toEqual({ x: 3, y: 2 });
    expect(leapTarget({ x: 3, y: 2 }, { x: 1, y: 0 }, 3, fly, open)).toBeNull();
    expect(LEAP_MS).toBeLessThan(500);
  });
  it('só o Ar e a Terra têm segunda habilidade (tecla C)', () => {
    expect(FORMS.air.ability2?.id).toBe('leap');
    expect(FORMS.earth.ability2?.id).toBe('root');
    expect(FORMS.fire.ability2).toBeUndefined();
    expect(FORMS.water.ability2).toBeUndefined();
  });
  it('o sopro: linha de 4 casas parando na primeira ocupada', () => {
    expect(gustTiles({ x: 1, y: 3 }, { x: 1, y: 0 }, 4, open)).toHaveLength(4);
    expect(gustTiles({ x: 1, y: 3 }, { x: 1, y: 0 }, 4, (x, y) => open(x, y) && x !== 3)).toEqual([{ x: 2, y: 3 }]);
    expect(gustTiles({ x: 1, y: 3 }, { x: 0, y: 0 }, 4, open)).toEqual([]);
  });
  it('o sopro empurra 2 casas no auge, 1 nos degraus baixos, e para antes do obstáculo', () => {
    expect(gustPush(4)).toBe(2);
    expect(gustPush(3)).toBe(2);
    expect(gustPush(2)).toBe(1);
    expect(gustPush(0)).toBe(0);
    expect(gustTarget({ x: 2, y: 2 }, { x: 1, y: 0 }, 2, open)).toEqual({ x: 4, y: 2 });
    expect(gustTarget({ x: 2, y: 2 }, { x: 1, y: 0 }, 2, (x, y) => open(x, y) && x < 4)).toEqual({ x: 3, y: 2 });
    expect(gustTarget({ x: 2, y: 2 }, { x: 1, y: 0 }, 2, () => false)).toEqual({ x: 2, y: 2 });
  });
  it('só usa poção de ar enquanto transformada', () => {
    const f = new RooForm();
    f.start('air');
    expect(f.formElement).toBe('air');
  });
});


describe('defesa das formas (tecla V)', () => {
  it('toda forma tem uma defesa que corta o dano pela metade por 3 s', () => {
    for (const id of FORM_IDS) {
      const d = FORMS[id].defense;
      expect(d.nome.trim(), id).not.toBe('');
      expect(d.reduce, id).toBeCloseTo(GUARD_REDUCE);
      expect(d.guardMs, id).toBe(GUARD_MS);
      expect(d.cooldownMs, id).toBeGreaterThan(d.guardMs);
      expect(d.costMs, id).toBeGreaterThan(0);
    }
    expect(new Set(FORM_IDS.map(i => FORMS[i].defense.id)).size).toBe(FORM_IDS.length);
    expect(GUARD_COOLDOWN_MS).toBeGreaterThan(GUARD_MS);
  });
  it('as defesas de cada elemento: brasas, bolha, círculo de sal e redemoinho', () => {
    expect(FORMS.fire.defense.id).toBe('embers');
    expect(FORMS.water.defense.id).toBe('bubble');
    expect(FORMS.earth.defense.id).toBe('salt-ring');
    expect(FORMS.air.defense.id).toBe('whirl');
  });
  it('o dano com a defesa cai pela metade (arredondado); sem defesa, inteiro; cura e zero não mudam', () => {
    expect(guardedDamage(6, true)).toBe(3);
    expect(guardedDamage(6, false)).toBe(6);
    expect(guardedDamage(1, true)).toBe(1); // 0,5 arredonda para 1: nunca some um golpe mínimo de uma vez
    expect(guardedDamage(0, true)).toBe(0);
    expect(guardedDamage(4, true, 0.25)).toBe(3);
  });
  it('a defesa tem espera própria e gasta tempo da forma', () => {
    const f = new RooForm();
    expect(f.useDefense()).toBeNull(); // sem forma, não há defesa
    f.start('water');
    expect(f.defenseReady).toBe(true);
    const d = f.useDefense();
    expect(d?.id).toBe('bubble');
    expect(f.defenseReady).toBe(false);
    expect(f.useDefense()).toBeNull();
    expect(f.remainingMs).toBe(FORM_MS - FORMS.water.defense.costMs);
    f.tick(GUARD_COOLDOWN_MS);
    expect(f.defenseReady).toBe(true);
  });
  it('o círculo tem as quatro casas vizinhas, cada uma com o sentido para longe da Roo', () => {
    const ring = ringNeighbors({ x: 4, y: 4 });
    expect(ring).toHaveLength(4);
    for (const n of ring) {
      expect(Math.abs(n.x - 4) + Math.abs(n.y - 4)).toBe(1);
      expect(n.dir).toEqual({ x: n.x - 4, y: n.y - 4 });
    }
    expect(RING_PUSH_STEPS).toBe(2);
  });
});

describe('Raiz: a jogadora escolhe onde brotar', () => {
  const ok = (x: number, y: number): boolean => open(x, y);
  it('as casas possíveis são as livres a até 4 passos (Manhattan), sem a da Roo', () => {
    const spots = rootCandidates({ x: 4, y: 4 }, 4, ok);
    expect(spots).not.toContainEqual({ x: 4, y: 4 });
    for (const t of spots) expect(Math.abs(t.x - 4) + Math.abs(t.y - 4)).toBeLessThanOrEqual(4);
    expect(spots).toContainEqual({ x: 8, y: 4 });
    expect(spots).not.toContainEqual({ x: 8, y: 5 }); // 5 passos
    expect(rootCandidates({ x: 4, y: 4 }, 4, (x, y) => ok(x, y) && x !== 5)).not.toContainEqual({ x: 5, y: 4 });
  });
  it('o cursor anda um passo por vez e não sai do alcance nem da grade', () => {
    let c = { x: 4, y: 4 };
    c = aimMove(c, { x: 1, y: 0 }, { x: 4, y: 4 }, 4, ok);
    expect(c).toEqual({ x: 5, y: 4 });
    expect(aimMove({ x: 8, y: 4 }, { x: 1, y: 0 }, { x: 4, y: 4 }, 4, ok)).toEqual({ x: 8, y: 4 }); // além do alcance
    expect(aimMove({ x: 0, y: 4 }, { x: -1, y: 0 }, { x: 2, y: 4 }, 4, ok)).toEqual({ x: 0, y: 4 }); // fora da grade
  });
});
