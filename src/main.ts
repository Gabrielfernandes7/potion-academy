// Ponto de entrada: liga os botões de DOM ao jogo.
import '@fontsource/cinzel/600.css';
import '@fontsource/cinzel/700.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import './styles/main.css';
import { CANVAS } from './config';
import { audio } from './audio/AudioEngine';
import { retryGame, startGame } from './game/launcher';
import { touch } from './input/touch';
import { byId } from './ui/dom';
import { openShop, renderShop } from './ui/shop';

function setupLayout(): void {
  const root = document.documentElement;
  root.style.setProperty('--canvas-w', String(CANVAS.width));
  root.style.setProperty('--canvas-h', String(CANVAS.height));
  // controles de toque em telas de toque (ou com ?touch na URL, para testar no desktop)
  const forced = new URLSearchParams(location.search).has('touch');
  if (forced || window.matchMedia('(pointer: coarse)').matches) {
    document.body.classList.add('touch-on');
  }
  touch.bind(document);
}

function setMusicButton(on: boolean): void {
  const btn = byId('music-btn');
  btn.textContent = on ? 'SOM ON' : 'SOM OFF';
  btn.classList.toggle('on', on);
  btn.setAttribute('aria-pressed', String(on));
}

function bindButtons(): void {
  byId('play-btn').onclick = () => {
    // o primeiro clique libera o áudio (exigência dos navegadores)
    audio.sfx = true;
    if (!audio.enabled) {
      audio.enabled = true;
      audio.start();
      setMusicButton(true);
    }
    void startGame();
  };

  byId('retry-btn').onclick = () => retryGame();
  byId('shop-btn').onclick = () => openShop();
  byId('resume-btn').onclick = () => touch.press('pause'); // consumido pela cena no próximo frame

  byId('music-btn').onclick = () => {
    audio.toggleMusic();
    setMusicButton(audio.playing);
  };
}

setupLayout();
bindButtons();
renderShop();
