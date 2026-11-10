// Carta de frei Anselmo: aparece antes da primeira fase de uma partida nova (overlay em DOM).
import { byId, setShown } from './dom';

// Devolve uma promessa que resolve quando a jogadora fecha a carta (botão ou Enter/Espaço).
export function showLetter(): Promise<void> {
  return new Promise(resolve => {
    const btn = byId('letter-btn');
    const close = (): void => {
      btn.removeEventListener('click', close);
      window.removeEventListener('keydown', onKey);
      setShown('letter-overlay', false);
      resolve();
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        close();
      }
    };
    btn.addEventListener('click', close);
    window.addEventListener('keydown', onKey);
    setShown('letter-overlay', true);
    btn.focus();
  });
}
