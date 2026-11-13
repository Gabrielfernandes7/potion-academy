// Entrada do lab (só desenvolvimento): escolhe o experimento pela URL (?exp=<id>), monta a barra e
// o painel e cria o jogo Phaser com a cena dele. Abra /lab.html com `npm run dev`.
import Phaser from 'phaser';
import { EXPERIMENTS, findExperiment } from './registry';

const TILE = 40;

function mount(): void {
  const exp = findExperiment(new URLSearchParams(location.search).get('exp'));
  document.title = `Potion Academy: lab · ${exp.title}`;

  const nav = document.getElementById('lab-nav');
  if (nav) {
    nav.innerHTML = EXPERIMENTS
      .map(e => `<a href="?exp=${e.id}"${e.id === exp.id ? ' class="on" aria-current="page"' : ''}>${e.title}</a>`)
      .join('');
  }
  const title = document.getElementById('lab-title');
  if (title) title.textContent = exp.title;
  const summary = document.getElementById('lab-summary');
  if (summary) summary.textContent = exp.summary;
  const panel = document.getElementById('lab-panel');
  if (panel) panel.innerHTML = exp.panelHtml; // antes do jogo: a cena lê os controles ao criar

  const tile = exp.size.tile ?? TILE;
  new Phaser.Game({
    type: Phaser.CANVAS,
    width: exp.size.cols * tile,
    height: exp.size.rows * tile,
    parent: 'stage',
    pixelArt: true,
    backgroundColor: '#1b1714',
    audio: { noAudio: true },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [exp.scene],
  });
}

mount();
