// Sala de Música: overlay DOM (#music-overlay) com a Roo de maestro e a escolha da faixa.
// Abre pelo botão SALA DE MÚSICA do menu. A faixa escolhida vale para o menu e as partidas.
import { audio } from '../audio/AudioEngine';
import { loadTrackChoice, saveTrackChoice } from '../audio/prefs';
import { TRACKS } from '../audio/tracks';
import { byId, isShown, setShown } from './dom';

// null = sorteada a cada jogo; depois cada faixa, em ordem
const OPTIONS: (string | null)[] = [null, ...TRACKS.map(t => t.id)];
const FRAME_MS = 500; // a Roo "rege" trocando de quadro

export interface MusicRoomDeps {
  musicOn: () => boolean; // preferência MÚSICA da jogadora
  unlock: () => void; // libera o áudio do navegador (exige um gesto)
  maestroFrames: () => string[]; // imagens dos quadros do maestro (data URLs)
}

let deps: MusicRoomDeps | null = null;
let index = 0;
let frameTimer: ReturnType<typeof setInterval> | null = null;

function label(id: string | null): string {
  if (!id) return 'Sorteada a cada jogo';
  return TRACKS.find(t => t.id === id)?.name ?? 'Sorteada a cada jogo';
}

function refresh(): void {
  byId('music-now').textContent = label(OPTIONS[index]);
  byId('music-off').hidden = deps ? deps.musicOn() : true;
  const list = byId('music-list');
  Array.from(list.children).forEach((btn, i) => {
    const on = i === index;
    btn.classList.toggle('on', on);
    btn.setAttribute('aria-pressed', String(on));
  });
}

function choose(i: number): void {
  if (!deps) return;
  index = i;
  const id = OPTIONS[i];
  saveTrackChoice(id);
  audio.setTrackChoice(id); // se a música já toca, troca na hora
  if (deps.musicOn()) {
    // na sala a música ainda não começou: toca a escolha para ela ouvir
    deps.unlock();
    audio.enabled = true;
    audio.start();
  }
  refresh();
}

function buildList(): void {
  const list = byId('music-list');
  list.innerHTML = '';
  OPTIONS.forEach((id, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'track-btn';
    btn.textContent = label(id);
    btn.onclick = () => choose(i);
    list.appendChild(btn);
  });
}

function startMaestro(): void {
  const img = byId<HTMLImageElement>('maestro-img');
  const frames = deps ? deps.maestroFrames() : [];
  if (frames.length === 0) return;
  let f = 0;
  img.src = frames[0];
  if (frameTimer) clearInterval(frameTimer);
  frameTimer = setInterval(() => {
    f = (f + 1) % frames.length;
    img.src = frames[f];
  }, FRAME_MS);
}

export function initMusicRoom(d: MusicRoomDeps): void {
  deps = d;
  index = Math.max(0, OPTIONS.indexOf(loadTrackChoice(TRACKS.map(t => t.id))));
  audio.setTrackChoice(OPTIONS[index]); // a escolha salva vale desde o carregamento
  buildList();
  byId('music-back-btn').onclick = closeMusicRoom;
}

export function openMusicRoom(): void {
  setShown('music-overlay', true);
  refresh();
  startMaestro();
}

export function closeMusicRoom(): void {
  setShown('music-overlay', false);
  if (frameTimer) clearInterval(frameTimer);
  frameTimer = null;
  audio.stop(); // o menu fica em silêncio; a música volta a tocar ao jogar
}

export function isMusicRoomOpen(): boolean {
  return isShown('music-overlay');
}
