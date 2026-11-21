// Teclas das ações do jogo, que a jogadora pode trocar (regra pura; só load/save usam o localStorage).
// As setas, ENTER (pausa), R (reiniciar), 1 a 4 (frascos) e ESC ficam fixas.
import { Storage } from '../storage';

export type KeyAction = 'bomb' | 'transform' | 'ability' | 'ability2' | 'defense' | 'detonate';

export interface KeyActionDef { id: KeyAction; label: string; code: number }

// keyCode do navegador (é o mesmo que o Phaser usa em Phaser.Input.Keyboard.KeyCodes)
export const KEY_ACTIONS: readonly KeyActionDef[] = [
  { id: 'bomb', label: 'Colocar poção', code: 32 },
  { id: 'transform', label: 'Transformar', code: 84 },
  { id: 'ability', label: 'Habilidade da forma', code: 88 },
  { id: 'ability2', label: 'Segunda habilidade', code: 67 },
  { id: 'defense', label: 'Defesa', code: 86 },
  { id: 'detonate', label: 'Detonar poção de Ar', code: 68 },
];

export type KeyMap = Record<KeyAction, number>;

export const DEFAULT_KEYMAP: KeyMap = Object.fromEntries(KEY_ACTIONS.map(a => [a.id, a.code])) as KeyMap;

// setas, Enter, Esc, R, 1 a 4, ? e H (ajuda), Tab e Shift: reservadas
const RESERVED = new Set([37, 38, 39, 40, 13, 27, 82, 49, 50, 51, 52, 72, 9, 16, 17, 18, 91, 93]);

export function isReservedKey(code: number): boolean {
  return RESERVED.has(code);
}

/** Nome curto da tecla para mostrar na tela. */
export function keyLabel(code: number): string {
  if (code === 32) return 'Espaço';
  if (code >= 65 && code <= 90) return String.fromCharCode(code);
  if (code >= 48 && code <= 57) return String.fromCharCode(code);
  if (code >= 96 && code <= 105) return `Num ${code - 96}`;
  if (code >= 112 && code <= 123) return `F${code - 111}`;
  return `Tecla ${code}`;
}

/**
 * Troca a tecla de uma ação. Tecla reservada não vale (devolve o mapa igual); se outra ação já usava a tecla,
 * as duas trocam de lugar (nunca ficam duas ações na mesma tecla).
 */
export function rebind(map: KeyMap, action: KeyAction, code: number): KeyMap {
  if (isReservedKey(code) || !Number.isInteger(code) || code <= 0) return map;
  const next = { ...map };
  const other = KEY_ACTIONS.find(a => a.id !== action && next[a.id] === code);
  if (other) next[other.id] = next[action];
  next[action] = code;
  return next;
}

/** Lê um mapa salvo, ignorando o que for inválido ou repetido. */
export function sanitizeKeymap(saved: unknown): KeyMap {
  const out = { ...DEFAULT_KEYMAP };
  if (!saved || typeof saved !== 'object') return out;
  const used = new Set<number>();
  for (const a of KEY_ACTIONS) {
    const v = (saved as Record<string, unknown>)[a.id];
    if (typeof v === 'number' && Number.isInteger(v) && v > 0 && !isReservedKey(v) && !used.has(v)) out[a.id] = v;
  }
  // se o salvo deixou duas ações na mesma tecla, volta tudo ao padrão
  const codes = Object.values(out);
  return new Set(codes).size === codes.length ? out : { ...DEFAULT_KEYMAP };
}

const KEY = 'bombroo_keymap';
let current: KeyMap | null = null;

export function getKeymap(): KeyMap {
  if (!current) current = sanitizeKeymap(Storage.get<unknown>(KEY, null));
  return current;
}

export function setKeymap(map: KeyMap): void {
  current = map;
  Storage.set(KEY, map);
}

export function resetKeymap(): KeyMap {
  setKeymap({ ...DEFAULT_KEYMAP });
  return getKeymap();
}
