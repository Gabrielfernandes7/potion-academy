// Persistência em localStorage.
// ATENÇÃO: as chaves 'bombroo_owned' e as de fases não podem ser renomeadas sem uma migração, senão os jogadores perdem o progresso.
// 'bombroo_bank' (o OURO, que foi tirado do jogo) não é mais lida nem gravada: saves antigos só a deixam sem uso.

import { BOMB_ORDER, BombId } from './config';
import { STAGE_SCHEMA, migrateCompleted } from './game/stages/migration';
import { FORM_LESSONS, learnedAfter, type LessonForm } from './game/learning';
import type { FormId } from './game/forms/types';

// Versão do formato do save inteiro (as seis chaves juntas). A numeração das fases tem a sua própria versão
// (STAGES_SCHEMA_KEY). Ao mudar o formato de uma chave, aumente SAVE_VERSION e acrescente o passo em `SAVE_STEPS`.
export const SAVE_VERSION = 1;
const SAVE_VERSION_KEY = 'bombroo_save_version';
const OWNED_KEY = 'bombroo_owned';
const STAGES_KEY = 'bombroo_stages_completed';
const STAGES_SCHEMA_KEY = 'bombroo_stages_schema'; // versão da numeração das fases (game/stages/migration.ts)
const FORMS_KEY = 'bombroo_forms'; // transformações aprendidas (chave nova; o fogo é de nascença)
const ARENA_KEY = 'bombroo_arena_wins'; // chefes já vencidos na Arena (chave nova; não mexe no progresso antigo)

// Validadores dos dados salvos: o JSON pode vir corrompido, de uma versão antiga ou editado à mão. Cada um devolve só o
// que é válido e descarta o resto (identificadores desconhecidos, tipos errados, duplicatas).
export function cleanStrings(raw: unknown, allowed?: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const x of raw) if (typeof x === 'string' && (!allowed || allowed.includes(x)) && !out.includes(x)) out.push(x);
  return out;
}

export function cleanStageList(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  const out: number[] = [];
  for (const x of raw) if (Number.isInteger(x) && x >= 1 && x <= 999 && !out.includes(x)) out.push(x);
  return out;
}

/** O progresso numa forma só: poções, fases (na numeração atual), formas aprendidas e chefes vencidos na Arena. */
export interface SaveData {
  owned: BombId[];
  stages: number[];
  forms: string[];
  arena: string[];
}

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

// O save é carregado (e migrado) na primeira vez que alguém o usa, não ao importar o módulo: assim os testes
// preparam o localStorage antes e importar `storage.ts` não grava nada.
let owned: BombId[] = [];
let loaded = false;

// SAVE_STEPS[v] leva o save da versão v para a v + 1. Hoje só existe a versão 1 (a versão 0 é o save de antes de ela
// existir, que tem o mesmo formato): o passo 0 só carimba. Veja também game/stages/migration.ts, para as fases.
const SAVE_STEPS: Record<number, () => void> = {
  0: () => {},
};

function loadSave(): void {
  if (loaded) return;
  loaded = true;
  owned = cleanStrings(Storage.get<unknown>(OWNED_KEY, ['normal']), BOMB_ORDER) as BombId[];
  if (!owned.includes('normal')) owned.push('normal');
  migrateStageProgress();
  stampSaveVersion();
}

// Um save mais novo que este jogo (versão maior) fica como está: não migramos nem rebaixamos o que não conhecemos.
function stampSaveVersion(): void {
  const stored = Storage.get<unknown>(SAVE_VERSION_KEY, 0);
  const version = typeof stored === 'number' && Number.isInteger(stored) && stored >= 0 ? stored : 0;
  if (version >= SAVE_VERSION) return;
  for (let v = version; v < SAVE_VERSION; v++) SAVE_STEPS[v]();
  Storage.set(SAVE_VERSION_KEY, SAVE_VERSION);
}

/** Só para testes: esquece o que foi carregado, para ler o localStorage de novo. */
export function resetSaveCache(): void {
  loaded = false;
  owned = [];
}

export function hasBombType(t: BombId): boolean {
  loadSave();
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
function migrateStageProgress(): void {
  const version = Storage.get<unknown>(STAGES_SCHEMA_KEY, null);
  if (version === STAGE_SCHEMA) return;
  const list = cleanStageList(Storage.get<unknown>(STAGES_KEY, []));
  Storage.set(STAGES_KEY, migrateCompleted(list, typeof version === 'number' ? version : 1));
  Storage.set(STAGES_SCHEMA_KEY, STAGE_SCHEMA);
}

export function isStageCompleted(stage: number): boolean {
  loadSave();
  const completed = cleanStageList(Storage.get<unknown>(STAGES_KEY, []));
  return completed.includes(stage);
}

export function markStageCompleted(stage: number): void {
  loadSave();
  const completed = cleanStageList(Storage.get<unknown>(STAGES_KEY, []));
  if (!completed.includes(stage)) {
    completed.push(stage);
    Storage.set(STAGES_KEY, completed);
  }
  const learned = learnedAfter(stage);
  if (learned) grantBombType(learned);
}

// Vitórias na Arena de treino: guardam só o id de cada chefe vencido (abre a página dele no Manuscrito).
export function arenaWins(): string[] {
  loadSave();
  return cleanStrings(Storage.get<unknown>(ARENA_KEY, []));
}

export function markArenaWin(boss: string): void {
  loadSave();
  const wins = arenaWins();
  if (!wins.includes(boss)) {
    wins.push(boss);
    Storage.set(ARENA_KEY, wins);
  }
}

// Transformações: o fogo é de nascença. As outras são aprendidas na lição da fase (game/learning.ts) e ficam
// guardadas; quem já concluiu a fase da lição conta como tendo aprendido (saves antigos não perdem nada).
export function knowsForm(f: FormId): boolean {
  loadSave();
  if (f === 'fire') return true;
  if (cleanStrings(Storage.get<unknown>(FORMS_KEY, [])).includes(f)) return true;
  return isStageCompleted(FORM_LESSONS[f as LessonForm].stage);
}

export function learnForm(f: FormId): void {
  loadSave();
  if (f === 'fire') return;
  const have = cleanStrings(Storage.get<unknown>(FORMS_KEY, []));
  if (have.includes(f)) return;
  have.push(f);
  Storage.set(FORMS_KEY, have);
}

/** Uma cópia do progresso atual (já migrado para a numeração atual das fases). */
export function snapshotSave(): SaveData {
  loadSave();
  return {
    owned: [...owned],
    stages: cleanStageList(Storage.get<unknown>(STAGES_KEY, [])),
    forms: cleanStrings(Storage.get<unknown>(FORMS_KEY, [])),
    arena: cleanStrings(Storage.get<unknown>(ARENA_KEY, [])),
  };
}

/**
 * Junta um progresso ao atual (união: nada do que o jogador já tem se perde). `data` deve estar na numeração atual das
 * fases e já validado (veja saveFile.ts). Devolve quantos itens novos entraram.
 */
export function mergeSave(data: SaveData): number {
  loadSave();
  const before = snapshotSave();
  const union = <T>(a: readonly T[], b: readonly T[]): T[] => [...new Set([...a, ...b])];
  owned = union(before.owned, data.owned).sort((a, b) => BOMB_ORDER.indexOf(a) - BOMB_ORDER.indexOf(b));
  const stages = union(before.stages, data.stages).sort((a, b) => a - b);
  const forms = union(before.forms, data.forms);
  const arena = union(before.arena, data.arena);
  Storage.set(OWNED_KEY, owned);
  Storage.set(STAGES_KEY, stages);
  Storage.set(STAGES_SCHEMA_KEY, STAGE_SCHEMA);
  Storage.set(FORMS_KEY, forms);
  Storage.set(ARENA_KEY, arena);
  return (owned.length - before.owned.length) + (stages.length - before.stages.length)
    + (forms.length - before.forms.length) + (arena.length - before.arena.length);
}
