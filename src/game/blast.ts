// Alcance de uma explosão (puro, testável). Em vez de uma lista pronta, é um gerador: o chamador
// trata cada casa (reação em cadeia, quebrar bloco) antes de pedir a próxima, então uma casa que
// uma reação mudou no meio do caminho é vista como já está (mesmo comportamento de antes).
import { BLOCK, DIRS, WALL } from '../config';

export interface BlastTile {
  x: number;
  y: number;
  tile: number; // o que havia na casa (BLOCK, EMPTY...); a casa de origem vem com `origin: true`
  origin: boolean;
}

export function* walkBlast(
  ox: number,
  oy: number,
  radius: number,
  pierce: boolean,
  getTile: (x: number, y: number) => number | null,
): Generator<BlastTile> {
  yield { x: ox, y: oy, tile: getTile(ox, oy) ?? 0, origin: true };
  for (const [dx, dy] of DIRS) {
    for (let r = 1; r <= radius; r++) {
      const x = ox + dx * r;
      const y = oy + dy * r;
      const tile = getTile(x, y);
      if (tile === null || tile === WALL) break; // parede e borda param o raio
      yield { x, y, tile, origin: false };
      if (tile === BLOCK && !pierce) break; // bloco para o raio, salvo na poção telúrica
    }
  }
}
