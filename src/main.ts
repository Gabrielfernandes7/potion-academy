// Ponto de entrada: liga os botões de DOM ao jogo.
import '@fontsource/cinzel/600.css';
import '@fontsource/cinzel/700.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import './styles/main.css';
import { CANVAS } from './config';
import { audio } from './audio/AudioEngine';
import { SCENE_TRACKS } from './audio/tracks';
import { bootGame, retryGame, showMenu, startGame, textureDataUrl, showMap } from './game/launcher';
import { loadAudioPrefs, saveAudioPrefs } from './audio/prefs';
import { touch } from './input/touch';
import { byId } from './ui/dom';
import { bindMenuButtons, isMenuVisible } from './ui/menu';
import { closeMusicRoom, initMusicRoom, isMusicRoomOpen, openMusicRoom } from './ui/musicRoom';
import { isShopOpen, openShop, renderShop } from './ui/shop';
import { bindHelp } from './ui/help';
import { bindArena, isArenaOpen, openArena } from './ui/arena';

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

// Estado da escolha de áudio da jogadora (preferências), separado do que está tocando agora.
const prefs = loadAudioPrefs();

function setChip(id: string, label: string, on: boolean): void {
  const btn = byId(id);
  btn.textContent = `${label} ${on ? 'ON' : 'OFF'}`;
  btn.classList.toggle('on', on);
  btn.setAttribute('aria-pressed', String(on));
}

function setMusicButton(on: boolean): void {
  setChip('music-btn', 'MÚSICA', on);
}

function setSfxButton(on: boolean): void {
  setChip('sfx-btn', 'EFEITOS', on);
}

// Liga ou desliga a música. Ligar fora de uma partida só marca a preferência:
// a faixa começa quando a partida começar.
function applyMusicPref(on: boolean): void {
  prefs.music = on;
  saveAudioPrefs(prefs);
  audio.enabled = on;
  if (!on) audio.stop();
  else {
    audio.unlock();
    audio.playTrack(isMenuVisible() ? SCENE_TRACKS.menu : audio.trackId ?? SCENE_TRACKS.menu);
  }
  setMusicButton(on);
}

function applySfxPref(on: boolean): void {
  prefs.sfx = on;
  saveAudioPrefs(prefs);
  audio.sfx = on;
  setSfxButton(on);
}

// O primeiro clique em "JOGAR"/"COMEÇAR" libera o áudio (exigência dos navegadores).
function play(): void {
  audio.unlock(); // o primeiro clique libera o áudio do navegador
  audio.sfx = prefs.sfx;
  audio.enabled = prefs.music; // a música começa quando a partida inicia (Main.init sorteia a faixa)
  setMusicButton(prefs.music);
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
  // o botão mostra a preferência da jogadora, não o estado momentâneo (a música para entre fases)
  audio.onPlayingChange = () => setMusicButton(prefs.music);
  // qualquer toque ou tecla retoma o áudio se o navegador o tiver suspendido
  const wake = (): void => {
    audio.unlock();
    // o menu tem música própria: começa no primeiro toque (o navegador só libera o som com um gesto)
    if (isMenuVisible() && prefs.music && !audio.playing && !isMusicRoomOpen()) {
      audio.enabled = true;
      audio.playTrack(SCENE_TRACKS.menu);
    }
  };
  document.addEventListener('pointerdown', wake, { passive: true });
  document.addEventListener('keydown', wake);

  // o manuscrito do alquimista é uma página própria (manuscrito.html), no mesmo molde do livro da história
  const openManuscript = (): void => { location.assign('/manuscrito.html'); };
  bindMenuButtons({ play, shop: openShop, music: openMusicRoom, map: showMap, arena: openArena, manuscript: openManuscript });
  bindArena();
  byId('music-overlay').addEventListener('keydown', e => { if (e.key === 'Escape') closeMusicRoom(); });
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

  byId('music-btn').onclick = () => applyMusicPref(!prefs.music);
  byId('sfx-btn').onclick = () => applySfxPref(!prefs.sfx);

  // Enter inicia o jogo, mas só enquanto o menu está na tela (na partida, Enter é pausa)
  window.addEventListener('keydown', e => {
    if (e.key === 'Enter' && isMenuVisible() && !isShopOpen() && !isMusicRoomOpen() && !isArenaOpen()) {
      e.preventDefault();
      play();
    }
  });
}

setupLayout();
bindTrackName();
initMusicRoom({
  musicOn: () => prefs.music,
  unlock: () => audio.unlock(),
  maestroFrames: () => ['roo_maestro_0', 'roo_maestro_1'].map(k => textureDataUrl(k)).filter((u): u is string => !!u),
});
bindButtons();
setMusicButton(prefs.music);
setSfxButton(prefs.sfx);
audio.sfx = prefs.sfx;
audio.enabled = prefs.music;
renderShop();
bootGame();
