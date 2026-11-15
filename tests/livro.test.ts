import { describe, expect, it } from 'vitest';
import { TRACKS } from '../src/audio/tracks';
import { LIVRO, indiceDe, palavras } from '../src/game/livro';
import { SECOES } from '../src/game/voynich';
import { H, W, disco, type Ctx } from '../src/pages/livroDraw';
import { CENAS, SPRITES_DAS_CENAS } from '../src/pages/livroScenes';

describe('o Livro de Roo: o texto', () => {
  it('são 13 aberturas, com ids, folios e títulos únicos, e a capa vem primeiro', () => {
    expect(LIVRO).toHaveLength(13);
    expect(LIVRO[0].id).toBe('capa');
    expect(LIVRO[LIVRO.length - 1].id).toBe('frasco');
    for (const campo of ['id', 'folio', 'titulo'] as const) expect(new Set(LIVRO.map(p => p[campo])).size, campo).toBe(LIVRO.length);
    expect(LIVRO.map(p => p.folio)).toEqual(['f. 1r', 'f. 1v', 'f. 2r', 'f. 2v', 'f. 3r', 'f. 3v', 'f. 4r', 'f. 4v', 'f. 5r', 'f. 5v', 'f. 6r', 'f. 6v', 'f. 7r']);
  });
  it('cada abertura tem três parágrafos, de tamanho que cabe na página, e uma glosa do copista', () => {
    for (const p of LIVRO) {
      expect(p.texto, p.id).toHaveLength(3);
      expect(palavras(p), p.id).toBeGreaterThan(60);
      expect(palavras(p), p.id).toBeLessThan(260);
      expect(p.glosa.texto.length, p.id).toBeGreaterThan(30);
      for (const campo of [p.rubrica, p.titulo, p.legenda]) expect(campo.trim(), p.id).not.toBe('');
    }
  });
  it('a história traz o que foi pedido: a bolha iridescente, as velas, o pão partido e a filosofia de Belladona', () => {
    const tudo = (id: string): string => LIVRO.find(p => p.id === id)!.texto.join(' ').toLowerCase();
    expect(tudo('bolha')).toContain('iridescente');
    expect(LIVRO.find(p => p.id === 'bolha')!.legenda.toLowerCase()).toContain('velas');
    expect(tudo('bolha')).toContain('velas');
    expect(tudo('paes')).toContain('cinco pães');
    expect(tudo('paes')).toContain('partido');
    expect(tudo('belladona')).toContain('de um sopro e de sabão nasce pão');
  });
  it('NÃO cita versículos: nenhuma referência (livro e número) nem citação entre aspas de um texto sagrado', () => {
    const tudo = LIVRO.map(p => `${p.titulo} ${p.rubrica} ${p.texto.join(' ')} ${p.glosa.texto} ${p.legenda}`).join(' ');
    expect(tudo).not.toMatch(/\b(Mt|Mc|Lc|Jo|At|Sl|Is|Ecl|Pr|Rm|Gn|Ex)\s?\d+[,.:]\d+/);
    expect(tudo).not.toMatch(/\b(Mateus|Marcos|Lucas|João|Atos|Salmos?|Isaías|Eclesiastes)\s+\d+/);
  });
  it('a mensagem atravessa o livro: dedicar a vida a Jesus e servir os mais pobres, as viúvas e os órfãos', () => {
    const glosas = LIVRO.map(p => p.glosa.texto.toLowerCase()).join(' ');
    expect(glosas).toContain('jesus');
    expect(glosas).toContain('viúva');
    expect(glosas).toContain('órfã');
    expect(glosas).toContain('pobres');
    expect(LIVRO.filter(p => /viúva|órfã|pobre/.test(`${p.texto.join(' ')} ${p.glosa.texto}`.toLowerCase())).length).toBeGreaterThanOrEqual(8);
  });
  it('o cristianismo entra com reverência: nenhum texto menciona cruz', () => {
    for (const p of LIVRO) expect(`${p.titulo} ${p.texto.join(' ')} ${p.glosa.texto} ${p.legenda}`.toLowerCase(), p.id).not.toMatch(/\bcruz\b/);
  });
  it('cada abertura usa uma seção do códice e uma faixa de música que existem', () => {
    const faixas = new Set(TRACKS.map(t => t.id));
    for (const p of LIVRO) {
      expect(Object.keys(SECOES), p.id).toContain(p.secao);
      expect(faixas.has(p.faixa), `${p.id}: faixa ${p.faixa}`).toBe(true);
    }
  });
  it('o endereço #id leva à abertura certa (e id desconhecido cai na capa)', () => {
    expect(indiceDe('bolha')).toBe(3);
    expect(indiceDe('frasco')).toBe(12);
    expect(indiceDe('primavera')).toBe(11);
    expect(indiceDe('nada')).toBe(0);
    expect(indiceDe('')).toBe(0);
  });
});

// Um contexto 2D de mentira: aceita qualquer chamada e propriedade. Serve para rodar cada cena e pegar erros de digitação
// e de conta (NaN nas coordenadas), sem um navegador.
function contextoFalso(registro: number[][]): Ctx {
  const alvo: Record<string, unknown> = {};
  return new Proxy(alvo, {
    get: (_t, nome: string) => {
      if (nome in alvo) return alvo[nome];
      return (...args: unknown[]): void => { registro.push(args.filter((a): a is number => typeof a === 'number')); };
    },
    set: (_t, nome: string, v) => { alvo[nome] = v; return true; },
  }) as unknown as Ctx;
}

describe('o Livro de Roo: as gravuras', () => {
  it('toda abertura tem uma cena', () => {
    for (const p of LIVRO) expect(typeof CENAS[p.cena], p.id).toBe('function');
    expect(Object.keys(CENAS).sort()).toEqual([...new Set(LIVRO.map(p => p.cena))].sort());
  });
  it('cada cena roda em vários instantes, sem erro e sem NaN nas coordenadas', () => {
    for (const p of LIVRO) {
      for (const t of [0, 0.4, 3.7, 11.2, 41]) {
        const reg: number[][] = [];
        expect(() => CENAS[p.cena](contextoFalso(reg), t, {}), `${p.id} em t=${t}`).not.toThrow();
        expect(reg.length, p.id).toBeGreaterThan(20); // desenhou de fato
        for (const args of reg) for (const n of args) expect(Number.isFinite(n), `${p.id} t=${t}: ${args.join(',')}`).toBe(true);
      }
    }
  });
  it('as texturas que as cenas pedem incluem a Roo bebê na bolha (16 quadros) e os personagens', () => {
    for (let i = 0; i < 16; i++) expect(SPRITES_DAS_CENAS).toContain(`roo_bubble_fetal_${i}`);
    for (const k of ['witch_idle_0', 'anselmo_front_0', 'mestre_sombra_0', 'roo_down_0', 'hud_flask_empty']) expect(SPRITES_DAS_CENAS).toContain(k);
  });
  it('o canvas das cenas é 4:3 e discos minúsculos saem quadrados (nunca um "+", que lembraria uma cruz)', () => {
    expect(W / H).toBeCloseTo(4 / 3);
    const quadrados: number[][] = [];
    disco(contextoFalso(quadrados), 10, 10, 2, '#fff');
    expect(quadrados).toHaveLength(1); // um único retângulo
    const grande: number[][] = [];
    disco(contextoFalso(grande), 10, 10, 6, '#fff');
    expect(grande.length).toBeGreaterThan(5); // linhas de um disco de verdade
  });
});
