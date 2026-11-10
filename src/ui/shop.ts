// Caldeirão de Magia: loja de tipos de poção (overlay DOM #shop-overlay).
// É aqui que a estilização do Caldeirão vai acontecer (CSS em styles/main.css).
import { BOMB_ORDER, BOMB_TYPES, ELEMENTS, BombId } from '../config';
import { Bank, buyBombType, hasBombType } from '../storage';
import { byId, setShown } from './dom';

export function renderShop(): void {
  byId('shop-coins').textContent = String(Bank.get());
  const container = byId('shop-items');
  container.innerHTML = '';
  for (const type of BOMB_ORDER) {
    if (type === 'normal') continue; // a poção de fogo é inicial e não aparece à venda
    container.appendChild(buildCard(type));
  }
}

function buildCard(type: BombId): HTMLDivElement {
  const cfg = BOMB_TYPES[type];
  const owned = hasBombType(type);
  const card = document.createElement('div');
  card.className = 'shop-item' + (owned ? ' owned' : '');
  const fuse = isFinite(cfg.fuse) ? ' · Fusível: ' + (cfg.fuse / 1000) + 's' : '';
  card.innerHTML = `
    <h3>${cfg.label}</h3>
    <p>${cfg.desc}<br>Alquimia: ${ELEMENTS[cfg.element].alchemy}<br>Raio: ${cfg.radius}${fuse}</p>
    <button ${owned ? 'disabled' : ''}>${owned ? 'Comprado' : `Comprar — ${cfg.cost} POÇÃO`}</button>
  `;
  if (!owned) {
    const button = card.querySelector('button');
    if (button) {
      button.onclick = () => {
        if (buyBombType(type)) renderShop();
      };
    }
  }
  return card;
}

export function openShop(): void {
  setShown('gameover-overlay', false);
  renderShop();
  setShown('shop-overlay', true);
}

export function closeShop(): void {
  setShown('shop-overlay', false);
}

export function isShopOpen(): boolean {
  return byId('shop-overlay').classList.contains('show');
}
