// Persistência em localStorage.
// ATENÇÃO: as chaves 'bombroo_bank' e 'bombroo_owned' não podem ser renomeadas
// sem uma migração, senão os jogadores perdem o progresso.

import { BOMB_TYPES, BombId } from './config';
import { STAGE_SCHEMA, migrateCompleted } from './game/stages/migration';

const BANK_KEY = 'bombroo_bank';
const OWNED_KEY = 'bombroo_owned';
const STAGES_KEY = 'bombroo_stages_completed';
const STAGES_SCHEMA_KEY = 'bombroo_stages_schema'; // versão da numeração das fases (game/stages/migration.ts)
const ARENA_KEY = 'bombroo_arena_wins'; // chefes já vencidos na Arena (chave nova; não mexe no progresso antigo)
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

// Rastreamento de fases concluídas. A numeração das fases tem versão: se o jogo inseriu fases desde
// a última vez, o progresso salvo é renumerado uma vez, ao carregar.
(function migrateStageProgress(): void {
  const version = Storage.get<number | null>(STAGES_SCHEMA_KEY, null);
  if (version === STAGE_SCHEMA) return;
  const list = Storage.get<number[]>(STAGES_KEY, []);
  Storage.set(STAGES_KEY, migrateCompleted(list, version ?? 1));
  Storage.set(STAGES_SCHEMA_KEY, STAGE_SCHEMA);
})();

export function isStageCompleted(stage: number): boolean {
  const completed = Storage.get<number[]>(STAGES_KEY, []);
  return completed.includes(stage);
}

export function markStageCompleted(stage: number): void {
  const completed = Storage.get<number[]>(STAGES_KEY, []);
  if (!completed.includes(stage)) {
    completed.push(stage);
    Storage.set(STAGES_KEY, completed);
  }
}

// Vitórias na Arena de treino: guardam só o id de cada chefe vencido (abre a página dele no Manuscrito).
export function arenaWins(): string[] {
  const list = Storage.get<unknown>(ARENA_KEY, []);
  return Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : [];
}

export function markArenaWin(boss: string): void {
  const wins = arenaWins();
  if (!wins.includes(boss)) {
    wins.push(boss);
    Storage.set(ARENA_KEY, wins);
  }
}
