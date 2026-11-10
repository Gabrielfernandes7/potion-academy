import { defineConfig } from 'vite';

export default defineConfig({
  server: { port: 5173 },
  build: {
    target: 'es2020',
    // além do jogo, publica o catálogo de sprites (sprites.html)
    rollupOptions: { input: { main: 'index.html', sprites: 'sprites.html' } },
  },
});
