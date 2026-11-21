// Experimento "Elenco": protótipos de personagens para dar mais cara de alquimia e Idade Média. Compara o que
// existe hoje (linha de cima) com a proposta (linha de baixo). Abra /lab.html?exp=cast com `npm run dev`.
// Só desenho: nada aqui entra no jogo até ser aprovado (então vai para src/textures/, com os mesmos nomes de chave).
//
// Propostas:
//   1. Espírito do alambique: o fantasma vira um espírito de vapor que sai do gargalo de um frasco (alquimia: o que se
//      destila). A silhueta deixa de ser um lençol branco.
//   2. Gota de mercúrio: a gosma vira uma gota de prata-viva, com reflexos de metal e sem cara de gelatina.
//   3. Selo da fraqueza: um selinho com o glifo do elemento que fere o inimigo. Ensina a fraqueza só de olhar.
//      (Nada de ☿: o glifo do Mercúrio tem uma cruz, e a regra de fé veta cruz em inimigo.)
import Phaser from 'phaser';
import type { ElementId } from '../../config';
import { generateTextures } from '../../textures';
import { createMaker, type MakeFn } from '../../textures/make';
import type { LabExperiment } from '../types';

type Gfx = Phaser.GameObjects.Graphics;

const COLS = 12;
const ROWS = 6;
const TILE = 40;

// ---------------------------------------------------------------- 1. espírito do alambique
function spirit(g: Gfx, T: number, f: number): void {
  const c = T / 2;
  const OUT = 0x3d5a80;
  const dy = f === 0 ? 0 : 1; // o espírito sobe e desce um pixel
  const sx = f === 0 ? 1 : -1;
  g.fillStyle(0x000000, 0.25); g.fillEllipse(c, T - 3, 22, 5);
  // frasco de vidro: bojo, gargalo e boca
  g.fillStyle(0x2d4a5a); g.fillEllipse(c, 31, 22, 15); g.fillRect(c - 4, 16, 8, 13); g.fillRect(c - 6, 15, 12, 3);
  g.fillStyle(0xcfeaf5, 0.9); g.fillEllipse(c, 31, 20, 13); g.fillRect(c - 3, 17, 6, 12);
  g.fillStyle(0x7fd0e0); g.fillEllipse(c, 34, 18, 8); // o líquido no fundo
  g.fillStyle(0xeaffff); g.fillRect(c - 7, 28, 2, 4); // reflexo no vidro
  g.fillStyle(0xeaffff, 0.9); g.fillCircle(c - 3, 34, 1.2); g.fillCircle(c + 3, 35, 1); g.fillCircle(c + 1, 32, 0.8);
  // o vapor que sai do gargalo: rabo em S, corpo e cabeça
  g.fillStyle(OUT); g.fillCircle(c + sx, 17 + dy, 4.8); g.fillCircle(c - sx, 12 + dy, 7); g.fillCircle(c, 8 + dy, 9.4);
  g.fillStyle(0xe6f1fb); g.fillCircle(c + sx, 17 + dy, 3.8); g.fillCircle(c - sx, 12 + dy, 6); g.fillCircle(c, 8 + dy, 8.4);
  g.fillStyle(0xb7cfe6); g.fillEllipse(c + 4, 11 + dy, 5, 9); // sombra do lado direito
  // dois fiapos de braço
  g.fillStyle(OUT); g.fillEllipse(c - 10, 13 + dy, 6, 3.6); g.fillEllipse(c + 10, 13 + dy, 6, 3.6);
  g.fillStyle(0xe6f1fb); g.fillEllipse(c - 10, 13 + dy, 4.4, 2.2); g.fillEllipse(c + 10, 13 + dy, 4.4, 2.2);
  // rosto
  g.fillStyle(0x1f2a44); g.fillEllipse(c - 3.4, 8 + dy, 3.4, 4.6); g.fillEllipse(c + 3.4, 8 + dy, 3.4, 4.6);
  g.fillStyle(0xffffff); g.fillCircle(c - 3.9, 7 + dy, 0.9); g.fillCircle(c + 2.9, 7 + dy, 0.9);
  g.fillStyle(0x1f2a44); g.fillEllipse(c, 13 + dy, 3, 2.6);
}

// ---------------------------------------------------------------- 2. gota de mercúrio
function mercury(g: Gfx, T: number, f: number): void {
  const c = T / 2;
  const OUT = 0x2a3550;
  const ry = f === 0 ? 13 : 11; // respira: a gota estica e achata
  const tip = f === 0 ? 4 : 7;
  const cy = f === 0 ? 24 : 26;
  g.fillStyle(OUT, 0.45); g.fillEllipse(c, T - 4, 28, 6);
  g.fillStyle(0x93a3bd, 0.9); g.fillEllipse(c, T - 4, 24, 4);
  // gotinhas soltas
  for (const [x, y, r] of [[6, 33, 2.6], [34, 34, 2.1]] as const) {
    g.fillStyle(OUT); g.fillCircle(x, y, r + 1); g.fillStyle(0xaebbd0); g.fillCircle(x, y, r); g.fillStyle(0xffffff); g.fillRect(x - 1, y - 1, 1, 1);
  }
  // corpo em gota: contorno, prata, sombra de baixo e reflexos
  g.fillStyle(OUT); g.fillEllipse(c, cy, 27, ry * 2 + 2); g.fillTriangle(c, tip - 1, c - 8, cy - 4, c + 8, cy - 4);
  g.fillStyle(0xaebbd0); g.fillEllipse(c, cy, 25, ry * 2); g.fillTriangle(c, tip + 1, c - 7, cy - 4, c + 7, cy - 4);
  g.fillStyle(0x7686a3); g.fillEllipse(c + 4, cy + 5, 17, ry); // sombra
  g.fillStyle(0x56658a); g.fillEllipse(c, cy + ry - 2, 20, 4); // borda escura embaixo (metal)
  g.fillStyle(0xe3ebf7); g.fillRect(c + 8, cy - 3, 2, 7); // luz rebatida do lado
  g.fillStyle(0xffffff); g.fillRect(c - 9, cy - 8, 3, 8); g.fillRect(c - 8, cy - 11, 2, 2); // brilho de metal
  // olhos estreitos e frios
  g.fillStyle(0x1a2238); g.fillRect(c - 7, cy - 1, 5, 3); g.fillRect(c + 2, cy - 1, 5, 3);
  g.fillStyle(0xd9f3ff); g.fillRect(c - 6, cy - 1, 1, 1); g.fillRect(c + 3, cy - 1, 1, 1);
  g.fillStyle(0x1a2238); g.fillRect(c - 3, cy + 5, 6, 1);
}

// ---------------------------------------------------------------- 3. selo da fraqueza
// Glifos de 9 x 5 px: fogo e ar são triângulos para cima; água e terra, para baixo; ar e terra têm a barra.
const UP = ['....#....', '...###...', '..#####..', '.#######.', '#########'];
const DOWN = ['#########', '.#######.', '..#####..', '...###...', '....#....'];
const GLYPH: Record<ElementId, { rows: string[]; bar: number | null; color: number }> = {
  fire: { rows: UP, bar: null, color: 0xd6452f },
  water: { rows: DOWN, bar: null, color: 0x2f6fa8 },
  earth: { rows: DOWN, bar: 1, color: 0x4d7a2e },
  air: { rows: UP, bar: 3, color: 0x6b7b8c },
};
const BADGE = 15;

function drawBadge(g: Gfx, el: ElementId): void {
  const { rows, bar, color } = GLYPH[el];
  g.fillStyle(0x3a2a1a); g.fillCircle(BADGE / 2, BADGE / 2, BADGE / 2);
  g.fillStyle(0xf3e3b8); g.fillCircle(BADGE / 2, BADGE / 2, BADGE / 2 - 1);
  const ox = 3, oy = 5;
  // contorno escuro de 1 px em volta do triângulo, para ele se destacar do pergaminho
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch !== '#') return;
    g.fillStyle(0x2a1a0e);
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) g.fillRect(ox + x + dx, oy + y + dy, 1, 1);
  }));
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch !== '#') return;
    g.fillStyle(color);
    g.fillRect(ox + x, oy + y, 1, 1);
  }));
  // a barra do símbolo (terra e ar) atravessa o triângulo e passa das bordas
  if (bar !== null) { g.fillStyle(0x2a1a0e); g.fillRect(ox - 1, oy + bar, 11, 1); }
}

function buildTextures(scene: Phaser.Scene, make: MakeFn): void {
  make('proto_spirit', (g, T) => spirit(g, T, 0));
  make('proto_spirit_1', (g, T) => spirit(g, T, 1));
  make('proto_mercury', (g, T) => mercury(g, T, 0));
  make('proto_mercury_1', (g, T) => mercury(g, T, 1));
  const g = scene.make.graphics({}, false);
  for (const el of ['fire', 'water', 'earth', 'air'] as const) {
    g.clear();
    drawBadge(g, el);
    g.generateTexture(`proto_badge_${el}`, BADGE, BADGE);
  }
  g.destroy();
}

const PANEL_HTML = `
  <h2>Elenco: propostas</h2>
  <p class="tip">Em cima, o que existe hoje. Embaixo, a proposta. O palco é ampliado sem suavização.</p>
  <h2>O que muda</h2>
  <ul>
    <li><b>Fantasma</b> vira <b>Espírito do alambique</b>: vapor saindo do gargalo de um frasco.</li>
    <li><b>Gosma</b> vira <b>Gota de mercúrio</b>: prata-viva com reflexo de metal.</li>
    <li><b>Selo da fraqueza</b>: o glifo do elemento que fere o inimigo (△ fogo, ▽ água, ▽ com barra terra, △ com barra ar).</li>
  </ul>
  <p class="tip">Os nomes das chaves seriam os mesmos (<code>enemy_ghost</code>, <code>enemy_slime</code>), então o jogo, o Manuscrito e o Livro os pegariam sozinhos.</p>
`;

interface Pair { today: string; todayAlt: string | null; proto: string; protoAlt: string | null; weak: ElementId; label: string }

const PAIRS: Pair[] = [
  { today: 'enemy_ghost', todayAlt: null, proto: 'proto_spirit', protoAlt: 'proto_spirit_1', weak: 'water', label: 'espírito' },
  { today: 'enemy_slime', todayAlt: 'enemy_slime_1', proto: 'proto_mercury', protoAlt: 'proto_mercury_1', weak: 'earth', label: 'mercúrio' },
  { today: 'enemy', todayAlt: null, proto: 'enemy', protoAlt: null, weak: 'earth', label: 'sapo' },
  { today: 'enemy_lantern', todayAlt: null, proto: 'enemy_lantern', protoAlt: null, weak: 'water', label: 'lanterna' },
  { today: 'enemy_owl', todayAlt: 'enemy_owl_1', proto: 'enemy_owl', protoAlt: 'enemy_owl_1', weak: 'earth', label: 'coruja' },
];

class CastScene extends Phaser.Scene {
  private flip = 0;
  private movers: Array<{ img: Phaser.GameObjects.Image; a: string; b: string | null }> = [];

  constructor() {
    super('LabCast');
  }

  create(): void {
    generateTextures(this);
    buildTextures(this, createMaker(this).make);
    const w = COLS * TILE;
    const bg = this.add.graphics();
    bg.fillStyle(0x2c3b34); bg.fillRect(0, 0, w, ROWS * TILE);
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if ((x + y) % 2) { bg.fillStyle(0x33463d); bg.fillRect(x * TILE, y * TILE, TILE, TILE); }
    const style = { fontFamily: 'monospace', fontSize: '10px', color: '#f1e6d6' };
    this.add.text(4, 2, 'HOJE', style);
    this.add.text(4, 3 * TILE + 2, 'PROPOSTA (com selo da fraqueza)', style);
    PAIRS.forEach((p, i) => {
      const x = TILE + i * (TILE * 2) + TILE / 2;
      this.add.text(x - 20, 2 * TILE + 8, p.label, style).setAlpha(0.7);
      this.place(x, TILE * 1.5, p.today, p.todayAlt);
      const img = this.place(x, TILE * 4.5, p.proto, p.protoAlt);
      this.add.image(img.x + 15, img.y - 17, `proto_badge_${p.weak}`);
    });
    this.time.addEvent({ delay: 450, loop: true, callback: () => this.tick() });
  }

  private place(x: number, y: number, a: string, b: string | null): Phaser.GameObjects.Image {
    const img = this.add.image(x, y, a);
    this.movers.push({ img, a, b });
    return img;
  }

  private tick(): void {
    this.flip ^= 1;
    for (const m of this.movers) if (m.b) m.img.setTexture(this.flip ? m.b : m.a);
  }
}

export const castExperiment: LabExperiment = {
  id: 'cast',
  title: 'Elenco',
  summary: 'Propostas de personagens com mais cara de alquimia: espírito do alambique, gota de mercúrio e selo da fraqueza.',
  size: { cols: COLS, rows: ROWS, tile: TILE },
  panelHtml: PANEL_HTML,
  scene: CastScene,
};
