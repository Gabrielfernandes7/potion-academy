// Janela AJUSTES: volume da música e dos efeitos e troca das teclas das ações.
import { byId, isShown, setShown } from './dom';
import { KEY_ACTIONS, getKeymap, keyLabel, rebind, resetKeymap, setKeymap, isReservedKey, type KeyAction } from '../input/keymap';

export function isSettingsOpen(): boolean {
  return isShown('settings-overlay');
}

export interface SettingsHooks {
  musicVolume: () => number;
  sfxVolume: () => number;
  setMusicVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
}

let waiting: KeyAction | null = null;
let msg = '';

function renderKeys(): void {
  const box = byId('keymap-list');
  box.textContent = '';
  const map = getKeymap();
  for (const a of KEY_ACTIONS) {
    const row = document.createElement('div');
    row.className = 'set-row';
    const name = document.createElement('span');
    name.textContent = a.label;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip-btn key-btn' + (waiting === a.id ? ' on' : '');
    btn.textContent = waiting === a.id ? 'APERTE UMA TECLA...' : keyLabel(map[a.id]);
    btn.setAttribute('aria-label', `${a.label}: ${keyLabel(map[a.id])}. Clique para trocar`);
    btn.onclick = () => { waiting = a.id; msg = ''; renderKeys(); };
    row.append(name, btn);
    box.appendChild(row);
  }
  if (msg) {
    const p = document.createElement('p');
    p.className = 'letter-note';
    p.setAttribute('role', 'status');
    p.textContent = msg;
    box.appendChild(p);
  }
}

function openSettings(hooks: SettingsHooks): void {
  if (isSettingsOpen()) return;
  const set = (id: string, v: number): void => {
    byId<HTMLInputElement>(id).value = String(Math.round(v * 100));
    byId(id + '-out').textContent = `${Math.round(v * 100)}%`;
  };
  set('vol-music', hooks.musicVolume());
  set('vol-sfx', hooks.sfxVolume());
  waiting = null;
  msg = '';
  renderKeys();
  setShown('settings-overlay', true);
  byId('settings-close').focus({ preventScroll: true });
}

function closeSettings(): void {
  if (!isSettingsOpen()) return;
  waiting = null;
  setShown('settings-overlay', false);
  (document.activeElement as HTMLElement | null)?.blur();
}

export function bindSettings(hooks: SettingsHooks): void {
  byId('settings-btn').onclick = () => (isSettingsOpen() ? closeSettings() : openSettings(hooks));
  byId('settings-close').onclick = closeSettings;
  byId('settings-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeSettings();
  });
  const slider = (id: string, apply: (v: number) => void): void => {
    const input = byId<HTMLInputElement>(id);
    input.oninput = () => {
      const v = Number(input.value) / 100;
      byId(id + '-out').textContent = `${input.value}%`;
      apply(v);
    };
  };
  slider('vol-music', hooks.setMusicVolume);
  slider('vol-sfx', hooks.setSfxVolume);
  byId('keymap-reset').onclick = () => { resetKeymap(); waiting = null; msg = 'Teclas padrão.'; renderKeys(); };
  // captura antes dos outros ouvintes (ajuda, jogo): a tecla apertada é a nova tecla, não uma ação
  window.addEventListener('keydown', e => {
    if (!isSettingsOpen()) return;
    if (waiting) {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (e.key === 'Escape') { waiting = null; msg = ''; renderKeys(); return; }
      if (isReservedKey(e.keyCode)) { msg = 'Essa tecla não pode ser usada.'; renderKeys(); return; }
      setKeymap(rebind(getKeymap(), waiting, e.keyCode));
      waiting = null;
      msg = '';
      renderKeys();
    } else if (e.key === 'Escape') {
      closeSettings();
    }
  }, true);
}
