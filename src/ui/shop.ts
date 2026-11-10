// Caldeirão de Magia: loja de frascos (overlay DOM #shop-overlay).
// Markup do cenário em index.html; visual em styles/main.css (seção "Caldeirão").
import { BOMB_ORDER, BOMB_TYPES, ELEMENTS, BombId } from '../config';
import { Bank, buyBombType, hasBombType } from '../storage';
import { buttonLabel, cardView, formatFuse } from '../game/shopRules';
import { byId, setShown } from './dom';

const hex = (n: number): string => '#' + n.toString(16).padStart(6, '0');
const MAX_PIPS = 5;

// Frasco Erlenmeyer em SVG; a cor do líquido vem das variáveis CSS --el / --el-glow do card.
function potionSvg(): string {
  return `
    <svg viewBox="0 0 64 80" aria-hidden="true" focusable="false">
      <path class="liquid" d="M17.5 48H46.5L53 62c2.5 5.5-1 10-7 10H18c-6 0-9.500-4.500-7-10z"/>
      <path class="glass" d="M27 6h10v4h-1.500v14L53 62c2.500 5.500-1 10-7 10H18c-6 0-9.500-4.500-7-10L28.500 24V10H27z"/>
      <path class="shine" d="M24 52l4-10" />
      <rect class="cork" x="26" y="2.500" width="12" height="5" rx="1.500"/>
      <circle class="bubble" cx="28" cy="58" r="2.500"/>
      <circle class="bubble" cx="38" cy="54" r="2"/>
      <circle class="bubble" cx="33" cy="65" r="1.600"/>
    </svg>`;
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
    <div class="potion-art">${potionSvg()}</div>
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
