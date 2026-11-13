// Arena de treino: janela em DOM aberta pelo menu, com um cartão por chefe (game/arena.ts). Cada cartão mostra o
// desenho, a vida, a fraqueza e a imunidade (da tabela de personagens) e leva à luta. As vitórias ficam salvas.
import { ELEMENTS, ElementId } from '../config';
import { ARENA_BOSSES } from '../game/arena';
import { PROFILES } from '../game/entities/profiles';
import { startArena, textureDataUrl } from '../game/launcher';
import { arenaWins } from '../storage';
import { byId, isShown, setShown } from './dom';
import { ROUGH_FILTER, elementIconSvg } from './elementIcons';

function chips(label: string, list: readonly ElementId[]): HTMLElement {
  const row = document.createElement('div');
  row.className = 'arena-row';
  const name = document.createElement('span');
  name.className = 'arena-label';
  name.textContent = label;
  row.append(name);
  if (list.length === 0) {
    const none = document.createElement('span');
    none.className = 'arena-none';
    none.textContent = 'nenhuma';
    row.append(none);
  }
  for (const e of list) {
    const c = document.createElement('span');
    c.className = 'arena-chip';
    c.innerHTML = elementIconSvg(e, 22);
    c.append(document.createTextNode(ELEMENTS[e].name));
    row.append(c);
  }
  return row;
}

function renderCards(): void {
  const grid = byId('arena-grid');
  grid.textContent = '';
  const wins = arenaWins();
  for (const b of ARENA_BOSSES) {
    const p = PROFILES[b.perfil];
    const card = document.createElement('article');
    card.className = 'arena-card';

    const head = document.createElement('div');
    head.className = 'arena-head';
    const img = document.createElement('img');
    img.className = 'arena-sprite';
    img.alt = '';
    img.width = 80;
    img.height = 100;
    const url = textureDataUrl(b.sprite);
    if (url) img.src = url;
    const title = document.createElement('div');
    const h = document.createElement('h3');
    h.textContent = b.nome;
    const place = document.createElement('p');
    place.className = 'arena-place';
    place.textContent = b.lugar;
    title.append(h, place);
    if (wins.includes(b.id)) {
      const done = document.createElement('span');
      done.className = 'arena-won';
      done.textContent = 'VENCIDO';
      title.append(done);
    }
    head.append(img, title);

    const life = document.createElement('p');
    life.className = 'arena-life';
    life.textContent = `Vida: ${p.maxHp} pontos`;
    const tip = document.createElement('p');
    tip.className = 'arena-tip';
    tip.textContent = b.dica;
    const go = document.createElement('button');
    go.type = 'button';
    go.className = 'big-btn';
    go.textContent = 'TREINAR';
    go.onclick = () => { closeArena(); void startArena(b.id); };

    card.append(head, life, chips('Fraqueza', p.weak), chips('Imune', p.immune), tip, go);
    grid.append(card);
  }
}

export function openArena(): void {
  if (!document.getElementById('rough')) document.body.insertAdjacentHTML('afterbegin', ROUGH_FILTER); // tinta dos ícones
  renderCards();
  setShown('arena-overlay', true);
  (byId('arena-grid').querySelector('button') as HTMLElement | null)?.focus();
}

export function closeArena(): void {
  setShown('arena-overlay', false);
}

export function isArenaOpen(): boolean {
  return isShown('arena-overlay');
}

export function bindArena(): void {
  byId('arena-close').onclick = closeArena;
  byId('arena-overlay').addEventListener('keydown', e => { if (e.key === 'Escape') closeArena(); });
}
