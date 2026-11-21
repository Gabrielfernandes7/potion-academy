// Preferências de áudio escolhidas pela jogadora (música e efeitos), guardadas no navegador.
// São independentes: dá para deixar só os efeitos, só a música, ou nenhum dos dois.
import { Storage } from '../storage';

export interface AudioPrefs {
  music: boolean;
  sfx: boolean;
  musicVolume: number; // 0 a 1
  sfxVolume: number; // 0 a 1
}

const KEY = 'bombroo_audio';
const DEFAULTS: AudioPrefs = { music: true, sfx: true, musicVolume: 1, sfxVolume: 1 };

/** Volume válido: número entre 0 e 1 (qualquer outra coisa vira o padrão). */
export function clampVolume(v: unknown, def = 1): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : def;
}

export function loadAudioPrefs(): AudioPrefs {
  const saved = Storage.get<Partial<AudioPrefs>>(KEY, {});
  return {
    music: typeof saved.music === 'boolean' ? saved.music : DEFAULTS.music,
    sfx: typeof saved.sfx === 'boolean' ? saved.sfx : DEFAULTS.sfx,
    musicVolume: clampVolume(saved.musicVolume),
    sfxVolume: clampVolume(saved.sfxVolume),
  };
}

export function saveAudioPrefs(prefs: AudioPrefs): void {
  Storage.set(KEY, prefs);
}
