import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

// Em desenvolvimento, o Vite responde qualquer caminho com o jogo (fallback de SPA). Este plugin devolve a
// página 404 de verdade para endereços sem extensão que não são o jogo. Em produção, o servidor de hospedagem
// usa 404.html e 500.html (ver docs/16-guia-de-extensao.md).
function paginaNaoEncontrada(): Plugin {
  return {
    name: 'pagina-404',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? '/').split('?')[0];
        const pedeHtml = req.method === 'GET' && (req.headers.accept ?? '').includes('text/html');
        const interno = url === '/' || url.startsWith('/@') || url.startsWith('/src/') || url.startsWith('/node_modules/');
        if (!pedeHtml || interno || /\.[a-z0-9]+$/i.test(url)) return next();
        const arquivo = resolve(server.config.root, '404.html');
        if (!existsSync(arquivo)) return next();
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(readFileSync(arquivo, 'utf8'));
      });
    },
  };
}

export default defineConfig({
  plugins: [paginaNaoEncontrada()],
  server: { port: 5173 },
  build: {
    target: 'es2020',
    // Phaser (~1,2 MB) em arquivo próprio: o navegador o guarda em cache e não rebaixa a cada mudança do jogo
    chunkSizeWarningLimit: 1300,
    // além do jogo, publica o catálogo de sprites, o livro da história, o manuscrito e as páginas de erro
    rollupOptions: {
      input: {
        main: 'index.html',
        sprites: 'sprites.html',
        history: 'history.html',
        manuscrito: 'manuscrito.html',
        notFound: '404.html',
        serverError: '500.html',
      },
      output: { manualChunks: id => (id.includes('node_modules/phaser') ? 'phaser' : undefined) },
    },
  },
});
