// Cena do menu principal: o laboratório à luz de vela, com a Roo lendo um livro (a página vira de tempos em tempos),
// uma estante de livros e um alambique funcionando (a chama sob o frasco, as bolhas, o vapor e as gotas que caem no
// frasco coletor). O título e os botões são DOM (por cima do canvas, ver #menu em index.html).
//
// Feita para ser leve: o cenário parado é desenhado UMA vez numa textura (uma imagem por quadro, não centenas de
// comandos de Graphics), e o que se mexe são poucos objetos: a Roo troca de quadro num relógio só (a cada 100 ms, o
// mesmo relógio que redesenha as duas chamas pequenas) e as bolhas, o vapor e a gota rodam em tweens. Sem partículas,
// sem RenderTexture por quadro e sem trabalho em update().
import Phaser from 'phaser';
import { CANVAS, CONFIG } from '../config';
import { mulberry32 } from '../game/rng';
import { rooFootOriginY } from '../textures/rooGeometry';

const W = CANVAS.width;
const H = CANVAS.height;
type Gfx = Phaser.GameObjects.Graphics;

const WALL_H = 330; // altura da parede; abaixo dela é chão
const ROO_X = 300;
const ROO_SCALE = 3; // escala inteira: todo pixel da Roo tem o mesmo tamanho
const FEET_Y = 411;
const U = 3; // o "pixel" do cenário: tudo parado é desenhado em múltiplos de 3 px
const BG_KEY = 'menu_lab_bg';
const TORCH_XS = [224, 376]; // as tochas da parede, uma de cada lado da Roo
const TORCH_Y = 258;

// o alambique, na bancada da direita
const BENCH_X = 396;
const BENCH_TOP = 396;
const CANDLE_X = 426;
const FLASK_X = 495; // centro do frasco de fervura
const FLASK_Y = 350;
const BURNER_Y = BENCH_TOP; // a chama fica sobre a bancada, sob o frasco
const NECK_TOP = 286; // altura do tubo que sobe e atravessa
const RECV_X = 567; // frasco coletor
const RECV_TOP = 352;

// A sequência de quadros da leitura (um quadro = 100 ms): página parada, a folha vira (1 a 7), outra página parada e a
// folha volta. Os quadros 0 e 8 são as duas páginas paradas.
const HOLD = 36;
const READ_SEQUENCE: number[] = [
  ...new Array<number>(HOLD).fill(0), 1, 2, 3, 4, 5, 6, 7,
  ...new Array<number>(HOLD).fill(8), 7, 6, 5, 4, 3, 2, 1,
];

export class MenuScene extends Phaser.Scene {
  private roo!: Phaser.GameObjects.Sprite;
  private flames!: Gfx;
  private tick = 0;
  private lastFrame = -1;

  constructor() {
    super('Menu');
  }

  create(): void {
    this.tick = 0;
    this.lastFrame = -1;
    this.buildBackground();
    this.buildRoo();
    this.buildAmbient();
    // um relógio só move a leitura e as chamas
    this.time.addEvent({ delay: 100, loop: true, callback: this.onTick, callbackScope: this });
    this.onTick();
  }

  // ---------------------------------------------------------------- cenário (desenhado uma vez)

  private buildBackground(): void {
    this.add.tileSprite(0, 0, W, WALL_H, 'wall').setOrigin(0).setTint(0xb09c88).setDepth(0);
    this.add.tileSprite(0, WALL_H, W, H - WALL_H, 'floor1').setOrigin(0).setTint(0x9a8068).setDepth(0);
    if (!this.textures.exists(BG_KEY)) {
      const g = this.make.graphics({}, false);
      this.paintScenery(g);
      g.generateTexture(BG_KEY, W, H);
      g.destroy();
    }
    this.add.image(0, 0, BG_KEY).setOrigin(0).setDepth(1);
  }

  private paintScenery(g: Gfx): void {
    const r = (x: number, y: number, w: number, h: number, color: number, a = 1): void => {
      g.fillStyle(color, a);
      g.fillRect(x, y, w, h);
    };
    // disco e elipse em pixels (uma célula de U px por vez): nada de curva suave, tudo em degraus como a pixel art
    const disc = (cx: number, cy: number, rad: number, color: number, a = 1, clip?: (gy: number) => boolean): void => {
      const n = Math.round(rad / U);
      for (let gy = -n; gy <= n; gy++) {
        for (let gx = -n; gx <= n; gx++) {
          if (gx * gx + gy * gy > n * n + n * 0.6) continue;
          if (clip && !clip(cy + gy * U)) continue;
          r(cx + gx * U - U / 2, cy + gy * U - U / 2, U, U, color, a);
        }
      }
    };
    const ell = (cx: number, cy: number, rx: number, ry: number, color: number, a = 1): void => {
      const nx = Math.round(rx / U), ny = Math.max(1, Math.round(ry / U));
      for (let gy = -ny; gy <= ny; gy++) {
        const half = Math.round(nx * Math.sqrt(Math.max(0, 1 - (gy * gy) / (ny * ny + 0.01))));
        r(cx - half * U, cy + gy * U - U / 2, half * 2 * U, U, color, a);
      }
    };
    // rodapé
    r(0, WALL_H - 6, W, 9, 0x1b1d24);
    // vinheta em degraus: escurece o topo (título) e a base (botões), sem degradê suave
    for (let i = 0; i < 6; i++) r(0, i * 30, W, 30, 0x000000, 0.78 - i * 0.13);
    for (let i = 0; i < 6; i++) r(0, H - 150 + i * 25, W, 25, 0x000000, 0.1 + i * 0.14);

    // estante de livros (esquerda)
    const rng = mulberry32(11);
    const SX = 18;
    const SW = 168;
    r(SX - 6, 222, SW + 12, 186, 0x2a1d12);
    r(SX, 228, SW, 174, 0x140e08);
    const spines = [0x6b2f6b, 0x8a3a30, 0x2f5d6b, 0x3f6b3a, 0x8a6a2a, 0x4a3a7a, 0x7a4a2a, 0x2a4a5a];
    for (let row = 0; row < 3; row++) {
      const top = 228 + row * 58;
      const base = top + 54; // o tampo da prateleira
      let x = SX + 6;
      while (x < SX + SW - 12) {
        const w = U * (2 + Math.floor(rng() * 3));
        const h = 54 - U * Math.floor(rng() * 5) - 6;
        const c = spines[Math.floor(rng() * spines.length)];
        r(x, base - h, w, h, c);
        r(x, base - h, U, h, 0xffffff, 0.12); // brilho da lombada
        r(x, base - h + U * 2, w, U, 0xd9b45a, 0.55); // faixa dourada
        x += w + (rng() < 0.15 ? U * 2 : 0);
      }
      r(SX, base, SW, U * 2, 0x5a432a);
      r(SX, base, SW, U, 0x7a5c38);
    }

    // tapete sob a Roo (bordado em degraus) e a sombra dela
    r(ROO_X - 90, FEET_Y - 9, 180, 30, 0x4a1f2a);
    r(ROO_X - 87, FEET_Y - 6, 174, 24, 0x7a2f3a);
    r(ROO_X - 81, FEET_Y - 3, 162, 18, 0x4a1f2a);
    for (let x = ROO_X - 78; x < ROO_X + 76; x += 12) { r(x, FEET_Y + 3, 6, 6, 0xd9b45a); r(x + 6, FEET_Y + 6, 3, 3, 0xd9b45a); }
    r(ROO_X - 90, FEET_Y - 9, 180, 3, 0x9a4a4a, 0.6);
    ell(ROO_X, FEET_Y + 3, 52, 9, 0x000000, 0.32);

    // tochas na parede, uma de cada lado da Roo (a chama anima em onTick)
    for (const tx of TORCH_XS) {
      r(tx - 12, TORCH_Y + 6, 24, 9, 0x1c1410); // espelho de ferro
      r(tx - 9, TORCH_Y + 9, 18, 3, 0x4a4f5c);
      r(tx - 6, TORCH_Y + 15, 12, 6, 0x2a2b33); // suporte
      r(tx - 6, TORCH_Y - 18, 12, 36, 0x1c1410); // cabo
      r(tx - 3, TORCH_Y - 18, 6, 33, 0x7a5c38);
      r(tx - 3, TORCH_Y - 18, 3, 33, 0x9b7b4f);
      r(tx - 9, TORCH_Y - 30, 18, 15, 0x1c1410); // a cabeça de pano e piche
      r(tx - 6, TORCH_Y - 27, 12, 9, 0x3a2b1a);
      r(tx - 3, TORCH_Y - 27, 6, 3, 0xd6452f); // brasa
      this.drawFlame(g, tx, TORCH_Y - 30, 1.8, 0, 0xffa94d, 0xfff0b0, 0xe8501f); // chama parada: só a vela se mexe
    }
    for (const dx of [-12, 0, 12]) this.drawFlame(g, FLASK_X + dx, BURNER_Y - U * 6, 0.75, 0, 0xffa94d, 0xfff0b0, 0xe8501f); // fogareiro, parado

    // bancada (direita): tampo e pernas
    r(BENCH_X, BENCH_TOP, W - BENCH_X, U * 3, 0x5a432a);
    r(BENCH_X, BENCH_TOP, W - BENCH_X, U, 0x7a5c38);
    r(BENCH_X + 9, BENCH_TOP + U * 3, U * 3, 44, 0x3a2b1a);
    r(W - 18, BENCH_TOP + U * 3, U * 3, 44, 0x3a2b1a);

    // vela no castiçal
    r(CANDLE_X - 15, BENCH_TOP - U * 2, 30, U * 2, 0xb58a2f);
    r(CANDLE_X - 9, BENCH_TOP - U * 7, U * 3, U * 5, 0xb58a2f);
    r(CANDLE_X - 6, BENCH_TOP - U * 22, 12, U * 15, 0xf1e6c4);
    r(CANDLE_X + 3, BENCH_TOP - U * 22, 3, U * 15, 0xd2c08c);
    r(CANDLE_X - 6, BENCH_TOP - U * 22, 3, U * 15, 0xfffbe8, 0.7);
    r(CANDLE_X - 1, BENCH_TOP - U * 25, 3, U * 3, 0x1c1410); // pavio

    // alambique: fogareiro de latão
    r(FLASK_X - 24, BURNER_Y - U * 6, 48, U * 6, 0x3a2b1a);
    r(FLASK_X - 21, BURNER_Y - U * 5, 42, U * 4, 0xb58a2f);
    r(FLASK_X - 21, BURNER_Y - U * 5, 42, U, 0xe6c15a);
    // trempe
    r(FLASK_X - 27, BURNER_Y - U * 12, U * 2, U * 6, 0x2a2b33);
    r(FLASK_X + 21, BURNER_Y - U * 12, U * 2, U * 6, 0x2a2b33);
    // frasco de fervura: vidro, líquido e brilho
    disc(FLASK_X, FLASK_Y, 30, 0x1c1410); // contorno
    disc(FLASK_X, FLASK_Y, 27, 0x7fb8ae, 0.45); // vidro
    disc(FLASK_X, FLASK_Y + 6, 21, 0x2fa56a, 1, gy => gy >= FLASK_Y + 3); // líquido: sombra do fundo
    disc(FLASK_X - 3, FLASK_Y + 3, 18, 0x6fcf97, 1, gy => gy >= FLASK_Y + 3); // líquido: tom claro
    r(FLASK_X - 18, FLASK_Y + 1, 36, U, 0xc8f5dd); // linha do líquido
    r(FLASK_X - 21, FLASK_Y - 15, U * 2, U * 5, 0xffffff, 0.6); // reflexos do vidro
    r(FLASK_X - 18, FLASK_Y - 21, U * 2, U, 0xffffff, 0.45);
    r(FLASK_X + 15, FLASK_Y - 9, U, U * 3, 0xffffff, 0.3);
    r(FLASK_X - 6, FLASK_Y - 30, 12, U * 2, 0xb58a2f); // anel de latão no colo do frasco
    r(FLASK_X - 6, FLASK_Y - 30, 12, U, 0xe6c15a);
    // gargalo e tubo que sobe, atravessa e desce (segmentos retos, contorno escuro e vidro por cima)
    const pipe = (x: number, y: number, w: number, h: number): void => {
      r(x - 3, y - 3, w + 6, h + 6, 0x1c1410);
    };
    const glass = (x: number, y: number, w: number, h: number): void => {
      r(x, y, w, h, 0x9ad4c8, 0.6);
      r(x, y, Math.min(w, U), Math.min(h, U), 0xffffff, 0.5);
    };
    const segs: Array<[number, number, number, number]> = [
      [FLASK_X - 6, NECK_TOP, 12, FLASK_Y - 24 - NECK_TOP],
      [FLASK_X - 6, NECK_TOP, RECV_X - FLASK_X + 6, 12],
      [RECV_X - 6, NECK_TOP, 12, RECV_TOP - NECK_TOP],
    ];
    segs.forEach(s => pipe(...s));
    segs.forEach(s => glass(...s));
    // condensador: a parte grossa do tubo, com anéis de latão
    r(FLASK_X + 36, NECK_TOP - 9, 60, 30, 0x1c1410);
    r(FLASK_X + 39, NECK_TOP - 6, 54, 24, 0x7fb8ae, 0.7);
    r(FLASK_X + 39, NECK_TOP - 6, 54, U, 0xffffff, 0.45);
    for (const dx of [36, 63, 90]) r(FLASK_X + dx, NECK_TOP - 9, U * 2, 30, 0xb58a2f);
    // frasco coletor (direita): vidro e o líquido que se acumula
    r(RECV_X - 24, RECV_TOP + 6, 48, BENCH_TOP - RECV_TOP - 6, 0x1c1410);
    r(RECV_X - 21, RECV_TOP + 9, 42, BENCH_TOP - RECV_TOP - 12, 0x9ad4c8, 0.3);
    r(RECV_X - 21, RECV_TOP + 21, 42, BENCH_TOP - RECV_TOP - 24, 0x4fa3e6);
    r(RECV_X - 21, RECV_TOP + 21, 42, U, 0xd8f2ff);
    r(RECV_X - 21, RECV_TOP + 27, 42, BENCH_TOP - RECV_TOP - 30, 0x7ad0ff, 0.6);
    r(RECV_X - 12, RECV_TOP + 15, U, U * 4, 0xffffff, 0.5);
    r(RECV_X - 9, RECV_TOP - 3, 18, 12, 0x1c1410); // gargalo
    r(RECV_X - 6, RECV_TOP, 12, 9, 0x9ad4c8, 0.45);
    // haste de ferro com garra segurando o tubo, atrás do alambique
    r(RECV_X - 36, NECK_TOP - 30, U * 2, BENCH_TOP - NECK_TOP + 30, 0x2a2b33);
    r(RECV_X - 36, NECK_TOP - 30, U, BENCH_TOP - NECK_TOP + 30, 0x4a4f5c);
    r(RECV_X - 36, NECK_TOP - 30, 30, U * 2, 0x2a2b33);
    r(RECV_X - 12, NECK_TOP - 33, U * 2, U * 4, 0x4a4f5c);
    // graduações no frasco coletor e um rótulo de runas pendurado na bancada
    for (let i = 0; i < 4; i++) r(RECV_X + 12, RECV_TOP + 18 + i * 12, i % 2 ? 6 : 9, 2, 0x1c1410, 0.7);
    r(FLASK_X - 6, BENCH_TOP + U * 3, 12, 15, 0xd9c896);
    r(FLASK_X - 6, BENCH_TOP + U * 3, 12, U, 0xf1e6c4);
    r(FLASK_X - 3, BENCH_TOP + U * 5, U, U, 0x6b2f6b); r(FLASK_X, BENCH_TOP + U * 6, U, U, 0x6b2f6b); r(FLASK_X - 3, BENCH_TOP + U * 7, U * 2, U, 0x6b2f6b);
    // livro fechado e um pilão sobre a bancada, entre a vela e o fogareiro
    r(CANDLE_X + 21, BENCH_TOP - 12, 27, 12, 0x1c1410);
    r(CANDLE_X + 24, BENCH_TOP - 9, 21, 6, 0x6b2f6b);
    r(CANDLE_X + 24, BENCH_TOP - 9, 21, U, 0x8a4a8a);
  }

  // ---------------------------------------------------------------- Roo lendo

  private buildRoo(): void {
    this.roo = this.add.sprite(ROO_X, FEET_Y, 'roo_read_0')
      .setOrigin(0.5, rooFootOriginY(CONFIG.tile))
      .setScale(ROO_SCALE)
      .setDepth(8);
  }

  // ---------------------------------------------------------------- vida do ambiente (tweens, poucos objetos)

  private buildAmbient(): void {
    this.flames = this.add.graphics().setDepth(5);

    // luz quente da vela: um brilho aditivo que respira
    const glow = this.add.image(CANDLE_X, BENCH_TOP - 80, 'menu_puff').setScale(6).setTint(0xffa94d)
      .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.22).setDepth(2);
    this.tweens.add({ targets: glow, alpha: { from: 0.16, to: 0.3 }, scale: { from: 5.6, to: 6.3 }, duration: 260, yoyo: true, repeat: -1 });
    this.add.image(FLASK_X, BURNER_Y - 10, 'menu_puff').setScale(2.4).setTint(0xff7043).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.28).setDepth(6);

    // tochas e fogareiro: só um brilho fixo (apenas a chama da vela se mexe)
    for (const tx of TORCH_XS) {
      this.add.image(tx, TORCH_Y - 40, 'menu_puff').setScale(5).setTint(0xffa94d).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.18).setDepth(2);
    }
    // bolhas que sobem no frasco de fervura (três, defasadas)
    for (let i = 0; i < 3; i++) {
      const x = FLASK_X - 10 + i * 10;
      const b = this.add.image(x, FLASK_Y + 20, 'menu_bubble').setScale(0.55 + i * 0.1).setAlpha(0).setDepth(6);
      this.tweens.add({
        targets: b, y: FLASK_Y - 10, alpha: { from: 0.9, to: 0 }, duration: 1500 + i * 350,
        delay: i * 520, repeat: -1, ease: 'Sine.easeOut',
        onRepeat: () => b.setY(FLASK_Y + 20),
      });
    }

    // vapor saindo do gargalo
    for (let i = 0; i < 2; i++) {
      const p = this.add.image(FLASK_X, NECK_TOP - 6, 'menu_puff').setScale(0.55).setTint(0xdcefe9).setAlpha(0)
        .setBlendMode(Phaser.BlendModes.ADD).setDepth(6);
      this.tweens.add({
        targets: p, y: NECK_TOP - 46, scale: 1.2, alpha: { from: 0.34, to: 0 }, duration: 2400,
        delay: i * 1200, repeat: -1,
        onRepeat: () => { p.setY(NECK_TOP - 6); p.setScale(0.55); },
      });
    }

    // a gota que se forma na ponta do tubo e cai no frasco coletor
    const drop = this.add.image(RECV_X, NECK_TOP + 48, 'menu_spark').setTint(0x7ad0ff).setScale(0.8).setAlpha(0).setDepth(6);
    this.tweens.add({
      targets: drop, y: RECV_TOP + 21, alpha: { from: 1, to: 0.9 }, duration: 520, delay: 700, repeatDelay: 1400, repeat: -1,
      ease: 'Quad.easeIn',
      onRepeat: () => drop.setY(NECK_TOP + 48),
    });
  }

  // ---------------------------------------------------------------- relógio de 100 ms

  private onTick(): void {
    this.tick++;
    const frame = READ_SEQUENCE[this.tick % READ_SEQUENCE.length];
    if (frame !== this.lastFrame) {
      this.lastFrame = frame;
      this.roo.setTexture(`roo_read_${frame}`);
    }
    // a única chama que se mexe é a da vela: três formas que se revezam
    const g = this.flames;
    g.clear();
    const k = this.tick % 3;
    const lean = k === 1 ? 3 : k === 2 ? -3 : 0;
    this.drawFlame(g, CANDLE_X, BENCH_TOP - U * 25, 1, lean, 0xffa94d, 0xfff0b0, 0xe8501f);
  }

  // Uma chama em degraus (retângulos): base larga, miolo claro e ponta inclinada.
  private drawFlame(g: Gfx, x: number, y: number, s: number, lean: number, mid: number, core: number, edge: number): void {
    const u = U * s;
    g.fillStyle(edge); g.fillRect(x - u * 1.5, y - u * 2, u * 3, u * 2);
    g.fillRect(x - u + lean * 0.5, y - u * 4, u * 2, u * 2);
    g.fillRect(x - u * 0.5 + lean, y - u * 6, u, u * 2);
    g.fillStyle(mid); g.fillRect(x - u, y - u * 2, u * 2, u * 2);
    g.fillRect(x - u * 0.5 + lean * 0.5, y - u * 4, u, u * 2);
    g.fillStyle(core); g.fillRect(x - u * 0.5, y - u * 1.4, u, u);
  }
}
