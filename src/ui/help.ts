// Janela "Como jogar" (botão "?" no topo). Escondida por padrão; o jogo fica pausado enquanto aberta.
import { byId, isShown, setShown } from './dom';

export function isHelpOpen(): boolean {
  return isShown('help-overlay');
}

function openHelp(): void {
  if (isHelpOpen()) return;
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
