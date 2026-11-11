// Carta de frei Anselmo: aparece antes da primeira fase de uma partida nova (overlay em DOM).
import { byId, setShown } from './dom';
import { onAdvanceKey, setPortrait } from './dialogue';

// Devolve uma promessa que resolve quando a jogadora fecha a carta (botão ou Enter/Espaço).
// `portrait`: retrato de frei Anselmo (data URL), mostrado acima do texto.
export function showLetter(portrait?: string | null): Promise<void> {
  return new Promise(resolve => {
    const btn = byId('letter-btn');
    const close = (): void => {
      btn.removeEventListener('click', close);
      stopKeys();
      setShown('letter-overlay', false);
      resolve();
    };
    const stopKeys = onAdvanceKey(close);
    btn.addEventListener('click', close);
    setPortrait('letter-portrait', portrait);
    setShown('letter-overlay', true);
    btn.focus();
  });
}
