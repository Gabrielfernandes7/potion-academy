import { describe, expect, it } from 'vitest';
import { PROFILES } from '../../src/game/entities/profiles';
import { damageTo } from '../../src/game/entities/damage';
import { damageToRoo } from '../../src/game/entities/roo';
import {
  EmberField, FORMS, FORM_COOLDOWN_MS, FORM_IDS, FORM_MS, FORM_STAGES, RooForm, boostFactor, boostedDamage,
  bubbleAt, bubblePath, emberDamage, emberMs, embersHurt, fireLight, flameTiles, formStage, formView, profileOf, trapMs,
  BUBBLE_STEP_MS, IRIDESCENT, iridescent,
} from '../../src/game/forms';

const hit = (form: 'fire' | 'water' | null, el: 'fire' | 'water' | 'earth' | 'air', stage: 0 | 1 | 2 | 3 | 4): number =>
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
    expect(FORM_IDS.sort()).toEqual(['fire', 'water']);
    for (const id of FORM_IDS) {
      const d = FORMS[id];
      expect(d.id).toBe(id);
      expect(d.nome.trim()).not.toBe('');
      expect(d.transformKey).toMatch(/^[A-Z]$/);
      expect(d.ability.costMs).toBeGreaterThan(0);
      expect(d.ability.cooldownMs).toBeGreaterThan(d.ability.costMs);
      expect(d.ability.range).toBeGreaterThan(0);
      expect(d.boost).toBeGreaterThan(0);
    }
    expect(new Set(FORM_IDS.map(i => FORMS[i].transformKey)).size).toBe(FORM_IDS.length); // teclas diferentes
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
  it('NÃO pode usar poção de água enquanto transformada (e só enquanto)', () => {
    expect(FORMS.fire.forbids).toBe('water');
    const f = new RooForm();
    expect(f.forbids('water')).toBe(false);
    f.start('fire');
    expect(f.forbids('water')).toBe(true);
    expect(f.forbids('fire')).toBe(false);
    expect(f.forbiddenElement).toBe('water');
    f.spend(FORM_MS);
    expect(f.forbids('water')).toBe(false);
    expect(f.forbiddenElement).toBeNull();
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
  it('NÃO proíbe poção nenhuma (pode usar todas, inclusive a de fogo)', () => {
    expect(FORMS.water.forbids).toBeUndefined();
    const f = new RooForm();
    f.start('water');
    for (const e of ['fire', 'water', 'earth', 'air'] as const) expect(f.forbids(e)).toBe(false);
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
  it('o que a HUD vê: forma, tempo, espera e proibição', () => {
    const f = new RooForm();
    expect(formView(f)).toEqual({ form: null, active: false, stage: 0, ratio: 0, cooldownRatio: 0, abilityReady: false, forbids: null });
    f.start('fire');
    expect(formView(f)).toMatchObject({ form: 'fire', active: true, stage: 4, ratio: 1, abilityReady: true, forbids: 'water' });
    f.tick(10000);
    expect(formView(f).ratio).toBeCloseTo(0.5);
    f.tick(10000);
    expect(formView(f)).toMatchObject({ form: null, active: false, cooldownRatio: 1, forbids: null });
    f.tick(FORM_COOLDOWN_MS);
    f.start('water');
    expect(formView(f)).toMatchObject({ form: 'water', forbids: null });
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
