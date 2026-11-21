// O Livro de Roo (livro.html): um livro de 12 aberturas com gravuras animadas, virada de página, glosas à margem e música
// opcional. O texto está em game/livro.ts, as cenas em livroScenes.ts. Os personagens das gravuras são os do próprio jogo:
// as texturas vêm de um Phaser escondido (como em birthScene.ts e no manuscrito) e são copiadas para canvases comuns.
import '../canvasGuard'; // primeiro de todos: sem leitura de pixels, o Phaser cai ao carregar (ver canvasGuard.ts)
import '@fontsource/cinzel/600.css';
import '@fontsource/cinzel/700.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/400-italic.css';
import '@fontsource/nunito/700.css';
import '../styles/livro.css';
import Phaser from 'phaser';
import { audio } from '../audio/AudioEngine';
import { LIVRO, indiceDe } from '../game/livro';
import { voynichLines } from '../game/voynich';
import type { Sprites } from './livroDraw';
import { CENAS, SPRITES_DAS_CENAS } from './livroScenes';
import { bootPage, prepareTextures } from './shared';

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const estreito = (): boolean => window.matchMedia('(max-width: 820px)').matches;

let sprites: Sprites = {};
let idx = indiceDe(location.hash.slice(1));
let virando = false;
let musicaLigada = false;
let rafId = 0;
let t0 = performance.now();

// ---------------------------------------------------------------- as texturas do jogo, copiadas para canvases comuns

function carregarSprites(): Promise<Sprites> {
  return new Promise<Sprites>(resolve => {
    class Gen extends Phaser.Scene {
      constructor() { super('LivroGen'); }
      create(): void {
        const out: Sprites = {};
        try {
          prepareTextures(this, { bubble: true });
          for (const key of SPRITES_DAS_CENAS) {
            if (!this.textures.exists(key)) continue;
            const src = this.textures.get(key).getSourceImage() as HTMLCanvasElement;
            const copia = document.createElement('canvas');
            copia.width = src.width;
            copia.height = src.height;
            copia.getContext('2d')?.drawImage(src, 0, 0);
            out[key] = copia;
          }
        } catch { /* sem sprites: as cenas ainda desenham o cenário */ }
        resolve(out);
        this.game.destroy(true);
      }
    }
    bootPage(Gen);
  });
}

// ---------------------------------------------------------------- a gravura animada

function pintar(): void {
  const canvas = $<HTMLCanvasElement>('cena');
  const c = canvas.getContext('2d');
  if (!c) return;
  c.imageSmoothingEnabled = false;
  CENAS[LIVRO[idx].cena](c, (performance.now() - t0) / 1000, sprites);
}

function laco(): void {
  cancelAnimationFrame(rafId);
  if (reduzido) { t0 = performance.now() - 4000; pintar(); return; } // movimento reduzido: uma gravura parada, bem iluminada
  let ultimo = 0;
  const passo = (agora: number): void => {
    if (!document.hidden && agora - ultimo > 33) { ultimo = agora; pintar(); } // 30 quadros por segundo bastam em pixel art
    rafId = requestAnimationFrame(passo);
  };
  rafId = requestAnimationFrame(passo);
}

// ---------------------------------------------------------------- a abertura na tela

function preencher(i: number): void {
  const p = LIVRO[i];
  $('rubrica').textContent = p.rubrica;
  $('titulo').textContent = p.titulo;
  const texto = $('texto');
  texto.textContent = '';
  p.texto.forEach((par, k) => {
    const el = document.createElement('p');
    el.textContent = par;
    el.style.setProperty('--i', String(k)); // cada parágrafo surge um pouco depois do anterior
    texto.append(el);
  });
  $('glosa-txt').textContent = p.glosa.texto;
  $('legenda').textContent = p.legenda;
  $('folio-esq').textContent = p.folio;
  $('folio-dir').textContent = `${i + 1} / ${LIVRO.length}`;
  $('marginalia').textContent = voynichLines(p.id, 2, 4).join('  ·  ');
  $('cena').setAttribute('aria-label', p.legenda);
  $('ant').toggleAttribute('disabled', i === 0);
  $('prox').toggleAttribute('disabled', i === LIVRO.length - 1);
  document.querySelectorAll<HTMLButtonElement>('#pontos button').forEach((b, k) => b.setAttribute('aria-current', k === i ? 'true' : 'false'));
  document.title = `${p.titulo} · O Livro de Roo`;
  history.replaceState(null, '', `#${p.id}`);
  t0 = performance.now(); // a cena começa do começo
  if (musicaLigada) audio.playTrack(p.faixa);
  $('pg-dir').scrollTop = 0;
  window.scrollTo({ top: 0 });
}

// A virada: a página da direita dobra em torno da lombada, o conteúdo troca, e a da esquerda se abre (e o contrário ao
// voltar). Em tela estreita ou com movimento reduzido, só uma troca suave.
async function virar(delta: 1 | -1): Promise<void> {
  const alvo = idx + delta;
  if (virando || alvo < 0 || alvo >= LIVRO.length) return;
  virando = true;
  const dir = $('pg-dir');
  const esq = $('pg-esq');
  const livre = reduzido || estreito() || typeof dir.animate !== 'function';
  if (livre) {
    idx = alvo;
    preencher(idx);
    virando = false;
    return;
  }
  const dobra = (el: HTMLElement, origem: string, de: number, ate: number, easing: string): Promise<unknown> => {
    el.style.transformOrigin = origem;
    return el.animate(
      [
        { transform: `rotateY(${de}deg)`, filter: `brightness(${de === 0 ? 1 : 0.72})` },
        { transform: `rotateY(${ate}deg)`, filter: `brightness(${ate === 0 ? 1 : 0.72})` },
      ],
      { duration: 260, easing, fill: 'both' },
    ).finished;
  };
  if (delta > 0) {
    await dobra(dir, 'left center', 0, -88, 'ease-in');
    idx = alvo;
    preencher(idx);
    dir.style.transform = '';
    await dobra(esq, 'right center', 88, 0, 'ease-out');
  } else {
    await dobra(esq, 'right center', 0, 88, 'ease-in');
    idx = alvo;
    preencher(idx);
    esq.style.transform = '';
    await dobra(dir, 'left center', -88, 0, 'ease-out');
  }
  for (const el of [dir, esq]) el.getAnimations().forEach(a => a.cancel());
  virando = false;
}

// ---------------------------------------------------------------- música (opcional: os navegadores exigem um clique)

function musica(): void {
  musicaLigada = !musicaLigada;
  const btn = $('musica');
  btn.setAttribute('aria-pressed', String(musicaLigada));
  btn.textContent = `Música: ${musicaLigada ? 'ligada' : 'desligada'}`;
  if (musicaLigada) {
    audio.unlock();
    audio.enabled = true;
    audio.playTrack(LIVRO[idx].faixa);
  } else {
    audio.stop();
    audio.enabled = false;
  }
}

// ---------------------------------------------------------------- ligação

function montarPontos(): void {
  const ol = $('pontos');
  LIVRO.forEach((p, k) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', `${k + 1}. ${p.titulo}`);
    b.title = p.titulo;
    b.addEventListener('click', () => { void ir(k); });
    li.append(b);
    ol.append(li);
  });
}

async function ir(alvo: number): Promise<void> {
  // um salto grande vira uma troca direta; passos vizinhos usam a virada
  if (Math.abs(alvo - idx) === 1) { await virar(alvo > idx ? 1 : -1); return; }
  if (alvo === idx || virando) return;
  idx = alvo;
  preencher(idx);
}

function ligarEntrada(): void {
  $('ant').addEventListener('click', () => { void virar(-1); });
  $('prox').addEventListener('click', () => { void virar(1); });
  $('musica').addEventListener('click', musica);
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); void virar(1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); void virar(-1); }
    else if (e.key === 'Home') void ir(0);
    else if (e.key === 'End') void ir(LIVRO.length - 1);
  });
  window.addEventListener('hashchange', () => { const k = indiceDe(location.hash.slice(1)); if (k !== idx) void ir(k); });
  // deslizar o dedo vira a página
  let x0 = 0;
  let y0 = 0;
  const livro = $('livro');
  livro.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  livro.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - x0;
    const dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.6) void virar(dx < 0 ? 1 : -1);
  }, { passive: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) t0 = performance.now() - 2000; });
}

async function iniciar(): Promise<void> {
  sprites = await carregarSprites();
  montarPontos();
  ligarEntrada();
  $('carregando').hidden = true;
  $('encadernacao').hidden = false;
  $('controle').hidden = false;
  preencher(idx);
  laco();
}

void iniciar();
