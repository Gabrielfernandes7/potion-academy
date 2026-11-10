// Overlays de tela cheia em DOM: pausa e game over (a loja fica em shop.ts).
import { byId, setShown } from './dom';

export interface GameOverData {
  won: boolean;
  coins: number;
  gems: number;
  hp: number;
  maxHp: number;
  blocksDestroyed: number;
  timeLeft: number;
}

export function setPauseVisible(visible: boolean): void {
  setShown('pause-overlay', visible);
}

export function showGameOver(d: GameOverData): void {
  const title = byId('go-title');
  title.textContent = d.won ? 'VITÓRIA!' : 'GAME OVER';
  title.style.color = d.won ? '#ffd54f' : '#ff5252';
  byId('go-stats').innerHTML =
    `POÇÃO: <b>${d.coins}</b> · GEMAS: <b>${d.gems}</b> · VIDA: <b>${d.hp}/${d.maxHp}</b>`;
  byId('go-stats2').innerHTML =
    `Blocos destruídos: ${d.blocksDestroyed} · Tempo restante: ${Math.ceil(d.timeLeft / 1000)}s`;
  setShown('gameover-overlay', true);
}

export function hideGameOver(): void {
  setShown('gameover-overlay', false);
}
