// Os inimigos do Observatório e da Biblioteca (desenhados por código, 40 px, contorno escuro para ler sobre o chão
// claro e o escuro): lanterna viva (fogo), relógio de cobre (terra), toupeira de sal (terra) e coruja do
// scriptorium (ar). Nada em forma de cruz (regra de conteúdo do CLAUDE.md).
import type { MakeFn } from './make';

const OUT = 0x1c1410; // o contorno de todos

export function drawNewEnemies(make: MakeFn): void {
  // Lanterna viva: um espírito de chama dentro de uma lamparina de latão, com olhos e uma chama no topo.
  make('enemy_lantern', (g, T) => {
    const c = T / 2;
    g.fillStyle(0x000000, 0.25); g.fillEllipse(c, T - 4, 22, 5);
    // argola de segurar e a chama
    g.lineStyle(2, OUT); g.beginPath(); g.arc(c, 7, 4, Math.PI, 0, false); g.strokePath();
    g.fillStyle(OUT); g.fillTriangle(c, 0, c - 6, 13, c + 6, 13);
    g.fillStyle(0xd6452f); g.fillTriangle(c, 1, c - 5, 13, c + 5, 13);
    g.fillStyle(0xffa94d); g.fillTriangle(c, 4, c - 3, 13, c + 3, 13);
    g.fillStyle(0xfff0b0); g.fillTriangle(c, 8, c - 1.5, 13, c + 1.5, 13);
    // topo e base de latão
    g.fillStyle(OUT); g.fillRect(c - 12, 12, 24, 5); g.fillRect(c - 12, T - 9, 24, 6);
    g.fillStyle(0xb58a2f); g.fillRect(c - 11, 13, 22, 3); g.fillRect(c - 11, T - 8, 22, 4);
    // vidro com a luz
    g.fillStyle(OUT); g.fillRect(c - 10, 16, 20, 15);
    g.fillStyle(0xffd27a); g.fillRect(c - 9, 17, 18, 13);
    g.fillStyle(0xfff3c4); g.fillEllipse(c, 24, 11, 10);
    // barras do vidro
    g.fillStyle(0xb58a2f); g.fillRect(c - 1, 17, 2, 13);
    // olhos
    g.fillStyle(OUT); g.fillEllipse(c - 4, 23, 3.4, 4.6); g.fillEllipse(c + 4, 23, 3.4, 4.6);
    g.fillStyle(0xffffff); g.fillCircle(c - 4.4, 21.8, 0.8); g.fillCircle(c + 3.6, 21.8, 0.8);
  });

  // Relógio de cobre: um autômato de bronze, corpo de engrenagem, mostrador no peito e pernas curtas.
  make('enemy_clock', (g, T) => {
    const c = T / 2;
    g.fillStyle(0x000000, 0.25); g.fillEllipse(c, T - 4, 26, 6);
    // pernas
    g.fillStyle(OUT); g.fillRect(c - 11, T - 10, 8, 8); g.fillRect(c + 3, T - 10, 8, 8);
    g.fillStyle(0x8a5a2a); g.fillRect(c - 10, T - 9, 6, 6); g.fillRect(c + 4, T - 9, 6, 6);
    // corpo
    g.fillStyle(OUT); g.fillRoundedRect(c - 14, 8, 28, 26, 4);
    g.fillStyle(0xb87333); g.fillRoundedRect(c - 13, 9, 26, 24, 3);
    g.fillStyle(0xd99a5b); g.fillRect(c - 12, 10, 24, 3);
    g.fillStyle(0x8a5a2a); g.fillRect(c + 6, 13, 6, 19);
    // mostrador (rosto)
    g.fillStyle(OUT); g.fillCircle(c, 19, 9.5);
    g.fillStyle(0xf3ead0); g.fillCircle(c, 19, 8.4);
    g.lineStyle(1.4, OUT);
    g.beginPath(); g.moveTo(c, 19); g.lineTo(c, 13.5); g.moveTo(c, 19); g.lineTo(c + 4, 21); g.strokePath();
    for (const [dx, dy] of [[0, -7], [7, 0], [0, 7], [-7, 0]]) { g.fillStyle(OUT); g.fillRect(c + dx - 0.7, 19 + dy - 0.7, 1.4, 1.4); }
    g.fillStyle(0xd6452f); g.fillCircle(c, 19, 1.2);
    // olhos de parafuso sobre o mostrador e engrenagens nos lados
    g.fillStyle(OUT); g.fillRect(c - 7, 11, 3, 3); g.fillRect(c + 4, 11, 3, 3);
    g.fillStyle(0xffd54f); g.fillRect(c - 6.5, 11.5, 2, 2); g.fillRect(c + 4.5, 11.5, 2, 2);
    for (const gx of [c - 16, c + 16]) {
      g.fillStyle(OUT); g.fillCircle(gx, 22, 4.6);
      g.fillStyle(0x8a5a2a); g.fillCircle(gx, 22, 3.6);
      g.fillStyle(OUT); g.fillCircle(gx, 22, 1.3);
    }
    // chave de dar corda nas costas, sobre a cabeça
    g.fillStyle(OUT); g.fillRect(c - 1.5, 3, 3, 6); g.fillCircle(c - 3, 3, 2.4); g.fillCircle(c + 3, 3, 2.4);
    g.fillStyle(0xd99a5b); g.fillCircle(c - 3, 3, 1.4); g.fillCircle(c + 3, 3, 1.4);
  });

  // Toupeira de sal: corpo cinza-azulado salpicado de cristais de sal, focinho rosado e garras largas.
  make('enemy_mole', (g, T) => {
    const c = T / 2;
    g.fillStyle(0x000000, 0.25); g.fillEllipse(c, T - 4, 26, 6);
    // montinho de terra aos pés
    g.fillStyle(0x5d4228); g.fillEllipse(c, T - 6, 30, 9);
    g.fillStyle(0x8d6e43); g.fillEllipse(c - 5, T - 8, 12, 5); g.fillEllipse(c + 8, T - 7, 9, 4);
    // corpo
    g.fillStyle(OUT); g.fillEllipse(c, 21, 28, 24);
    g.fillStyle(0x6f7c8f); g.fillEllipse(c, 21, 26, 22);
    g.fillStyle(0x8f9db0); g.fillEllipse(c - 3, 18, 16, 12);
    // cristais de sal nas costas
    for (const [dx, dy, s] of [[-8, 11, 3], [0, 8, 3.6], [8, 11, 3]] as Array<[number, number, number]>) {
      g.fillStyle(OUT); g.fillTriangle(c + dx, dy - s - 1, c + dx - s - 1, dy + 2, c + dx + s + 1, dy + 2);
      g.fillStyle(0xf6f2e2); g.fillTriangle(c + dx, dy - s, c + dx - s, dy + 1, c + dx + s, dy + 1);
    }
    // focinho
    g.fillStyle(OUT); g.fillEllipse(c, 27, 14, 10);
    g.fillStyle(0xe8a7a0); g.fillEllipse(c, 27, 12, 8);
    g.fillStyle(OUT); g.fillCircle(c, 25, 2.2);
    g.fillStyle(0xffd0cb); g.fillCircle(c - 0.6, 24.4, 0.7);
    // olhinhos minúsculos
    g.fillStyle(OUT); g.fillCircle(c - 7, 19, 1.8); g.fillCircle(c + 7, 19, 1.8);
    g.fillStyle(0xffffff); g.fillCircle(c - 7.4, 18.5, 0.6); g.fillCircle(c + 6.6, 18.5, 0.6);
    // garras largas
    for (const gx of [c - 14, c + 14]) {
      g.fillStyle(OUT); g.fillEllipse(gx, 29, 9, 8);
      g.fillStyle(0xe8a7a0); g.fillEllipse(gx, 29, 7, 6);
      g.fillStyle(0xf6f2e2); g.fillRect(gx - 3, 31, 1.6, 3); g.fillRect(gx, 31.4, 1.6, 3); g.fillRect(gx + 2.6, 31, 1.6, 3);
    }
  });

  // Coruja do scriptorium: penas marrom-claras, olhos grandes e dourados, tufos nas orelhas e um livrinho nas garras.
  make('enemy_owl', (g, T) => {
    const c = T / 2;
    g.fillStyle(0x000000, 0.2); g.fillEllipse(c, T - 3, 20, 5);
    // asas abertas, atrás do corpo
    g.fillStyle(OUT); g.fillEllipse(c - 15, 22, 12, 22); g.fillEllipse(c + 15, 22, 12, 22);
    g.fillStyle(0x8a6d4b); g.fillEllipse(c - 15, 22, 10, 20); g.fillEllipse(c + 15, 22, 10, 20);
    g.fillStyle(0xb99a73); g.fillRect(c - 18, 14, 2, 14); g.fillRect(c + 16, 14, 2, 14);
    // corpo
    g.fillStyle(OUT); g.fillEllipse(c, 23, 24, 28);
    g.fillStyle(0xa98a63); g.fillEllipse(c, 23, 22, 26);
    g.fillStyle(0xf0e2c4); g.fillEllipse(c, 28, 14, 14);
    // listras do peito
    g.fillStyle(0xa98a63);
    for (let i = 0; i < 3; i++) g.fillRect(c - 4, 25 + i * 3.4, 8, 1.4);
    // tufos das orelhas
    g.fillStyle(OUT); g.fillTriangle(c - 11, 6, c - 4, 12, c - 12, 14); g.fillTriangle(c + 11, 6, c + 4, 12, c + 12, 14);
    g.fillStyle(0x8a6d4b); g.fillTriangle(c - 10, 8, c - 5, 12, c - 11, 13); g.fillTriangle(c + 10, 8, c + 5, 12, c + 11, 13);
    // olhos grandes
    g.fillStyle(OUT); g.fillCircle(c - 5.5, 16, 6); g.fillCircle(c + 5.5, 16, 6);
    g.fillStyle(0xf8ecc8); g.fillCircle(c - 5.5, 16, 5); g.fillCircle(c + 5.5, 16, 5);
    g.fillStyle(0xf2a900); g.fillCircle(c - 5.5, 16, 3.4); g.fillCircle(c + 5.5, 16, 3.4);
    g.fillStyle(OUT); g.fillCircle(c - 5.5, 16, 1.8); g.fillCircle(c + 5.5, 16, 1.8);
    g.fillStyle(0xffffff); g.fillCircle(c - 6.2, 15.2, 0.7); g.fillCircle(c + 4.8, 15.2, 0.7);
    // bico
    g.fillStyle(OUT); g.fillTriangle(c - 2.6, 19, c + 2.6, 19, c, 24);
    g.fillStyle(0xe0a030); g.fillTriangle(c - 1.8, 19.4, c + 1.8, 19.4, c, 22.8);
    // pés com garras
    g.fillStyle(OUT); g.fillRect(c - 8, T - 8, 6, 5); g.fillRect(c + 2, T - 8, 6, 5);
    g.fillStyle(0xe0a030); g.fillRect(c - 7, T - 7, 4, 3); g.fillRect(c + 3, T - 7, 4, 3);
  });
}
