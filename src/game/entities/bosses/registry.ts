// A fábrica de chefes (ligada ao Phaser): id -> controlador. Os metadados estão em defs.ts. O `Record<BossId, ...>`
// obriga uma linha por chefe. Para um chefe novo, veja docs/16-guia-de-extensao.md.
import type { MainScene } from '../../../scenes/MainScene';
import type { BossId } from '../../stages/types';
import type { BossBase } from './BossBase';
import { BelladonnaController } from './belladonna/BelladonnaController';
import { ChimeraController } from './chimera/ChimeraController';
import { LionController } from './lion/LionController';
import { MandrakeController } from './mandrake/MandrakeController';

const FACTORIES: Record<BossId, (scene: MainScene) => BossBase> = {
  belladonna: s => new BelladonnaController(s),
  mandrake: s => new MandrakeController(s),
  chimera: s => new ChimeraController(s),
  lion: s => new LionController(s),
};

export function createBoss(id: BossId, scene: MainScene): BossBase {
  return FACTORIES[id](scene);
}
