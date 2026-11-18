// Legibilidade dos personagens a 40 px (issue #34): abre o catálogo de sprites num navegador e confere duas coisas.
//   1. SILHUETA: dois chefes (ou dois inimigos) não podem ter a mesma forma. Compara a máscara de opacidade de cada par
//      (interseção sobre união, IoU) no mesmo quadro de 40 px; acima do limite, os dois se confundem.
//   2. CONTORNO: sobre cada chão do jogo, a borda de cada criatura precisa de contraste (razão WCAG) com ele; se a
//      borda some no chão, a criatura some junto (o caso do fantasma pálido sobre o chão claro).
// Roda com `npm run silhouettes` (o servidor de dev sobe sozinho; URL e CHROME/PW como no smoke). Sai com 1 se falhar.
// Com `--sheet`, grava a folha de silhuetas em escala de cinza em silhuetas.png (para olhar a olho nu).
const { spawn } = require('node:child_process');
const { chromium } = require(process.env.PW || 'playwright');

const PORT = 5198;
const URL = (process.env.URL || `http://localhost:${PORT}`).replace(/\/$/, '');
let server = null;
async function ensureServer() {
  if (process.env.URL) return;
  server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(URL + '/')).ok) return; } catch { /* ainda subindo */ }
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error('o servidor de dev não subiu');
}

// Limites (ajustados depois de medir o jogo; veja docs/09-sprites.md)
// A silhueta é uma guarda contra regressão, não uma prova: a sobreposição (IoU) de duas máscaras no mesmo quadro
// é grosseira (silhuetas redondas, como a gosma e a toupeira, se sobrepõem muito e se distinguem pela cor). Medido
// em 2026-11-18: pior par de chefes 0.74, pior de inimigos 0.82. Acima do AVISO só avisa; acima do LIMITE falha.
const WARN_IOU = 0.72;
const MAX_IOU = { chefes: 0.8, inimigos: 0.85 };
const MIN_EDGE_RATIO = 1.6; // razão de contraste mínima entre a borda e o chão
const MIN_EDGE_SHARE = 0.3; // pelo menos esta parte da borda precisa passar

const BOSSES = ['witch_idle_0', 'mandrake_idle_0', 'chimera_idle_0', 'lion_idle_0', 'ouro_idle_0'];
const FLOORS = ['floor1', 'floor2', 'g_floor1', 'g_floor2'];

(async () => {
  await ensureServer();
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(URL + '/sprites.html?zoom=1');
  await page.waitForFunction(() => document.querySelectorAll('figure canvas').length > 100, { timeout: 60000 });

  const data = await page.evaluate(({ BOSSES, FLOORS, MIN_EDGE_RATIO, sheet }) => {
    const get = key => {
      for (const f of document.querySelectorAll('figure')) {
        if (f.querySelector('b')?.textContent === key) return f.querySelector('canvas');
      }
      return null;
    };
    const pixels = key => { const c = get(key); if (!c) return null; const ctx = c.getContext('2d'); return { w: c.width, h: c.height, d: ctx.getImageData(0, 0, c.width, c.height).data }; };
    const all = [...document.querySelectorAll('figure b')].map(e => e.textContent);
    const enemies = all.filter(k => /^enemy_/.test(k) && !/_(1|pause|aim)$/.test(k));
    const lum = (r, g, b) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const ratio = (a, b) => { const [hi, lo] = a > b ? [a, b] : [b, a]; return (hi + 0.05) / (lo + 0.05); };
    const mask = p => { const m = new Uint8Array(p.w * p.h); for (let i = 0; i < m.length; i++) m[i] = p.d[i * 4 + 3] >= 128 ? 1 : 0; return m; };
    const iou = (a, b) => { let i = 0, u = 0; for (let k = 0; k < a.length; k++) { if (a[k] && b[k]) i++; if (a[k] || b[k]) u++; } return u ? i / u : 0; };
    // o chão: média da cor opaca da textura
    const floorLum = {};
    for (const key of FLOORS) {
      const p = pixels(key); if (!p) continue;
      let r = 0, g = 0, b = 0, n = 0;
      for (let i = 0; i < p.w * p.h; i++) { if (p.d[i * 4 + 3] < 128) continue; r += p.d[i * 4]; g += p.d[i * 4 + 1]; b += p.d[i * 4 + 2]; n++; }
      floorLum[key] = lum(r / n, g / n, b / n);
    }
    const out = { pairs: [], edges: [], sheet: null };
    const groups = { chefes: BOSSES, inimigos: enemies };
    const cache = {};
    for (const [name, keys] of Object.entries(groups)) {
      for (const k of keys) { const p = pixels(k); if (p) cache[k] = { p, m: mask(p) }; }
      const ok = keys.filter(k => cache[k]);
      for (let i = 0; i < ok.length; i++) for (let j = i + 1; j < ok.length; j++) {
        if (cache[ok[i]].m.length === cache[ok[j]].m.length) out.pairs.push({ group: name, a: ok[i], b: ok[j], iou: iou(cache[ok[i]].m, cache[ok[j]].m) });
      }
    }
    // borda: pixel opaco com algum vizinho transparente (ou na margem do quadro)
    for (const k of [...BOSSES, ...enemies]) {
      const c = cache[k]; if (!c) continue;
      const { w, h, d } = c.p;
      const edge = [];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x; if (!c.m[i]) continue;
        const open = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const nx = x + dx, ny = y + dy; return nx < 0 || ny < 0 || nx >= w || ny >= h || !c.m[ny * w + nx]; });
        if (open) edge.push(lum(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]));
      }
      const share = {};
      for (const [fk, fl] of Object.entries(floorLum)) share[fk] = edge.filter(l => ratio(l, fl) >= MIN_EDGE_RATIO).length / (edge.length || 1);
      out.edges.push({ key: k, share });
    }
    if (sheet) {
      // folha em escala de cinza: cada silhueta em preto sobre branco, 40 px (ampliada 3x para olhar)
      const keys = [...BOSSES, ...enemies].filter(k => cache[k]);
      const cell = 50 * 3, cols = 8, rows = Math.ceil(keys.length / cols);
      const cv = document.createElement('canvas'); cv.width = cols * cell; cv.height = rows * (cell + 14);
      const ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
      keys.forEach((k, i) => {
        const { p, m } = cache[k]; const img = ctx.createImageData(p.w, p.h);
        for (let q = 0; q < m.length; q++) { const v = m[q] ? 0 : 255; img.data[q * 4] = img.data[q * 4 + 1] = img.data[q * 4 + 2] = v; img.data[q * 4 + 3] = 255; }
        const tmp = document.createElement('canvas'); tmp.width = p.w; tmp.height = p.h; tmp.getContext('2d').putImageData(img, 0, 0);
        ctx.imageSmoothingEnabled = false;
        const x = (i % cols) * cell, y = Math.floor(i / cols) * (cell + 14);
        ctx.drawImage(tmp, x, y, p.w * 3, p.h * 3);
        ctx.fillStyle = '#000'; ctx.font = '10px sans-serif'; ctx.fillText(k, x + 2, y + p.h * 3 + 10);
      });
      out.sheet = cv.toDataURL('image/png');
    }
    return out;
  }, { BOSSES, FLOORS, MIN_EDGE_RATIO, sheet: process.argv.includes('--sheet') });

  let failed = 0;
  const step = (name, ok, detail = '') => { console.log(`${ok ? 'ok   ' : 'FALHA'} ${name}${detail ? ': ' + detail : ''}`); if (!ok) failed++; };

  for (const group of ['chefes', 'inimigos']) {
    const pairs = data.pairs.filter(p => p.group === group).sort((a, b) => b.iou - a.iou);
    const worst = pairs[0];
    for (const p of pairs.filter(p => p.iou > WARN_IOU && p.iou <= MAX_IOU[group])) console.log(`aviso silhueta parecida: ${p.a} x ${p.b}, IoU ${p.iou.toFixed(2)} (diferenciar também pela cor)`);
    for (const p of pairs.filter(p => p.iou > MAX_IOU[group])) step(`silhueta distinta: ${p.a} x ${p.b}`, false, `IoU ${p.iou.toFixed(2)} (máximo ${MAX_IOU[group]})`);
    if (worst) step(`silhuetas dos ${group} distintas`, worst.iou <= MAX_IOU[group], `pior par ${worst.a} x ${worst.b}, IoU ${worst.iou.toFixed(2)}`);
  }
  for (const e of data.edges) {
    const bad = Object.entries(e.share).filter(([, s]) => s < MIN_EDGE_SHARE);
    step(`borda legível sobre os chãos: ${e.key}`, bad.length === 0, bad.map(([f, s]) => `${f} ${(s * 100).toFixed(0)}%`).join(', ') || Object.values(e.share).map(s => (s * 100).toFixed(0) + '%').join('/'));
  }
  if (data.sheet) {
    require('node:fs').writeFileSync('silhuetas.png', Buffer.from(data.sheet.split(',')[1], 'base64'));
    console.log('folha de silhuetas gravada em silhuetas.png');
  }
  step('sem erros no navegador', errors.length === 0, errors.join(' | '));
  await browser.close();
  if (server) server.kill();
  console.log(failed ? `\n${failed} passo(s) falharam.` : '\nTudo certo.');
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); if (server) server.kill(); process.exit(1); });
