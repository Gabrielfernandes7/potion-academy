// Exportar e importar o progresso (arquivo JSON). Puro quanto ao navegador: o DOM fica em ui/saveTransfer.ts.
// O arquivo guarda o progresso (poções, fases, formas, Arena), não as preferências de áudio. Importar JUNTA o que
// está no arquivo ao progresso atual (união): nada que o jogador já tenha é apagado.
import { BOMB_ORDER } from './config';
import { STAGE_SCHEMA, migrateCompleted } from './game/stages/migration';
import { SAVE_VERSION, cleanStageList, cleanStrings, mergeSave, snapshotSave, type SaveData } from './storage';
import type { BombId } from './config';

export const SAVE_FILE_NAME = 'potion-academy-progresso.json';
const GAME_ID = 'potion-academy';
/** Versão do formato do ARQUIVO (não confundir com SAVE_VERSION, a do que fica no navegador). */
export const FILE_FORMAT = 1;
const MAX_FILE_CHARS = 200_000;

export type ParsedSave = { ok: true; data: SaveData } | { ok: false; error: string };
export type ImportResult = { ok: true; added: number } | { ok: false; error: string };

export function exportSave(now: Date = new Date()): string {
  const data = snapshotSave();
  return JSON.stringify({
    jogo: GAME_ID,
    formato: FILE_FORMAT,
    versaoDoSave: SAVE_VERSION,
    salvoEm: now.toISOString(),
    dados: { owned: data.owned, stages: data.stages, stagesSchema: STAGE_SCHEMA, forms: data.forms, arena: data.arena },
  }, null, 2);
}

const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

/** Lê e valida o texto de um arquivo de progresso. Descarta o que não for válido; nunca grava nada. */
export function parseSave(text: string): ParsedSave {
  if (text.length > MAX_FILE_CHARS) return { ok: false, error: 'O arquivo é grande demais para ser um progresso do jogo.' };
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'O arquivo não é um JSON válido.' };
  }
  if (!isObject(raw) || raw.jogo !== GAME_ID) return { ok: false, error: 'Este arquivo não é um progresso do Potion Academy.' };
  if (typeof raw.formato !== 'number' || raw.formato > FILE_FORMAT) {
    return { ok: false, error: 'Este progresso é de uma versão mais nova do jogo. Atualize o jogo para carregá-lo.' };
  }
  const d = raw.dados;
  if (!isObject(d)) return { ok: false, error: 'O arquivo está incompleto: faltam os dados do progresso.' };
  const schema = typeof d.stagesSchema === 'number' && Number.isInteger(d.stagesSchema) && d.stagesSchema >= 1 ? d.stagesSchema : 1;
  if (schema > STAGE_SCHEMA) return { ok: false, error: 'Este progresso é de uma versão mais nova do jogo. Atualize o jogo para carregá-lo.' };
  const owned = cleanStrings(d.owned, BOMB_ORDER) as BombId[];
  if (!owned.includes('normal')) owned.push('normal');
  return {
    ok: true,
    data: {
      owned,
      stages: migrateCompleted(cleanStageList(d.stages), schema), // arquivo de um jogo com outra numeração de fases
      forms: cleanStrings(d.forms),
      arena: cleanStrings(d.arena),
    },
  };
}

/** Valida o arquivo e, se estiver certo, junta o progresso ao atual. */
export function importSave(text: string): ImportResult {
  const parsed = parseSave(text);
  if (!parsed.ok) return parsed;
  return { ok: true, added: mergeSave(parsed.data) };
}
