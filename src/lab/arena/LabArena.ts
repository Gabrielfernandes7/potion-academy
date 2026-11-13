// Cena-base dos experimentos que precisam de um mapa: grade com muralhas, pilares e blocos, e a
// Roo andando casa a casa (setas). O experimento estende esta classe e só acrescenta o que testa
// (onCreate/onUpdate). Usa as texturas e os módulos reais do jogo.
import Phaser from 'phaser';
import { mulberry32 } from '../../audio/tracks';
import { generateTextures } from '../../textures';
import { rooOriginY } from '../../textures/rooGeometry';

export interface ArenaConfig { cols: number; rows: number; tile: number; blockChance?: number; seed?: number }

const STEP_MS = 150;

export abstract class LabArena extends Phaser.Scene {
  protected readonly cols: number;
  protected readonly rows: number;
  protected readonly tile: number;
  protected walls = new Set<string>();
  protected blocks = new Map<string, Phaser.GameObjects.Image>();
  protected player!: Phaser.GameObjects.Sprite;
  protected gx = 1;
  protected gy = 1;
  private busy = false;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

  protected constructor(key: string, private readonly cfg: ArenaConfig) {
    super(key);
    this.cols = cfg.cols;
    this.rows = cfg.rows;
    this.tile = cfg.tile;
  }

  /** Chamado no fim de create(): monte aqui o que o experimento testa. */
  protected onCreate(): void {}
  /** Chamado a cada quadro, depois do movimento da Roo. */
  protected onUpdate(_time: number, _delta: number): void {}

  create(): void {
    generateTextures(this);
    this.buildMap();
    this.player = this.add.sprite(this.gx * this.tile + this.tile / 2, this.gy * this.tile + this.tile / 2, 'roo_down_0')
      .setOrigin(0.5, rooOriginY(this.tile)).setDepth(10);
    this.cursors = this.input.keyboard?.createCursorKeys();
    this.onCreate();
  }

  update(time: number, delta: number): void {
    const c = this.cursors;
    if (c) {
      if (c.left.isDown) this.move(-1, 0);
      else if (c.right.isDown) this.move(1, 0);
      else if (c.up.isDown) this.move(0, -1);
      else if (c.down.isDown) this.move(0, 1);
    }
    this.onUpdate(time, delta);
  }

  /** A casa está livre (sem muralha nem bloco)? */
  protected free(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return false;
    const k = `${x},${y}`;
    return !this.walls.has(k) && !this.blocks.has(k);
  }

  /** Casas livres (para espalhar coisas), longe do ponto de partida da Roo. */
  protected freeTiles(minDistFromStart = 4): Array<{ x: number; y: number }> {
    const out: Array<{ x: number; y: number }> = [];
    for (let y = 1; y < this.rows - 1; y++) {
      for (let x = 1; x < this.cols - 1; x++) {
        if (this.free(x, y) && Math.abs(x - 1) + Math.abs(y - 1) >= minDistFromStart) out.push({ x, y });
      }
    }
    return out;
  }

  private buildMap(): void {
    const rng = mulberry32(this.cfg.seed ?? 7);
    const chance = this.cfg.blockChance ?? 0.45;
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        this.add.image(x * this.tile, y * this.tile, (x + y) % 2 === 0 ? 'floor1' : 'floor2').setOrigin(0, 0);
        const border = x === 0 || y === 0 || x === this.cols - 1 || y === this.rows - 1;
        const pillar = x % 2 === 0 && y % 2 === 0;
        if (border || pillar) {
          this.walls.add(`${x},${y}`);
          this.add.image(x * this.tile, y * this.tile, 'wall').setOrigin(0, 0).setDepth(1);
        } else if ((x > 3 || y > 3) && rng() < chance) {
          this.blocks.set(`${x},${y}`, this.add.image(x * this.tile, y * this.tile, 'block').setOrigin(0, 0).setDepth(2));
        }
      }
    }
  }

  private move(dx: number, dy: number): void {
    if (this.busy) return;
    const nx = this.gx + dx;
    const ny = this.gy + dy;
    if (!this.free(nx, ny)) return;
    this.gx = nx;
    this.gy = ny;
    this.busy = true;
    this.tweens.add({
      targets: this.player,
      x: nx * this.tile + this.tile / 2,
      y: ny * this.tile + this.tile / 2,
      duration: STEP_MS,
      onComplete: () => { this.busy = false; },
    });
  }
}
