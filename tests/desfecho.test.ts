import { describe, expect, it } from 'vitest';
import indexHtml from '../index.html?raw';
import { BELLADONA_CARDS, CAULDRON_LINES, ENDING_CARDS, OUROBOROS_CARDS, PASSAGE_CARDS } from '../src/game/story';
import { LAST_STAGE, stageDef } from '../src/game/stages/index';

const texto = (cards: ReadonlyArray<{ text: string }>): string => cards.map(c => c.text).join(' ').toLowerCase();

// Os fios soltos que a história abre e que o fim precisa fechar (docs/12-historia.md, "O desfecho").
describe('o desfecho da história', () => {
  it('a Roo tem um motivo pessoal para partir: a sopa que come, o lar tomado e a noite que não conhece', () => {
    const carta = indexHtml.toLowerCase();
    expect(carta).toContain('sopa do mosteiro');
    expect(carta).toContain('tomou o teu laboratório');
    expect(carta).toContain('uma noite que tu não conheces');
    expect(stageDef(1).story.toLowerCase()).toContain('anselmo sabe quem eu sou');
  });

  it('Belladona não só perde: o trauma aparece na derrota e ela volta ao portão, com o que fazer', () => {
    expect(texto(BELLADONA_CARDS)).toContain('minha mãe ardeu três noites');
    expect(texto(BELLADONA_CARDS)).toContain('não sei o que faço');
    const fim = ENDING_CARDS.filter(c => c.speaker === 'Belladona');
    expect(fim.length).toBeGreaterThanOrEqual(2);
    expect(texto(ENDING_CARDS)).toContain('eu sei destilar a febre');
    expect(texto(ENDING_CARDS)).toContain('então fica');
  });

  it('a fome ganha resposta honesta: sem milagre, celeiros abertos, semente repartida e "deu para todos"', () => {
    const t = texto(ENDING_CARDS);
    expect(t).toContain('nenhuma poção a venceu');
    expect(t).toContain('celeiros do vale se abriram');
    expect(t).toContain('semente foi repartida');
    expect(t).toContain('deu para todos');
  });

  it('a febre e os mortos: a doença recua, nem todos se salvam e os que se foram são lembrados pelo nome', () => {
    const t = texto(ENDING_CARDS);
    expect(t).toContain('a febre recuou');
    expect(t).toContain('nem todos foram salvos');
    expect(t).toContain('lembrados pelo nome');
  });

  it('o mestre tem fecho: a última página dele responde à pergunta ("não foi prova, foi dádiva") e a vela fica na janela', () => {
    expect(texto(OUROBOROS_CARDS)).toContain('não foi prova. foi dádiva');
    expect(texto(ENDING_CARDS)).toContain('do mestre não houve notícia');
    expect(texto(ENDING_CARDS)).toContain('uma vela na janela');
    expect(CAULDRON_LINES.join(' ').toLowerCase()).toContain('uma vela ficou acesa na janela');
  });

  it('a Roo diz o que aprendeu, e a cena final mostra o Caldeirão fazendo sopa para muitos', () => {
    const roo = ENDING_CARDS.filter(c => c.speaker === 'Roo').map(c => c.text.toLowerCase()).join(' ');
    expect(roo).toContain('não nasci para provar nada');
    expect(roo).toContain('ao lado de quem tem fome');
    const cena = CAULDRON_LINES.join(' ').toLowerCase();
    expect(cena).toContain('sopa');
    expect(cena).toContain('muitas mãos');
    expect(cena).toContain('dádiva');
  });

  it('a última linha da cena final continua a mesma (a bolha sobe com ela)', () => {
    expect(CAULDRON_LINES[CAULDRON_LINES.length - 1]).toBe('Por enquanto, bastava mexer a poção, devagar.');
  });

  it('nada do desfecho põe cruz em objeto ou ficha (regra de conteúdo)', () => {
    expect(texto(ENDING_CARDS)).not.toMatch(/\bcruz\b/);
  });
});

// A mensagem do jogo (docs/12-historia.md): o verdadeiro evangelho é dedicar a vida a Jesus e servir os mais pobres,
// as viúvas e os órfãos, como Belladona passa a fazer. Dita em pouco, em cada parte, sem aula e sem versículo.
describe('a mensagem do jogo está em cada parte da história', () => {
  const capitulos = [1, 5, 9, 13, 17, 20].map(n => stageDef(n).story.toLowerCase());
  const geral = [
    indexHtml,
    ...ENDING_CARDS.map(c => c.text),
    ...Object.values(PASSAGE_CARDS).flat().map(c => c.text),
    ...Array.from({ length: LAST_STAGE }, (_, i) => stageDef(i + 1).story),
  ].join(' ').toLowerCase();

  it('Jesus, os pobres, as viúvas e os órfãos aparecem na carta, nas passagens, nas fases e no fim', () => {
    for (const palavra of ['jesus', 'pobres', 'viúvas', 'órfãos']) expect(geral).toContain(palavra);
    expect(texto(ENDING_CARDS)).toContain('jesus');
    expect(texto(ENDING_CARDS)).toContain('viúvas');
    expect(texto(ENDING_CARDS)).toContain('órfãos');
    expect(texto(Object.values(PASSAGE_CARDS).flat())).toContain('jesus');
  });

  it('Belladona é o exemplo: o fim a mostra cuidando de quem foi deixado para trás', () => {
    expect(texto(ENDING_CARDS)).toMatch(/belladona[^.]*(viúvas|órfãos)|(viúvas|órfãos)[^.]*belladona/);
  });

  it('nenhum texto do jogo cita capítulo e versículo (Mt 5,3; Jo 6,1-15...)', () => {
    const tudo = [geral, ...capitulos].join(' ');
    expect(tudo).not.toMatch(/\b(mt|mc|lc|jo|at|sl|is|ecl|rm|cor|gn|ex)\s?\d{1,3}\s?[,:.]\s?\d/i);
    expect(tudo).not.toMatch(/\b(evangelho|capítulo|versículo) (de|segundo) (mateus|marcos|lucas|joão)\b/);
  });
});
