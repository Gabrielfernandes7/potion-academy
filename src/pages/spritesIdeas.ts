// Página de ideias de sprites (sprites-ideas.html): mostra a Roo de fogo ao lado da original.
// Abra /sprites-ideas.html com o servidor de desenvolvimento ligado (npm run dev). Não entra no jogo.
import '@fontsource/cinzel/700.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/700.css';
import Phaser from 'phaser';
import { generateTextures } from '../textures';
import { outlineTexture } from '../textures/outline';
import { FIRE_PALETTE, makeFireRoo, type FireDir } from '../textures/rooFire';

interface Pose { label: string; key: string; dir: FireDir; frame: number; sleep?: boolean }

const POSES: Pose[] = [
  { label: 'De frente, parada', key: 'roo_down_0', dir: 'down', frame: 0 },
  { label: 'De costas, parada', key: 'roo_up_0', dir: 'up', frame: 0 },
  { label: 'De lado, andando (quadro 1)', key: 'roo_side_0', dir: 'side', frame: 0 },
  { label: 'De lado, andando (quadro 2)', key: 'roo_side_1', dir: 'side', frame: 1 },
  { label: 'De lado, andando (quadro 3)', key: 'roo_side_2', dir: 'side', frame: 2 },
  { label: 'De lado, andando (quadro 4)', key: 'roo_side_3', dir: 'side', frame: 3 },
  { label: 'Dormindo', key: 'roo_sleep_down_0', dir: 'down', frame: 0, sleep: true },
];

// as 4 poses pedidas na folha de referência
const SHEET_KEYS = ['roo_down_0', 'roo_up_0', 'roo_side_0', 'roo_sleep_down_0'];

type Img = CanvasImageSource & { width: number; height: number };

function zoomed(src: Img, zoom: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = src.width * zoom;
  c.height = src.height * zoom;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(src, 0, 0, c.width, c.height);
  }
  return c;
}

class IdeasScene extends Phaser.Scene {
  constructor() {
    super('Ideas');
  }

  create(): void {
    generateTextures(this);
    // a Roo dormindo não tem contorno no jogo; aqui ela ganha, para a folha ter o mesmo contorno em todas as poses
    outlineTexture(this, 'roo_sleep_down_0');

    const zoom = Number(new URLSearchParams(location.search).get('zoom')) || 6;
    const source = (key: string): HTMLCanvasElement => this.textures.get(key).getSourceImage() as HTMLCanvasElement;
    const fire = new Map<string, HTMLCanvasElement>();
    for (const p of POSES) fire.set(p.key, makeFireRoo(source(p.key), p));

    // ---- original x fogo, lado a lado
    const grid = document.getElementById('fire-grid');
    if (grid) {
      for (const p of POSES) {
        const fig = document.createElement('figure');
        const pair = document.createElement('div');
        pair.className = 'pair';
        pair.append(zoomed(source(p.key), zoom), zoomed(fire.get(p.key) as HTMLCanvasElement, zoom));
        const cap = document.createElement('figcaption');
        cap.innerHTML = `<b>${p.label}</b>original (esquerda) | fogo (direita) | 40 × 50 px`;
        fig.append(pair, cap);
        grid.appendChild(fig);
      }
    }

    // ---- caminhada de lado em loop (a chama da varinha balança entre os quadros)
    const anim = document.getElementById('fire-anim');
    if (anim) {
      const frames = POSES.filter(p => p.dir === 'side').map(p => zoomed(fire.get(p.key) as HTMLCanvasElement, 8));
      const view = document.createElement('canvas');
      view.width = frames[0].width;
      view.height = frames[0].height;
      anim.appendChild(view);
      const vctx = view.getContext('2d');
      let i = 0;
      window.setInterval(() => {
        if (!vctx) return;
        vctx.clearRect(0, 0, view.width, view.height);
        vctx.drawImage(frames[i % frames.length], 0, 0);
        i++;
      }, 160);
    }

    // ---- paleta
    const sw = document.getElementById('fire-swatches');
    if (sw) {
      for (const c of FIRE_PALETTE) {
        const s = document.createElement('span');
        s.className = 'swatch';
        s.innerHTML = `<i style="background:${c.hex}"></i>${c.name} <code>${c.hex}</code>`;
        sw.appendChild(s);
      }
    }

    // ---- folha de referência: 4 poses lado a lado, 8x
    document.getElementById('sheet-btn')?.addEventListener('click', () => {
      const cells = SHEET_KEYS.map(k => zoomed(fire.get(k) as HTMLCanvasElement, 8));
      const sheet = document.createElement('canvas');
      sheet.width = cells.reduce((n, c) => n + c.width, 0);
      sheet.height = cells[0].height;
      const sctx = sheet.getContext('2d');
      if (!sctx) return;
      let x = 0;
      for (const c of cells) {
        sctx.drawImage(c, x, 0);
        x += c.width;
      }
      const a = document.createElement('a');
      a.href = sheet.toDataURL('image/png');
      a.download = 'roo-fogo-folha-8x.png';
      a.click();
    });
  }
}

new Phaser.Game({
  type: Phaser.CANVAS,
  width: 1,
  height: 1,
  parent: 'stage',
  pixelArt: true,
  audio: { noAudio: true },
  scene: [IdeasScene],
});
