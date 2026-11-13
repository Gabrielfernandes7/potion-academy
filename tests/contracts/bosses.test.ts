// Contrato dos chefes: tudo o que um chefe novo precisa ter, ligado ao registro (entities/bosses/defs.ts).
// Se um destes testes falhar depois de você criar um chefe, a mensagem diz o que falta. Guia: docs/16-guia-de-extensao.md.
import { describe, expect, it } from 'vitest';
import { ARENA_BOSSES, arenaStageDef } from '../../src/game/arena';
import { BOSS_DEFS, BOSS_IDS, bossIdleTexture } from '../../src/game/entities/bosses/defs';
import { PROFILES } from '../../src/game/entities/profiles';
import { MANUSCRITO } from '../../src/game/manuscrito';
import { LAST_STAGE, STAGES } from '../../src/game/stages/index';
import { BLOCK_TEXTURE } from '../../src/game/stages/blockStyles';
import { groupOf } from '../../src/textures/groups';

describe('contrato dos chefes', () => {
  it.each(BOSS_IDS)('%s: a linha do registro está completa', id => {
    const d = BOSS_DEFS[id];
    expect(d.id, 'o id do registro bate com a chave').toBe(id);
    expect(PROFILES[d.profile], `falta a linha ${d.profile} em PROFILES (entities/profiles.ts)`).toBeDefined();
    expect(['top', 'bottom']).toContain(d.spawn);
    expect(['next', 'gate']).toContain(d.after);
    for (const t of [d.arena.nome, d.arena.lugar, d.arena.dica, d.sprite.prefix]) expect(t.trim()).not.toBe('');
    expect(BLOCK_TEXTURE[d.arena.block], 'o bloco da Arena precisa existir em blockStyles.ts').toBeTruthy();
    expect(typeof d.sprite.draw).toBe('function');
  });

  it.each(BOSS_IDS)('%s: tem cartão na Arena e a fase de treino monta', id => {
    expect(ARENA_BOSSES.find(b => b.id === id), 'a Arena deriva do registro').toBeDefined();
    expect(arenaStageDef(id).boss).toBe(id);
  });

  it.each(BOSS_IDS)('%s: tem página no Manuscrito, ligada ao id do chefe e ao perfil', id => {
    const page = MANUSCRITO.find(e => e.arenaId === id);
    expect(page, `falta a página em game/manuscrito.ts com arenaId: '${id}'`).toBeDefined();
    expect(page!.perfil).toBe(BOSS_DEFS[id].profile);
  });

  it.each(BOSS_IDS)('%s: o sprite cai no grupo "Chefes" do catálogo', id => {
    expect(groupOf(bossIdleTexture(id)).id, `o prefixo ${BOSS_DEFS[id].sprite.prefix}_ não está sendo reconhecido`).toBe('bosses');
  });

  it('os prefixos de sprite são únicos (dois chefes não dividem textura)', () => {
    expect(new Set(BOSS_IDS.map(i => BOSS_DEFS[i].sprite.prefix)).size).toBe(BOSS_IDS.length);
  });

  it('um chefe que está na campanha tem despedida; só o último abre o portão', () => {
    const inCampaign = STAGES.filter(s => s.boss);
    for (const s of inCampaign) {
      expect(BOSS_DEFS[s.boss!].farewell.length, `${s.boss} está na fase ${s.name} e precisa de despedida em story.ts`).toBeGreaterThan(0);
    }
    const gates = BOSS_IDS.filter(i => BOSS_DEFS[i].after === 'gate');
    expect(gates).toHaveLength(1);
    expect(STAGES[LAST_STAGE - 1].boss).toBe(gates[0]);
  });
});
