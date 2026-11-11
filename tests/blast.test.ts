import { describe, expect, it } from 'vitest';
import { BLOCK, EMPTY, WALL } from '../src/config';
import { walkBlast } from '../src/game/blast';

// grade 7x7: bordas de parede, resto vazio
function grid(edit: (g: number[][]) => void = () => {}) {
  const g = Array.from({ length: 7 }, (_, y) => Array.from({ length: 7 }, (_, x) => (x === 0 || y === 0 || x === 6 || y === 6 ? WALL : EMPTY)));
  edit(g);
  return (x: number, y: number): number | null => (g[y]?.[x] ?? null);
}
const cells = (it: Iterable<{ x: number; y: number }>) => [...it].map(t => `${t.x},${t.y}`);

describe('walkBlast', () => {
  it('abre uma cruz com o raio dado', () => {
    const c = cells(walkBlast(3, 3, 2, false, grid()));
    expect(c).toHaveLength(1 + 4 * 2);
    expect(c).toContain('3,1');
    expect(c).toContain('5,3');
  });

  it('para na parede', () => {
    const c = cells(walkBlast(1, 1, 3, false, grid()));
    expect(c).not.toContain('0,1');
    expect(c).toContain('4,1');
  });

  it('o bloco entra na lista e para o raio; a poção telúrica atravessa', () => {
    const g = grid(m => { m[3][4] = BLOCK; });
    const normal = cells(walkBlast(3, 3, 2, false, g));
    expect(normal).toContain('4,3');
    expect(normal).not.toContain('5,3');
    const pierce = cells(walkBlast(3, 3, 2, true, g));
    expect(pierce).toContain('5,3');
  });

  it('fora da grade (null) também para', () => {
    expect(cells(walkBlast(1, 1, 2, false, () => null))).toEqual(['1,1']);
  });
});
