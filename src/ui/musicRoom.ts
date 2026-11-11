// Sala de Música: overlay DOM (#music-overlay) com a Roo de maestro e a escolha da faixa.
// Abre pelo botão SALA DE MÚSICA do menu. A faixa escolhida vale para o menu e as partidas.
import { audio } from '../audio/AudioEngine';
import { SCENE_TRACKS, trackById } from '../audio/tracks';
import { byId, isShown, setShown } from './dom';

// Uma faixa para cada parte do jogo; a Sala só deixa ouvir (não muda o que toca nas fases).
const PARTS: { id: string; part: string }[] = [
  { id: 'nocturno', part: 'Menu e carta' },
  { id: 'alambique', part: 'Fase 1 · O Chamado' },
  { id: 'ecos', part: 'Fase 2 · O Caminho' },
  { id: 'duelo', part: 'Fase 3 · O Duelo' },
  { id: 'jardim', part: 'Fase 4 · O Retorno' },
  { id: 'vesperas', part: 'Confissão e final' },
];
const FRAME_MS = 500; // a Roo "rege" trocando de quadro

export interface MusicRoomDeps {
  musicOn: () => boolean; // preferência MÚSICA da jogadora
  unlock: () => void; // libera o áudio do navegador (exige um gesto)
  maestroFrames: () => string[]; // imagens dos quadros do maestro (data URLs)
}

let deps: MusicRoomDeps | null = null;
let index = 0;
let heard = false; // já tocou alguma faixa na Sala
let frameTimer: ReturnType<typeof setInterval> | null = null;

function refresh(): void {
  const cur = PARTS[index];
  byId('music-now').textContent = heard
    ? `${trackById(cur.id)?.name ?? ''} (${cur.part})`
    : 'Escolha uma parte do jogo para ouvir';
  byId('music-off').hidden = deps ? deps.musicOn() : true;
  const list = byId('music-list');
  Array.from(list.children).forEach((btn, i) => {
    const on = heard && i === index;
    btn.classList.toggle('on', on);
    btn.setAttribute('aria-pressed', String(on));
  });
}

function choose(i: number): void {
  if (!deps) return;
  index = i;
  heard = true;
  if (deps.musicOn()) {
    deps.unlock();
    audio.enabled = true;
    audio.playTrack(PARTS[i].id);
  }
  refresh();
}

function buildList(): void {
  const list = byId('music-list');
  list.innerHTML = '';
  PARTS.forEach((p, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'track-btn';
    btn.textContent = `${p.part}: ${trackById(p.id)?.name ?? ''}`;
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
  buildList();
  byId('music-back-btn').onclick = closeMusicRoom;
}

export function openMusicRoom(): void {
  heard = false;
  setShown('music-overlay', true);
  refresh();
  startMaestro();
}

export function closeMusicRoom(): void {
  setShown('music-overlay', false);
  if (frameTimer) clearInterval(frameTimer);
  frameTimer = null;
  if (deps?.musicOn()) audio.playTrack(SCENE_TRACKS.menu); // volta à música do menu
}

export function isMusicRoomOpen(): boolean {
  return isShown('music-overlay');
}
