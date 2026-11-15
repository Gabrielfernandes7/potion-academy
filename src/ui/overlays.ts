// Overlays de tela cheia em DOM: pausa e game over .
import { byId, setShown } from './dom';

export interface GameOverData {
  won: boolean;
  gems: number;
  hp: number;
  maxHp: number;
  blocksDestroyed: number;
  timeLeft: number;
  stage: number;
  arenaBoss?: string; // luta de treino na Arena: o nome do chefe (muda o título e os números)
}

export function setPauseVisible(visible: boolean): void {
  setShown('pause-overlay', visible);
}

function tile(label: string, value: string): string {
  return `<div class="result-tile"><span class="label">${label}</span><b class="value">${value}</b></div>`;
}

export function showGameOver(d: GameOverData): void {
  const title = byId('go-title');
  const arena = d.arenaBoss !== undefined;
  title.textContent = arena ? (d.won ? 'ARENA VENCIDA' : 'DERROTA NA ARENA') : d.won ? 'JORNADA CUMPRIDA' : 'GAME OVER';
  const story = byId('go-story');
  story.hidden = !d.won || arena;
  title.className = d.won ? 'win' : 'lose';
  byId('go-stats').innerHTML = (arena
    ? [
      tile('CHEFE', d.arenaBoss as string),
      tile('VIDA', `${d.hp}/${d.maxHp}`),
      tile('BLOCOS', String(d.blocksDestroyed)),
      tile('TEMPO', `${Math.ceil(d.timeLeft / 1000)} s`),
    ]
    : [
      tile('GEMAS', String(d.gems)),
      tile('VIDA', `${d.hp}/${d.maxHp}`),
      tile('BLOCOS', String(d.blocksDestroyed)),
      tile('TEMPO', `${Math.ceil(d.timeLeft / 1000)} s`),
      tile('FASE', String(d.stage)),
    ]).join('');
  setShown('gameover-overlay', true);
}

export function hideGameOver(): void {
  setShown('gameover-overlay', false);
}

export interface DuelResultData {
  winner: string | null; // nome do vencedor; null = empate
  reason: 'ko' | 'time' | 'draw';
  a: { name: string; hp: number; maxHp: number };
  b: { name: string; hp: number; maxHp: number };
  timeLeft: number;
}

const DUEL_REASON: Record<DuelResultData['reason'], string> = {
  ko: 'NOCAUTE',
  time: 'NO TEMPO: MAIS VIDA',
  draw: 'VIDA IGUAL',
};

/** O resultado de um duelo de chefes na Arena (usa a mesma janela do fim de jogo). */
export function showDuelResult(d: DuelResultData): void {
  const title = byId('go-title');
  title.textContent = d.winner ? `${d.winner.toUpperCase()} VENCEU` : 'EMPATE';
  title.className = 'win';
  byId('go-story').hidden = true;
  byId('go-stats').innerHTML = [
    tile(d.a.name.toUpperCase(), `${d.a.hp}/${d.a.maxHp}`),
    tile(d.b.name.toUpperCase(), `${d.b.hp}/${d.b.maxHp}`),
    tile('RESULTADO', DUEL_REASON[d.reason]),
    tile('TEMPO', `${Math.ceil(d.timeLeft / 1000)} s`),
  ].join('');
  setShown('gameover-overlay', true);
}
