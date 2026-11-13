// Experimento "Roo de fogo": um mapa em miniatura para testar a transformação da Roo e as ideias de
// habilidade do elemento Fogo. Abra /lab.html?exp=fire-roo com `npm run dev`. Não entra no build.
import Phaser from 'phaser';
import { generateTextures } from '../../textures';
import { makeFireRoo, type FireDir, type FireIntensity } from '../../textures/rooFire';
import { ROO_HEAD_ROOM, rooOriginY } from '../../textures/rooGeometry';
import type { LabExperiment } from '../types';

const TILE = 40;
const COLS = 11;
const ROWS = 9;
const DIRS: FireDir[] = ['down', 'up', 'side'];
const ANIM_STEPS = 8; // fases do tremor da chama (0 a 7)
const ANIM_MS = 90; // tempo entre fases: a chama treme mesmo com a Roo parada
const BOMB_FUSE = 1600;
const BLAST_RADIUS = 2;
const EMBER_MS = 2200;
const BLOCKS: Array<[number, number]> = [
  [3, 1], [5, 1], [7, 1], [1, 3], [3, 3], [5, 3], [7, 3], [9, 3],
  [1, 5], [3, 5], [5, 5], [7, 5], [9, 5], [3, 7], [5, 7], [7, 7],
];
const FIRE_DARK = 0xd6452f;
const FIRE_MID = 0xffa94d;

interface Cfg { stage: number; intensity: FireIntensity; trail: boolean }
interface Bomb { x: number; y: number; g: Phaser.GameObjects.Graphics; timer: Phaser.Time.TimerEvent }

function readControls(): Cfg {
  const stage = Number((document.getElementById('stage-select') as HTMLSelectElement).value);
  const intensity = (document.getElementById('intensity-select') as HTMLSelectElement).value as FireIntensity;
  const trail = (document.getElementById('trail-check') as HTMLInputElement).checked;
  return { stage, intensity, trail };
}

class FireRooScene extends Phaser.Scene {
  private cfg!: Cfg;
  private player!: Phaser.GameObjects.Sprite;
  private gx = 1;
  private gy = 1;
  private dir: FireDir = 'down';
  private flip = false;
  private anim = 0; // fase de 0 a 7
  private busy = false;
  private walls = new Set<string>();
  private blocks = new Map<string, Phaser.GameObjects.Image>();
  private embers = new Map<string, number>();
  private emberGfx!: Phaser.GameObjects.Graphics;
  private bombs: Bomb[] = [];
  private blasts = 0;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private bombKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super('FireRoo');
  }

  create(): void {
    generateTextures(this);
    this.cfg = readControls();
    this.buildMap();
    this.buildFire();
    this.emberGfx = this.add.graphics().setDepth(1);
    this.player = this.add.sprite(this.gx * TILE + TILE / 2, this.gy * TILE + TILE / 2, 'roo_down_0')
      .setOrigin(0.5, rooOriginY(TILE))
      .setDepth(5);
    this.refresh();

    // tremor contínuo: a chama vibra mesmo parada; o corpo anda quando a Roo se move
    this.time.addEvent({
      delay: ANIM_MS,
      loop: true,
      callback: () => {
        this.anim = (this.anim + 1) % ANIM_STEPS;
        this.refresh();
      },
    });

    const kb = this.input.keyboard;
    if (kb) {
      this.cursors = kb.createCursorKeys();
      this.bombKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    document.getElementById('export-btn')?.addEventListener('click', () => this.exportGrid());
    document.getElementById('stage-select')?.addEventListener('change', () => this.applySettings());
    document.getElementById('intensity-select')?.addEventListener('change', () => this.applySettings());
    document.getElementById('trail-check')?.addEventListener('change', () => this.applySettings());
    this.setStatus();
  }

  update(): void {
    const now = this.time.now;
    for (const b of this.bombs) this.drawBomb(b, now);
    this.drawEmbers(now);
    if (this.cursors) {
      if (this.cursors.left.isDown) this.move(-1, 0);
      else if (this.cursors.right.isDown) this.move(1, 0);
      else if (this.cursors.up.isDown) this.move(0, -1);
      else if (this.cursors.down.isDown) this.move(0, 1);
    }
    if (this.bombKey && Phaser.Input.Keyboard.JustDown(this.bombKey)) this.placeBomb();
  }

  private buildMap(): void {
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        this.add.image(x * TILE, y * TILE, (x + y) % 2 === 0 ? 'floor1' : 'floor2').setOrigin(0, 0);
        const border = x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1;
        const pillar = x % 2 === 0 && y % 2 === 0;
        if (border || pillar) {
          this.walls.add(`${x},${y}`);
          this.add.image(x * TILE, y * TILE, 'wall').setOrigin(0, 0).setDepth(1);
        }
      }
    }
    for (const [x, y] of BLOCKS) {
      this.blocks.set(`${x},${y}`, this.add.image(x * TILE, y * TILE, 'block').setOrigin(0, 0).setDepth(2));
    }
  }

  // Textura da Roo de fogo para cada direção, quadro do corpo (0 a 3) e fase do tremor (0 a 7).
  private buildFire(): void {
    for (const dir of DIRS) {
      for (let fr = 0; fr < 4; fr++) {
        const src = this.textures.get(`roo_${dir}_${fr}`).getSourceImage() as HTMLCanvasElement;
        for (let t = 0; t < ANIM_STEPS; t++) {
          const key = `lab_${dir}_${fr}_${t}`;
          if (this.textures.exists(key)) this.textures.remove(key);
          const canvas = makeFireRoo(src, {
            dir,
            frame: fr,
            tick: t,
            intensity: this.cfg.intensity,
            stage: this.cfg.stage,
          });
          this.textures.addCanvas(key, canvas);
        }
      }
    }
  }

  // Parada, o corpo fica no quadro 0 (sem bob nem respiração): só a chama treme.
  // Andando, o corpo usa o quadro 0 a 3 do passo.
  private refresh(): void {
    const fr = this.busy ? this.anim % 4 : 0;
    const t = this.anim;
    const key = this.cfg.stage === 0
      ? `roo_${this.dir}_${fr}`
      : `lab_${this.dir}_${fr}_${t}`;
    this.player.setTexture(key);
    this.player.setFlipX(this.dir === 'side' && this.flip);
  }

  private applySettings(): void {
    this.cfg = readControls();
    if (!this.cfg.trail) this.embers.clear();
    this.buildFire();
    this.refresh();
  }

  private free(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return false;
    const k = `${x},${y}`;
    return !this.walls.has(k) && !this.blocks.has(k) && !this.bombs.some(b => b.x === x && b.y === y);
  }

  private move(dx: number, dy: number): void {
    if (this.busy) return;
    this.dir = dy < 0 ? 'up' : dy > 0 ? 'down' : 'side';
    if (dx !== 0) this.flip = dx < 0;
    const nx = this.gx + dx;
    const ny = this.gy + dy;
    if (!this.free(nx, ny)) {
      this.refresh();
      return;
    }
    const fromX = this.gx;
    const fromY = this.gy;
    this.gx = nx;
    this.gy = ny;
    this.busy = true;
    this.refresh();
    this.tweens.add({
      targets: this.player,
      x: nx * TILE + TILE / 2,
      y: ny * TILE + TILE / 2,
      duration: 150,
      onComplete: () => {
        this.busy = false;
        this.refresh();
        if (this.cfg.stage >= 4 && this.cfg.trail) this.embers.set(`${fromX},${fromY}`, this.time.now + EMBER_MS);
      },
    });
  }

  private placeBomb(): void {
    const { gx, gy } = this;
    if (this.bombs.some(b => b.x === gx && b.y === gy)) return;
    const g = this.add.graphics().setDepth(3);
    const bomb: Bomb = { x: gx, y: gy, g, timer: this.time.delayedCall(BOMB_FUSE, () => this.explode(bomb)) };
    this.bombs.push(bomb);
  }

  private drawBomb(b: Bomb, now: number): void {
    const cx = b.x * TILE + TILE / 2;
    const cy = b.y * TILE + TILE / 2 + 2;
    b.g.clear();
    b.g.fillStyle(0x1c1410);
    b.g.fillCircle(cx, cy, 10);
    b.g.fillStyle(0x3a1a10);
    b.g.fillCircle(cx - 3, cy - 3, 3);
    b.g.fillStyle(Math.floor(now / 150) % 2 === 0 ? FIRE_MID : FIRE_DARK);
    b.g.fillRect(cx + 4, cy - 12, 3, 3);
  }

  private explode(b: Bomb): void {
    this.bombs = this.bombs.filter(x => x !== b);
    b.g.destroy();
    const tiles: Array<[number, number]> = [[b.x, b.y]];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      for (let k = 1; k <= BLAST_RADIUS; k++) {
        const x = b.x + dx * k;
        const y = b.y + dy * k;
        const key = `${x},${y}`;
        if (this.walls.has(key)) break;
        tiles.push([x, y]);
        const blk = this.blocks.get(key);
        if (blk) {
          blk.destroy();
          this.blocks.delete(key);
          break;
        }
      }
    }
    const now = this.time.now;
    for (const [x, y] of tiles) {
      const flash = this.add.rectangle(x * TILE + TILE / 2, y * TILE + TILE / 2, TILE, TILE, 0xffd54f, 0.85).setDepth(4);
      this.tweens.add({ targets: flash, alpha: 0, duration: 350, onComplete: () => flash.destroy() });
      if (this.cfg.stage >= 4 && this.cfg.trail) this.embers.set(`${x},${y}`, now + EMBER_MS);
    }
    this.blasts++;
    this.setStatus();
  }

  // Brasas em xadrez de pixels que alternam entre quadros (sem degradê).
  private drawEmbers(now: number): void {
    this.emberGfx.clear();
    if (this.cfg.stage < 4) return;
    const phase = Math.floor(now / 180);
    for (const [key, until] of this.embers) {
      if (now > until) {
        this.embers.delete(key);
        continue;
      }
      const [x, y] = key.split(',').map(Number);
      for (let py = 0; py < 4; py++) {
        for (let px = 0; px < 4; px++) {
          if ((px + py + phase) % 2 !== 0) continue;
          this.emberGfx.fillStyle((px + py) % 3 === 0 ? FIRE_DARK : FIRE_MID, 0.75);
          this.emberGfx.fillRect(x * TILE + px * 10, y * TILE + py * 10, 10, 10);
        }
      }
    }
  }

  // Folha: uma linha por estágio (0 a 4) e uma coluna por fase do tremor. Baixa em PNG, escala 3×.
  private exportGrid(): void {
    const SCALE = 3;
    const cw = TILE * SCALE;
    const ch = (TILE + ROO_HEAD_ROOM) * SCALE;
    const canvas = document.createElement('canvas');
    canvas.width = ANIM_STEPS * cw;
    canvas.height = 5 * ch;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    const src = this.textures.get('roo_down_0').getSourceImage() as HTMLCanvasElement;
    for (let stage = 0; stage < 5; stage++) {
      for (let t = 0; t < ANIM_STEPS; t++) {
        const fire = makeFireRoo(src, { dir: 'down', frame: 0, tick: t, intensity: this.cfg.intensity, stage });
        ctx.drawImage(fire, t * cw, stage * ch, cw, ch);
      }
    }
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'roo-transformacao.png';
    a.click();
  }

  private setStatus(): void {
    const el = document.getElementById('status');
    if (el) el.textContent = `Explosões: ${this.blasts}`;
  }
}

const PANEL_HTML = `
      <h2>Estágio da Roo</h2>
      <label>
        Transformação
        <select id="stage-select">
          <option value="0">0 · Original (capa roxa)</option>
          <option value="1">1 · Capa vermelha em degradê</option>
          <option value="2">2 · Chapéu em chama, varinha e olhos</option>
          <option value="3">3 · Manto em chamas e orelhas</option>
          <option value="4" selected>4 · Faíscas e brasas</option>
        </select>
      </label>
      <label>
        Intensidade
        <select id="intensity-select">
          <option value="low">Baixa</option>
          <option value="medium">Média</option>
          <option value="high" selected>Alta</option>
        </select>
      </label>

      <h2>Mecânica de teste</h2>
      <label class="check">
        <input type="checkbox" id="trail-check" checked>
        Explosões deixam brasas (estágio 4)
      </label>
      <p class="tip">Ideia para testar a sensação. A regra final ainda não está definida em <code>docs/</code>.</p>

      <h2>Controles</h2>
      <ul>
        <li><kbd>setas</kbd> andar (passo por casa)</li>
        <li><kbd>Espaço</kbd> colocar Poção de Fogo (explode em 1,6 s)</li>
        <li>Blocos destrutíveis somem na explosão; pilares e paredes não.</li>
      </ul>

      <h2>Exportar</h2>
      <button type="button" id="export-btn" style="font:inherit;font-weight:700;background:var(--accent);color:#fff;border:0;border-radius:6px;padding:8px 12px;cursor:pointer">Baixar folha da transformação (PNG)</button>
      <p class="tip">Linhas: estágios 0 a 4. Colunas: as 8 fases do tremor. Escala 3×.</p>

      <h2>Resultado</h2>
      <p id="status">Explosões: 0</p>
    
`;

export const fireRooExperiment: LabExperiment = {
  id: 'fire-roo',
  title: 'Roo de fogo',
  summary: 'A transformação da Roo e as ideias do elemento Fogo, num mapa em miniatura.',
  size: { cols: COLS, rows: ROWS, tile: TILE },
  panelHtml: PANEL_HTML,
  scene: FireRooScene,
};
