// Névoa: uma camada escura sobre a fase com um círculo claro em volta da Roo. É um efeito de
// tela, sem regra de jogo (os inimigos continuam onde estão, só não se vê). As regras puras
// estão em fogRules.ts. Usada por fases com `fog` (stages/types.ts) e pelo lab (src/lab).
import Phaser from 'phaser';
import { FOG_DARKNESS, clampFogRadius, fogRadiusPx } from './fogRules';

const BRUSH_KEY = 'fog_brush';
const BRUSH_R = 128; // raio da textura do pincel (é ampliada ou reduzida ao raio da névoa)
const RINGS = 5;     // degraus do contorno: pixel art, sem degradê suave

// Pincel redondo em degraus: o centro apaga a névoa por completo e a borda, pouco.
function ensureBrush(scene: Phaser.Scene): void {
  if (scene.textures.exists(BRUSH_KEY)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  for (let i = 0; i < RINGS; i++) {
    g.fillStyle(0xffffff, i === RINGS - 1 ? 1 : 0.26);
    g.fillCircle(BRUSH_R, BRUSH_R, BRUSH_R * (1 - i / RINGS));
  }
  g.generateTexture(BRUSH_KEY, BRUSH_R * 2, BRUSH_R * 2);
  g.destroy();
}

export class Fog {
  private readonly rt: Phaser.GameObjects.RenderTexture;
  private readonly brush: Phaser.GameObjects.Image;
  private radiusTiles: number;
  private darkness: number;
  private breathe = true;

  constructor(
    private readonly scene: Phaser.Scene,
    width: number,
    height: number,
    radiusTiles: number,
    private readonly tile: number,
    depth = 16,
    color = 0x0b1220,
  ) {
    ensureBrush(scene);
    this.radiusTiles = clampFogRadius(radiusTiles);
    this.darkness = FOG_DARKNESS;
    this.color = color;
    this.rt = scene.add.renderTexture(0, 0, width, height).setOrigin(0, 0).setDepth(depth);
    this.brush = scene.make.image({ key: BRUSH_KEY, add: false }).setOrigin(0.5);
  }

  private readonly color: number;

  setRadius(radiusTiles: number): void { this.radiusTiles = clampFogRadius(radiusTiles); }
  setDarkness(d: number): void { this.darkness = Math.min(1, Math.max(0, d)); }
  setBreathing(on: boolean): void { this.breathe = on; }

  // Redesenha a névoa com o círculo claro em (x, y), em pixels do mundo.
  update(x: number, y: number): void {
    const r = fogRadiusPx(this.radiusTiles, this.tile, this.scene.time.now, this.breathe);
    this.rt.clear();
    this.rt.fill(this.color, this.darkness);
    this.brush.setPosition(x, y).setScale(r / BRUSH_R);
    this.rt.erase(this.brush);
  }

  destroy(): void {
    this.brush.destroy();
    this.rt.destroy();
  }
}
