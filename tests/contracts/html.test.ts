// Contrato do HTML: o código procura elementos por id; se o id sumir ou for digitado errado, a tela quebra em silêncio.
// Este teste lê o código-fonte e confere cada id citado contra o index.html (e as páginas de apoio contra o delas).
import { describe, expect, it } from 'vitest';
import indexHtml from '../../index.html?raw';
import manuscritoHtml from '../../manuscrito.html?raw';
import spritesHtml from '../../sprites.html?raw';
import manuscritoTs from '../../src/pages/manuscrito.ts?raw';
import spritesTs from '../../src/pages/sprites.ts?raw';
import { SPRITE_GROUPS, groupOf } from '../../src/textures/groups';
import { MANUSCRITO } from '../../src/game/manuscrito';

const ids = (html: string): Set<string> => new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));

// o código-fonte da interface do jogo, como texto (import.meta.glob é do Vite: sem dependência do Node)
const gameUi = import.meta.glob<string>(['/src/ui/**/*.ts', '/src/scenes/**/*.ts', '/src/main.ts', '/src/game/launcher.ts'], { query: '?raw', import: 'default', eager: true });
const rootHtml = import.meta.glob<string>('/*.html', { query: '?raw', import: 'default', eager: true });
const allTs = Object.keys(import.meta.glob('/src/**/*.ts'));

describe('contrato do HTML', () => {
  const index = ids(indexHtml);

  it('todo id usado em byId/setShown/isShown na interface do jogo existe no index.html', () => {
    const missing: string[] = [];
    for (const [file, src] of Object.entries(gameUi)) {
      for (const m of src.matchAll(/(?:byId|setShown|isShown)\(\s*'([a-z][\w-]*)'/g)) {
        if (!index.has(m[1])) missing.push(`${file}: ${m[1]}`);
      }
    }
    expect(missing, 'ids que o código procura e o index.html não tem').toEqual([]);
    expect(Object.keys(gameUi).length, 'o glob achou os arquivos').toBeGreaterThan(8);
  });

  it('as páginas de apoio encontram os ids delas', () => {
    const pages: Array<[string, string, string]> = [['manuscrito.html', manuscritoHtml, manuscritoTs], ['sprites.html', spritesHtml, spritesTs]];
    for (const [name, html, ts] of pages) {
      const have = ids(html);
      for (const m of ts.matchAll(/getElementById\(\s*'([\w-]+)'/g)) {
        expect(have.has(m[1]), `${name} precisa de #${m[1]}`).toBe(true);
      }
    }
  });

  it('cada página .html da raiz aponta para um script que existe', () => {
    const entries = Object.entries(rootHtml);
    expect(entries.length).toBeGreaterThanOrEqual(5);
    for (const [file, html] of entries) {
      const m = html.match(/<script type="module" src="([^"]+)"/);
      expect(m, `${file} precisa de um <script type="module">`).not.toBeNull();
      expect(allTs, `${file} aponta para ${m![1]}`).toContain(m![1]);
    }
  });
});

describe('contrato dos sprites', () => {
  it('toda textura citada no Manuscrito cai num grupo conhecido do catálogo (não em "Outros")', () => {
    for (const e of MANUSCRITO) {
      for (const k of e.sprite.frames) expect(groupOf(k).id, `${e.id}: a textura ${k} caiu em "Outros": nome errado?`).not.toBe('other');
    }
  });
  it('os grupos do catálogo têm id único e o último é o "Outros"', () => {
    expect(new Set(SPRITE_GROUPS.map(g => g.id)).size).toBe(SPRITE_GROUPS.length);
    expect(SPRITE_GROUPS[SPRITE_GROUPS.length - 1].id).toBe('other');
  });
});
