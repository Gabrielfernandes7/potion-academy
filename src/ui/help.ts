// Janela "Como jogar" (botão "?" no topo). Escondida por padrão; o jogo fica pausado enquanto aberta.
import { byId, isShown, setShown } from './dom';

export function isHelpOpen(): boolean {
  return isShown('help-overlay');
}

// As seções viram abas: uma de cada vez cabe na tela (antes, a ajuda inteira exigia rolar muito no celular).
const TAB_NAMES = ['Objetivo', 'Teclas', 'Frascos', 'Formas', 'Reações', 'Criaturas', 'Dicas'];
let tabsBuilt = false;

function showTab(i: number): void {
  const panel = byId('help-overlay').querySelector('.panel.help') as HTMLElement;
  panel.querySelectorAll<HTMLElement>(':scope > section').forEach((s, k) => { s.hidden = k !== i; });
  panel.querySelectorAll<HTMLElement>('.help-tabs button').forEach((b, k) => {
    b.setAttribute('aria-selected', String(k === i));
    b.tabIndex = k === i ? 0 : -1;
  });
}

function buildTabs(): void {
  if (tabsBuilt) return;
  const panel = byId('help-overlay').querySelector('.panel.help') as HTMLElement;
  const sections = panel.querySelectorAll<HTMLElement>(':scope > section');
  if (sections.length < 2) return;
  tabsBuilt = true;
  const nav = document.createElement('div');
  nav.className = 'help-tabs';
  nav.setAttribute('role', 'tablist');
  sections.forEach((sec, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.textContent = TAB_NAMES[i] ?? (sec.querySelector('h3')?.textContent ?? String(i + 1));
    b.onclick = () => showTab(i);
    nav.appendChild(b);
  });
  panel.querySelector('h2')?.after(nav);
  showTab(0);
}

function openHelp(): void {
  if (isHelpOpen()) return;
  buildTabs();
  setShown('help-overlay', true);
  byId('help-close').focus({ preventScroll: true });
}

function closeHelp(): void {
  if (!isHelpOpen()) return;
  setShown('help-overlay', false);
  // tira o foco do botão: senão Espaço/Enter no jogo reabririam a janela
  (document.activeElement as HTMLElement | null)?.blur();
}

function toggleHelp(): void {
  if (isHelpOpen()) closeHelp();
  else openHelp();
}

export function bindHelp(): void {
  byId('help-btn').onclick = toggleHelp;
  byId('help-close').onclick = closeHelp;
  byId('help-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeHelp(); // clicar fora fecha
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeHelp();
    else if (e.key === '?' || (e.key.toLowerCase() === 'h' && !e.ctrlKey && !e.metaKey)) toggleHelp();
  });
}
