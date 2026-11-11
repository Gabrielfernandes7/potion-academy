// Teste de fumaça: abre o jogo, passa a carta, coloca uma bomba e confere que nada quebrou.
// Precisa do servidor de dev ligado (npm run dev) e do Playwright instalado fora do projeto.
// Uso: PW=/caminho/para/node_modules/playwright node scripts/smoke.cjs
// Sai com código 1 se houver erro de página ou se a bomba não aparecer.
const { chromium } = require(process.env.PW);

const URL = process.env.URL || 'http://localhost:5173/';

function fail(msg) {
  console.error('FALHOU:', msg);
  process.exitCode = 1;
}

(async () => {
  const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto(URL);
  await page.waitForFunction(() => document.querySelector('#menu-play'), { timeout: 20000 });
  await page.click('#menu-play');
  await page.waitForSelector('#letter-overlay.show', { timeout: 15000 });
  await page.click('#letter-btn');
  await page.waitForTimeout(1500);

  const placed = await page.evaluate(() => {
    const main = window.__game.scene.getScene('Main');
    if (!main || !main.bombSystem) return { error: 'cena Main ou bombSystem ausentes' };
    const before = main.bombSystem.bombs.length;
    main.player.gridX = 2; main.player.gridY = 2;
    main.bombSystem.placeBomb();
    return { before, after: main.bombSystem.bombs.length };
  });
  if (placed.error) fail(placed.error);
  else if (placed.after !== placed.before + 1) fail(`bomba não foi colocada (${placed.before} -> ${placed.after})`);

  await page.waitForTimeout(3500); // a bomba explode sozinha
  const exploded = await page.evaluate(() => window.__game.scene.getScene('Main').bombSystem.bombs.length);
  if (exploded !== 0) fail(`a bomba deveria ter explodido (ainda há ${exploded})`);

  if (errors.length) fail('erros no navegador:\n  ' + errors.slice(0, 5).join('\n  '));
  if (!process.exitCode) console.log('OK: carta, bomba colocada e explodida, sem erros.');
  await browser.close();
})().catch(e => { fail(e.message); process.exit(1); });
