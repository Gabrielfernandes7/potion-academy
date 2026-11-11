// Diário da Roo: janela em DOM aberta pelo menu, com as anotações já liberadas.
import { byId, isShown, setShown } from './dom';
import { DIARY, unlockedEntries } from '../game/diary';
import { isStageCompleted } from '../storage';

export function openDiary(): void {
  const completed = DIARY.map(e => e.stage).filter(s => s > 0 && isStageCompleted(s));
  const open = new Set(unlockedEntries(completed).map(e => e.stage));
  const list = byId('diary-list');
  list.textContent = '';
  for (const e of DIARY) {
    const item = document.createElement('li');
    item.className = open.has(e.stage) ? 'diary-entry' : 'diary-entry locked';
    const h = document.createElement('b');
    h.textContent = open.has(e.stage) ? e.title : '???';
    const p = document.createElement('p');
    p.textContent = open.has(e.stage) ? e.text : 'Vença a fase para ler esta página.';
    item.append(h, p);
    list.append(item);
  }
  setShown('diary-overlay', true);
  byId('diary-close').focus();
}

export function closeDiary(): void {
  setShown('diary-overlay', false);
}

export function bindDiary(): void {
  byId('diary-close').onclick = closeDiary;
  byId('diary-overlay').addEventListener('keydown', e => { if (e.key === 'Escape') closeDiary(); });
}

export function isDiaryOpen(): boolean {
  return isShown('diary-overlay');
}
