import { describe, expect, it } from 'vitest';
import { BLOCK_NAME, BLOCK_TEXTURE, BlockStyle, blockStyleOf, blockTextureOf } from '../src/game/stages/blockStyles';
import { STAGES } from '../src/game/stages/index';

const STYLES = Object.keys(BLOCK_TEXTURE) as BlockStyle[];

describe('blocos por fase', () => {
  it('cada fase da campanha tem o seu bloco, sem repetir (a pilha de livros espera a Biblioteca)', () => {
    const styles = STAGES.map(s => blockStyleOf(s));
    expect(new Set(styles).size).toBe(STAGES.length);
    expect(styles).not.toContain('books');
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
