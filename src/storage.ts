// Persistência em localStorage.
// ATENÇÃO: as chaves 'bombroo_owned' e as de fases não podem ser renomeadas sem uma migração, senão os jogadores perdem o progresso.
// 'bombroo_bank' (o OURO, que foi tirado do jogo) não é mais lida nem gravada: saves antigos só a deixam sem uso.

import { BombId } from './config';
import { STAGE_SCHEMA, migrateCompleted } from './game/stages/migration';
import { FORM_LESSONS, learnedAfter, type LessonForm } from './game/learning';
import type { FormId } from './game/forms/types';

const OWNED_KEY = 'bombroo_owned';
const STAGES_KEY = 'bombroo_stages_completed';
const STAGES_SCHEMA_KEY = 'bombroo_stages_schema'; // versão da numeração das fases (game/stages/migration.ts)
const FORMS_KEY = 'bombroo_forms'; // transformações aprendidas (chave nova; o fogo é de nascença)
const ARENA_KEY = 'bombroo_arena_wins'; // chefes já vencidos na Arena (chave nova; não mexe no progresso antigo)

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

let owned: BombId[] = Storage.get<BombId[]>(OWNED_KEY, ['normal']);
if (!owned.includes('normal')) owned.push('normal');

export function hasBombType(t: BombId): boolean {
  return owned.includes(t);
}

// A poção passa a ser da Roo (aprendida na jornada, sem custo).
export function grantBombType(t: BombId): void {
  if (hasBombType(t)) return;
  owned.push(t);
  Storage.set(OWNED_KEY, owned);
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
  const learned = learnedAfter(stage);
  if (learned) grantBombType(learned);
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

// Transformações: o fogo é de nascença. As outras são aprendidas na lição da fase (game/learning.ts) e ficam
// guardadas; quem já concluiu a fase da lição conta como tendo aprendido (saves antigos não perdem nada).
export function knowsForm(f: FormId): boolean {
  if (f === 'fire') return true;
  const list = Storage.get<unknown>(FORMS_KEY, []);
  if (Array.isArray(list) && list.includes(f)) return true;
  return isStageCompleted(FORM_LESSONS[f as LessonForm].stage);
}

export function learnForm(f: FormId): void {
  if (f === 'fire') return;
  const list = Storage.get<unknown>(FORMS_KEY, []);
  const have = Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : [];
  if (have.includes(f)) return;
  have.push(f);
  Storage.set(FORMS_KEY, have);
}
