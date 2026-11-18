// Gera os ícones do app (PNG) a partir de public/favicon.svg: `node scripts/make-icons.cjs`.
// Saída em public/icons/: icon-192.png, icon-512.png, icon-maskable-512.png (com margem de segurança) e apple-touch-icon.png.
const { chromium } = require(process.env.PW || 'playwright');
const { readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const svg = readFileSync(join(root, 'public/favicon.svg'), 'utf8');
const BG = '#161a18'; // o fundo do próprio ícone

// `scale` < 1 deixa uma margem em volta (ícone "maskable": o sistema corta em círculo ou quadrado arredondado)
const targets = [
  ['icon-192.png', 192, 1, false],
  ['icon-512.png', 512, 1, false],
  ['icon-maskable-512.png', 512, 0.78, true],
  ['apple-touch-icon.png', 180, 1, true], // o iOS não aceita transparência: fundo cheio
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const [name, size, scale, solid] of targets) {
    await page.setViewportSize({ width: size, height: size });
    const inner = Math.round(size * scale);
    await page.setContent(
      `<body style="margin:0;background:${solid ? BG : 'transparent'};width:${size}px;height:${size}px;display:grid;place-items:center">` +
        `<div style="width:${inner}px;height:${inner}px">${svg.replace('<svg ', '<svg width="100%" height="100%" ')}</div></body>`,
    );
    const png = await page.screenshot({ omitBackground: !solid, clip: { x: 0, y: 0, width: size, height: size } });
    writeFileSync(join(root, 'public/icons', name), png);
    console.log('gerado', name);
  }
  await browser.close();
})();
