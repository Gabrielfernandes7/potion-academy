// Poções (bombas) em vidro tipo Erlenmeyer, uma por tipo de bomba.
import type { MakeFn } from './make';

function makePotion(make: MakeFn, key: string, liquidCol: number, glowCol: number): void {
  make(key, (g, T) => {
    // vidro (cone com base)
    g.lineStyle(1.5, 0xcccccc);
    g.fillStyle(0xffffff);
    g.fillTriangle(T / 2 - 7, T / 2 + 3, T / 2 + 7, T / 2 + 3, T / 2, 3);
    // rolha
    g.fillStyle(0x8b6f47);
    g.fillRect(T / 2 - 2.5, 2, 5, 3);
    // líquido
    g.fillStyle(liquidCol);
    g.fillTriangle(T / 2 - 6, T / 2 + 1, T / 2 + 6, T / 2 + 1, T / 2, 10);
    // brilho
    g.fillStyle(glowCol);
    g.fillCircle(T / 2 - 2, T / 2 - 1, 1.5);
    // bolhas
    g.fillStyle(0xffffff);
    g.fillCircle(T / 2 + 2, T / 2 + 1, 1);
    g.fillCircle(T / 2 - 1, T / 2 + 2, 0.7);
  });
}

export function drawPotions(make: MakeFn): void {
  makePotion(make, 'bomb_normal', 0xff6b6b, 0xffa94d);
  makePotion(make, 'bomb_mega',   0x74b9ff, 0xa8e6f5);
  makePotion(make, 'bomb_pierce', 0x81c784, 0xc8e6c9);
  makePotion(make, 'bomb_remote', 0xc9d6df, 0xeef4f8);
}
