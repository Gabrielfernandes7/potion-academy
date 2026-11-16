// Os inimigos novos (desenhados por código, 40 px, contorno escuro para ler sobre o chão claro e o escuro): lanterna
// viva (fogo), relógio de cobre, toupeira de sal e sentinela de cera (terra), coruja do scriptorium (ar), gosma de
// mercúrio (água), ratinho do celeiro (terra) e salamandra do caldeirão (fogo, amiga). Nada em forma de cruz (regra de conteúdo do CLAUDE.md).
import type Phaser from 'phaser';
import type { MakeFn } from './make';

type Graphics = Phaser.GameObjects.Graphics;

const OUT = 0x1c1410; // o contorno de todos

export function drawNewEnemies(make: MakeFn): void {
  // Lanterna viva: uma lamparina de latão pendurada pela argola, com um espírito de chama de rosto vivo dentro do vidro.
  // Tudo cabe nos 40 px (a chama que balança é a de dentro do vidro; no segundo quadro ela inclina e pisca).
  const lantern = (g: Graphics, T: number, v: 0 | 1 | 2 = 0): void => {
    const c = T / 2;
    g.fillStyle(0x000000, 0.25); g.fillEllipse(c, T - 3, 24, 5);
    // argola de segurar
    g.lineStyle(3, OUT); g.beginPath(); g.arc(c, 7, 5, Math.PI, 0, false); g.strokePath();
    g.lineStyle(1.4, 0xd8a93c); g.beginPath(); g.arc(c, 7, 5, Math.PI, 0, false); g.strokePath();
    // tampa de latão (trapézio) com a chaminé
    g.fillStyle(OUT); g.fillRoundedRect(c - 6, 6, 12, 7, 2); g.fillRoundedRect(c - 13, 11, 26, 6, 2);
    g.fillStyle(0xb58a2f); g.fillRect(c - 5, 7, 10, 5); g.fillRect(c - 12, 12, 24, 4);
    g.fillStyle(0xe6c15a); g.fillRect(c - 12, 12, 24, 1.4); g.fillRect(c - 4, 7, 8, 1.2);
    g.fillStyle(0x7d5c1d); g.fillRect(c + 6, 13.4, 6, 2.6);
    // vidro, com o brilho quente de dentro
    g.fillStyle(OUT); g.fillRect(c - 11, 16, 22, 16);
    g.fillStyle(0x5a3a22); g.fillRect(c - 10, 17, 20, 14);
    g.fillStyle(0xe58a3a, 0.55); g.fillEllipse(c, 24, 20, 18);
    // o espírito: gota de chama com ponta, miolo claro e rosto
    const lean = v === 1 ? 2 : 0;
    g.fillStyle(OUT); g.fillTriangle(c + lean, 11, c - 7, 26, c + 7, 26); g.fillEllipse(c, 24.5, 17, 14);
    g.fillStyle(0xe8501f); g.fillTriangle(c + lean, 13, c - 6, 25, c + 6, 25); g.fillEllipse(c, 24.5, 15, 12);
    g.fillStyle(0xffa94d); g.fillTriangle(c + lean, 16, c - 4.6, 25, c + 4.6, 25); g.fillEllipse(c, 25.5, 11, 8.5);
    g.fillStyle(0xfff0b0); g.fillEllipse(c, 27, 6.4, 4.4);
    // olhos (piscam no segundo quadro) e um sorriso torto
    g.fillStyle(OUT);
    if (v === 1) { g.fillRect(c - 5, 23.4, 3.4, 1.4); g.fillRect(c + 1.6, 23.4, 3.4, 1.4); }
    else { g.fillEllipse(c - 3.4, 23.6, 2.8, 4); g.fillEllipse(c + 3.4, 23.6, 2.8, 4); g.fillStyle(0xffffff); g.fillCircle(c - 3.8, 22.6, 0.7); g.fillCircle(c + 3, 22.6, 0.7); }
    g.fillStyle(OUT); g.fillRect(c - 2, 28, 4, 1.2);
    // moldura do vidro (barras de latão) por cima
    g.fillStyle(0xb58a2f); g.fillRect(c - 11, 16, 2, 16); g.fillRect(c + 9, 16, 2, 16);
    // base de latão e pés
    g.fillStyle(OUT); g.fillRoundedRect(c - 13, 31, 26, 6, 2); g.fillRect(c - 10, 36, 5, 3); g.fillRect(c + 5, 36, 5, 3);
    g.fillStyle(0xb58a2f); g.fillRect(c - 12, 32, 24, 4); g.fillRect(c - 9, 36, 3, 2); g.fillRect(c + 6, 36, 3, 2);
    g.fillStyle(0xe6c15a); g.fillRect(c - 12, 32, 24, 1.2);
    g.fillStyle(0x7d5c1d); g.fillRect(c + 6, 34, 6, 2);
  };

  // Relógio de cobre: um autômato de bronze, corpo de engrenagem, mostrador no peito e pernas curtas.
  const clock = (g: Graphics, T: number, v: 0 | 1 | 2 = 0): void => {
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
    g.beginPath(); g.moveTo(c, 19);
    if (v === 1) { g.lineTo(c + 4.5, 15); g.moveTo(c, 19); g.lineTo(c + 3, 23); } else { g.lineTo(c, 13.5); g.moveTo(c, 19); g.lineTo(c + 4, 21); }
    g.strokePath();
    for (const [dx, dy] of [[0, -7], [7, 0], [0, 7], [-7, 0]]) { g.fillStyle(OUT); g.fillRect(c + dx - 0.7, 19 + dy - 0.7, 1.4, 1.4); }
    g.fillStyle(0xd6452f); g.fillCircle(c, 19, 1.2);
    // olhos de parafuso sobre o mostrador e engrenagens nos lados
    g.fillStyle(OUT); g.fillRect(c - 7, 11, 3, v === 2 ? 1.4 : 3); g.fillRect(c + 4, 11, 3, v === 2 ? 1.4 : 3);
    if (v !== 2) { g.fillStyle(0xffd54f); g.fillRect(c - 6.5, 11.5, 2, 2); g.fillRect(c + 4.5, 11.5, 2, 2); }
    for (const gx of [c - 16, c + 16]) {
      g.fillStyle(OUT); g.fillCircle(gx, 22, 4.6);
      g.fillStyle(0x8a5a2a); g.fillCircle(gx, 22, 3.6);
      g.fillStyle(OUT); g.fillCircle(gx, 22, 1.3);
    }
    // chave de dar corda sobre a cabeça: na pausa, gira de lado (está dando corda em si mesmo)
    if (v === 2) {
      g.fillStyle(OUT); g.fillRect(c - 8, 3, 16, 3); g.fillCircle(c - 8, 4.5, 2.4); g.fillCircle(c + 8, 4.5, 2.4);
      g.fillStyle(0xd99a5b); g.fillCircle(c - 8, 4.5, 1.4); g.fillCircle(c + 8, 4.5, 1.4); g.fillRect(c - 7, 4, 14, 1.2);
    } else {
      g.fillStyle(OUT); g.fillRect(c - 1.5, 3, 3, 6); g.fillCircle(c - 3, 3, 2.4); g.fillCircle(c + 3, 3, 2.4);
      g.fillStyle(0xd99a5b); g.fillCircle(c - 3, 3, 1.4); g.fillCircle(c + 3, 3, 1.4);
    }
  };

  // Toupeira de sal: corpo cinza-azulado salpicado de cristais de sal, focinho rosado e garras largas.
  const mole = (g: Graphics, T: number, v: 0 | 1 | 2 = 0): void => {
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
    const up = v === 1 ? -1.5 : 0; // fareja: o focinho sobe e desce
    g.fillStyle(OUT); g.fillEllipse(c, 27 + up, 14, 10);
    g.fillStyle(0xe8a7a0); g.fillEllipse(c, 27 + up, 12, 8);
    g.fillStyle(OUT); g.fillCircle(c, 25 + up, 2.2);
    g.fillStyle(0xffd0cb); g.fillCircle(c - 0.6, 24.4 + up, 0.7);
    // olhinhos minúsculos
    g.fillStyle(OUT); g.fillCircle(c - 7, 19, 1.8); g.fillCircle(c + 7, 19, 1.8);
    g.fillStyle(0xffffff); g.fillCircle(c - 7.4, 18.5, 0.6); g.fillCircle(c + 6.6, 18.5, 0.6);
    // garras largas
    for (const gx of [c - 14, c + 14]) {
      g.fillStyle(OUT); g.fillEllipse(gx, 29, 9, 8);
      g.fillStyle(0xe8a7a0); g.fillEllipse(gx, 29, 7, 6);
      g.fillStyle(0xf6f2e2); g.fillRect(gx - 3, 31, 1.6, 3); g.fillRect(gx, 31.4, 1.6, 3); g.fillRect(gx + 2.6, 31, 1.6, 3);
    }
  };

  // Coruja do scriptorium: penas marrom-claras, olhos grandes e dourados, tufos nas orelhas e um livrinho nas garras.
  const owl = (g: Graphics, T: number, v: 0 | 1 | 2 = 0): void => {
    const c = T / 2;
    g.fillStyle(0x000000, 0.2); g.fillEllipse(c, T - 3, 20, 5);
    // asas abertas, atrás do corpo
    const wy = v === 2 ? 15 : 22; // mirando: as asas sobem
    g.fillStyle(OUT); g.fillEllipse(c - 15, wy, 12, 22); g.fillEllipse(c + 15, wy, 12, 22);
    g.fillStyle(0x8a6d4b); g.fillEllipse(c - 15, wy, 10, 20); g.fillEllipse(c + 15, wy, 10, 20);
    g.fillStyle(0xb99a73); g.fillRect(c - 18, wy - 8, 2, 14); g.fillRect(c + 16, wy - 8, 2, 14);
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
    if (v === 1) { // piscando
      g.fillStyle(0xa98a63); g.fillCircle(c - 5.5, 16, 5); g.fillCircle(c + 5.5, 16, 5);
      g.fillStyle(OUT); g.fillRect(c - 9.5, 16, 8, 1.6); g.fillRect(c + 1.5, 16, 8, 1.6);
    } else {
      const big = v === 2 ? 1.5 : 0; // mirando: olhos arregalados e dourados, brilhando
      g.fillStyle(0xf8ecc8); g.fillCircle(c - 5.5, 16, 5 + big * 0.4); g.fillCircle(c + 5.5, 16, 5 + big * 0.4);
      g.fillStyle(v === 2 ? 0xffd54f : 0xf2a900); g.fillCircle(c - 5.5, 16, 3.4 + big * 0.5); g.fillCircle(c + 5.5, 16, 3.4 + big * 0.5);
      g.fillStyle(OUT); g.fillCircle(c - 5.5, 16, v === 2 ? 1.1 : 1.8); g.fillCircle(c + 5.5, 16, v === 2 ? 1.1 : 1.8);
      g.fillStyle(0xffffff); g.fillCircle(c - 6.2, 15.2, 0.7); g.fillCircle(c + 4.8, 15.2, 0.7);
    }
    // bico
    g.fillStyle(OUT); g.fillTriangle(c - 2.6, 19, c + 2.6, 19, c, 24);
    g.fillStyle(0xe0a030); g.fillTriangle(c - 1.8, 19.4, c + 1.8, 19.4, c, 22.8);
    // pés com garras
    g.fillStyle(OUT); g.fillRect(c - 8, T - 8, 6, 5); g.fillRect(c + 2, T - 8, 6, 5);
    g.fillStyle(0xe0a030); g.fillRect(c - 7, T - 7, 4, 3); g.fillRect(c + 3, T - 7, 4, 3);
  };

  // Gosma de mercúrio: uma gota de prata viva, com um brilho azulado, olhos redondos e uma poça aos pés. No segundo
  // quadro achata e estica (respira).
  const slime = (g: Graphics, T: number, v: 0 | 1 | 2 = 0): void => {
    const c = T / 2;
    const w = v === 1 ? 31 : 28;
    const h = v === 1 ? 20 : 24;
    g.fillStyle(0x000000, 0.25); g.fillEllipse(c, T - 4, 30, 6);
    g.fillStyle(0x9fb2c0, 0.55); g.fillEllipse(c, T - 6, 34, 8); // poça
    g.fillStyle(OUT); g.fillEllipse(c, T - 8 - h / 2, w + 3, h + 3); g.fillTriangle(c - 4, T - 8 - h - 4, c - 9, T - 14 - h / 2, c + 6, T - 14 - h / 2);
    g.fillStyle(0xb7c7d6); g.fillEllipse(c, T - 8 - h / 2, w, h); g.fillTriangle(c - 3, T - 8 - h - 2, c - 8, T - 14 - h / 2, c + 5, T - 14 - h / 2);
    g.fillStyle(0xe4edf5); g.fillEllipse(c - 5, T - 12 - h / 2, w * 0.45, h * 0.4);
    g.fillStyle(0x7e94a8); g.fillEllipse(c + 6, T - 5 - h / 2, w * 0.4, h * 0.4);
    // olhos
    const ey = T - 9 - h / 2;
    g.fillStyle(OUT); g.fillCircle(c - 5.5, ey, 4.4); g.fillCircle(c + 5.5, ey, 4.4);
    g.fillStyle(0xffffff); g.fillCircle(c - 5.5, ey, 3.4); g.fillCircle(c + 5.5, ey, 3.4);
    g.fillStyle(OUT); g.fillCircle(c - 5, ey + 0.4, 1.6); g.fillCircle(c + 6, ey + 0.4, 1.6);
    g.fillStyle(OUT); g.fillRect(c - 3, ey + 7, 6, 1.6); // boquinha
    // gotinhas de prata soltas
    g.fillStyle(0xe4edf5); g.fillCircle(c - 15, T - 12, 1.8); g.fillCircle(c + 15, T - 15, 1.4);
  };

  // Sentinela de cera: um cavaleiro-vela. Cabeça de cera derretida com viseira de olhos âmbar e o pavio aceso no topo,
  // corpo de vela com um cinto de latão e gotas escorrendo, um escudo-castiçal e os pés numa poça de cera.
  // Tudo cabe nos 40 px: no segundo quadro a chama se inclina e as gotas descem.
  const sentinel = (g: Graphics, T: number, v: 0 | 1 | 2 = 0): void => {
    const c = T / 2;
    const WAX = 0xf1e6c4, LIGHT = 0xfffbe8, SHADE = 0xd2c08c, DEEP = 0xb7a56f, BRASS = 0xb58a2f, BRASS_L = 0xe6c15a;
    const drip = v === 1 ? 1.5 : 0;
    // poça de cera aos pés
    g.fillStyle(0x000000, 0.25); g.fillEllipse(c, T - 2.5, 28, 5);
    g.fillStyle(DEEP); g.fillEllipse(c, T - 4, 26, 6);
    g.fillStyle(SHADE); g.fillEllipse(c - 1, T - 4.6, 20, 4);
    // pés
    g.fillStyle(OUT); g.fillRoundedRect(c - 10, 31, 8, 7, 2); g.fillRoundedRect(c + 2, 31, 8, 7, 2);
    g.fillStyle(WAX); g.fillRoundedRect(c - 9, 32, 6, 5, 1.5); g.fillRoundedRect(c + 3, 32, 6, 5, 1.5);
    // corpo de vela
    g.fillStyle(OUT); g.fillRoundedRect(c - 11, 19, 22, 15, 3);
    g.fillStyle(WAX); g.fillRoundedRect(c - 10, 20, 20, 13, 2);
    g.fillStyle(SHADE); g.fillRect(c + 4, 21, 6, 12);
    g.fillStyle(LIGHT); g.fillRect(c - 9, 21, 2, 10);
    // cinto de latão
    g.fillStyle(OUT); g.fillRect(c - 11, 27, 22, 4);
    g.fillStyle(BRASS); g.fillRect(c - 10, 28, 20, 2); g.fillStyle(BRASS_L); g.fillRect(c - 10, 28, 20, 1); g.fillStyle(OUT); g.fillRect(c - 1.5, 27.4, 3, 3);
    // gotas escorrendo pelo peito
    g.fillStyle(WAX); g.fillRect(c - 6, 20, 3, 5 + drip); g.fillCircle(c - 4.5, 25 + drip, 1.8);
    g.fillRect(c + 1, 20, 2.4, 3 + drip); g.fillCircle(c + 2.2, 23 + drip, 1.4);
    // braço direito (livre) e braço esquerdo com o escudo-castiçal
    g.fillStyle(OUT); g.fillRoundedRect(c + 10, 21, 6, 10, 2);
    g.fillStyle(WAX); g.fillRoundedRect(c + 11, 22, 4, 8, 1.5); g.fillStyle(SHADE); g.fillRect(c + 13.4, 23, 1.6, 6);
    g.fillStyle(OUT); g.fillCircle(c - 14, 27, 6);
    g.fillStyle(BRASS); g.fillCircle(c - 14, 27, 5); g.fillStyle(BRASS_L); g.fillCircle(c - 15, 25.6, 2.4);
    g.fillStyle(0x7d5c1d); g.fillCircle(c - 13.5, 28.4, 2.2); g.fillStyle(WAX); g.fillCircle(c - 14, 27, 1.2); // um tocoto de vela no meio
    g.fillStyle(OUT); g.fillRect(c - 11, 24, 2, 5);
    g.fillStyle(WAX); g.fillRect(c - 11, 25, 1, 3);
    // cabeça: capuz de cera derretida (as bordas escorrem) com a viseira
    g.fillStyle(OUT); g.fillRoundedRect(c - 10, 9, 20, 14, 5); g.fillRoundedRect(c - 11.5, 15, 4, 8 + drip, 2); g.fillRoundedRect(c + 7.5, 15, 4, 6 + drip, 2);
    g.fillStyle(WAX); g.fillRoundedRect(c - 9, 10, 18, 12, 4); g.fillRoundedRect(c - 10.5, 16, 2.4, 6 + drip, 1.2); g.fillRoundedRect(c + 8.1, 16, 2.4, 4 + drip, 1.2);
    g.fillStyle(SHADE); g.fillRect(c + 4, 12, 4, 9); g.fillStyle(LIGHT); g.fillRect(c - 7, 11, 5, 1.6);
    g.fillStyle(OUT); g.fillRoundedRect(c - 7.5, 14, 15, 5, 1.5);
    g.fillStyle(0xffc34d); g.fillRect(c - 6, 15, 4, 3); g.fillRect(c + 2, 15, 4, 3);
    g.fillStyle(0xfff0b0); g.fillRect(c - 5.4, 15.4, 1.6, 1.4); g.fillRect(c + 2.6, 15.4, 1.6, 1.4);
    // pavio e chama (a chama se inclina no segundo quadro)
    const lean = v === 1 ? 1.6 : 0;
    g.fillStyle(OUT); g.fillRect(c - 1, 6, 2, 5);
    g.fillStyle(OUT); g.fillTriangle(c + lean, 0, c - 4.4, 8, c + 4.4, 8);
    g.fillStyle(0xe8501f); g.fillTriangle(c + lean, 1.2, c - 3.4, 7.6, c + 3.4, 7.6);
    g.fillStyle(0xffa94d); g.fillTriangle(c + lean, 3, c - 2.2, 7.6, c + 2.2, 7.6);
    g.fillStyle(0xfff0b0); g.fillTriangle(c + lean * 0.6, 5, c - 1, 7.6, c + 1, 7.6);
  };

  // Ratinho do celeiro: pardo, de orelhas grandes e rosadas, cauda comprida; no segundo quadro mexe o focinho.
  const rat = (g: Graphics, T: number, v: 0 | 1 | 2 = 0): void => {
    const c = T / 2;
    g.fillStyle(0x000000, 0.22); g.fillEllipse(c, T - 4, 22, 5);
    // cauda
    g.lineStyle(2, OUT); g.beginPath(); g.moveTo(c - 10, T - 9); g.lineTo(c - 17, T - 7); g.lineTo(c - 18, T - 13); g.strokePath();
    g.lineStyle(1, 0xe8a7a0); g.beginPath(); g.moveTo(c - 10, T - 9); g.lineTo(c - 17, T - 7); g.lineTo(c - 18, T - 13); g.strokePath();
    // corpo
    g.fillStyle(OUT); g.fillEllipse(c, T - 12, 24, 16);
    g.fillStyle(0xa58a6e); g.fillEllipse(c, T - 12, 22, 14);
    g.fillStyle(0xd9c3a3); g.fillEllipse(c + 1, T - 9, 14, 7);
    // cabeça e orelhas
    g.fillStyle(OUT); g.fillCircle(c + 9, T - 17, 7); g.fillCircle(c + 4, T - 23, 5); g.fillCircle(c + 13, T - 23, 5);
    g.fillStyle(0xa58a6e); g.fillCircle(c + 9, T - 17, 6);
    g.fillStyle(0xe8a7a0); g.fillCircle(c + 4, T - 23, 3.6); g.fillCircle(c + 13, T - 23, 3.6);
    // focinho, olho e bigodes
    const nose = v === 1 ? 1.2 : 0;
    g.fillStyle(OUT); g.fillCircle(c + 15.5 + nose, T - 16, 2); g.fillCircle(c + 10, T - 19, 1.6);
    g.fillStyle(0xe8a7a0); g.fillCircle(c + 15.5 + nose, T - 16, 1.2);
    g.fillStyle(0xffffff); g.fillCircle(c + 9.6, T - 19.4, 0.5);
    g.lineStyle(1, OUT); g.beginPath(); g.moveTo(c + 14, T - 15); g.lineTo(c + 19, T - 13 + nose); g.moveTo(c + 14, T - 17); g.lineTo(c + 19, T - 18 - nose); g.strokePath();
    // patinhas
    g.fillStyle(OUT); g.fillRect(c - 6, T - 7, 4, 4); g.fillRect(c + 4, T - 7, 4, 4);
    g.fillStyle(0xe8a7a0); g.fillRect(c - 5, T - 6, 2, 2); g.fillRect(c + 5, T - 6, 2, 2);
  };

  // Salamandra do caldeirão: lagartixa laranja de brasa, pintas de fogo, olhos sonolentos e a cauda enrolada.
  const salamander = (g: Graphics, T: number, v: 0 | 1 | 2 = 0): void => {
    const c = T / 2;
    g.fillStyle(0x000000, 0.22); g.fillEllipse(c, T - 4, 28, 6);
    g.fillStyle(0x6a3a22, 0.5); g.fillEllipse(c, T - 5, 34, 8); // pedra quente
    // cauda enrolada
    g.lineStyle(5, OUT); g.beginPath(); g.arc(c - 11, T - 12, 7, 0.3, Math.PI * 1.7, false); g.strokePath();
    g.lineStyle(3, 0xe8782a); g.beginPath(); g.arc(c - 11, T - 12, 7, 0.3, Math.PI * 1.7, false); g.strokePath();
    // corpo
    g.fillStyle(OUT); g.fillEllipse(c + 2, T - 13, 26, 15);
    g.fillStyle(0xf08a35); g.fillEllipse(c + 2, T - 13, 24, 13);
    g.fillStyle(0xffc46b); g.fillEllipse(c + 4, T - 10, 15, 6);
    // pintas de brasa
    g.fillStyle(0xd6452f); g.fillCircle(c - 2, T - 16, 1.7); g.fillCircle(c + 5, T - 17, 1.7); g.fillCircle(c + 11, T - 15, 1.4);
    // cabeça
    g.fillStyle(OUT); g.fillEllipse(c + 14, T - 15, 14, 11);
    g.fillStyle(0xf08a35); g.fillEllipse(c + 14, T - 15, 12, 9);
    // olho sonolento (o segundo quadro abre)
    g.fillStyle(OUT); g.fillCircle(c + 16, T - 17, 2.2);
    if (v === 1) { g.fillStyle(0xffe08a); g.fillCircle(c + 16, T - 17, 1.4); g.fillStyle(OUT); g.fillCircle(c + 16.3, T - 17, 0.7); }
    else { g.fillStyle(0xf08a35); g.fillRect(c + 13.8, T - 18.4, 4.4, 1.5); }
    // patinhas
    g.fillStyle(OUT); for (const px of [c - 4, c + 8]) { g.fillRect(px, T - 8, 4, 4); }
    g.fillStyle(0xf08a35); for (const px of [c - 3, c + 9]) { g.fillRect(px, T - 7, 2, 2); }
    // faísca no ar
    g.fillStyle(0xffd27a); g.fillRect(c + 2, v === 1 ? T - 30 : T - 27, 2, 2);
  };

  // Cada criatura tem dois quadros de vida (a chama balança, os ponteiros andam, a toupeira fareja, a coruja pisca) e
  // um quadro de estado: o relógio dando corda na pausa e a coruja mirando.
  make('enemy_lantern', (g, T) => lantern(g, T, 0));
  make('enemy_lantern_1', (g, T) => lantern(g, T, 1));
  make('enemy_clock', (g, T) => clock(g, T, 0));
  make('enemy_clock_1', (g, T) => clock(g, T, 1));
  make('enemy_clock_pause', (g, T) => clock(g, T, 2));
  make('enemy_mole', (g, T) => mole(g, T, 0));
  make('enemy_mole_1', (g, T) => mole(g, T, 1));
  make('enemy_owl', (g, T) => owl(g, T, 0));
  make('enemy_owl_1', (g, T) => owl(g, T, 1));
  make('enemy_owl_aim', (g, T) => owl(g, T, 2));
  make('enemy_slime', (g, T) => slime(g, T, 0));
  make('enemy_slime_1', (g, T) => slime(g, T, 1));
  make('enemy_sentinel', (g, T) => sentinel(g, T, 0));
  make('enemy_sentinel_1', (g, T) => sentinel(g, T, 1));
  make('enemy_rat', (g, T) => rat(g, T, 0));
  make('enemy_rat_1', (g, T) => rat(g, T, 1));
  make('enemy_salamander', (g, T) => salamander(g, T, 0));
  make('enemy_salamander_1', (g, T) => salamander(g, T, 1));
}
