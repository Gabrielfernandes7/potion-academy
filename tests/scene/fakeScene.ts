// Cena falsa para testar o PlayerController e o RooFormSystem sem Phaser nem navegador.
import { vi } from 'vitest';
import { CONFIG, EMPTY, type BombId } from '../../src/config';

const gfx = (): Record<string, unknown> => {
  const g: Record<string, unknown> = {};
  for (const m of ['setDepth', 'clear', 'fillStyle', 'fillRect', 'lineStyle', 'strokeRect', 'fillCircle', 'strokeCircle', 'beginPath', 'moveTo', 'lineTo', 'strokePath', 'setAlpha', 'setVisible']) g[m] = () => g;
  return g;
};

export interface FakeScene {
  [k: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export function makeFakeScene(over: Partial<FakeScene> = {}): FakeScene {
  const floats: string[] = [];
  const sprite = {
    x: CONFIG.tile * 1.5, y: CONFIG.tile * 1.5, alpha: 1,
    anims: { timeScale: 1, currentAnim: null as { key: string } | null },
    setTint: vi.fn(), clearTint: vi.fn(), setAlpha: vi.fn(), setTexture: vi.fn(),
  };
  const scene: FakeScene = {
    stage: 1, duel: null, bombType: 'normal' as BombId, floats,
    player: {
      gridX: 1, gridY: 1, dir: { x: 0, y: 1 }, facing: 'down', moving: false,
      hp: 24, invulnerable: 0, upgrades: {}, speedUp: 0,
    },
    playerSprite: sprite,
    forms: { walkFactor: () => 1, profile: () => undefined, reduceDamage: (d: number) => d },
    bombSystem: { explosions: [] as Array<{ key: string; element: string; hitPlayer?: boolean }> },
    pickupSystem: { checkPickups: vi.fn() },
    checkWin: vi.fn(), updateHud: vi.fn(), play: vi.fn(), playWalk: vi.fn(), playIdle: vi.fn(), triggerGameOver: vi.fn(),
    floatingText: (_x: number, _y: number, t: string) => { floats.push(t); },
    playerTile: () => ({ x: 1, y: 1 }), isFree: () => true, hasBomb: () => false, doorX: -1, doorY: -1,
    getTile: () => EMPTY,
    tweens: { add: vi.fn() },
    add: { graphics: () => gfx() },
    cameras: { main: { flash: vi.fn(), shake: vi.fn() } },
    ...over,
  };
  return scene;
}
