// Contrato das páginas de erro e dos links para a história: confere que as páginas existem, têm o básico
// (idioma, título, volta ao jogo) e que o Vite as publica. Lê o código-fonte, sem subir o servidor.
import { describe, expect, it } from 'vitest';
import notFound from '../../404.html?raw';
import serverError from '../../500.html?raw';
import indexHtml from '../../index.html?raw';
import historyHtml from '../../history.html?raw';
import viteConfig from '../../vite.config.ts?raw';

describe('páginas de erro', () => {
  for (const [nome, html, codigo] of [['404', notFound, '404'], ['500', serverError, '500']] as const) {
    it(`${nome}.html tem idioma, título, código ${codigo} e volta ao jogo`, () => {
      expect(html).toContain('<html lang="pt-BR">');
      expect(html).toMatch(/<title>[^<]+<\/title>/);
      expect(html).toContain(`>${codigo}</p>`);
      expect(html).toContain('href="/"');
      expect(html).toContain('name="robots" content="noindex"');
    });
  }

  it('o Vite publica as duas páginas', () => {
    expect(viteConfig).toContain("notFound: '404.html'");
    expect(viteConfig).toContain("serverError: '500.html'");
  });
});

describe('versões da história', () => {
  it('o menu leva à seção de versões do livro', () => {
    expect(indexHtml).toContain('href="/history.html#versoes"');
    expect(historyHtml).toContain('id="versoes"');
  });
});
