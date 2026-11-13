import { defineConfig } from 'vite';

export default defineConfig({
  server: { port: 5173 },
  build: {
    target: 'es2020',
    // Phaser (~1,2 MB) em arquivo próprio: o navegador o guarda em cache e não rebaixa a cada mudança do jogo
    chunkSizeWarningLimit: 1300,
    // além do jogo, publica o catálogo de sprites (sprites.html) o livro da história (history.html) e o manuscrito do alquimista (manuscrito.html)
    rollupOptions: {
      input: { main: 'index.html', sprites: 'sprites.html', history: 'history.html', manuscrito: 'manuscrito.html' },
      output: { manualChunks: id => (id.includes('node_modules/phaser') ? 'phaser' : undefined) },
    },
  },
});
