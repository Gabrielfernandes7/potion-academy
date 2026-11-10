// Catálogo de sprites: gera as mesmas texturas do jogo e as mostra ampliadas, agrupadas.
// Abra /sprites.html com o servidor de desenvolvimento ligado (npm run dev).
import '@fontsource/cinzel/700.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/700.css';
import './styles/sprites.css';
import Phaser from 'phaser';
import { generateTextures } from './textures';

interface Group { title: string; note: string; test: (key: string) => boolean }

const GROUPS: Group[] = [
  { title: 'Roo (personagem)', note: 'roo_{down,up,side}_0-3: andar. roo_sleep_*: dormindo. roo_stir_*: mexendo a poção (menu, sem braço).', test: k => k.startsWith('roo_') },
  { title: 'Belladona (chefe)', note: 'witch_idle_0/1: parada. witch_cast: lançando poção. witch_hurt: machucada.', test: k => k.startsWith('witch_') },
  { title: 'Poções', note: 'Um formato por elemento: fogo (balão), água (tubo), terra (pote), éter (losango).', test: k => k.startsWith('bomb_') },
  { title: 'Itens', note: 'Power-ups são fichas redondas com aro colorido; moeda, gema, coração e baú são itens soltos.', test: k => k.startsWith('pickup_') },
  { title: 'HUD', note: 'Ícones usados na faixa de cima do jogo.', test: k => k.startsWith('hud_') },
  { title: 'Efeitos do menu e das explosões', note: 'Peças pequenas usadas pelos sistemas de partículas.', test: k => k.startsWith('menu_') },
  { title: 'Cenário e inimigos', note: 'Chão, muralha, caixote, porta e a criatura alquímica.', test: () => true },
];

class CatalogScene extends Phaser.Scene {
  constructor() {
    super('Catalog');
  }

  create(): void {
    generateTextures(this);
    const zoom = Number(new URLSearchParams(location.search).get('zoom')) || 5;
    const keys = this.textures.getTextureKeys().filter(k => !k.startsWith('__')).sort();
    const root = document.getElementById('catalog') as HTMLElement;
    const used = new Set<string>();

    for (const group of GROUPS) {
      const members = keys.filter(k => !used.has(k) && group.test(k));
      if (members.length === 0) continue;
      members.forEach(k => used.add(k));

      const title = document.createElement('h2');
      title.textContent = `${group.title} (${members.length})`;
      const note = document.createElement('p');
      note.textContent = group.note;
      const grid = document.createElement('div');
      grid.className = 'grid';

      for (const key of members) {
        const img = this.textures.get(key).getSourceImage() as CanvasImageSource & { width: number; height: number };
        const canvas = document.createElement('canvas');
        canvas.width = img.width * zoom;
        canvas.height = img.height * zoom;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
        const fig = document.createElement('figure');
        const cap = document.createElement('figcaption');
        cap.innerHTML = `<b>${key}</b>${img.width} × ${img.height}`;
        fig.append(canvas, cap);
        grid.appendChild(fig);
      }
      root.append(title, note, grid);
    }
  }
}

new Phaser.Game({
  type: Phaser.CANVAS,
  width: 1,
  height: 1,
  parent: 'stage',
  pixelArt: true,
  audio: { noAudio: true },
  scene: [CatalogScene],
});
