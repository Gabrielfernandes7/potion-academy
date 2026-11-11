// Cartões de diálogo em DOM (#dialogue-overlay): fala de um personagem por vez, com retrato.
// Usado na confissão de frei Anselmo. Enter, Espaço ou o botão avançam; ao fim, a promessa resolve.
import { byId, setShown } from './dom';

export interface DialogueCard {
  speaker: string;
  text: string;
  portrait?: string; // data URL do retrato (opcional)
}

// Mostra o retrato (ou o esconde, se não houver).
export function setPortrait(imgId: string, url?: string | null): void {
  const img = byId<HTMLImageElement>(imgId);
  if (url) img.src = url;
  img.hidden = !url;
}

// Avança com Enter/Espaço sem deixar a tecla chegar ao jogo (Enter é pausa na partida).
export function onAdvanceKey(fn: () => void): () => void {
  const handler = (e: KeyboardEvent): void => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    e.stopPropagation();
    if (!e.repeat) fn();
  };
  window.addEventListener('keydown', handler, true);
  return () => window.removeEventListener('keydown', handler, true);
}

export function showDialogue(cards: DialogueCard[], lastLabel = 'CONTINUAR'): Promise<void> {
  return new Promise(resolve => {
    if (cards.length === 0) { resolve(); return; }
    const btn = byId('dialogue-btn');
    let i = 0;
    const render = (): void => {
      const c = cards[i];
      setPortrait('dialogue-portrait', c.portrait);
      byId('dialogue-speaker').textContent = c.speaker;
      byId('dialogue-text').textContent = c.text;
      byId('dialogue-step').textContent = cards.length > 1 ? `${i + 1} / ${cards.length}` : '';
      btn.textContent = i === cards.length - 1 ? lastLabel : 'CONTINUAR';
    };
    const stopKeys = onAdvanceKey(() => advance());
    const advance = (): void => {
      i++;
      if (i < cards.length) { render(); return; }
      btn.removeEventListener('click', advance);
      stopKeys();
      setShown('dialogue-overlay', false);
      resolve();
    };
    btn.addEventListener('click', advance);
    render();
    setShown('dialogue-overlay', true);
    btn.focus();
  });
}
