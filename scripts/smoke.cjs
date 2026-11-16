// Teste de fumaça no navegador: abre o jogo de verdade e confere os caminhos principais, sem erros de página.
//   1. menu, carta e primeira fase (HUD, poção colocada e explodida)
//   2. as transformações: T transforma na forma da poção escolhida (fogo recusa a Poção de Água; depois, com a poção de água na mão, T vira água)
//   3. a Arena: cada chefe do registro luta, é vencido e abre a página dele no Manuscrito
//   4. as páginas de apoio (manuscrito, catálogo de sprites, livro da história) carregam sem erro
//
// Roda com `npm run smoke`: o Playwright é dependência do projeto (npx playwright install chromium, uma vez) e o
// servidor de dev sobe sozinho numa porta livre. Opcionais: URL (usa um servidor já ligado, em vez de subir um),
// CHROME (executável do Chromium) e PW (caminho de outra cópia do Playwright).
// Sai com código 1 se qualquer passo falhar. Cada passo imprime "ok" ou o motivo.
const { spawn } = require('node:child_process');
const { chromium } = require(process.env.PW || 'playwright');

let server = null;
const PORT = 5199;
const URL = (process.env.URL || `http://localhost:${PORT}/`).replace(/\/$/, '');
async function ensureServer() {
  if (process.env.URL) return;
  server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(URL + '/')).ok) return; } catch { /* ainda subindo */ }
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error('o servidor de dev não subiu');
}
let failed = 0;
const step = (name, ok, detail = '') => { console.log(`${ok ? 'ok   ' : 'FALHA'} ${name}${detail ? ': ' + detail : ''}`); if (!ok) failed++; };

(async () => {
  await ensureServer();
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

  // o cartão de entrada de cada fase segura a partida até COMEÇAR (ou Enter): fecha quando aparece
  const begin = async () => {
    try { await page.waitForSelector('#intro-overlay.show', { timeout: 5000 }); await page.click('#intro-btn'); } catch { /* sem cartão */ }
    await page.waitForTimeout(400);
  };

  // 1. menu e primeira fase
  await page.goto(URL + '/');
  await page.waitForFunction(() => document.querySelector('#menu-play') && window.__game, { timeout: 30000 });
  step('menu abre com os botões', await page.evaluate(() => ['menu-play', 'menu-map', 'menu-arena', 'menu-manuscript', 'menu-music', 'menu-book'].every(id => document.getElementById(id))));
  await page.click('#menu-play');
  await page.waitForSelector('#letter-overlay.show', { timeout: 15000 });
  await page.click('#letter-btn');
  await begin();
  await page.waitForTimeout(800);
  const bombs = await page.evaluate(() => { const m = window.__game.scene.getScene('Main'); m.player.gridX = 2; m.player.gridY = 2; const a = m.bombSystem.bombs.length; m.bombSystem.placeBomb(); return [a, m.bombSystem.bombs.length]; });
  step('poção colocada', bombs[1] === bombs[0] + 1);
  await page.waitForTimeout(3500);
  step('poção explodiu sozinha', (await page.evaluate(() => window.__game.scene.getScene('Main').bombSystem.bombs.length)) === 0);

  // 2. transformações
  await startStage({ stage: 0, arena: 'belladonna' }); // a Arena libera todas as poções
  await begin();
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.__game.scene.getScene('Main').setBomb('normal'));
  await hold('t');
  let s = await page.evaluate(() => { const m = window.__game.scene.getScene('Main'); return { id: m.forms.form.id, bomb: m.bombType }; });
  step('T com a Poção de Fogo na mão transforma em fogo', s.id === 'fire' && s.bomb === 'normal', JSON.stringify(s));
  await page.evaluate(() => window.__game.scene.getScene('Main').setBomb('mega'));
  step('a Roo de fogo recusa a Poção de Água', (await page.evaluate(() => window.__game.scene.getScene('Main').bombType)) !== 'mega');
  await page.evaluate(() => { const f = window.__game.scene.getScene('Main').forms.form; f.spend(99999); f.tick(30000); });
  await page.waitForTimeout(400); // um quadro para a forma liberar as poções (o bloqueio é atualizado na partida)
  await page.evaluate(() => window.__game.scene.getScene('Main').setBomb('mega'));
  await hold('t');
  s = await page.evaluate(() => { const m = window.__game.scene.getScene('Main'); return { id: m.forms.form.id, stage: m.forms.form.stage }; });
  step('T com a Poção de Água na mão transforma em água', s.id === 'water' && s.stage === 4, JSON.stringify(s));

  // 3. Arena: cada chefe do registro
  const bosses = await page.evaluate(async () => (await import('/src/game/entities/bosses/defs.ts')).BOSS_IDS);
  for (const id of bosses) {
    await startStage({ stage: 0, arena: id });
    await begin();
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

  // 3b. as 20 fases abrem: grade montada, sem erro, e o chefe aparece nas fases de chefe
  const nStages = await page.evaluate(async () => (await import('/src/game/stages/index.ts')).STAGES.length);
  step('a campanha tem 20 fases', nStages === 20, String(nStages));
  for (let n = 1; n <= nStages; n++) {
    await startStage({ stage: n });
    await begin();
    await page.waitForTimeout(250);
    const r = await page.evaluate(() => { const m = window.__game.scene.getScene('Main'); return { grid: m.grid.length, boss: !!m.boss, isBoss: m.isBossStage, hp: m.player.hp }; });
    step(`fase ${n} abre`, r.grid > 0 && r.hp > 0 && r.boss === r.isBoss, JSON.stringify(r));
  }

  // 3c. reiniciar a fase 30 vezes não acumula ouvintes nem objetos (vazamento)
  await startStage({ stage: 1 });
  await begin();
  const probe = () => page.evaluate(() => { const g = window.__game; return { ev: g.events.eventNames().reduce((n, k) => n + g.events.listenerCount(k), 0), tex: Object.keys(g.textures.list).length }; });
  for (let i = 0; i < 3; i++) await page.evaluate(() => window.__game.scene.getScene('Main').scene.restart({ stage: 1 }));
  await begin();
  const before = await probe();
  for (let i = 0; i < 30; i++) await page.evaluate(() => window.__game.scene.getScene('Main').scene.restart({ stage: 1 }));
  await begin();
  const after = await probe();
  step('30 reinícios não vazam ouvintes nem texturas', after.ev <= before.ev + 2 && after.tex <= before.tex + 5, `${JSON.stringify(before)} -> ${JSON.stringify(after)}`);

  // 3d. a semente repete o mapa
  const mapOf = async seed => { await startStage({ stage: 2, seed }); await begin(); return page.evaluate(() => JSON.stringify(window.__game.scene.getScene('Main').grid)); };
  const m1 = await mapOf(777), m2 = await mapOf(777), m3 = await mapOf(778);
  step('a mesma semente gera o mesmo mapa', m1 === m2 && m1 !== m3);

  // 3e. os painéis cabem na tela, sem rolagem, nos tamanhos comuns de celular, tablet e computador
  const overlays = ['music-overlay', 'arena-overlay', 'letter-overlay', 'intro-overlay', 'dialogue-overlay', 'help-overlay', 'pause-overlay', 'gameover-overlay'];
  for (const [w, h] of [[360, 640], [390, 844], [667, 375], [800, 360], [1024, 768]]) {
    const pg = await browser.newPage({ viewport: { width: w, height: h }, hasTouch: w < 900 });
    await pg.goto(URL + '/' + (w < 900 ? '?touch' : ''));
    await pg.waitForSelector('#menu-play', { timeout: 30000 });
    await pg.evaluate(async () => {
      const long = 'Roo, filho do Caldeirão: há três invernos o teu mestre partiu sem dizer para onde, e desde então comes da sopa do mosteiro como qualquer um do vale, na mesma fila, onde as viúvas e os órfãos passam primeiro. Belladona, discípula dele, tomou o teu laboratório e as escrituras que guardamos. Peço que as tragas de volta e que, ao encontrá-las, não as trates como pedra.';
      const img = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="200"/>';
      for (const id of ['letter-portrait', 'dialogue-portrait']) { const e = document.getElementById(id); e.src = img; e.hidden = false; }
      document.getElementById('dialogue-speaker').textContent = 'FREI ANSELMO';
      document.getElementById('dialogue-text').textContent = long;
      document.getElementById('dialogue-step').textContent = '3 / 17';
      document.getElementById('intro-head').textContent = 'O VALE · 1/4';
      document.getElementById('intro-name').textContent = 'O CHAMADO';
      document.getElementById('intro-story').textContent = long;
      const t = document.getElementById('intro-tip'); t.hidden = false; t.textContent = 'Poção de Água apaga poções de Fogo. Fantasmas atravessam paredes.';
      const o = await import('/src/ui/overlays.ts');
      o.showGameOver({ won: false, gems: 2, hp: 0, maxHp: 24, blocksDestroyed: 14, timeLeft: 31000, stage: 7, cause: 'uma explosão de fogo', tip: 'O fogo é a fraqueza da Roo (6 de dano). Afaste-se 3 casas depois de pôr a poção, ou use a água.' });
      o.hideGameOver();
      const ar = await import('/src/ui/arena.ts'); ar.openArena(); ar.closeArena();
    });
    await pg.keyboard.press('h');
    await pg.waitForTimeout(150);
    const over = await pg.evaluate(ids => ids.map(id => {
      const o = document.getElementById(id);
      if (id !== 'help-overlay') o.classList.add('show');
      const pan = o.querySelector('.panel') || o;
      const n = Math.max(o.scrollHeight - o.clientHeight, pan.scrollHeight - pan.clientHeight, o.scrollWidth - o.clientWidth);
      if (id !== 'help-overlay') o.classList.remove('show');
      return n > 1 ? `${id.replace('-overlay', '')}:${n}px` : null;
    }).filter(Boolean), overlays);
    step(`painéis sem rolagem em ${w}x${h}`, over.length === 0, over.join(', '));
    await pg.close();
  }

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
  if (server) server.kill();
  console.log(failed ? `\n${failed} passo(s) falharam.` : '\nTudo certo.');
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error('FALHA:', e.message); if (server) server.kill(); process.exit(1); });
