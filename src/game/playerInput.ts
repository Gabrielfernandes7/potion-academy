// Escolha do passo da Roo a partir das teclas (regra pura, sem Phaser).
// A última seta apertada manda; se ela continua segurada, a Roo segue nela; senão vale a primeira segurada.
export interface Dir { x: number; y: number }
export interface DirFlags { up: boolean; down: boolean; left: boolean; right: boolean }

/** A direção da seta recém-apertada; sem seta nova, mantém a anterior. */
export function nextLastDir(last: Dir, just: DirFlags): Dir {
  if (just.up) return { x: 0, y: -1 };
  if (just.down) return { x: 0, y: 1 };
  if (just.left) return { x: -1, y: 0 };
  if (just.right) return { x: 1, y: 0 };
  return last;
}

/** Para onde dar o próximo passo (ou null, se nenhuma seta está segurada). */
export function chooseMove(last: Dir, held: DirFlags): Dir | null {
  const lastHeld =
    (last.x === 0 && last.y === -1 && held.up) ||
    (last.x === 0 && last.y === 1 && held.down) ||
    (last.x === -1 && last.y === 0 && held.left) ||
    (last.x === 1 && last.y === 0 && held.right);
  if (lastHeld) return { x: last.x, y: last.y };
  if (held.up) return { x: 0, y: -1 };
  if (held.down) return { x: 0, y: 1 };
  if (held.left) return { x: -1, y: 0 };
  if (held.right) return { x: 1, y: 0 };
  return null;
}
