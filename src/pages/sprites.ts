// Catálogo de sprites: gera as mesmas texturas do jogo e as mostra ampliadas, agrupadas.
// Abra /sprites.html com o servidor de desenvolvimento ligado (npm run dev).
import '@fontsource/cinzel/700.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/700.css';
import '../styles/sprites.css';
import Phaser from 'phaser';
import { FORM_PREVIEW, bootPage, prepareTextures } from './shared';
import { SPRITE_GROUPS } from '../textures/groups';

// Folha de sprites: todas as texturas numa imagem só (grade), mais um JSON com a posição de cada uma.
// Formato simples, que qualquer engine ou ferramenta aceita: { "image": ..., "frames": { chave: {x, y, w, h} } }.
function downloadAtlas(scene: Phaser.Scene): void {
  const keys = scene.textures.getTextureKeys().filter(k => !k.startsWith('__')).sort();
  const sources = keys.map(k => scene.textures.get(k).getSourceImage() as HTMLCanvasElement);
  const cellW = Math.max(...sources.map(s => s.width));
  const cellH = Math.max(...sources.map(s => s.height));
  const cols = Math.ceil(Math.sqrt(keys.length));
  const rows = Math.ceil(keys.length / cols);
  const canvas = document.createElement('canvas');
  canvas.width = cols * cellW;
  canvas.height = rows * cellH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const frames: Record<string, { x: number; y: number; w: number; h: number }> = {};
  keys.forEach((k, i) => {
    const x = (i % cols) * cellW;
    const y = Math.floor(i / cols) * cellH;
    const img = sources[i];
    ctx.drawImage(img, x, y);
    frames[k] = { x, y, w: img.width, h: img.height };
  });
  const save = (href: string, name: string): void => {
    const a = document.createElement('a');
    a.href = href;
    a.download = name;
    a.click();
  };
  save(canvas.toDataURL('image/png'), 'potion-academy-sprites.png');
  const json = JSON.stringify({ image: 'potion-academy-sprites.png', cell: { w: cellW, h: cellH }, frames }, null, 2);
  save(URL.createObjectURL(new Blob([json], { type: 'application/json' })), 'potion-academy-sprites.json');
}

class CatalogScene extends Phaser.Scene {
  constructor() {
    super('Catalog');
  }

  create(): void {
    prepareTextures(this, { forms: FORM_PREVIEW });
    document.getElementById('atlas-btn')?.addEventListener('click', () => downloadAtlas(this));
    const zoom = Number(new URLSearchParams(location.search).get('zoom')) || 5;
    const keys = this.textures.getTextureKeys().filter(k => !k.startsWith('__')).sort();
    const root = document.getElementById('catalog') as HTMLElement;
    const used = new Set<string>();

    for (const group of SPRITE_GROUPS) {
      const members = keys.filter(k => !used.has(k) && group.test(k));
      if (members.length === 0) continue;
      members.forEach(k => used.add(k));

      const section = document.createElement('section');
      section.dataset.group = group.id;
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
      section.append(title, note, grid);
      root.appendChild(section);
    }
  }
}

bootPage(CatalogScene);
