// Mapa do Vale das Fórmulas: um pergaminho com o caminho da história. No mapa do vale, cada
// capítulo longo (A Torre / Duelo, O Retorno) é um lugar só; ao tocá-lo, abre o mapa do capítulo
// com as fases dele. Mostra o que já foi vencido, onde a Roo está e o que ainda está selado.
// Cada mapa tem o seu papel: o do vale é pergaminho; ao entrar num capítulo, o fundo muda (charneca com
// névoa, pedra fria da Torre, jardim do mosteiro). Fases e capítulos: game/stages (STAGES, CHAPTERS, CHAPTER_LIST).
import Phaser from 'phaser';
import { CANVAS } from '../config';
import { readTheme } from '../ui/theme';
import { isStageCompleted } from '../storage';
import { setMenuVisible } from '../ui/menu';
import { currentStage as nextStage, isStageUnlocked as unlocked } from '../game/stages/mapRules';
import { CHAPTERS, CHAPTER_LIST, LAST_STAGE, STAGES } from '../game/stages/index';
import { ChapterDef } from '../game/stages/types';
import { SEALED_MESSAGE, UPCOMING_CHAPTERS, UpcomingChapter } from '../game/stages/upcoming';
import { voynichLines } from '../game/voynich';

const isUnlocked = (stage: number): boolean => unlocked(stage, isStageCompleted);

// Cores do pergaminho (só deste mapa; o restante do jogo usa as variáveis CSS).
const INK = 0x3a2814;
const INK_CSS = '#3a2814';
const INK_SOFT_CSS = '#6b5232';
const GOLD_CSS = '#9a6416';
const PARCH = 0xe8d6a8;
const PARCH_DARK = 0xcfb782;
const SEAL = 0x7a2f22;

// Papel de cada mapa. O pergaminho do vale é o padrão; cada capítulo troca a cor e o desenho de fundo.
// A tinta (INK) é a mesma em todos, para o texto ler igual. Os desenhos são blocos de pixels inteiros.
type MapPattern = 'parchment' | 'moor' | 'stone' | 'garden';
interface MapLook { paper: number; paperDark: number; pattern: MapPattern; mark: number; markLight: number }
const LOOKS: Record<string, MapLook> = {
  world: { paper: PARCH, paperDark: PARCH_DARK, pattern: 'parchment', mark: 0x8c9a5b, markLight: 0xbfa874 },
  vale: { paper: 0xdad8ae, paperDark: 0xb4b182, pattern: 'moor', mark: 0x7f9a5a, markLight: 0xf4f3dc },
  torre: { paper: 0xc2c8d4, paperDark: 0x959fb4, pattern: 'stone', mark: 0x6b7388, markLight: 0xe4e8f0 },
  retorno: { paper: 0xd8e3b6, paperDark: 0xaac488, pattern: 'garden', mark: 0x5f9a4a, markLight: 0xf4e6c0 },
};
// Ícone do lugar de cada capítulo no mapa do vale.
const CHAPTER_ICON: Record<string, string> = { vale: 'lab', torre: 'boss', retorno: 'garden' };

// Número pseudo-aleatório fixo por posição: o fundo é o mesmo toda vez que o mapa abre.
function hash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// Um lugar do mapa: uma fase, ou um capítulo inteiro (no mapa do vale).
interface Spot { stage: number; x: number; y: number; chapter?: ChapterDef; upcoming?: UpcomingChapter }

// Posição de cada lugar, em fração do canvas: zigue-zague da esquerda para a direita, qualquer que
// seja a quantidade de lugares (o mapa do vale tem um por capítulo; o de um capítulo, um por fase).
function zigzag(i: number, n: number): { fx: number; fy: number } {
  const fx = n === 1 ? 0.5 : 0.13 + (i * 0.67) / (n - 1); // margem para os rótulos largos nas pontas
  return { fx, fy: i % 2 === 0 ? 0.64 : 0.42 };
}

const chapterById = (id: string): ChapterDef | undefined => CHAPTERS.find(c => c.id === id);

export class MapScene extends Phaser.Scene {
  spots: Spot[] = [];
  private chapter: ChapterDef | null = null; // null = mapa do vale
  private toast?: Phaser.GameObjects.Text;

  private get look(): MapLook {
    return LOOKS[this.chapter?.id ?? 'world'] ?? LOOKS.world;
  }

  constructor() {
    super('Map');
  }

  init(data?: { chapter?: string }): void {
    this.chapter = data?.chapter ? chapterById(data.chapter) ?? null : null;
  }

  create(): void {
    const w = CANVAS.width;
    const h = CANVAS.height;
    const theme = readTheme();
    this.cameras.main.setBackgroundColor('#2a1d10');
    this.spots = this.buildSpots();

    const g = this.add.graphics().setDepth(0);
    this.drawParchment(g, w, h);
    this.drawScenery(g, w, h);
    this.drawPaths(g);

    const title = this.chapter ? this.chapter.name : 'VALE DAS FÓRMULAS';
    const sub = this.chapter
      ? `${this.chapter.place}: quatro fases, e a última é o chefe ou o desfecho`
      : 'Do Caldeirão ao Mosteiro de São Tomás, e dois capítulos ainda selados';
    this.add.text(w / 2, h * 0.085, title, {
      fontFamily: theme.fontDisplay, fontSize: '30px', color: INK_CSS, fontStyle: '700',
    }).setOrigin(0.5).setDepth(10);
    this.add.text(w / 2, h * 0.085 + 28, sub, {
      fontFamily: theme.fontBody, fontSize: '13px', color: INK_SOFT_CSS, fontStyle: 'italic',
    }).setOrigin(0.5).setDepth(10);

    const now = nextStage(isStageCompleted);
    this.spots.forEach(spot => this.buildSpot(spot, this.containsStage(spot, now), theme));
    this.buildTokens(now);
    this.buildFooter(w, h, theme);
    this.bindKeys();
  }

  // ---------- lugares e capítulos ----------

  // Lugares da tela atual: no mapa do vale, duas fases e dois capítulos; num capítulo, as fases dele.
  private buildSpots(): Spot[] {
    const at = (i: number, n: number): { x: number; y: number } => {
      const p = zigzag(i, n);
      return { x: p.fx * CANVAS.width, y: p.fy * CANVAS.height };
    };
    if (this.chapter) {
      const c = this.chapter;
      const n = c.last - c.first + 1;
      return Array.from({ length: n }, (_, i) => ({ stage: c.first + i, ...at(i, n) }));
    }
    // vale: um lugar por capítulo agrupado e um por fase dos capítulos soltos
    const items: Array<Omit<Spot, 'x' | 'y'>> = [];
    let stage = 1;
    for (const spec of CHAPTER_LIST) {
      const chapter = spec.grouped ? CHAPTERS.find(c => c.id === spec.id) : undefined;
      if (chapter) items.push({ stage: chapter.first, chapter });
      else spec.stages.forEach((_, i) => items.push({ stage: stage + i }));
      stage += spec.stages.length;
    }
    // capítulos ainda selados: aparecem no fim do caminho, sem fases (stage 0) e sem acesso
    for (const upcoming of UPCOMING_CHAPTERS) items.push({ stage: 0, upcoming });
    return items.map((it, i) => ({ ...it, ...at(i, items.length) }));
  }

  // Um lugar contém a fase? (um capítulo contém as fases dele)
  private containsStage(spot: Spot, stage: number): boolean {
    if (spot.upcoming) return false;
    if (spot.chapter) return stage >= spot.chapter.first && stage <= spot.chapter.last;
    return spot.stage === stage;
  }

  private spotDone(spot: Spot): boolean {
    if (spot.upcoming) return false;
    if (!spot.chapter) return isStageCompleted(spot.stage);
    for (let s = spot.chapter.first; s <= spot.chapter.last; s++) if (!isStageCompleted(s)) return false;
    return true;
  }

  private spotOpen(spot: Spot): boolean {
    if (spot.upcoming) return false;
    return isUnlocked(spot.stage);
  }

  // ---------- desenho ----------

  private drawParchment(g: Phaser.GameObjects.Graphics, w: number, h: number): void {
    g.fillStyle(0x2a1d10, 1).fillRect(0, 0, w, h);
    const look = this.look;
    g.fillStyle(look.paper, 1).fillRoundedRect(10, 10, w - 20, h - 20, 10);
    this.drawPattern(g, w, h, look);
    // bordas escurecidas, como papel envelhecido
    for (let i = 0; i < 7; i++) {
      g.lineStyle(7, look.paperDark, 0.1 + i * 0.03).strokeRoundedRect(12 + i * 5, 12 + i * 5, w - 24 - i * 10, h - 24 - i * 10, 8);
    }
    g.lineStyle(3, INK, 0.9).strokeRoundedRect(20, 20, w - 40, h - 40, 6);
    g.lineStyle(1, INK, 0.7).strokeRoundedRect(26, 26, w - 52, h - 52, 4);
    // cantoneiras
    for (const [cx, cy] of [[26, 26], [w - 26, 26], [26, h - 26], [w - 26, h - 26]]) {
      g.fillStyle(SEAL, 1).fillCircle(cx, cy, 5);
      g.lineStyle(1, INK, 0.8).strokeCircle(cx, cy, 5);
    }
    // rosa dos ventos
    const rx = w - 56, ry = h - 84;
    g.lineStyle(1.5, INK, 0.8).strokeCircle(rx, ry, 20);
    g.fillStyle(INK, 0.85);
    g.fillTriangle(rx, ry - 30, rx - 6, ry, rx + 6, ry);
    g.fillStyle(INK, 0.45);
    g.fillTriangle(rx, ry + 30, rx - 6, ry, rx + 6, ry);
    g.fillTriangle(rx - 30, ry, rx, ry - 6, rx, ry + 6);
    g.fillTriangle(rx + 30, ry, rx, ry - 6, rx, ry + 6);
    this.add.text(rx, ry - 38, 'N', { fontFamily: 'Cinzel, serif', fontSize: '13px', color: INK_CSS, fontStyle: '700' })
      .setOrigin(0.5).setDepth(10);
  }

  // Textura do papel de cada mapa, em blocos de pixels (sem degradê).
  private drawPattern(g: Phaser.GameObjects.Graphics, w: number, h: number, look: MapLook): void {
    const x0 = 14, y0 = 14, x1 = w - 14, y1 = h - 14;
    if (look.pattern === 'stone') {
      // tijolos de pedra fria, em fileiras deslocadas
      const bw = 56, bh = 28;
      for (let row = 0, y = y0; y < y1; row++, y += bh) {
        const off = row % 2 === 0 ? 0 : bw / 2;
        for (let x = x0 - off; x < x1; x += bw) {
          const r = hash(Math.floor(x), row);
          const bx = Math.max(x0, x), bwid = Math.min(x1, x + bw) - bx, bhei = Math.min(bh, y1 - y);
          if (bwid <= 0 || bhei <= 0) continue;
          g.fillStyle(r < 0.5 ? look.paperDark : 0xffffff, r < 0.5 ? 0.18 * (0.5 + r) : 0.12 * r).fillRect(bx, y, bwid, bhei);
          g.fillStyle(INK, 0.16).fillRect(bx, y, bwid, 2).fillRect(bx, y, 2, bhei);
        }
      }
    } else if (look.pattern === 'moor') {
      // faixas de névoa em degraus, tufos de capim e flores de urze
      for (let y = y0 + 40; y < y1; y += 76) {
        for (let x = x0; x < x1; x += 8) {
          const step = Math.round(Math.sin(x / 70 + y / 40) * 2) * 4;
          g.fillStyle(look.markLight, 0.32).fillRect(x, y + step, 8, 8);
          g.fillStyle(look.markLight, 0.16).fillRect(x, y + step + 8, 8, 8);
        }
      }
      for (let y = y0 + 8; y < y1; y += 24) {
        for (let x = x0 + 8; x < x1; x += 24) {
          const r = hash(x, y);
          if (r > 0.34) continue;
          g.fillStyle(look.mark, 0.5).fillRect(x, y, 2, 6).fillRect(x + 4, y + 2, 2, 4).fillRect(x - 4, y + 2, 2, 4);
          if (r < 0.08) g.fillStyle(0x9a6aa0, 0.7).fillRect(x + 8, y - 2, 4, 4);
        }
      }
    } else if (look.pattern === 'garden') {
      // treliça de folhas pequenas e uma videira em cada borda
      for (let y = y0 + 6; y < y1; y += 28) {
        for (let x = x0 + 6; x < x1; x += 28) {
          const odd = (Math.floor(y / 28) + Math.floor(x / 28)) % 2 === 0;
          const r = hash(x, y);
          g.fillStyle(look.mark, odd ? 0.3 : 0.2).fillRect(x, y, 6, 4).fillRect(x + 6, y + 4, 6, 4);
          if (r < 0.1) g.fillStyle(0xe8836a, 0.7).fillRect(x + 14, y + 12, 4, 4).fillStyle(0xf5e6c0, 0.9).fillRect(x + 15, y + 13, 2, 2);
        }
      }
    }
  }

  // Diagrama circular de astros, como os dos manuscritos astronômicos: anéis, raios e estrelas.
  private drawCelestialDiagram(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
    g.lineStyle(1.5, INK, 0.55);
    for (const r of [30, 21, 11]) g.strokeCircle(cx, cy, r);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      g.beginPath().moveTo(cx + Math.cos(a) * 11, cy + Math.sin(a) * 11).lineTo(cx + Math.cos(a) * 30, cy + Math.sin(a) * 30).strokePath();
    }
    g.fillStyle(0xc9812a, 0.8).fillCircle(cx, cy, 5);
    g.fillStyle(SEAL, 0.75);
    for (const a of [0.4, 1.9, 3.5, 5.0]) g.fillCircle(cx + Math.cos(a) * 25.5, cy + Math.sin(a) * 25.5, 2.6);
  }

  // Cenário de um capítulo: charneca com pedras de pé, torre ao fundo, ou sebes e flores.
  private drawChapterScenery(g: Phaser.GameObjects.Graphics, w: number, h: number): void {
    const look = this.look;
    const free = (x: number, y: number, r = 70): boolean =>
      !this.spots.some(s => Math.abs(s.x - x) < r && y > s.y - 60 && y < s.y + 95) && !(x > w - 120 && y > h - 170) && y < h - 120;
    if (look.pattern === 'stone') {
      // torre ao fundo, no alto à direita, com ameias e uma janela acesa
      const tx = w * 0.91, ty = h * 0.1;
      g.fillStyle(look.mark, 0.85).fillRect(tx - 24, ty - 10, 48, 150);
      g.fillStyle(look.mark, 0.85).fillRect(tx - 28, ty - 26, 12, 18).fillRect(tx - 6, ty - 26, 12, 18).fillRect(tx + 16, ty - 26, 12, 18);
      g.lineStyle(2, INK, 0.7).strokeRect(tx - 24, ty - 10, 48, 150);
      g.fillStyle(0xf0c674, 0.95).fillRect(tx - 5, ty + 16, 10, 16);
      g.fillStyle(INK, 0.5).fillRect(tx - 10, ty + 70, 20, 30);
      // colunas quebradas
      for (const [fx, fy] of [[0.1, 0.34], [0.32, 0.28], [0.55, 0.3], [0.7, 0.62], [0.12, 0.78], [0.5, 0.8]]) {
        const x = fx * w, y = fy * h;
        if (!free(x, y)) continue;
        g.fillStyle(look.markLight, 0.9).fillRect(x - 6, y - 8, 12, 22);
        g.lineStyle(1.5, INK, 0.6).strokeRect(x - 6, y - 8, 12, 22);
        g.fillStyle(look.paperDark, 1).fillRect(x - 6, y - 8, 12, 4);
      }
    } else if (look.pattern === 'moor') {
      // colinas baixas e pedras de pé na charneca; árvores secas
      for (const [fx, fy, s] of [[0.62, 0.24, 120], [0.84, 0.14, 70], [0.15, 0.3, 90]] as Array<[number, number, number]>) {
        const x = fx * w, y = fy * h;
        g.fillStyle(look.mark, 0.4).fillEllipse(x, y, s * 1.6, s * 0.5);
        g.lineStyle(1.5, INK, 0.45).strokeEllipse(x, y, s * 1.6, s * 0.5);
      }
      for (const [fx, fy] of [[0.08, 0.5], [0.3, 0.34], [0.52, 0.34], [0.46, 0.78], [0.62, 0.8], [0.9, 0.62], [0.2, 0.84]]) {
        const x = fx * w, y = fy * h;
        if (!free(x, y)) continue;
        g.fillStyle(INK, 0.75).fillRect(x - 6, y - 14, 12, 26);
        g.fillStyle(look.markLight, 0.5).fillRect(x - 4, y - 12, 4, 8);
        g.fillStyle(INK, 0.85).fillRect(x - 9, y + 12, 18, 3);
      }
    } else {
      // sebes e canteiros de flores ao longo do caminho
      for (const [fx, fy] of [[0.07, 0.5], [0.12, 0.34], [0.3, 0.32], [0.5, 0.34], [0.56, 0.46], [0.74, 0.6], [0.92, 0.6], [0.34, 0.8], [0.6, 0.82], [0.2, 0.84], [0.76, 0.3], [0.9, 0.34]]) {
        const x = fx * w, y = fy * h;
        if (!free(x, y, 60)) continue;
        g.fillStyle(look.mark, 0.95).fillRect(x - 14, y - 4, 28, 14).fillRect(x - 10, y - 8, 20, 6);
        g.lineStyle(1.5, INK, 0.6).strokeRect(x - 14, y - 4, 28, 14);
        g.fillStyle(0xe8836a, 1).fillRect(x - 8, y - 6, 4, 4).fillRect(x + 4, y - 2, 4, 4);
        g.fillStyle(0xf5e6c0, 1).fillRect(x - 1, y - 8, 4, 4);
      }
    }
  }

  // Serra ao fundo e pinheiros: só enfeite, longe dos caminhos.
  private drawScenery(g: Phaser.GameObjects.Graphics, w: number, h: number): void {
    if (this.chapter) { this.drawChapterScenery(g, w, h); return; }
    this.drawCelestialDiagram(g, w * 0.12, h * 0.22);
    // serra (canto superior direito)
    g.lineStyle(2, INK, 0.7);
    const peaks: Array<[number, number, number]> = [[0.80, 0.25, 56], [0.88, 0.2, 66], [0.95, 0.27, 48]];
    for (const [fx, fy, s] of peaks) {
      const x = fx * w, y = fy * h;
      g.fillStyle(0xbfa874, 0.9).fillTriangle(x - s / 1.6, y + s / 2, x, y - s / 2, x + s / 1.6, y + s / 2);
      g.strokeTriangle(x - s / 1.6, y + s / 2, x, y - s / 2, x + s / 1.6, y + s / 2);
      g.fillStyle(PARCH, 0.95).fillTriangle(x - s / 6, y - s / 2 + s / 4, x, y - s / 2, x + s / 6, y - s / 2 + s / 4);
    }
    // pinheiros
    const trees: Array<[number, number]> = [
      [0.07, 0.50], [0.11, 0.42], [0.27, 0.36], [0.31, 0.30], [0.52, 0.36], [0.56, 0.44], [0.48, 0.62],
      [0.72, 0.60], [0.93, 0.62], [0.90, 0.72], [0.34, 0.66], [0.26, 0.58], [0.10, 0.80], [0.68, 0.50], [0.76, 0.78],
      [0.45, 0.78], [0.60, 0.82], [0.20, 0.84], [0.32, 0.84], [0.09, 0.30], [0.62, 0.28], [0.88, 0.62]
    ];
    for (const [fx, fy] of trees) {
      const x = fx * w, y = fy * h;
      // sem árvore em cima dos lugares, dos rótulos ou da rosa dos ventos
      if (this.spots.some(s => Math.abs(s.x - x) < 70 && y > s.y - 60 && y < s.y + 95)) continue;
      if (x > w - 120 && y > h - 170) continue;
      if (y > h - 120) continue; // faixa do rodapé (dica e botão)
      g.fillStyle(0x8c9a5b, 0.95).fillTriangle(x - 8, y + 4, x, y - 14, x + 8, y + 4);
      g.fillTriangle(x - 10, y + 12, x, y - 6, x + 10, y + 12);
      g.fillStyle(INK, 0.8).fillRect(x - 1.5, y + 12, 3, 5);
      g.lineStyle(1, INK, 0.6).strokeTriangle(x - 10, y + 12, x, y - 6, x + 10, y + 12);
    }
  }

  // Caminho pontilhado entre os lugares: cheio e vermelho onde a Roo já passou, apagado adiante.
  private drawPaths(g: Phaser.GameObjects.Graphics): void {
    for (let i = 0; i < this.spots.length - 1; i++) {
      const a = this.spots[i], b = this.spots[i + 1];
      const done = this.spotDone(a);
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const nx = -(b.y - a.y), ny = b.x - a.x;
      const len = Math.hypot(nx, ny) || 1;
      const bend = (i % 2 === 0 ? 1 : -1) * 38;
      const ctrl = new Phaser.Math.Vector2(mx + (nx / len) * bend, my + (ny / len) * bend);
      const curve = new Phaser.Curves.QuadraticBezier(
        new Phaser.Math.Vector2(a.x, a.y), ctrl, new Phaser.Math.Vector2(b.x, b.y),
      );
      const pts = curve.getSpacedPoints(Math.max(8, Math.floor(curve.getLength() / 12)));
      g.fillStyle(done ? SEAL : INK, done ? 0.9 : 0.4);
      pts.forEach((p) => {
        if (Phaser.Math.Distance.Between(p.x, p.y, a.x, a.y) > 34 && Phaser.Math.Distance.Between(p.x, p.y, b.x, b.y) > 34) {
          g.fillCircle(p.x, p.y, done ? 2.8 : 2.2);
        }
      });
    }
  }

  // ---------- lugares (desenho) ----------

  private buildSpot(spot: Spot, isCurrent: boolean, theme: ReturnType<typeof readTheme>): void {
    const c = spot.chapter;
    const up = spot.upcoming;
    const def = STAGES[spot.stage - 1];
    const done = this.spotDone(spot);
    const open = this.spotOpen(spot);
    const kind = up ? up.icon : c ? (CHAPTER_ICON[c.id] ?? 'garden') : def.kind;
    const name = up ? up.name : c ? c.name : def.name;
    // o lugar selado aparece em escrita ilegível, como num manuscrito que ninguém decifra
    const place = up ? voynichLines(up.id, 1, 3)[0] : c ? c.place : def.place;
    const { x, y } = spot;
    const R = 34;
    const dim = up ? 0.55 : open ? 1 : 0.62;

    const g = this.add.graphics().setDepth(4).setAlpha(dim);
    g.fillStyle(0x000000, 0.18).fillEllipse(x + 3, y + R - 4, R * 2, 14);
    g.fillStyle(PARCH, 1).fillCircle(x, y, R);
    g.lineStyle(3, INK, 1).strokeCircle(x, y, R);
    g.lineStyle(1, INK, 0.7).strokeCircle(x, y, R - 5);
    this.drawIcon(g, kind, x, y);

    // número da fase, ou faixa de fases do capítulo, em um selo de cera
    const badge = up ? '?' : c ? `${c.first}–${c.last}` : String(spot.stage);
    g.fillStyle(SEAL, 1).fillCircle(x - R + 4, y - R + 4, 11);
    g.lineStyle(1.5, INK, 0.9).strokeCircle(x - R + 4, y - R + 4, 11);
    this.add.text(x - R + 4, y - R + 4, badge, {
      fontFamily: theme.fontDisplay, fontSize: c ? '9px' : '14px', color: '#f5e6c0', fontStyle: '700',
    }).setOrigin(0.5).setDepth(6);

    // nome e lugar
    const label = this.add.text(x, y + R + 10, name, {
      fontFamily: theme.fontDisplay, fontSize: '14px', color: INK_CSS, fontStyle: '700', align: 'center', wordWrap: { width: 150 },
    }).setOrigin(0.5, 0).setDepth(6).setAlpha(dim);
    this.add.text(x, label.y + label.height + 2, place, {
      fontFamily: theme.fontBody, fontSize: '12px', color: INK_SOFT_CSS, fontStyle: 'italic',
    }).setOrigin(0.5, 0).setDepth(6).setAlpha(dim);

    if (done) {
      // selo de "vencida"
      const m = this.add.graphics().setDepth(7);
      m.fillStyle(0x3f7a3a, 1).fillCircle(x + R - 4, y - R + 4, 11);
      m.lineStyle(1.5, INK, 0.9).strokeCircle(x + R - 4, y - R + 4, 11);
      m.lineStyle(3, 0xf5e6c0, 1).beginPath()
        .moveTo(x + R - 9, y - R + 4).lineTo(x + R - 5, y - R + 8).lineTo(x + R + 2, y - R - 1).strokePath();
    } else if (!open) {
      // cadeado
      const l = this.add.graphics().setDepth(7);
      l.fillStyle(INK, 0.9).fillRoundedRect(x - 8, y - 4, 16, 13, 2);
      l.lineStyle(3, INK, 0.9).beginPath().arc(x, y - 4, 5.5, Math.PI, 0).strokePath();
      l.fillStyle(PARCH, 1).fillCircle(x, y + 2.5, 2);
    }

    if (isCurrent) {
      const ring = this.add.circle(x, y, R + 6).setStrokeStyle(3, 0xc9812a, 1).setDepth(3);
      this.tweens.add({ targets: ring, scale: { from: 1, to: 1.14 }, alpha: { from: 1, to: 0.25 }, duration: 1100, yoyo: true, repeat: -1 });
    }

    const hit = this.add.circle(x, y, R + 8, 0x000000, 0.001).setDepth(8).setInteractive({ useHandCursor: open });
    hit.on('pointerover', () => label.setColor(GOLD_CSS));
    hit.on('pointerout', () => label.setColor(INK_CSS));
    hit.on('pointerdown', () => this.activate(spot));
  }

  // Ícone de cada lugar, desenhado em formas simples.
  private drawIcon(g: Phaser.GameObjects.Graphics, kind: string, x: number, y: number): void {
    g.lineStyle(1.5, INK, 1);
    if (kind === 'lab') {
      // caldeirão sobre a chama, com bolhas
      g.fillStyle(0xe98b2d, 1).fillTriangle(x - 7, y + 17, x, y + 6, x + 7, y + 17);
      g.fillStyle(0x34303a, 1).fillEllipse(x, y + 4, 30, 22);
      g.strokeEllipse(x, y + 4, 30, 22);
      g.fillStyle(0x4fdc8a, 1).fillEllipse(x, y - 5, 24, 7);
      g.strokeEllipse(x, y - 5, 24, 7);
      g.fillStyle(0x9ff5c0, 1).fillCircle(x - 4, y - 12, 2.5).fillCircle(x + 5, y - 15, 2);
    } else if (kind === 'crypt') {
      // salão de arcos
      g.fillStyle(0x8f8f9c, 1).fillRect(x - 16, y - 12, 32, 28);
      g.strokeRect(x - 16, y - 12, 32, 28);
      g.fillStyle(0x2a2a38, 1);
      for (const ax of [x - 10, x, x + 10]) {
        g.fillRect(ax - 3.5, y - 1, 7, 17);
        g.fillCircle(ax, y - 1, 3.5);
      }
      g.fillStyle(0xdfe2ea, 0.9).fillCircle(x, y - 17, 3);
    } else if (kind === 'boss') {
      // torre de Belladona, com telhado pontudo e janela acesa
      g.fillStyle(0x6c5a8c, 1).fillRect(x - 9, y - 8, 18, 26);
      g.strokeRect(x - 9, y - 8, 18, 26);
      g.fillStyle(0x4a3a6c, 1).fillTriangle(x - 13, y - 8, x, y - 26, x + 13, y - 8);
      g.strokeTriangle(x - 13, y - 8, x, y - 26, x + 13, y - 8);
      g.fillStyle(0xf0c674, 1).fillRect(x - 2.5, y - 2, 5, 8);
      g.fillStyle(0xf0c674, 1).fillCircle(x, y - 28, 2);
    } else if (kind === 'library') {
      // estante de livros, acorrentada
      g.fillStyle(0x6b4a30, 1).fillRect(x - 17, y - 15, 34, 31);
      g.strokeRect(x - 17, y - 15, 34, 31);
      const books = [0x8c3b52, 0x3a6a8c, 0xc9812a, 0x4d8a7a, 0x7a2f22, 0xd9a21b, 0x6b5232];
      for (const [row, top] of [[0, y - 14], [1, y - 3], [2, y + 8]] as Array<[number, number]>) {
        for (let i = 0; i < 7; i++) g.fillStyle(books[(i + row * 2) % books.length], 1).fillRect(x - 15 + i * 4.4, top + (i % 3), 4, 8 - (i % 3));
        g.lineStyle(1.5, INK, 1).beginPath().moveTo(x - 17, top + 9).lineTo(x + 17, top + 9).strokePath();
      }
      g.lineStyle(2.5, 0x2a2a38, 1).beginPath().moveTo(x - 17, y - 8).lineTo(x + 17, y + 8).strokePath();
      g.lineStyle(2.5, 0x2a2a38, 1).beginPath().moveTo(x - 17, y + 8).lineTo(x + 17, y - 8).strokePath();
    } else if (kind === 'observatory') {
      // cúpula com fenda e um astrolábio
      g.fillStyle(0x7a86a8, 1).fillRect(x - 16, y + 3, 32, 14);
      g.strokeRect(x - 16, y + 3, 32, 14);
      g.fillStyle(0x56648a, 1).beginPath().arc(x, y + 3, 16, Math.PI, 0, false).closePath().fillPath();
      g.beginPath().arc(x, y + 3, 16, Math.PI, 0, false).strokePath();
      g.fillStyle(0x1c2238, 1).fillRect(x - 2.5, y - 13, 5, 16);
      g.fillStyle(0xe8c36a, 1).fillCircle(x + 15, y - 14, 8);
      g.strokeCircle(x + 15, y - 14, 8);
      g.lineStyle(1, INK, 1).strokeCircle(x + 15, y - 14, 4.5);
      g.beginPath().moveTo(x + 15, y - 22).lineTo(x + 15, y - 6).moveTo(x + 7, y - 14).lineTo(x + 23, y - 14).strokePath();
      g.fillStyle(INK, 0.8).fillCircle(x - 18, y - 18, 1.5).fillCircle(x - 9, y - 22, 1.5).fillCircle(x + 2, y - 24, 1.5);
    } else {
      // mosteiro com cruz e pórtico
      g.fillStyle(0xc9b48a, 1).fillRect(x - 17, y - 4, 34, 20);
      g.strokeRect(x - 17, y - 4, 34, 20);
      g.fillStyle(0x7a5538, 1).fillTriangle(x - 20, y - 4, x, y - 17, x + 20, y - 4);
      g.strokeTriangle(x - 20, y - 4, x, y - 17, x + 20, y - 4);
      g.fillStyle(0x3a2814, 1).fillRect(x - 4, y + 4, 8, 12);
      g.fillCircle(x, y + 4, 4);
      g.fillStyle(0xb9833f, 1).fillRect(x - 1, y - 27, 2, 11).fillRect(x - 4, y - 24, 8, 2);
    }
  }

  // Roo na fase atual e frei Anselmo no mosteiro.
  private buildTokens(now: number): void {
    const cur = this.spots.find(s => this.containsStage(s, now));
    if (cur && this.textures.exists('roo_down_0')) {
      const roo = this.add.image(cur.x - 38, cur.y + 6, 'roo_down_0').setScale(0.9).setOrigin(0.5, 0.85).setDepth(9);
      this.tweens.add({ targets: roo, y: roo.y - 5, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    const last = this.spots.find(s => this.containsStage(s, LAST_STAGE));
    if (last && this.textures.exists('anselmo_front_0') && now !== LAST_STAGE) {
      this.add.image(last.x + 38, last.y + 6, 'anselmo_front_0').setScale(0.9).setOrigin(0.5, 0.85).setDepth(9);
    }
  }

  private buildFooter(w: number, h: number, theme: ReturnType<typeof readTheme>): void {
    const back = this.chapter ? 'VOLTAR AO VALE' : 'VOLTAR AO MENU';
    const btn = this.add.rectangle(w * 0.5, h - 52, 180, 38, 0x3a2814, 0.92)
      .setStrokeStyle(2, 0x9a6416, 1).setInteractive({ useHandCursor: true }).setDepth(9);
    const label = this.add.text(w * 0.5, h - 52, back, {
      fontFamily: theme.fontBody, fontSize: '14px', color: '#f1e6c9', fontStyle: '700',
    }).setOrigin(0.5).setDepth(10);
    btn.on('pointerdown', () => (this.chapter ? this.openWorld() : this.backToMenu()));
    btn.on('pointerover', () => label.setColor('#f0c674'));
    btn.on('pointerout', () => label.setColor('#f1e6c9'));

    this.add.text(w / 2, h - 84, `Toque num lugar, ou use as teclas 1 a ${this.spots.length}. Enter entra na fase marcada.`, {
      fontFamily: theme.fontBody, fontSize: '12px', color: INK_SOFT_CSS, fontStyle: 'italic',
    }).setOrigin(0.5).setDepth(10);

    this.toast = this.add.text(w / 2, h * 0.19, '', {
      fontFamily: theme.fontBody, fontSize: '14px', color: '#f5e6c0', fontStyle: '700',
      backgroundColor: '#7a2f22', padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setDepth(20).setAlpha(0);
  }

  private bindKeys(): void {
    // guardados para remover ao sair: senão cada visita soma um atalho a mais
    const now = nextStage(isStageCompleted);
    const keys: Array<[string, () => void]> = [
      ['keydown-ESC', () => (this.chapter ? this.openWorld() : this.backToMenu())],
      ['keydown-ENTER', () => this.enterCurrent(now)],
      ['keydown-ONE', () => this.activateIndex(0)],
      ['keydown-TWO', () => this.activateIndex(1)],
      ['keydown-THREE', () => this.activateIndex(2)],
      ['keydown-FOUR', () => this.activateIndex(3)],
      ['keydown-FIVE', () => this.activateIndex(4)],
    ];
    for (const [event, fn] of keys) this.input.keyboard?.on(event, fn);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const [event, fn] of keys) this.input.keyboard?.off(event, fn);
    });
  }

  // ---------- navegação ----------

  private activateIndex(i: number): void {
    const spot = this.spots[i];
    if (spot) this.activate(spot);
  }

  // Enter: entra na fase da Roo (no mapa do vale, abre o capítulo dela).
  private enterCurrent(now: number): void {
    if (this.chapter) {
      if (this.containsStage(this.spotOf(now), now)) this.tryLoad(now);
      return;
    }
    const spot = this.spotOf(now);
    if (spot.chapter) this.openChapter(spot.chapter.id);
    else this.tryLoad(now);
  }

  private spotOf(stage: number): Spot {
    return this.spots.find(s => this.containsStage(s, stage)) ?? this.spots[0];
  }

  private activate(spot: Spot): void {
    if (spot.upcoming) {
      this.showToast(SEALED_MESSAGE);
      return;
    }
    if (spot.chapter) {
      if (this.spotOpen(spot)) this.openChapter(spot.chapter.id);
      else this.showToast(`Selado. Vença ${STAGES[spot.stage - 2]?.name ?? ''} primeiro.`);
      return;
    }
    this.tryLoad(spot.stage);
  }

  private openChapter(id: string): void {
    this.scene.restart({ chapter: id });
  }

  private openWorld(): void {
    this.scene.restart({});
  }

  private tryLoad(stage: number): void {
    if (!isUnlocked(stage)) {
      const need = STAGES[stage - 2]?.name ?? '';
      this.showToast(`Selado. Vença ${need} primeiro.`);
      return;
    }
    this.loadStage(stage);
  }

  private showToast(msg: string): void {
    if (!this.toast) return;
    this.toast.setText(msg).setAlpha(1);
    this.tweens.killTweensOf(this.toast);
    this.tweens.add({ targets: this.toast, alpha: 0, delay: 1400, duration: 500 });
  }

  private loadStage(stage: number): void {
    const game = this.game;
    setMenuVisible(false);
    game.scene.stop('Map');
    game.scene.stop('Menu');
    game.scene.start('Main', { stage });
  }

  // Volta ao menu: a cena do menu e o menu em DOM precisam voltar juntos.
  private backToMenu(): void {
    const game = this.game;
    game.scene.stop('Map');
    game.scene.start('Menu');
    setMenuVisible(true);
  }
}
