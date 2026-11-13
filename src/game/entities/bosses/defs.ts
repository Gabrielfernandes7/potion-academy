// Os metadados de cada chefe (puro, sem o controlador): perfil, sprite, onde nasce, o que acontece ao vencê-lo
// na campanha e o cartão dele na Arena. É a ÚNICA lista de chefes: as texturas, a Arena, o catálogo de sprites e a
// cena leem daqui. Para um chefe novo, veja docs/16-guia-de-extensao.md. O TypeScript obriga: o `Record<BossId, ...>`
// não compila enquanto faltar uma entrada para um id de `BossId` (stages/types.ts).
// O comportamento (habilidades) fica no controlador, ligado em registry.ts.
import type Phaser from 'phaser';
import { drawChimeraTextures } from '../../../textures/chimera';
import { drawLionTextures } from '../../../textures/greenLion';
import { drawMandrakeTextures } from '../../../textures/mandrake';
import { drawWitchTextures } from '../../../textures/witch';
import type { BlockStyle } from '../../stages/blockStyles';
import type { BossId, StageTheme } from '../../stages/types';
import { BELLADONA_CARDS, CHIMERA_CARDS, MANDRAKE_CARDS, type StoryCard } from '../../story';
import type { EntityId } from '../profiles';

export interface BossDef {
  id: BossId;
  profile: EntityId; // a linha dele em PROFILES (vida, fraqueza, imunidade)
  /** Os sprites: `${prefix}_idle_0/1`, `_cast`, `_hurt`, `_talk_0/1`, `_defeat`. */
  sprite: { prefix: string; draw: (g: Phaser.GameObjects.Graphics, tile: number) => void };
  spawn: 'top' | 'bottom'; // o canto onde nasce (as casas ao redor ficam livres)
  /** Na campanha: 'next' segue para a fase seguinte depois da despedida; 'gate' abre o portão (o último chefe). */
  after: 'next' | 'gate';
  farewell: StoryCard[]; // a despedida em cartões (vazia enquanto o chefe não está na campanha)
  /** O cartão da Arena de treino. */
  arena: { nome: string; lugar: string; dica: string; theme: StageTheme; block: BlockStyle };
}

export const BOSS_DEFS: Record<BossId, BossDef> = {
  chimera: {
    id: 'chimera', profile: 'chimera',
    sprite: { prefix: 'chimera', draw: drawChimeraTextures },
    spawn: 'bottom', after: 'next', farewell: CHIMERA_CARDS,
    arena: {
      nome: 'Quimera de Mercúrio', lugar: 'Poço de Prata, fim do Vale',
      dica: 'A água escorre por ela. A Poção Telúrica a prende.', theme: 'stone', block: 'barrel',
    },
  },
  belladonna: {
    id: 'belladonna', profile: 'belladonna',
    sprite: { prefix: 'witch', draw: drawWitchTextures },
    spawn: 'bottom', after: 'next', farewell: BELLADONA_CARDS,
    arena: {
      nome: 'Belladona', lugar: 'Torre de Belladona',
      dica: 'Fogo e éter a ferem muito. Todo golpe avisa no chão.', theme: 'stone', block: 'scroll',
    },
  },
  mandrake: {
    id: 'mandrake', profile: 'mandrake',
    sprite: { prefix: 'mandrake', draw: drawMandrakeTextures },
    spawn: 'top', after: 'gate', farewell: MANDRAKE_CARDS,
    arena: {
      nome: 'Mandrágora', lugar: 'Jardim do Mosteiro',
      dica: 'O fogo a fere muito; terra e água quase nada.', theme: 'garden', block: 'garden',
    },
  },
  lion: {
    id: 'lion', profile: 'lion',
    sprite: { prefix: 'lion', draw: drawLionTextures },
    spawn: 'bottom', after: 'next', farewell: [],
    arena: {
      nome: 'Leão Verde', lugar: 'Biblioteca Proibida (selada)',
      dica: 'Imune à terra; o éter o fere muito. O ácido dissolve as suas poções.', theme: 'crypt', block: 'books',
    },
  },
};

export const BOSS_IDS = Object.keys(BOSS_DEFS) as BossId[];

/** A textura parada do chefe (para cartões e miniaturas). */
export function bossIdleTexture(id: BossId): string {
  return `${BOSS_DEFS[id].sprite.prefix}_idle_0`;
}
