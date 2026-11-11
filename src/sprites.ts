// Catálogo de sprites: gera as mesmas texturas do jogo e as mostra ampliadas, agrupadas.
// Abra /sprites.html com o servidor de desenvolvimento ligado (npm run dev).
import '@fontsource/cinzel/700.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/700.css';
import './styles/sprites.css';
import Phaser from 'phaser';
import { generateTextures } from './textures';

// Cada grupo vira uma pasta em docs/img/sprites/<id>.png (ver docs/09-sprites.md).
interface Group { id: string; title: string; note: string; test: (key: string) => boolean }

const GROUPS: Group[] = [
  { id: 'heroes', title: 'Heróis (a Roo)', note: 'roo_{down,up,side}_0-3: andar. roo_sleep_*: dormindo. roo_stir_*: mexendo a poção (menu, sem braço). roo_maestro_*: maestro de casaca (Sala de Música). roo_read_*: de frente, lendo; vemos a capa do livro e a folha virando por cima (GIF do README).', test: k => k.startsWith('roo_') },
  { id: 'bosses', title: 'Chefes', note: 'Belladona. witch_idle_0/1: parada. witch_cast: lançando poção. witch_hurt: machucada.', test: k => k.startsWith('witch_') },
  { id: 'humans', title: 'Personagens humanos', note: 'Frei Anselmo (anselmo_front_0/1: de frente, 1 respira; anselmo_back: de costas; anselmo_side: perfil; anselmo_retrato: de frente em 4x, vetorial, usado na carta e na confissão). Aparece na carta, no portão do jardim e na confissão final.', test: k => k.startsWith('anselmo_') },
  { id: 'enemies', title: 'Inimigos', note: 'enemy: sapo mago (laboratório e jardim). enemy_ghost: fantasma (salão dos fantasmas; atravessa paredes). enemy_flower: flor do mal (jardim; fixa, imune à água).', test: k => k.startsWith('enemy') },
  { id: 'objects', title: 'Objetos', note: 'Poções: um formato por elemento: fogo (balão), água (tubo), terra (pote), éter (losango). Itens: power-ups são fichas redondas; moeda, gema, coração e baú são itens soltos.', test: k => k.startsWith('bomb_') || k.startsWith('pickup_') },
  { id: 'effects', title: 'Efeitos', note: 'Peças pequenas dos sistemas de partículas e a explosão.', test: k => k.startsWith('menu_') || k === 'explosion' },
  { id: 'scenery', title: 'Cenário', note: 'Castelo: floor, wall, block, door. Jardim: g_floor, g_wall (sebe), g_block (canteiro), gate (portão).', test: k => /^(floor|wall|block|door|g_|gate_)/.test(k) },
  { id: 'ui', title: 'Interface (HUD)', note: 'Ícones usados na faixa de cima do jogo.', test: k => k.startsWith('hud_') },
  { id: 'other', title: 'Outros', note: 'Sprites sem grupo definido.', test: () => true },
];

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
    generateTextures(this);
    document.getElementById('atlas-btn')?.addEventListener('click', () => downloadAtlas(this));
    const zoom = Number(new URLSearchParams(location.search).get('zoom')) || 5;
    const keys = this.textures.getTextureKeys().filter(k => !k.startsWith('__')).sort();
    const root = document.getElementById('catalog') as HTMLElement;
    const used = new Set<string>();

    for (const group of GROUPS) {
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

new Phaser.Game({
  type: Phaser.CANVAS,
  width: 1,
  height: 1,
  parent: 'stage',
  pixelArt: true,
  audio: { noAudio: true },
  scene: [CatalogScene],
});
