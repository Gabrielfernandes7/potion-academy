// Roo de fogo (IDEIA, não entra no jogo): pinta brasas e chamas por cima das texturas prontas da Roo.
// Versão: capa vermelho+branco, CHAPÉU DE FOGO (gradiente + ponta ondulada), PADRÃO DE CHAMAS na
// barra do manto (estilo capa do Hokage) e MUITAS faíscas espalhadas pelo personagem.
// Só a página sprites-ideas.html usa este módulo. As posições vêm das mesmas contas de roo.ts
// (cx, cy, balanço do passo, varinha); as cores do corpo são detectadas pelos pixels da textura.
// Sem Phaser: só canvas 2D.

export type FireDir = 'down' | 'up' | 'side';
export type FireIntensity = 'low' | 'medium' | 'high';
export type CloakPalette = 'red-white' | 'red-yellow' | 'original';

export interface FireOpts {
  dir: FireDir;
  frame: number; // 0 a 3 (caminhada); dormindo usa 0 ou 1
  sleep?: boolean;
  intensity?: FireIntensity; // padrão: 'high'
  cloakPalette?: CloakPalette; // padrão: 'red-white'
  // Fase do tremor da chama (0 a 7). Sem ela, usa o quadro do corpo (0 a 3).
  tick?: number;
  // Estágio da transformação (a Roo vai pegando o fogo aos poucos):
  // 0 = original (capa roxa, sem fogo); 1 = capa vermelha em degradê; 2 = chapéu em chama, varinha e olhos;
  // 3 = manto em chamas e orelhas; 4 = faíscas e brasas. Padrão: 4 (completa).
  stage?: number;
}

// ---------------------------------------------------------------- paletas
export const FIRE = {
  ash: 0x3a1a10,
  dark: 0xd6452f,
  mid: 0xffa94d,
  light: 0xfff0b0,
  white: 0xfffbe0,
  eye: 0xff8a1f,
} as const;

export const CLOAK = {
  red: 0xc62828,
  redDark: 0x8e1c1c,
  white: 0xfff5e0,
  whiteWarm: 0xffe0b0,
  yellow: 0xffd000,
  yellowL: 0xffe680,
} as const;

// Degradê vermelho da capa, do topo (claro) à barra (escuro). Cada faixa é um degrau de pixel.
export const CLOAK_GRADIENT = [0xe53935, 0xc62828, 0xa31d1d, 0x8e1c1c, 0x6a1414] as const;

export const FIRE_PALETTE: ReadonlyArray<{ name: string; hex: string }> = [
  { name: 'contorno', hex: '#1c1410' },
  { name: 'corpo (pelo)', hex: '#ff9a3a' },
  { name: 'capa vermelha', hex: '#c62828' },
  { name: 'capa vermelha escura', hex: '#8e1c1c' },
  { name: 'detalhe branco', hex: '#fff5e0' },
  { name: 'branco quente (sombra)', hex: '#ffe0b0' },
  { name: 'realce amarelo', hex: '#ffd000' },
  { name: 'realce amarelo claro', hex: '#ffe680' },
  { name: 'brasa escura', hex: '#3a1a10' },
  { name: 'chama escura', hex: '#d6452f' },
  { name: 'chama média', hex: '#ffa94d' },
  { name: 'chama clara', hex: '#fff0b0' },
  { name: 'núcleo quente', hex: '#fffbe0' },
  { name: 'olhos', hex: '#ff8a1f' },
];

const TILE = 40;
const HEAD_ROOM = 10;
// oito fases: a chama oscila para um lado e para o outro sem repetir o padrão a cada quadro
const WOBBLE = [0, -1, 0, 1, -1, 0, 1, 0];

type Px = readonly [number, number, number, number];
type Put = (x: number, y: number, c: number) => void;
type PutIfEmpty = (x: number, y: number, c: number) => void;

// ---------------------------------------------------------------- detectores de origem
// Roxo da capa, inclusive as mesclas com alfa (contorno, brilho e sombra do manto). Antes, a regra
// ignorava tons mais apagados, que ficavam roxos depois do recolor.
const isPurple = (r: number, g: number, b: number): boolean => b > g + 8 && b >= r * 0.8;
const isGold = (r: number, g: number, b: number): boolean => r > 190 && b < 120 && g / r > 0.7;
const isFur = (r: number, g: number, b: number): boolean => r > 170 && g > 70 && g < 175 && b < 100;
const isOutline = (r: number, g: number, b: number, a: number): boolean =>
  a > 128 && r < 60 && g < 50 && b < 50;

// ---------------------------------------------------------------- detectores pós-recolor
const pack = (c: number): number =>
  ((c >> 16) & 255) | (((c >> 8) & 255) << 8) | ((c & 255) << 16);

const RED_SET = new Set<number>([...CLOAK_GRADIENT.map(c => pack(c)), pack(CLOAK.redDark)]);
const WHITE_SET = new Set<number>([pack(CLOAK.white), pack(CLOAK.whiteWarm)]);
const YELLOW_SET = new Set<number>([pack(CLOAK.yellow), pack(CLOAK.yellowL)]);

const isRedCloak = (r: number, g: number, b: number): boolean =>
  RED_SET.has(r | (g << 8) | (b << 16));
const isWhiteDetail = (r: number, g: number, b: number): boolean =>
  WHITE_SET.has(r | (g << 8) | (b << 16));
const isYellowDetail = (r: number, g: number, b: number): boolean =>
  YELLOW_SET.has(r | (g << 8) | (b << 16));

// ---------------------------------------------------------------- recolor
// Cor da capa numa altura: o degrau vem da posição vertical; a sombra original escurece um degrau e a
// luz clareia um. Na fronteira entre degraus, xadrez (sem degradê suave, estilo pixel).
function cloakShade(x: number, y: number, r: number, top: number, span: number): number {
  const last = CLOAK_GRADIENT.length - 1;
  const t = Math.min(1, Math.max(0, (y - top) / span)) * last;
  let idx = Math.floor(t);
  const frac = t - idx;
  if (frac > 0.5 && (x + y) % 2 === 0 && idx < last) idx++;
  if (r < 75) idx = Math.min(last, idx + 1);
  else if (r > 110) idx = Math.max(0, idx - 1);
  return CLOAK_GRADIENT[idx];
}

function recolorCloak(
  d: Uint8ClampedArray,
  w: number,
  h: number,
  palette: CloakPalette,
): void {
  if (palette === 'original') return;
  // altura da capa (primeira e última linha com roxo), para distribuir o degradê
  let top = h;
  let bottom = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (d[i + 3] >= 40 && isPurple(d[i], d[i + 1], d[i + 2])) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }
  const span = Math.max(1, bottom - top);
  const detail = palette === 'red-white' ? 'white' : 'yellow';
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (d[i + 3] < 40) continue;
      const r = d[i], g = d[i + 1], b = d[i + 2];
      if (isPurple(r, g, b)) {
        const c = cloakShade(x, y, r, top, span);
        d[i] = (c >> 16) & 255;
        d[i + 1] = (c >> 8) & 255;
        d[i + 2] = c & 255;
      } else if (isGold(r, g, b)) {
        let c: number;
        if (detail === 'white') c = r > 230 ? CLOAK.white : CLOAK.whiteWarm;
        else c = r > 230 ? CLOAK.yellowL : CLOAK.yellow;
        d[i] = (c >> 16) & 255;
        d[i + 1] = (c >> 8) & 255;
        d[i + 2] = c & 255;
      }
    }
  }
}

// ---------------------------------------------------------------- língua de chama
function flameTongue(
  put: Put,
  putEmpty: PutIfEmpty,
  x: number,
  baseY: number,
  h: number,
  phase: number,
  over = false,
): void {
  if (h <= 0) return;
  const draw = over ? put : putEmpty;
  const wob = WOBBLE[phase % 4];
  for (let row = 0; row < h; row++) {
    const y = baseY - row;
    const t = row / Math.max(1, h - 1);
    if (row === 0) {
      draw(x - 1, y, FIRE.dark);
      draw(x, y, FIRE.mid);
      draw(x + 1, y, FIRE.dark);
    } else if (t < 0.55) {
      draw(x - 1, y, FIRE.mid);
      draw(x, y, FIRE.light);
      draw(x + 1, y, FIRE.mid);
    } else if (t < 0.85) {
      draw(x + wob, y, FIRE.light);
    } else {
      draw(x + wob, y, FIRE.white);
    }
  }
}

// ---------------------------------------------------------------- transformação principal
export function makeFireRoo(
  src: CanvasImageSource & { width: number; height: number },
  o: FireOpts,
): HTMLCanvasElement {
  const w = src.width;
  const h = src.height;
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const ctx = out.getContext('2d');
  if (!ctx) return out;
  ctx.drawImage(src, 0, 0);
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;

  const lvl = o.stage ?? 4;
  if (lvl >= 1) recolorCloak(d, w, h, o.cloakPalette ?? 'red-white');

  const sleep = !!o.sleep;
  const f = o.frame % 4; // quadro do corpo (andar e respirar): define o corpo e as âncoras
  // ph: fase do tremor do fogo (0 a 7). Anda sozinha, mesmo parada, então a chama vibra sem mexer no corpo.
  const ph = o.tick ?? f;
  const intensity = o.intensity ?? 'high';

  const inside = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < w && y < h;
  const at = (x: number, y: number): Px => {
    if (!inside(x, y)) return [0, 0, 0, 0];
    const i = (y * w + x) * 4;
    return [d[i], d[i + 1], d[i + 2], d[i + 3]];
  };
  const put: Put = (fx, fy, c) => {
    const x = Math.round(fx);
    const y = Math.round(fy);
    if (!inside(x, y)) return;
    const i = (y * w + x) * 4;
    d[i] = (c >> 16) & 255;
    d[i + 1] = (c >> 8) & 255;
    d[i + 2] = c & 255;
    d[i + 3] = 255;
  };
  const putIfEmpty: PutIfEmpty = (fx, fy, c) => {
    const x = Math.round(fx);
    const y = Math.round(fy);
    if (inside(x, y) && at(x, y)[3] < 40) put(x, y, c);
  };

  // ------------------------------------------------ âncoras
  const bob = sleep ? 0 : [0, 1.2, 0, -1.2][f];
  const cx = TILE / 2;
  const cy = TILE / 2 + 1 + bob + (sleep ? 1.5 : 0) + HEAD_ROOM;
  const wave = sleep ? 0 : Math.sin((f * Math.PI) / 2) * 2;

  const hatX = o.dir === 'side' ? cx + 2 : cx;
  let wandX: number;
  let wandY: number;
  if (o.dir === 'side') {
    wandX = cx + (sleep ? 15 : 16) + wave;
    wandY = cy - (sleep ? 6 : 12);
  } else if (o.dir === 'up') {
    wandX = cx + (sleep ? 13.5 : 14) + wave * 0.5;
    wandY = cy - (sleep ? 3 : 11);
  } else {
    wandX = cx + (sleep ? 14 : 14.5) + wave * 0.5;
    wandY = cy - (sleep ? 3 : 11);
  }

  // ------------------------------------------------ topo do chapéu
  let tipY = -1;
  for (let y = 0; y < Math.floor(cy - 14) && tipY < 0; y++) {
    for (let x = 0; x < w; x++) {
      const [r, g, b, a] = at(x, y);
      if (a > 128 && isRedCloak(r, g, b)) {
        tipY = y;
        break;
      }
    }
  }

  // ------------------------------------------------ linhas do chapéu (antes do repaint)
  const hatBottom = Math.round(cy - 14);
  type HatRow = { y: number; xs: number[] };
  const hatRows: HatRow[] = [];
  for (let y = Math.max(0, tipY); y <= hatBottom && y < h; y++) {
    const xs: number[] = [];
    for (let x = 0; x < w; x++) {
      const [r, g, b, a] = at(x, y);
      if (a > 128 && isRedCloak(r, g, b)) xs.push(x);
    }
    if (xs.length > 0) hatRows.push({ y, xs });
  }
  let hatCenterX = Math.round(hatX);
  if (hatRows.length > 0) {
    let sumX = 0;
    let count = 0;
    for (const { xs } of hatRows) for (const x of xs) { sumX += x; count++; }
    if (count > 0) hatCenterX = Math.round(sumX / count);
  }

  // ------------------------------------------------ CHAPÉU VIRA CHAMA
  const totalHatRows = hatRows.length;
  if (totalHatRows > 0 && !sleep && lvl >= 2) {
    for (let i = 0; i < totalHatRows; i++) {
      const { y, xs } = hatRows[i];
      const t = (totalHatRows - 1 - i) / Math.max(1, totalHatRows - 1);
      const wobble = (y + ph) % 3 === 0 ? 0.06 : 0;
      let c: number;
      if (t + wobble < 0.22) c = FIRE.dark;
      else if (t + wobble < 0.52) c = FIRE.mid;
      else if (t + wobble < 0.82) c = FIRE.light;
      else c = FIRE.white;
      for (const x of xs) put(x, y, c);
    }
  } else if (totalHatRows > 0 && lvl >= 2) {
    for (const { y, xs } of hatRows) {
      const c = (y + ph) % 3 === 0 ? FIRE.dark : FIRE.ash;
      for (const x of xs) put(x, y, c);
    }
  }

  // ------------------------------------------------ ponta do chapéu (língua ondulada)
  let flameTipY = tipY;
  if (!sleep && tipY >= 0 && totalHatRows > 0 && lvl >= 2) {
    const wob = WOBBLE[ph];
    putIfEmpty(hatCenterX, tipY - 1, FIRE.white);
    putIfEmpty(hatCenterX + wob, tipY - 2, FIRE.light);
    putIfEmpty(hatCenterX + wob, tipY - 3, FIRE.white);
    if (intensity !== 'low') {
      putIfEmpty(hatCenterX - wob, tipY - 4, FIRE.light);
      putIfEmpty(hatCenterX - 1, tipY, FIRE.light);
      putIfEmpty(hatCenterX + 1, tipY, FIRE.light);
    }
    flameTipY = tipY - 4;
  }

  // ------------------------------------------------ chaminés laterais do chapéu
  if (!sleep && totalHatRows > 3 && intensity !== 'low' && lvl >= 2) {
    const spots: Array<[number, number]> = [
      [Math.floor(totalHatRows * 0.15), 0],
      [Math.floor(totalHatRows * 0.35), 2],
      [Math.floor(totalHatRows * 0.55), 1],
    ];
    for (const [rowIdx, phase] of spots) {
      if (rowIdx >= totalHatRows) continue;
      const row = hatRows[rowIdx];
      const leftX = row.xs[0];
      const rightX = row.xs[row.xs.length - 1];
      const w1 = WOBBLE[(ph + phase) % 4];
      const w2 = WOBBLE[(ph + phase + 2) % 4];
      putIfEmpty(leftX - 1, row.y, FIRE.mid);
      putIfEmpty(leftX - 1, row.y - 1 + w1, FIRE.light);
      putIfEmpty(rightX + 1, row.y, FIRE.mid);
      putIfEmpty(rightX + 1, row.y - 1 + w2, FIRE.light);
    }
  }

  // ------------------------------------------------ aba do chapéu: brasa escura
  if (lvl >= 2) for (let y = Math.floor(cy - 13.5); y <= Math.ceil(cy - 9.5); y++) {
    for (let x = hatX - 7; x <= hatX + 7; x++) {
      const [r, g, b, a] = at(x, y);
      if (a > 128 && isWhiteDetail(r, g, b)) {
        put(x, y, sleep ? FIRE.ash : (x + ph) % 2 === 0 ? FIRE.dark : FIRE.mid);
      } else if (a > 128 && isYellowDetail(r, g, b)) {
        put(x, y, sleep ? FIRE.ash : FIRE.dark);
      }
    }
  }

  // ------------------------------------------------ orelhas: borda em brasa
  const ears = o.dir === 'side' ? [cx - 1] : [cx - 6.5, cx + 6.5];
  const earTop = Math.floor(cy - 16 - 14);
  const earBottom = Math.floor(cy - 17);
  const ember: Array<[number, number, number]> = [];
  for (const ex of ears) {
    for (let y = earTop; y <= earBottom; y++) {
      for (let x = Math.floor(ex - 3); x <= Math.ceil(ex + 3); x++) {
        const [r, g, b, a] = at(x, y);
        if (a < 128 || !isFur(r, g, b)) continue;
        const edge = ([[1, 0], [-1, 0], [0, 1], [0, -1]] as const).some(([dx, dy]) => {
          const [nr, ng, nb, na] = at(x + dx, y + dy);
          return na < 40 || isOutline(nr, ng, nb, na);
        });
        if (edge) ember.push([x, y, (x + y + ph) % 2 === 0 && !sleep ? FIRE.light : FIRE.dark]);
      }
    }
  }
  if (lvl >= 3) for (const [x, y, c] of ember) put(x, y, c);

  if (!sleep && intensity !== 'low' && lvl >= 3) {
    for (const ex of ears) {
      let etipY = -1;
      for (let y = 0; y < Math.floor(cy - 18); y++) {
        for (let x = Math.floor(ex - 2); x <= Math.ceil(ex + 2); x++) {
          const [r, g, b, a] = at(x, y);
          if (a > 128 && isFur(r, g, b)) { etipY = y; break; }
        }
        if (etipY >= 0) break;
      }
      if (etipY >= 0) flameTongue(put, putIfEmpty, Math.round(ex), etipY - 1, 3, ph, false);
    }
  }

  // ------------------------------------------------ olhos
  if (!sleep && lvl >= 2) {
    const eyes: Array<[number, number]> = o.dir === 'down'
      ? [[cx - 3.5, cy - 11], [cx + 3.5, cy - 11]]
      : o.dir === 'side' ? [[cx + 4.5, cy - 11]] : [];
    for (const [ex, ey] of eyes) {
      for (let y = Math.floor(ey - 3); y <= Math.ceil(ey + 3); y++) {
        for (let x = Math.floor(ex - 3); x <= Math.ceil(ex + 3); x++) {
          const [r, g, b, a] = at(x, y);
          if (a > 128 && r > 200 && g > 200 && b > 200) put(x, y, FIRE.eye);
        }
      }
      put(ex, ey, FIRE.eye);
      if (intensity === 'high') put(ex - 0.4, ey - 0.4, FIRE.white);
    }
  }

  // ------------------------------------------------ chamas no colo do manto
  let mantleTop = h;
  for (let y = Math.floor(cy - 6); y < h - 4; y++) {
    let found = false;
    for (let x = 0; x < w; x++) {
      const [r, g, b, a] = at(x, y);
      if (a > 128 && isRedCloak(r, g, b)) { found = true; break; }
    }
    if (found) { mantleTop = y; break; }
  }
  if (!sleep && intensity !== 'low' && mantleTop < h && lvl >= 3) {
    let mL = -1;
    let mR = -1;
    for (let x = 0; x < w; x++) {
      const [r, g, b, a] = at(x, mantleTop);
      if (a > 128 && isRedCloak(r, g, b)) { if (mL < 0) mL = x; mR = x; }
    }
    if (mL >= 0) {
      if (mL === mR) {
        flameTongue(put, putIfEmpty, mL, mantleTop - 1, 4, ph, false);
      } else {
        flameTongue(put, putIfEmpty, mL, mantleTop - 1, 4, (ph + 1) % 4, false);
        flameTongue(put, putIfEmpty, mR, mantleTop - 1, 4, (ph + 2) % 4, false);
        if (intensity === 'high' && mR - mL > 8) {
          flameTongue(put, putIfEmpty, mL + 2, mantleTop, 3, (ph + 3) % 4, false);
          flameTongue(put, putIfEmpty, mR - 2, mantleTop, 3, ph, false);
        }
      }
    }
  }

  // ------------------------------------------------ BARRA DO MANTO + PADRÃO DE CHAMAS (Hokage)
  const hem: Array<[number, number]> = [];
  for (let x = 0; x < w; x++) {
    for (let y = h - 3; y >= Math.floor(cy + 9); y--) {
      const [r, g, b, a] = at(x, y);
      if (a > 128 && (isRedCloak(r, g, b) || isWhiteDetail(r, g, b) || isYellowDetail(r, g, b))) {
        hem.push([x, y]);
        break;
      }
    }
  }

  if (hem.length > 0 && lvl >= 3) {
    // Base da barra (brasa)
    for (const [x, y] of hem) {
      put(x, y, sleep ? FIRE.ash : (x + ph) % 3 === 0 ? FIRE.mid : FIRE.dark);
    }

    if (!sleep) {
      // Fileira de brasa escura (base das chamas)
      for (const [x, y] of hem) put(x, y - 1, FIRE.dark);

      // PADRÃO DE CHAMAS no manto: 3-5 línguas alternando altura
      const numFlames = intensity === 'high' ? 5 : intensity === 'medium' ? 4 : 3;
      const flameW = Math.max(3, Math.floor(hem.length / numFlames));

      for (let fi = 0; fi < numFlames; fi++) {
        const centerIdx = Math.floor(flameW * (fi + 0.5));
        if (centerIdx >= hem.length) break;

        const [px, py] = hem[centerIdx];
        const tall = intensity === 'low' ? false : fi % 2 === 0;
        const wob = WOBBLE[(ph + fi) % 4];

        // Base larga (3 px)
        put(px - 1, py - 1, FIRE.dark);
        put(px, py - 1, FIRE.mid);
        put(px + 1, py - 1, FIRE.dark);
        // Corpo
        put(px, py - 2, FIRE.light);
        // Ponta (só nas altas e fora do low)
        if (tall) put(px + wob, py - 3, FIRE.white);
      }

      // Chamas nas pontas laterais do manto
      const [lx, ly] = hem[0];
      const [rx, ry] = hem[hem.length - 1];
      flameTongue(put, putIfEmpty, lx - 1, ly - 1, 3, (ph + 1) % 4, false);
      flameTongue(put, putIfEmpty, rx + 1, ry - 1, 3, (ph + 2) % 4, false);

      // Faíscas abaixo da barra
      if (intensity === 'high') {
        for (let i = 0; i < hem.length; i += 3) {
          const [x, y] = hem[i];
          putIfEmpty(x, y + 1, FIRE.mid);
          putIfEmpty(x, y + 2, FIRE.ash);
        }
      }
    }
  }

  // ------------------------------------------------ varinha: chama 3x5 + faísca
  const baseY = Math.round(wandY - 4);
  const wx = Math.round(wandX);
  if (lvl < 2) {
    // sem varinha em chamas antes do estágio 2
  } else if (sleep) {
    putIfEmpty(wx, baseY, FIRE.dark);
    if (ph === 0) putIfEmpty(wx, baseY - 1, FIRE.mid);
  } else {
    put(wx - 1, baseY, FIRE.dark);
    put(wx, baseY, FIRE.mid);
    put(wx + 1, baseY, FIRE.dark);
    put(wx - 1, baseY - 1, FIRE.mid);
    put(wx, baseY - 1, FIRE.light);
    put(wx + 1, baseY - 1, FIRE.mid);
    const wob = WOBBLE[ph];
    put(wx + wob, baseY - 2, FIRE.light);
    put(wx + wob, baseY - 3, FIRE.white);
    if (intensity === 'high') {
      if (ph % 2 === 0) putIfEmpty(wx + 2, baseY - 2, FIRE.light);
      else putIfEmpty(wx - 2, baseY - 1, FIRE.mid);
    }
  }

  // ------------------------------------------------ pés: brasas
  const lx = cx - (o.dir === 'side' ? 8 : 11);
  const rx = cx + (o.dir === 'side' ? 9 : 11);
  if (lvl < 3) {
    // sem brasas nos pés antes do estágio 3
  } else if (sleep) {
    putIfEmpty(lx, 49, FIRE.dark);
    putIfEmpty(rx, 48, FIRE.dark);
  } else {
    putIfEmpty(lx - (ph % 2), 48, FIRE.white);
    putIfEmpty(lx + 1, 49, FIRE.mid);
    putIfEmpty(lx - 1, 49, FIRE.ash);
    putIfEmpty(rx, 48, ph % 2 === 0 ? FIRE.white : FIRE.mid);
    putIfEmpty(rx + 1, 47, ph % 2 === 0 ? FIRE.mid : FIRE.light);
    putIfEmpty(rx + 1, 48, FIRE.ash);
  }

  // ------------------------------------------------ MUITAS FAÍSCAS ESPALHADAS
  if (!sleep && intensity !== 'low' && lvl >= 4) {
    const sparkColors = [FIRE.white, FIRE.light, FIRE.mid, FIRE.dark];

    // --- Chapéu: 5 faíscas subindo ---
    const hatSparks: Array<[number, number]> = [
      [-10, 0], [8, 0], [-5, -1], [4, -1], [0, 2],
      [-13, -3], [12, -4], [-7, -6], [7, -7], [0, -9],
    ];
    for (let i = 0; i < hatSparks.length; i++) {
      const [dx, dy] = hatSparks[i];
      const phase = (ph + i * 2) % 4;
      const spx = Math.round(cx + dx + WOBBLE[(ph + i) % 4]);
      const spy = flameTipY - 3 - phase * 2 + dy;
      if (spy < 1 || spy > 48) continue;
      putIfEmpty(spx, spy, sparkColors[phase]);
    }

    // --- Varinha: 5 faíscas caindo do wand ---
    for (let i = 0; i < 5; i++) {
      const phase = (ph + i + 1) % 4;
      const spx = Math.round(wandX + 2 + i - (ph % 2)) + WOBBLE[(ph + i) % 4];
      const spy = baseY - 5 - phase * 2 - i;
      if (spy < 1 || spy > 48) continue;
      putIfEmpty(spx, spy, sparkColors[phase]);
    }

    // --- Pés: 5 faíscas subindo ---
    for (let i = 0; i < 5; i++) {
      const phase = (ph + i + 2) % 4;
      const offX = [-9, 9, 0, -14, 14][i];
      const spx = Math.round(cx + offX + WOBBLE[(ph + i) % 4]);
      const spy = 46 - phase * 2 - i;
      if (spy < 38 || spy > 49) continue;
      putIfEmpty(spx, spy, sparkColors[phase]);
    }

    // --- Lados do manto: 2 faíscas (só high) ---
    if (intensity === 'high' && mantleTop < h) {
      let mL = -1;
      let mR = -1;
      for (let x = 0; x < w; x++) {
        const [r, g, b, a] = at(x, mantleTop + 4);
        if (a > 128 && isRedCloak(r, g, b)) { if (mL < 0) mL = x; mR = x; }
      }
      if (mL >= 0) {
        const fl = ph % 4;
        putIfEmpty(mL - 2, mantleTop + 8 - fl, FIRE.light);
        putIfEmpty(mR + 2, mantleTop + 10 + fl, FIRE.mid);
      }
    }

    // --- Rastro de brasas ao andar de lado ---
    if (o.dir === 'side' && ph > 0 && ph < 3) {
      const trailX = cx - 14 - ph * 2;
      putIfEmpty(trailX, 43 + (ph % 2), FIRE.mid);
      putIfEmpty(trailX - 1, 45 - (ph % 2), FIRE.dark);
    }
  }

  ctx.putImageData(img, 0, 0);
  return out;
}
