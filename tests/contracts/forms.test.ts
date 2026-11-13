// Contrato das transformações: cada forma do registro (game/forms) precisa de página, tecla, botão de toque e ajuda.
import { describe, expect, it } from 'vitest';
import html from '../../index.html?raw';
import audioSrc from '../../src/audio/AudioEngine.ts?raw';
import { FORMS, FORM_IDS } from '../../src/game/forms';
import { MANUSCRITO } from '../../src/game/manuscrito';
import { TOUCH_NAMES } from '../../src/input/touch';

const RESERVED = ['X', 'D', 'R', 'H', 'Q', '1', '2', '3', '4']; // teclas que já têm função no jogo

describe('contrato das transformações', () => {
  it.each(FORM_IDS)('%s: tem página no Manuscrito com o sprite da forma', id => {
    const page = MANUSCRITO.find(e => e.forma === id);
    expect(page, `falta uma página em game/manuscrito.ts com forma: '${id}'`).toBeDefined();
    expect(page!.perfilDireto, 'a página mostra o perfil da forma').toBeDefined();
    expect(page!.sprite.frames.every(k => k.startsWith(`roo_${id}_4_down_0_`)), 'os quadros são as texturas da forma').toBe(true);
  });

  it.each(FORM_IDS)('%s: tem tecla própria (não usada) e aparece na ajuda', id => {
    const key = FORMS[id].transformKey;
    expect(RESERVED, `a tecla ${key} já tem outra função`).not.toContain(key);
    expect(html, `a ajuda (index.html) precisa de <kbd>${key}</kbd>`).toContain(`<kbd>${key}</kbd>`);
  });

  it('as teclas de transformação não se repetem', () => {
    expect(new Set(FORM_IDS.map(i => FORMS[i].transformKey)).size).toBe(FORM_IDS.length);
  });

  it('há um botão de toque por forma e um para a habilidade, e todos são nomes válidos', () => {
    const used = [...html.matchAll(/data-touch="([^"]+)"/g)].map(m => m[1]);
    expect(used).toContain('ability');
    expect(used).toEqual(expect.arrayContaining(['transformFire', 'transformWater']));
    for (const name of used) expect(TOUCH_NAMES, `o botão data-touch="${name}" não é uma ação conhecida (input/touch.ts)`).toContain(name);
  });

  it('há som de transformação e de fim para cada elemento de forma (SfxName)', () => {
    for (const sfx of ['transform', 'formEnd']) expect(audioSrc).toContain(`case '${sfx}'`);
    for (const id of FORM_IDS) expect(audioSrc, `falta o timbre de ${FORMS[id].element} em transformSound`).toContain(`'${FORMS[id].element}'`);
  });
});
