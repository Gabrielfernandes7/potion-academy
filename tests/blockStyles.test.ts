import { describe, expect, it } from 'vitest';
import { BLOCK_NAME, BLOCK_TEXTURE, BlockStyle, blockStyleOf, blockTextureOf } from '../src/game/stages/blockStyles';
import { STAGES } from '../src/game/stages/index';

const STYLES = Object.keys(BLOCK_TEXTURE) as BlockStyle[];

describe('blocos por fase', () => {
  it('cada fase da campanha tem bloco; os livros são da Biblioteca (três fases), e o pergaminho se repete só no duelo e no scriptorium', () => {
    const styles = STAGES.map(s => blockStyleOf(s));
    expect(styles.filter(s => s === 'books')).toHaveLength(3);
    expect(styles.filter(s => s === 'scroll')).toHaveLength(2);
    expect(STAGES.every(s => s.block !== undefined)).toBe(true);
  });
  it('todo estilo tem textura e nome, e as texturas não se repetem', () => {
    for (const s of STYLES) {
      expect(BLOCK_TEXTURE[s], s).toBeTruthy();
      expect(BLOCK_NAME[s], s).toBeTruthy();
    }
    expect(new Set(STYLES.map(s => BLOCK_TEXTURE[s])).size).toBe(STYLES.length);
  });
  it('o primeiro bloco é o caixote de madeira e o jardim usa o canteiro', () => {
    expect(blockTextureOf(STAGES[0])).toBe('block');
    expect(blockTextureOf(STAGES[STAGES.length - 1])).toBe('g_block');
  });
  it('sem escolha, a fase usa madeira (castelo) ou canteiro (jardim)', () => {
    expect(blockStyleOf({ theme: 'stone' })).toBe('wood');
    expect(blockStyleOf({ theme: 'crypt' })).toBe('wood');
    expect(blockStyleOf({ theme: 'garden' })).toBe('garden');
  });
});
