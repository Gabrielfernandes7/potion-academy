// Ponto de entrada: liga os botões de DOM ao jogo.
import '@fontsource/cinzel/600.css';
import '@fontsource/cinzel/700.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import './styles/main.css';
import { CANVAS } from './config';
import { audio } from './audio/AudioEngine';
import { bootGame, retryGame, showMenu, startGame } from './game/launcher';
import { touch } from './input/touch';
import { byId } from './ui/dom';
import { bindMenuButtons, isMenuVisible } from './ui/menu';
import { isShopOpen, openShop, renderShop } from './ui/shop';
import { bindHelp } from './ui/help';

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

// O primeiro clique em "JOGAR"/"COMEÇAR" libera o áudio (exigência dos navegadores).
function play(): void {
  audio.sfx = true;
  audio.unlock();
  if (!audio.enabled) {
    audio.enabled = true; // a música começa quando a partida inicia (Main.init sorteia a faixa)
    setMusicButton(true);
  }
  void startGame();
}

// Mostra o nome da faixa que está tocando ao lado do botão de som.
function bindTrackName(): void {
  const label = byId('track-name');
  audio.onTrackChange = name => {
    label.textContent = name ?? '';
    label.classList.remove('fresh');
    if (name) {
      void label.offsetWidth; // reinicia a animação de entrada
      label.classList.add('fresh');
    }
  };
}

function bindButtons(): void {
  // o botão de som sempre reflete se a música está tocando de fato
  audio.onPlayingChange = on => setMusicButton(on);
  // qualquer toque ou tecla retoma o áudio se o navegador o tiver suspendido
  const wake = (): void => audio.unlock();
  document.addEventListener('pointerdown', wake, { passive: true });
  document.addEventListener('keydown', wake);

  bindMenuButtons({ play, shop: openShop });
  bindHelp();
  // botões do topo não ficam com o foco: senão Espaço/Enter no jogo os apertariam de novo
  document.addEventListener('click', e => {
    const chip = (e.target as HTMLElement).closest('.chip-btn');
    if (chip instanceof HTMLElement && chip.id !== 'help-btn') chip.blur();
  });
  byId('play-btn').onclick = play;
  byId('shop-back-btn').onclick = showMenu;
  byId('retry-btn').onclick = () => retryGame();
  byId('shop-btn').onclick = () => openShop();
  byId('menu-btn').onclick = showMenu;
  byId('pause-menu-btn').onclick = showMenu;
  byId('resume-btn').onclick = () => touch.press('pause'); // consumido pela cena no próximo frame

  byId('music-btn').onclick = () => {
    audio.toggleMusic();
    setMusicButton(audio.playing);
  };

  // Enter inicia o jogo, mas só enquanto o menu está na tela (na partida, Enter é pausa)
  window.addEventListener('keydown', e => {
    if (e.key === 'Enter' && isMenuVisible() && !isShopOpen()) {
      e.preventDefault();
      play();
    }
  });
}

setupLayout();
bindTrackName();
bindButtons();
renderShop();
bootGame();
