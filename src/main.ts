// Ponto de entrada: liga os botões de DOM ao jogo.
import { audio } from './audio/AudioEngine';
import { retryGame, startGame } from './game/launcher';
import { byId } from './ui/dom';
import { openShop, renderShop } from './ui/shop';
import './styles/main.css';

function bindButtons(): void {
  byId('play-btn').onclick = () => {
    // o primeiro clique libera o áudio (exigência dos navegadores)
    audio.sfx = true;
    if (!audio.enabled) {
      audio.enabled = true;
      audio.start();
      setMusicButton(true);
    }
    startGame();
  };

  byId('retry-btn').onclick = () => retryGame();
  byId('shop-btn').onclick = () => openShop();

  byId('music-btn').onclick = () => {
    audio.toggleMusic();
    setMusicButton(audio.playing);
  };
}

function setMusicButton(on: boolean): void {
  const btn = byId('music-btn');
  btn.textContent = on ? 'SOM ON' : 'SOM OFF';
  btn.classList.toggle('on', on);
}

bindButtons();
renderShop();
