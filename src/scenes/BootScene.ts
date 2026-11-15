// Gera as texturas procedurais e abre o menu. As texturas das formas da Roo (1536, quatro formas) não seguram a
// abertura: o menu abre logo e elas são geradas em pedaços, um degrau de uma forma por vez, enquanto o jogador lê o
// menu. O RooFormSystem garante a forma que vai usar na hora de transformar (`addRooFormTextures` é idempotente), então nunca falta.
import Phaser from 'phaser';
import { TEXTURES_READY } from '../game/events';
import { FORM_IDS } from '../game/forms';
import { generateTextures } from '../textures';
import { addRooFormTextures } from '../textures/rooFormTextures';

const STAGES = [1, 2, 3, 4];
const CHUNK_DELAY_MS = 60; // entre um pedaço e o seguinte: dá fôlego ao menu e à música

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    const scene = this;
    generateTextures(this);
    this.game.events.emit(TEXTURES_READY);
    this.scene.start('Menu');
    // em segundo plano: uma forma e um degrau por pedaço. Timer do navegador (e não da cena): `scene.start('Menu')` encerra
    // esta cena, e o gerenciador de texturas é do jogo, então segue valendo
    const jobs = FORM_IDS.flatMap(form => STAGES.map(stage => ({ form, stage })));
    let i = 0;
    const next = (): void => {
      const job = jobs[i++];
      if (!job) return;
      addRooFormTextures(scene, { forms: [job.form], stages: [job.stage] });
      window.setTimeout(next, CHUNK_DELAY_MS);
    };
    window.setTimeout(next, CHUNK_DELAY_MS * 4);
  }
}
