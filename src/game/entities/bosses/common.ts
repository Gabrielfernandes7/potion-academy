// Peças comuns a todos os chefes (puras, sem Phaser): casa do mapa, fases e área de explosão em cruz.
export interface Tile { x: number; y: number }
export type BossPhase = 1 | 2;

// Fase 2 ("furiosa") começa quando a vida chega à metade.
export function phaseFor(hp: number, maxHp: number): BossPhase {
  return hp <= maxHp / 2 ? 2 : 1;
}

const DIRS4: ReadonlyArray<readonly [number, number]> = [[0, -1], [0, 1], [-1, 0], [1, 0]];

// Casas atingidas por uma explosão em cruz. Obstáculos (muralha/caixote) bloqueiam o resto do braço.
export function blastTiles(cx: number, cy: number, radius: number, isOpen: (x: number, y: number) => boolean): Tile[] {
  const tiles: Tile[] = [{ x: cx, y: cy }];
  for (const [dx, dy] of DIRS4) {
    for (let r = 1; r <= radius; r++) {
      const x = cx + dx * r;
      const y = cy + dy * r;
      if (!isOpen(x, y)) break;
      tiles.push({ x, y });
    }
  }
  return tiles;
}
