// Teste de fumaça no navegador: abre o jogo de verdade e confere os caminhos principais, sem erros de página.
//   1. menu, carta e primeira fase (HUD, poção colocada e explodida)
//   2. as transformações: T (fogo, recusa a Poção Aqua) e Y (água, bolha de sabão)
//   3. a Arena: cada chefe do registro luta, é vencido e abre a página dele no Manuscrito
//   4. as páginas de apoio (manuscrito, catálogo de sprites, livro da história) carregam sem erro
//
// Precisa do servidor de dev ligado (npm run dev) e do Playwright instalado fora do projeto:
//   PW=/caminho/para/node_modules/playwright npm run smoke
// Opcionais: URL (padrão http://localhost:5173/), CHROME (caminho do executável do Chromium/headless shell).
// Sai com código 1 se qualquer passo falhar. Cada passo imprime "ok" ou o motivo.
const PW = process.env.PW;
if (!PW) { console.error('Defina PW=/caminho/para/node_modules/playwright (veja o cabeçalho deste arquivo).'); process.exit(2); }
const { chromium } = require(PW);

const URL = (process.env.URL || 'http://localhost:5173/').replace(/\/$/, '');
let failed = 0;
const step = (name, ok, detail = '') => { console.log(`${ok ? 'ok   ' : 'FALHA'} ${name}${detail ? ': ' + detail : ''}`); if (!ok) failed++; };

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1000, height: 820 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  const main = () => page.evaluate(() => window.__game.scene.getScene('Main'));
  const hold = async k => { await page.keyboard.down(k); await page.waitForTimeout(120); await page.keyboard.up(k); await page.waitForTimeout(150); };
  const startStage = stage => page.evaluate(s => {
    document.getElementById('menu').style.display = 'none';
    const g = window.__game; g.scene.stop('Menu'); g.scene.stop('Main'); g.scene.start('Main', s);
  }, stage);

  // 1. menu e primeira fase
  await page.goto(URL + '/');
  await page.waitForFunction(() => document.querySelector('#menu-play') && window.__game, { timeout: 30000 });
  step('menu abre com os botões', await page.evaluate(() => ['menu-play', 'menu-map', 'menu-arena', 'menu-shop', 'menu-manuscript', 'menu-music'].every(id => document.getElementById(id))));
  await page.click('#menu-play');
  await page.waitForSelector('#letter-overlay.show', { timeout: 15000 });
  await page.click('#letter-btn');
  await page.waitForTimeout(1500);
  const bombs = await page.evaluate(() => { const m = window.__game.scene.getScene('Main'); m.player.gridX = 2; m.player.gridY = 2; const a = m.bombSystem.bombs.length; m.bombSystem.placeBomb(); return [a, m.bombSystem.bombs.length]; });
  step('poção colocada', bombs[1] === bombs[0] + 1);
  await page.waitForTimeout(3500);
  step('poção explodiu sozinha', (await page.evaluate(() => window.__game.scene.getScene('Main').bombSystem.bombs.length)) === 0);

  // 2. transformações
  await startStage({ stage: 0, arena: 'belladonna' }); // a Arena libera todas as poções
  await page.waitForTimeout(2500);
  await page.evaluate(() => window.__game.scene.getScene('Main').setBomb('mega'));
  await hold('t');
  let s = await page.evaluate(() => { const m = window.__game.scene.getScene('Main'); return { id: m.forms.form.id, bomb: m.bombType }; });
  step('T transforma em fogo e troca a Poção Aqua', s.id === 'fire' && s.bomb !== 'mega', JSON.stringify(s));
  await page.evaluate(() => window.__game.scene.getScene('Main').setBomb('mega'));
  step('a Roo Fire recusa a Poção Aqua', (await page.evaluate(() => window.__game.scene.getScene('Main').bombType)) !== 'mega');
  await page.evaluate(() => { const f = window.__game.scene.getScene('Main').forms.form; f.spend(99999); f.tick(30000); });
  await hold('y');
  s = await page.evaluate(() => { const m = window.__game.scene.getScene('Main'); return { id: m.forms.form.id, stage: m.forms.form.stage }; });
  step('Y transforma em água', s.id === 'water' && s.stage === 4, JSON.stringify(s));

  // 3. Arena: cada chefe do registro
  const bosses = await page.evaluate(async () => (await import('/src/game/entities/bosses/defs.ts')).BOSS_IDS);
  for (const id of bosses) {
    await startStage({ stage: 0, arena: id });
    await page.waitForFunction(() => { const m = window.__game.scene.getScene('Main'); return m && m.boss && m.boss.name; }, { timeout: 15000 });
    await page.waitForTimeout(800);
    await page.evaluate(() => { const m = window.__game.scene.getScene('Main'); const b = m.boss; m.player.invulnerable = 99999; b.state = 'idle'; b.invulnMs = 0; b.timers = []; b.hp = 1; b.onExplosion([{ x: b.gridX, y: b.gridY }], 'fire'); b.onExplosion([{ x: b.gridX, y: b.gridY }], 'air'); b.onExplosion([{ x: b.gridX, y: b.gridY }], 'earth'); b.onExplosion([{ x: b.gridX, y: b.gridY }], 'water'); });
    try {
      await page.waitForSelector('#gameover-overlay.show', { timeout: 15000 });
      step(`Arena: ${id} é vencido`, true);
    } catch { step(`Arena: ${id} é vencido`, false, 'a tela de resultado não apareceu'); }
    await page.evaluate(() => document.getElementById('gameover-overlay').classList.remove('show'));
  }
  const wins = await page.evaluate(() => JSON.parse(localStorage.getItem('bombroo_arena_wins') || '[]'));
  step('as vitórias ficam salvas', bosses.every(b => wins.includes(b)), JSON.stringify(wins));

  // 4. páginas de apoio
  for (const [path, sel] of [['/manuscrito.html?p=leao', '.folha h2'], ['/sprites.html', '#catalog section'], ['/history.html', '.book']]) {
    await page.goto(URL + path);
    try { await page.waitForSelector(sel, { timeout: 20000 }); step(`página ${path} carrega`, true); }
    catch { step(`página ${path} carrega`, false, `não achou ${sel}`); }
  }
  await page.goto(URL + '/manuscrito.html?p=leao');
  await page.waitForSelector('.folha h2');
  step('página do Leão Verde aberta pela Arena', (await page.evaluate(() => document.querySelector('.folha h2').textContent)) === 'Leão Verde');

  step('sem erros no navegador', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  console.log(failed ? `\n${failed} passo(s) falharam.` : '\nTudo certo.');
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error('FALHA:', e.message); process.exit(1); });
