// Experimento "Elenco": todos os inimigos comuns com o selo da fraqueza, como na partida (src/textures/weaknessBadge.ts
// e game/entities/badge.ts). Serve para conferir a leitura dos sprites e dos selos lado a lado, sobre dois tons de chão.
// Abra /lab.html?exp=cast com `npm run dev`. Captura em docs/img/lab-elenco.png.
import Phaser from 'phaser';
import { generateTextures } from '../../textures';
import { weaknessBadge } from '../../game/entities/badge';
import { ENEMY_TYPES, type EnemyKind } from '../../game/entities/enemies/defs';
import { badgeKey } from '../../textures/weaknessBadge';
import type { LabExperiment } from '../types';

const COLS = 12;
const ROWS = 6;
const TILE = 40;
const KINDS = Object.keys(ENEMY_TYPES) as EnemyKind[];
// Mesmo ponto do selo no jogo (EnemySystem: BADGE_DX/BADGE_DY).
const BADGE_DX = 14;
const BADGE_DY = -15;
// O segundo quadro de vida, para o lab animar como o jogo.
const ALT: Partial<Record<EnemyKind, string>> = {
  ghost: 'enemy_ghost_1', lantern: 'enemy_lantern_1', clock: 'enemy_clock_1', mole: 'enemy_mole_1', owl: 'enemy_owl_1',
  slime: 'enemy_slime_1', sentinel: 'enemy_sentinel_1', rat: 'enemy_rat_1', salamander: 'enemy_salamander_1',
};

const PANEL_HTML = `
  <h2>Elenco com selos</h2>
  <p class="tip">Cada inimigo que machuca leva um selo com o glifo do elemento que o fere. Ratinho e salamandra não levam.</p>
  <ul>
    <li>△ fogo, ▽ água, ▽ com barra terra, △ com barra ar.</li>
    <li>Fantasma (espírito do alambique) e gosma (gota de mercúrio) têm sprites novos.</li>
  </ul>
`;

class CastScene extends Phaser.Scene {
  private flip = 0;
  private movers: Array<{ img: Phaser.GameObjects.Image; a: string; b: string }> = [];

  constructor() {
    super('LabCast');
  }

  create(): void {
    generateTextures(this);
    const bg = this.add.graphics();
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { bg.fillStyle((x + y) % 2 ? 0x33463d : 0x2c3b34); bg.fillRect(x * TILE, y * TILE, TILE, TILE); }
    const style = { fontFamily: 'monospace', fontSize: '9px', color: '#f1e6d6' };
    KINDS.forEach((kind, i) => {
      const col = i % 5, row = Math.floor(i / 5);
      const x = TILE * (1 + col * 2) + TILE / 2, y = TILE * (1 + row * 2) - 4;
      const img = this.add.image(x, y, ENEMY_TYPES[kind].texture);
      const weak = weaknessBadge(kind);
      if (weak) this.add.image(x + BADGE_DX, y + BADGE_DY, badgeKey(weak));
      this.add.text(x - 22, y + 22, kind, style).setAlpha(0.75);
      const alt = ALT[kind];
      if (alt) this.movers.push({ img, a: ENEMY_TYPES[kind].texture, b: alt });
    });
    this.time.addEvent({ delay: 450, loop: true, callback: () => { this.flip ^= 1; for (const m of this.movers) m.img.setTexture(this.flip ? m.b : m.a); } });
  }
}

export const castExperiment: LabExperiment = {
  id: 'cast',
  title: 'Elenco',
  summary: 'Os inimigos comuns com o selo da fraqueza, como na partida.',
  size: { cols: COLS, rows: ROWS, tile: TILE },
  panelHtml: PANEL_HTML,
  scene: CastScene,
};
