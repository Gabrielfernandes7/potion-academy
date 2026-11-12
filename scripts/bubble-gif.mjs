// Gera os GIFs da Roo bebê na bolha (docs/img/roo-bolha-fetal.gif e roo-bolha-observando.gif, com cópia em public/img/)
// a partir de src/textures/rooBubble.ts. Uso: npm i --no-save @napi-rs/canvas && node scripts/bubble-gif.mjs   (precisa do ffmpeg)
import { build } from 'esbuild';
import { createCanvas } from '@napi-rs/canvas';
import { mkdirSync, writeFileSync, rmSync, copyFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const bundle = '/tmp/roo-bubble-bundle.mjs';
await build({ entryPoints: ['src/textures/rooBubble.ts'], bundle: true, format: 'esm', outfile: bundle, logLevel: 'error' });
const { drawRooBubbleFrame, BUBBLE_FRAMES, BUBBLE_SIZE } = await import(pathToFileURL(bundle).href);

const SCALE = 4;
mkdirSync('public/img', { recursive: true });
for (const [pose, name] of [['fetal', 'roo-bolha-fetal'], ['observe', 'roo-bolha-observando']]) {
  const out = `/tmp/${name}-frames`;
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  for (let k = 0; k < BUBBLE_FRAMES; k++) {
    // fundo preto: na página o GIF entra com mix-blend-mode: screen, então o preto some
    const small = createCanvas(BUBBLE_SIZE, BUBBLE_SIZE);
    const sc = small.getContext('2d');
    sc.fillStyle = '#000';
    sc.fillRect(0, 0, BUBBLE_SIZE, BUBBLE_SIZE);
    drawRooBubbleFrame(sc, k, pose);
    const big = createCanvas(BUBBLE_SIZE * SCALE, BUBBLE_SIZE * SCALE);
    const bc = big.getContext('2d');
    bc.imageSmoothingEnabled = false;
    bc.drawImage(small, 0, 0, BUBBLE_SIZE * SCALE, BUBBLE_SIZE * SCALE);
    writeFileSync(`${out}/f${String(k).padStart(2, '0')}.png`, big.toBuffer('image/png'));
  }
  const gif = `docs/img/${name}.gif`;
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '10', '-i', `${out}/f%02d.png`,
    '-vf', 'split[a][b];[a]palettegen=max_colors=128:stats_mode=full[p];[b][p]paletteuse=dither=none', '-loop', '0', gif]);
  copyFileSync(gif, `public/img/${name}.gif`);
  console.log('ok', gif);
}
