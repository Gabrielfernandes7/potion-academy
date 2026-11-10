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
  stage: number;
  bossDefeated: boolean;
}

export function setPauseVisible(visible: boolean): void {
  setShown('pause-overlay', visible);
}

function tile(label: string, value: string): string {
  return `<div class="result-tile"><span class="label">${label}</span><b class="value">${value}</b></div>`;
}

export function showGameOver(d: GameOverData): void {
  const title = byId('go-title');
  title.textContent = d.bossDefeated ? 'BELLADONA DERROTADA!' : (d.won ? 'VITÓRIA!' : 'GAME OVER');
  title.className = d.won ? 'win' : 'lose';
  byId('go-stats').innerHTML = [
    tile('POÇÃO', String(d.coins)),
    tile('GEMAS', String(d.gems)),
    tile('VIDA', `${d.hp}/${d.maxHp}`),
    tile('BLOCOS', String(d.blocksDestroyed)),
    tile('TEMPO', `${Math.ceil(d.timeLeft / 1000)} s`),
    tile('FASE', String(d.stage)),
  ].join('');
  setShown('gameover-overlay', true);
}

export function hideGameOver(): void {
  setShown('gameover-overlay', false);
}
