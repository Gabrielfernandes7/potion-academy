// Persistência em localStorage.
// ATENÇÃO: as chaves 'bombroo_bank' e 'bombroo_owned' não podem ser renomeadas
// sem uma migração, senão os jogadores perdem o progresso.

import { BOMB_TYPES, BombId } from './config';

const BANK_KEY = 'bombroo_bank';
const OWNED_KEY = 'bombroo_owned';
const START_BANK = 100;

export const Storage = {
  get<T>(k: string, def: T): T {
    try {
      const v = localStorage.getItem(k);
      return v === null ? def : (JSON.parse(v) as T);
    } catch {
      return def;
    }
  },
  set(k: string, v: unknown): void {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {
      // localStorage indisponível (modo privado, cota cheia): o jogo segue sem persistir.
    }
  },
};

export const Bank = {
  get(): number {
    return Storage.get<number>(BANK_KEY, 0);
  },
  add(n: number): number {
    const v = this.get() + n;
    Storage.set(BANK_KEY, v);
    return v;
  },
  spend(n: number): boolean {
    const v = this.get();
    if (v < n) return false;
    Storage.set(BANK_KEY, v - n);
    return true;
  },
};

if (Storage.get<number | null>(BANK_KEY, null) === null) {
  Storage.set(BANK_KEY, START_BANK);
}

let owned: BombId[] = Storage.get<BombId[]>(OWNED_KEY, ['normal']);
if (!owned.includes('normal')) owned.push('normal');

export function hasBombType(t: BombId): boolean {
  return owned.includes(t);
}

export function buyBombType(t: BombId): boolean {
  if (hasBombType(t)) return false;
  if (!Bank.spend(BOMB_TYPES[t].cost)) return false;
  owned.push(t);
  Storage.set(OWNED_KEY, owned);
  return true;
}
