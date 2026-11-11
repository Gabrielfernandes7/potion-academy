// Regra pura do sono da Roo (sem Phaser, testável). Ver game/SleepSystem.ts.
export interface SleepState {
  idleMs: number; // tempo parada, sem nenhuma entrada
  sleeping: boolean;
  zzzMs: number; // tempo desde o último "z"
}

export type SleepEvent = 'wake' | 'sleep' | 'zzz' | null;

// Avança o estado em `delta` ms (altera `s`) e diz o que a cena precisa fazer:
// acordar, adormecer ou soltar um "z". `active`: a Roo anda ou há tecla/toque.
export function stepSleep(
  s: SleepState, delta: number, active: boolean, sleepAfterMs: number, zzzIntervalMs: number,
): SleepEvent {
  if (active) {
    s.idleMs = 0;
    if (s.sleeping) {
      s.sleeping = false;
      s.zzzMs = 0;
      return 'wake';
    }
    return null;
  }
  s.idleMs += delta;
  if (!s.sleeping) {
    if (s.idleMs >= sleepAfterMs) {
      s.sleeping = true;
      s.zzzMs = zzzIntervalMs; // o primeiro 'z' sai na hora
      return 'sleep';
    }
    return null;
  }
  s.zzzMs += delta;
  if (s.zzzMs >= zzzIntervalMs) {
    s.zzzMs = 0;
    return 'zzz';
  }
  return null;
}
