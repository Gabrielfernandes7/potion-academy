import { describe, expect, it } from 'vitest';
import { ELEMENTS, ElementId } from '../src/config';
import { LATIN, ROUGH_FILTER, elementIconSvg } from '../src/ui/elementIcons';

const ALL = Object.keys(ELEMENTS) as ElementId[];

describe('ícones dos atributos', () => {
  it('há um SVG para cada atributo da alquimia, todos diferentes', () => {
    const svgs = ALL.map(e => elementIconSvg(e));
    expect(new Set(svgs).size).toBe(ALL.length);
    for (const s of svgs) {
      expect(s.startsWith('<svg')).toBe(true);
      expect(s.endsWith('</svg>')).toBe(true);
      expect(s).toContain('viewBox="0 0 48 48"');
      expect(s).toContain('aria-hidden="true"');
    }
  });
  it('o tamanho é o pedido e a classe diz o elemento', () => {
    const s = elementIconSvg('water', 40);
    expect(s).toContain('width="40"');
    expect(s).toContain('height="40"');
    expect(s).toContain('el-water');
  });
  it('só tinta e aquarela: nada de imagem externa nem script', () => {
    for (const e of ALL) {
      const s = elementIconSvg(e);
      expect(s).not.toMatch(/<image|href=|<script|http/i);
    }
  });
  it('o filtro de tinta existe e tem o id que os ícones usam', () => {
    expect(ROUGH_FILTER).toContain('id="rough"');
    expect(elementIconSvg('fire')).toContain('url(#rough)');
  });
  it('cada atributo tem o nome latino do manuscrito', () => {
    expect(LATIN).toEqual({ fire: 'sulphur', water: 'mercurius', earth: 'sal', air: 'aether' });
  });
});
