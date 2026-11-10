// Caldeirão de Magia: loja de frascos (overlay DOM #shop-overlay).
// Markup do cenário em index.html; visual em styles/main.css (seção "Caldeirão").
import { BOMB_ORDER, BOMB_TYPES, ELEMENTS, BombId, ElementId } from '../config';
import { Bank, buyBombType, hasBombType } from '../storage';
import { buttonLabel, cardView, formatFuse } from '../game/shopRules';
import { byId, setShown } from './dom';

const hex = (n: number): string => '#' + n.toString(16).padStart(6, '0');
const MAX_PIPS = 5;

// Frasco em SVG, com o mesmo formato do sprite do jogo (um por elemento).
// A cor do líquido vem das variáveis CSS --el / --el-glow do cartão.
const FLASK_SVG: Record<ElementId, string> = {
  // fogo: balão de fundo redondo
  fire: `
    <path class="liquid" d="M14.8 44A19 19 0 1 0 49.2 44Z"/>
    <path class="glass" d="M26 10V30.8A22 22 0 1 0 38 30.8V10Z"/>
    <path class="shine" d="M17 52l4-10"/>
    <rect class="cork" x="25" y="3" width="14" height="8" rx="1.500"/>
    <circle class="bubble" cx="27" cy="56" r="2.500"/><circle class="bubble" cx="38" cy="60" r="2"/>
    <path style="fill:var(--el-glow)" d="M32 34l-4 9h8z"/>`,
  // água: tubo alto
  water: `
    <path class="liquid" d="M21.500 38H42.500V66q0 6-6 6h-9q-6 0-6-6Z"/>
    <ellipse style="fill:var(--el-glow)" cx="32" cy="38" rx="10.500" ry="3"/>
    <path class="glass" d="M27 10h10v12q7 1 7 8v40q0 8-8 8h-8q-8 0-8-8v-40q0-7 7-8Z"/>
    <path class="shine" d="M22.500 34v28"/>
    <rect class="cork" x="26" y="3" width="12" height="7" rx="1.500"/>
    <circle class="bubble" cx="28" cy="52" r="2.500"/><circle class="bubble" cx="37" cy="60" r="2"/><circle class="bubble" cx="32" cy="46" r="1.600"/>`,
  // terra: pote largo com cristais
  earth: `
    <path class="liquid" d="M14.500 40H49.500V64q0 5-5 5H19.500q-5 0-5-5Z"/>
    <path style="fill:var(--el-glow)" d="M24 69L28 48 32 69Z"/>
    <path style="fill:#9ccc65" d="M34 69L39 46 44 69Z"/>
    <path class="glass" d="M18 24h28v5q6 2 6 8v27q0 8-8 8H20q-8 0-8-8V37q0-6 6-8Z"/>
    <path class="shine" d="M16.500 40v22"/>
    <rect class="cork" x="17" y="14" width="30" height="11" rx="2"/>
    <circle class="bubble" cx="20" cy="56" r="1.600"/>`,
  // éter: losango com névoa
  air: `
    <path class="liquid" d="M32 32L45 50 32 68 19 50Z"/>
    <path style="fill:#fff;fill-opacity:.7" d="M32 40L39 50 32 60 25 50Z"/>
    <path class="glass" d="M29 10H35V24.500L52 50 32 76 12 50 29 24.500Z"/>
    <path class="shine" d="M17 48l8-10"/>
    <circle style="fill:#b0bec5" cx="32" cy="7" r="5"/><circle style="fill:#eceff1" cx="30.500" cy="5.500" r="1.800"/>
    <circle class="bubble" cx="26" cy="46" r="1.600"/><circle class="bubble" cx="38" cy="56" r="1.600"/>`,
};

function potionSvg(element: ElementId): string {
  return `<svg viewBox="0 0 64 80" aria-hidden="true" focusable="false">${FLASK_SVG[element]}</svg>`;
}

function radiusPips(radius: number): string {
  const on = Math.min(radius, MAX_PIPS);
  return Array.from({ length: MAX_PIPS }, (_, i) => `<i${i < on ? ' class="on"' : ''}></i>`).join('');
}

function buildCard(type: BombId, index: number, justBought: boolean): HTMLElement {
  const cfg = BOMB_TYPES[type];
  const el = ELEMENTS[cfg.element];
  const view = cardView(type, hasBombType(type), Bank.get());
  const tags: string[] = [];
  if (cfg.pierce) tags.push('Atravessa blocos');
  if (cfg.remote) tags.push('Detonação manual');

  const card = document.createElement('article');
  card.className = `shop-item ${view.state}${justBought ? ' just-bought' : ''}`;
  card.style.setProperty('--el', hex(el.color));
  card.style.setProperty('--el-glow', hex(el.glow));
  card.innerHTML = `
    <span class="key-badge" title="Tecla de atalho">${index + 1}</span>
    <div class="potion-art">${potionSvg(cfg.element)}</div>
    <h3>${cfg.label}</h3>
    <p class="element-line"><span class="sym" aria-hidden="true">${el.symbol}</span> ${el.alchemy} · ${el.name}</p>
    <p class="desc">${cfg.desc}</p>
    <dl class="stats">
      <div><dt>Raio</dt><dd class="pips" aria-label="Raio ${cfg.radius}">${radiusPips(cfg.radius)}</dd></div>
      <div><dt>Fusível</dt><dd>${formatFuse(cfg.fuse)}</dd></div>
    </dl>
    <div class="tags">${tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
    <button type="button" class="buy-btn"${view.state === 'affordable' ? '' : ' disabled'}>${buttonLabel(type, view)}</button>
  `;
  if (view.state === 'affordable') {
    const button = card.querySelector('button');
    if (button) button.onclick = () => purchase(type);
  }
  return card;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

function showToast(message: string): void {
  const toast = byId('shop-toast');
  toast.textContent = message;
  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}

function purchase(type: BombId): void {
  if (!buyBombType(type)) {
    showToast('POÇÃO insuficiente.');
    return;
  }
  renderShop(type);
  showToast(`${BOMB_TYPES[type].label} adquirida! Use a tecla ${BOMB_ORDER.indexOf(type) + 1} no jogo.`);
  const balance = byId('shop-balance');
  balance.classList.remove('pulse');
  void balance.offsetWidth; // reinicia a animação
  balance.classList.add('pulse');
}

export function renderShop(justBought?: BombId): void {
  byId('shop-coins').textContent = String(Bank.get());
  const container = byId('shop-items');
  container.innerHTML = '';
  BOMB_ORDER.forEach((type, i) => container.appendChild(buildCard(type, i, type === justBought)));
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
