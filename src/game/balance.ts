// Regras de equilíbrio (puras, testáveis). Ver docs/10-equilibrio.md.
import type { BombDef } from '../config';

// "b domina a" quando b é pelo menos tão bom quanto a em tudo e melhor em algo.
// Uma poção dominada por outra mais barata não teria motivo para existir; os testes impedem isso.
export function dominates(b: BombDef, a: BombDef): boolean {
  const atLeast =
    b.radius >= a.radius &&
    b.fuse <= a.fuse &&
    (b.pierce === true || a.pierce !== true) &&
    (b.remote === true || a.remote !== true);
  const better =
    b.radius > a.radius ||
    b.fuse < a.fuse ||
    (b.pierce === true && a.pierce !== true) ||
    (b.remote === true && a.remote !== true);
  return atLeast && better;
}

// Casas atingidas por uma explosão em cruz de raio r (sem obstáculos).
export function crossTiles(radius: number): number {
  return 4 * radius + 1;
}
