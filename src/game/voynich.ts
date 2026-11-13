// Decoração à moda do Manuscrito de Voynich (puro, testável): seções do códice, numeração de fólios e
// palavras em "voynichês". O Voynich (Beinecke MS 408) é um códice de vitela do início do século XV,
// escrito numa língua que ninguém decifrou, com seções de plantas (herbária), diagramas circulares de
// astros (astronômica/astrológica), banhos com tubos (balneológica), vidros de farmácia com ervas
// (farmacêutica) e parágrafos curtos marcados com estrelas (receitas). Aqui o usamos só como estética:
// as palavras são sorteadas com o alfabeto EVA e não dizem nada.
import { mulberry32 } from '../audio/tracks';

export type SecaoId = 'herbaria' | 'astronomica' | 'balneologica' | 'farmaceutica' | 'receitas';

export interface Secao { nome: string; nota: string }

export const SECOES: Record<SecaoId, Secao> = {
  herbaria: { nome: 'Seção herbária', nota: 'plantas e raízes' },
  astronomica: { nome: 'Seção astronômica', nota: 'astros e círculos' },
  balneologica: { nome: 'Seção balneológica', nota: 'banhos e tubos' },
  farmaceutica: { nome: 'Seção farmacêutica', nota: 'vidros e ervas' },
  receitas: { nome: 'Seção das receitas', nota: 'parágrafos de estrelas' },
};

/** Fólio: duas faces por folha, "r" (frente) e "v" (verso). Índice 0 = f. 1r, 1 = f. 1v, 2 = f. 2r... */
export function folioLabel(index: number): string {
  const i = Math.max(0, Math.floor(index));
  return `f. ${Math.floor(i / 2) + 1}${i % 2 === 0 ? 'r' : 'v'}`;
}

// Palavras muito frequentes no manuscrito real, em transcrição EVA.
export const EVA_COMMON: readonly string[] = ['daiin', 'ol', 'chedy', 'qokeedy', 'qokaiin', 'shedy', 'aiin', 'okeey', 'qokain'];

// Letras que a transcrição EVA usa; o gerador nunca sai delas.
export const EVA_LETTERS = 'acdefhiklmnopqrsty';

const PRE = ['qo', 'ch', 'sh', 'd', 's', 'o', 'k', 't', 'y', ''];
const MID = ['k', 't', 'ke', 'te', 'ch', 'she', 'l', 'd', ''];
const VOW = ['ai', 'ee', 'e', 'o', 'a', 'ei'];
const END = ['iin', 'in', 'dy', 'y', 'l', 'r', 'm', 'n', 'ol', 'ar'];

function seedOf(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

const pick = <T,>(list: readonly T[], r: () => number): T => list[Math.min(list.length - 1, Math.floor(r() * list.length))];

/** `count` palavras em voynichês, sempre as mesmas para a mesma semente (a página não muda a cada visita). */
export function voynichWords(seed: string, count: number): string[] {
  const r = mulberry32(seedOf(seed));
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    out.push(r() < 0.35 ? pick(EVA_COMMON, r) : pick(PRE, r) + pick(MID, r) + pick(VOW, r) + pick(END, r));
  }
  return out;
}

/** Linhas de texto em voynichês (cada linha, `perLine` palavras). */
export function voynichLines(seed: string, lines: number, perLine: number): string[] {
  const words = voynichWords(seed, lines * perLine);
  return Array.from({ length: lines }, (_, i) => words.slice(i * perLine, (i + 1) * perLine).join(' '));
}
