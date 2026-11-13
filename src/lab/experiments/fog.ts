// Experimento "Névoa": o mesmo efeito da fase A NÉVOA (game/effects/Fog.ts), com controles de raio,
// escuridão e respiração, e criaturas espalhadas para ver o que a névoa esconde.
// Abra /lab.html?exp=fog com `npm run dev`.
import { Fog } from '../../game/effects/Fog';
import { FOG_DARKNESS } from '../../game/effects/fogRules';
import { LabArena } from '../arena/LabArena';
import type { LabExperiment } from '../types';

const COLS = 15;
const ROWS = 13;
const TILE = 40;

const PANEL_HTML = `
  <h2>Névoa</h2>
  <label>
    Raio de visão (casas): <b id="fog-radius-out">3</b>
    <input type="range" id="fog-radius" min="1.5" max="8" step="0.5" value="3">
  </label>
  <label>
    Escuridão: <b id="fog-dark-out">${FOG_DARKNESS}</b>
    <input type="range" id="fog-dark" min="0.5" max="1" step="0.02" value="${FOG_DARKNESS}">
  </label>
  <label class="check"><input type="checkbox" id="fog-breath" checked> Respirar (o raio varia um pouco)</label>
  <label class="check"><input type="checkbox" id="fog-creatures" checked> Mostrar criaturas escondidas</label>

  <h2>Controles</h2>
  <ul>
    <li><kbd>setas</kbd> andar (passo por casa)</li>
    <li>Fantasmas e sapos ficam parados: só aparecem quando você chega perto.</li>
  </ul>
  <p class="tip">É o mesmo módulo que a fase A NÉVOA usa. A regra do raio está em <code>game/effects/fogRules.ts</code>.</p>
`;

class FogScene extends LabArena {
  private fog!: Fog;
  private creatures: Phaser.GameObjects.Image[] = [];

  constructor() {
    super('LabFog', { cols: COLS, rows: ROWS, tile: TILE, blockChance: 0.4 });
  }

  protected onCreate(): void {
    this.fog = new Fog(this, COLS * TILE, ROWS * TILE, this.readNumber('fog-radius', 3), TILE);
    this.scatterCreatures();
    const sync = (): void => {
      const radius = this.readNumber('fog-radius', 3);
      const dark = this.readNumber('fog-dark', FOG_DARKNESS);
      this.fog.setRadius(radius);
      this.fog.setDarkness(dark);
      this.fog.setBreathing((document.getElementById('fog-breath') as HTMLInputElement | null)?.checked ?? true);
      const showCreatures = (document.getElementById('fog-creatures') as HTMLInputElement | null)?.checked ?? true;
      this.creatures.forEach(c => c.setVisible(showCreatures));
      const r = document.getElementById('fog-radius-out'); if (r) r.textContent = String(radius);
      const d = document.getElementById('fog-dark-out'); if (d) d.textContent = String(dark);
    };
    for (const id of ['fog-radius', 'fog-dark', 'fog-breath', 'fog-creatures']) {
      document.getElementById(id)?.addEventListener('input', sync);
    }
    sync();
  }

  protected onUpdate(time: number): void {
    this.fog.update(this.player.x, this.player.y);
    this.creatures.forEach((c, i) => { c.y += Math.sin(time / 400 + i) * 0.15; });
  }

  private scatterCreatures(): void {
    const spots = this.freeTiles(5);
    for (let i = 0; i < 6 && spots.length > 0; i++) {
      const s = spots.splice(Math.floor((i * 7919) % spots.length), 1)[0];
      const key = i % 2 === 0 ? 'enemy_ghost' : 'enemy';
      this.creatures.push(this.add.image(s.x * TILE + TILE / 2, s.y * TILE + TILE / 2, key).setDepth(7));
    }
  }

  private readNumber(id: string, fallback: number): number {
    const el = document.getElementById(id) as HTMLInputElement | null;
    return el ? Number(el.value) : fallback;
  }
}

export const fogExperiment: LabExperiment = {
  id: 'fog',
  title: 'Névoa',
  summary: 'O efeito da fase A NÉVOA: ajuste o raio de visão e a escuridão.',
  size: { cols: COLS, rows: ROWS, tile: TILE },
  panelHtml: PANEL_HTML,
  scene: FogScene,
};
