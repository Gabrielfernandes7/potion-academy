import { describe, expect, it } from 'vitest';
import { EVA_COMMON, EVA_LETTERS, SECOES, SecaoId, folioLabel, voynichLines, voynichWords } from '../src/game/voynich';
import { MANUSCRITO } from '../src/game/manuscrito';
import { ornamentSvg, starBullet } from '../src/ui/ornaments';

const IDS = Object.keys(SECOES) as SecaoId[];

describe('voynichês', () => {
  it('é determinístico: a mesma semente dá as mesmas palavras', () => {
    expect(voynichWords('quimera', 12)).toEqual(voynichWords('quimera', 12));
    expect(voynichWords('quimera', 12)).not.toEqual(voynichWords('belladona', 12));
  });
  it('só usa as letras do alfabeto EVA, em minúsculas', () => {
    for (const seed of ['a', 'roo', 'mandragora', 'x'.repeat(20)]) {
      for (const w of voynichWords(seed, 60)) {
        expect(w.length).toBeGreaterThanOrEqual(2);
        for (const ch of w) expect(EVA_LETTERS.includes(ch), `${w}:${ch}`).toBe(true);
      }
    }
  });
  it('mistura palavras comuns do manuscrito real com palavras novas', () => {
    const words = voynichWords('mistura', 200);
    expect(words.some(w => EVA_COMMON.includes(w))).toBe(true);
    expect(words.some(w => !EVA_COMMON.includes(w))).toBe(true);
  });
  it('as linhas têm o número de palavras pedido', () => {
    const lines = voynichLines('linhas', 3, 4);
    expect(lines).toHaveLength(3);
    for (const l of lines) expect(l.split(' ')).toHaveLength(4);
  });
});

describe('fólios e seções', () => {
  it('duas faces por folha: r e v', () => {
    expect([0, 1, 2, 3, 9].map(folioLabel)).toEqual(['f. 1r', 'f. 1v', 'f. 2r', 'f. 2v', 'f. 5v']);
    expect(folioLabel(-4)).toBe('f. 1r');
  });
  it('toda página está numa seção que existe, e as cinco seções têm ornamento', () => {
    for (const e of MANUSCRITO) expect(IDS, e.id).toContain(e.secao);
    for (const id of IDS) {
      expect(SECOES[id].nome).not.toBe('');
      const svg = ornamentSvg(id, 80);
      expect(svg.startsWith('<svg')).toBe(true);
      expect(svg).toContain('width="80"');
      expect(svg).not.toMatch(/<image|href=|<script|http/i);
    }
    expect(new Set(IDS.map(id => ornamentSvg(id))).size).toBe(IDS.length);
  });
  it('as plantas ficam na seção herbária e a Quimera na balneológica', () => {
    const sec = (id: string): string => MANUSCRITO.find(e => e.id === id)!.secao;
    expect(['belladona', 'flor', 'mandragora'].map(sec)).toEqual(['herbaria', 'herbaria', 'herbaria']);
    expect(sec('quimera')).toBe('balneologica');
  });
  it('a estrela de parágrafo é um SVG', () => {
    expect(starBullet(16)).toContain('width="16"');
  });
});
