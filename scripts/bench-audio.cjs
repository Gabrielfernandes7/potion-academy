// Mede quanto custa, em tempo real, sintetizar a música (uma fração de um núcleo por segundo de som).
// Roda no navegador (WebAudio), com o servidor de dev ligado (npm run dev) e Playwright instalado
// fora do projeto. Uso: PW=/caminho/para/node_modules/playwright node scripts/bench-audio.cjs
const { chromium } = require(process.env.PW);

(async () => {
  const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
  const page = await browser.newPage();
  page.on('pageerror', e => console.error('pageerror', String(e)));
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(1500);
  const out = await page.evaluate(async () => {
    const A = await import('/src/audio/AudioEngine.ts');
    const T = await import('/src/audio/tracks.ts');
    const sr = 44100;
    async function bench(seconds, track, reverb) {
      const ctx = new OfflineAudioContext(2, sr * seconds, sr);
      const eng = A.audio;
      eng.attachContext(ctx);
      if (!reverb) eng.reverbIn = null;
      const rng = T.mulberry32(7);
      const melody = { idx: 3 };
      const stepDur = 60 / track.bpm / 2;
      let t = 0.01, bar = 0, notes = 0;
      while (t < seconds - 1) {
        for (const ev of T.generateBar(track, bar++, rng, melody)) { eng.playNote(ev, t + ev.step * stepDur, stepDur); notes++; }
        t += T.STEPS_PER_BAR * stepDur;
      }
      const t0 = performance.now();
      await ctx.startRendering();
      const ms = performance.now() - t0;
      return { track: track.id, reverb, notes, audioSeconds: seconds, renderMs: +ms.toFixed(0), cpuFractionRealtime: +(ms / (seconds * 1000)).toFixed(3) };
    }
    const res = [];
    for (const tr of [T.TRACKS[0], T.TRACKS[1], T.BOSS_TRACK]) {
      res.push(await bench(60, tr, true));
      res.push(await bench(60, tr, false));
    }
    return res;
  });
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
