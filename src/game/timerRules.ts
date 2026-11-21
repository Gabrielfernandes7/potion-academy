// Regra pura do tempo esgotado: depois que o tempo acaba, a Roo perde vida a cada intervalo.
// Sem Phaser: a cena guarda o contador e decide quando ele conta (`active`).

export interface OvertimeStep {
  timer: number; // próximo valor do contador (ms até o próximo dano)
  hit: boolean;  // true quando este passo causa dano
}

/** Avança o contador do dano de tempo esgotado em `delta` ms. Parado (`active` falso) não muda nada. */
export function stepOvertime(timer: number, delta: number, interval: number, active: boolean): OvertimeStep {
  if (!active) return { timer, hit: false };
  const next = timer - delta;
  if (next <= 0) return { timer: interval, hit: true };
  return { timer: next, hit: false };
}
