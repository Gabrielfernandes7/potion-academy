// Preferências de áudio escolhidas pela jogadora (música e efeitos), guardadas no navegador.
// São independentes: dá para deixar só os efeitos, só a música, ou nenhum dos dois.
import { Storage } from '../storage';

export interface AudioPrefs {
  music: boolean;
  sfx: boolean;
}

const KEY = 'bombroo_audio';
const DEFAULTS: AudioPrefs = { music: true, sfx: true };

export function loadAudioPrefs(): AudioPrefs {
  const saved = Storage.get<Partial<AudioPrefs>>(KEY, {});
  return {
    music: typeof saved.music === 'boolean' ? saved.music : DEFAULTS.music,
    sfx: typeof saved.sfx === 'boolean' ? saved.sfx : DEFAULTS.sfx,
  };
}

export function saveAudioPrefs(prefs: AudioPrefs): void {
  Storage.set(KEY, prefs);
}

// Faixa escolhida no menu: um id de faixa, ou null para sortear a cada jogo.
const TRACK_KEY = 'bombroo_track';

export function loadTrackChoice(validIds: string[]): string | null {
  const saved = Storage.get<unknown>(TRACK_KEY, null);
  return typeof saved === 'string' && validIds.includes(saved) ? saved : null;
}

export function saveTrackChoice(id: string | null): void {
  Storage.set(TRACK_KEY, id);
}
