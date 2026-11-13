// O bloco destrutível de cada fase: um estilo por fase (as texturas estão em textures/blocks.ts, terrain.ts
// e garden.ts). Dado puro, sem Phaser.
import type { StageSpec } from './types';

export type BlockStyle =
  | 'wood' | 'salt' | 'moss' | 'barrel' | 'slab' | 'wax' | 'flasks' | 'scroll' | 'hay' | 'cairn' | 'brick' | 'garden' | 'books';

export const BLOCK_TEXTURE: Record<BlockStyle, string> = {
  wood: 'block', salt: 'block_salt', moss: 'block_moss', barrel: 'block_barrel', slab: 'block_slab', wax: 'block_wax',
  flasks: 'block_flasks', scroll: 'block_scroll', hay: 'block_hay', cairn: 'block_cairn', brick: 'block_brick', garden: 'g_block', books: 'block_books',
};

export const BLOCK_NAME: Record<BlockStyle, string> = {
  wood: 'Caixote de madeira', salt: 'Bloco de sal', moss: 'Caixote com musgo', barrel: 'Barril de azougue',
  slab: 'Laje de pedra', wax: 'Caixote lacrado', flasks: 'Caixa de frascos', scroll: 'Pilha de pergaminhos',
  hay: 'Fardo de feno', cairn: 'Pilha de pedras', brick: 'Bloco de tijolos', garden: 'Canteiro de flores', books: 'Pilha de livros acorrentados',
};

/** O estilo do bloco da fase: o escolhido nela ou, sem escolha, madeira (castelo) ou canteiro (jardim). */
export function blockStyleOf(def: Pick<StageSpec, 'block' | 'theme'>): BlockStyle {
  return def.block ?? (def.theme === 'garden' ? 'garden' : 'wood');
}

export function blockTextureOf(def: Pick<StageSpec, 'block' | 'theme'>): string {
  return BLOCK_TEXTURE[blockStyleOf(def)];
}
