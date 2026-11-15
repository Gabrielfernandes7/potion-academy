import { describe, expect, it } from 'vitest';
import { MANUSCRITO, GRUPOS, cardStats, elementLabel, entryById, isEntryOpen, statsOf } from '../src/game/manuscrito';
import { PROFILES } from '../src/game/entities/profiles';
import { STAGES } from '../src/game/stages/index';

describe('manuscrito do alquimista', () => {
  it('ids únicos e todo grupo tem nome', () => {
    expect(new Set(MANUSCRITO.map(e => e.id)).size).toBe(MANUSCRITO.length);
    for (const e of MANUSCRITO) expect(GRUPOS[e.grupo], e.id).toBeDefined();
  });
  it('há uma página para cada personagem da tabela de dano', () => {
    const covered = new Set(MANUSCRITO.map(e => e.perfil).filter(Boolean));
    for (const id of Object.keys(PROFILES)) expect(covered.has(id as keyof typeof PROFILES), id).toBe(true);
  });
  it('cada página tem textos, ao menos uma habilidade e fase válida', () => {
    for (const e of MANUSCRITO) {
      expect(e.nome.trim()).not.toBe('');
      expect(e.nota.length, e.id).toBeGreaterThan(30);
      expect(e.habilidades.length, e.id).toBeGreaterThan(0);
      for (const h of e.habilidades) { expect(h.nome).not.toBe(''); expect(h.texto.length).toBeGreaterThan(20); }
      expect(e.sprite.frames.length).toBeGreaterThan(0);
      expect(e.fase).toBeGreaterThanOrEqual(1);
      expect(e.fase).toBeLessThanOrEqual(STAGES.length);
    }
  });
  it('os chefes abrem na fase do chefe', () => {
    const bossStage = (boss: string): number => STAGES.findIndex(s => s.boss === boss) + 1;
    expect(entryById('quimera')!.fase).toBe(bossStage('chimera'));
    expect(entryById('belladona')!.fase).toBe(bossStage('belladonna'));
    expect(entryById('mandragora')!.fase).toBe(bossStage('mandrake'));
  });
  it('as páginas abrem pelo progresso; as da fase 1 já estão abertas', () => {
    const nada = (): boolean => false;
    expect(MANUSCRITO.filter(e => isEntryOpen(e, nada)).map(e => e.id)).toEqual(['roo', 'roo-fire', 'anselmo', 'sapo']);
    expect(isEntryOpen(entryById('roo-aqua')!, s => s <= 1)).toBe(false); // a água é aprendida na fase 2
    expect(isEntryOpen(entryById('roo-aqua')!, s => s <= 2)).toBe(true);
    expect(isEntryOpen(entryById('roo-terra')!, s => s <= 3)).toBe(false);
    expect(isEntryOpen(entryById('roo-terra')!, s => s <= 4)).toBe(true);
    expect(isEntryOpen(entryById('roo-ar')!, s => s <= 4)).toBe(false);
    expect(isEntryOpen(entryById('roo-ar')!, s => s <= 5)).toBe(true);
    expect(isEntryOpen(entryById('quimera')!, s => s <= 4)).toBe(true);
    expect(isEntryOpen(entryById('mandragora')!, s => s <= 4)).toBe(false);
  });
  it('força, fraqueza e vida vêm da tabela: a Quimera é fraca à terra e imune à água', () => {
    const q = statsOf(entryById('quimera')!)!;
    expect(q.fraqueza).toEqual(['earth']);
    expect(q.forca.imune).toEqual(['water']);
    expect(q.vida).toBe(PROFILES.chimera.maxHp);
    expect(q.recebe).toEqual({ fire: 1, water: 0, earth: 1.5, air: 1 });
    const roo = statsOf(entryById('roo')!)!;
    expect(roo.fraqueza).toEqual(['fire']);
    expect(roo.forca.resiste).toContain('water');
  });
  it('Anselmo não luta: sem números', () => {
    expect(statsOf(entryById('anselmo')!)).toBeNull();
  });
  it('o atributo mostra o símbolo e o nome alquímico', () => {
    expect(cardStats(PROFILES.chimera).atributo).toMatchObject({ simbolo: '/svg/alchemy-water.svg', alquimia: 'Mercúrio' });
    expect(elementLabel('fire')).toBe('FOGO (Enxofre)');
  });
});

describe('manuscrito: Roo Fire e Leão Verde', () => {
  it('a página da Roo Fire mostra o perfil da transformação: resiste ao fogo, fraca à água', () => {
    const e = entryById('roo-fire')!;
    expect(e.perfil).toBeUndefined();
    const s = statsOf(e)!;
    expect(s.forca.resiste).toContain('fire');
    expect(s.fraqueza).toEqual(['water']);
    expect(s.atributo.elemento).toBe('fire');
    expect(s.recebe.fire).toBeLessThan(1);
    expect(s.recebe.water).toBeGreaterThan(1);
    expect(e.habilidades.map(h => h.nome).join(' ')).toMatch(/Labareda.*|Brasas/);
    expect(e.sprite.frames).toHaveLength(8);
  });
  it('a página do Leão Verde abre quando a Biblioteca é alcançada (fase 12)', () => {
    const e = entryById('leao')!;
    expect(e.selado).toBeFalsy();
    expect(isEntryOpen(e, (f) => f >= 12)).toBe(true);
    expect(isEntryOpen(e, (f) => f < 12)).toBe(false);
    const s = statsOf(e)!;
    expect(s.fraqueza).toEqual(['air']);
    expect(s.forca.imune).toEqual(['earth']);
  });
  it('vencer um chefe na Arena abre a página dele mesmo antes da fase', () => {
    const q = entryById('quimera')!;
    expect(isEntryOpen(q, () => false)).toBe(false);
    expect(isEntryOpen(q, () => false, ['chimera'])).toBe(true);
  });
});

describe('manuscrito: ligação com a Arena', () => {
  it('todo chefe da Arena tem a sua página, ligada pelo id do chefe', async () => {
    const { ARENA_BOSSES } = await import('../src/game/arena');
    for (const b of ARENA_BOSSES) {
      const page = MANUSCRITO.find(e => e.arenaId === b.id);
      expect(page, b.id).toBeDefined();
      expect(page!.perfil, b.id).toBe(b.perfil);
    }
  });
});

describe('manuscrito: Roo Terra e Roo Ar', () => {
  it('Terra: imune à terra, fraca ao ar, com o Muro de sal', () => {
    const e = entryById('roo-terra')!;
    const s = statsOf(e)!;
    expect(s.forca.imune).toEqual(['earth']);
    expect(s.fraqueza).toEqual(['air']);
    expect(e.habilidades.map(h => h.nome).join(' ')).toMatch(/Muro de sal/);
    expect(e.habilidades.map(h => h.nome).join(' ')).toMatch(/Raiz/);
    expect(e.sprite.frames[0]).toBe('roo_earth_4_down_0_0');
  });
  it('Ar: resiste ao ar, fraca à terra, com o Sopro e a visão de cima', () => {
    const e = entryById('roo-ar')!;
    const s = statsOf(e)!;
    expect(s.forca.resiste).toEqual(['air']);
    expect(s.fraqueza).toEqual(['earth']);
    expect(e.habilidades.map(h => h.nome).join(' ')).toMatch(/Sopro/);
    expect(e.habilidades.map(h => h.nome).join(' ')).toMatch(/visão de cima/);
    expect(e.habilidades.map(h => h.nome).join(' ')).toMatch(/Salto de vento/);
    expect(e.sprite.frames[0]).toBe('roo_air_4_down_0_0');
  });
});

describe('manuscrito: Roo Aqua', () => {
  it('mostra o perfil da forma de água: imune à água, fraca ao fogo, com a Bolha de sabão', () => {
    const e = entryById('roo-aqua')!;
    const s = statsOf(e)!;
    expect(s.forca.imune).toEqual(['water']);
    expect(s.fraqueza).toEqual(['fire']);
    expect(s.atributo.elemento).toBe('water');
    expect(s.recebe.water).toBe(0);
    expect(e.habilidades.map(h => h.nome).join(' ')).toMatch(/Bolha de sabão/);
    expect(e.sprite.frames).toHaveLength(8);
    expect(e.sprite.frames[0]).toBe('roo_water_4_down_0_0');
  });
  it('a página do fogo diz que só a Poção de Fogo responde à forma', () => {
    expect(entryById('roo-fire')!.habilidades.map(h => h.nome).join(' ')).toMatch(/Só a chama/);
  });
});
