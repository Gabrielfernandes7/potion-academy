// A direção da história na partida (Phaser): o cartão de entrada de cada fase, a passagem entre fases, o final
// com frei Anselmo e a despedida dos chefes. Os textos estão em game/story.ts e nas fases (stages/chapters);
// o que cada chefe faz ao ser vencido está no registro (entities/bosses/defs.ts: `after` e `farewell`).
// A MainScene cria um destes em create() e só delega.
import Phaser from 'phaser';
import { CONFIG } from '../config';
import { audio } from '../audio/AudioEngine';
import { SCENE_TRACKS } from '../audio/tracks';
import { Bank, markArenaWin, markStageCompleted } from '../storage';
import { showDialogue } from '../ui/dialogue';
import { readTheme } from '../ui/theme';
import type { MainScene } from '../scenes/MainScene';
import { BOSS_DEFS } from './entities/bosses/defs';
import { LAST_STAGE } from './stages/index';
import { ANSELMO, ENDING_CARDS, PASSAGE_CARDS, type StoryCard } from './story';

export class StoryDirector {
  constructor(private readonly scene: MainScene) {}

  // Cartão de entrada da fase: número e lugar, nome, uma frase da história e (se houver) a dica.
  showBanner(): void {
    const s = this.scene;
    const def = s.def;
    const theme = readTheme();
    const cx = (CONFIG.cols * CONFIG.tile) / 2;
    const cy = (CONFIG.rows * CONFIG.tile) / 2;
    const textW = CONFIG.cols * CONFIG.tile - 48;
    const items: Phaser.GameObjects.GameObject[] = [];
    const bandH = def.tip ? 150 : 124;
    items.push(s.add.rectangle(cx, cy, CONFIG.cols * CONFIG.tile, bandH, 0x120d08, 0.78).setDepth(29));
    let y = cy - bandH / 2 + 22;
    const head = def.chapter ? `${def.chapter} · ${def.part ?? ''}`.replace(/ · $/, '') : `FASE ${s.stage}`;
    items.push(s.add.text(cx, y, `${head} · ${def.place.toUpperCase()}`, {
      fontFamily: theme.fontDisplay, fontSize: '12px', color: theme.textMuted, fontStyle: '700',
    }).setOrigin(0.5).setDepth(30));
    y += 28;
    items.push(s.add.text(cx, y, def.name, {
      fontFamily: theme.fontDisplay, fontSize: '26px', color: '#f0c674', fontStyle: '700',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(30));
    y += 22;
    const story = s.add.text(cx, y, def.story, {
      fontFamily: theme.fontBody, fontSize: '13px', fontStyle: 'italic', color: '#f1e6c9',
      align: 'center', wordWrap: { width: textW },
    }).setOrigin(0.5, 0).setDepth(30);
    items.push(story);
    if (def.tip) {
      items.push(s.add.text(cx, y + story.height + 8, def.tip, {
        fontFamily: theme.fontBody, fontSize: '12px', color: '#c9b98f',
        align: 'center', wordWrap: { width: textW },
      }).setOrigin(0.5, 0).setDepth(30));
    }
    s.tweens.add({
      targets: items, alpha: 0, delay: 3200, duration: 600,
      onComplete: () => items.forEach(i => i.destroy()),
    });
  }

  // Passagem entre fases: a Roo lê ou ouve algo (se a fase tem cartões) e só então segue.
  passage(): void {
    const cards = PASSAGE_CARDS[this.scene.stage];
    if (cards) void this.talk(cards).then(() => this.scene.advanceStage());
    else this.scene.advanceStage();
  }

  // Cartões de conversa: a cena fica parada durante a conversa (nada acontece com a Roo).
  private async talk(cards: StoryCard[], button = 'SEGUIR'): Promise<void> {
    this.scene.scene.pause();
    await showDialogue(cards, button);
    this.scene.scene.resume();
  }

  // Final: frei Anselmo confessa e devolve o frasco vazio; depois a última cena no Caldeirão e a tela de fim.
  async ending(): Promise<void> {
    const s = this.scene;
    audio.playTrack(SCENE_TRACKS.ending);
    const portrait = s.textures.getBase64('anselmo_retrato') || undefined;
    s.scene.pause();
    await showDialogue(ENDING_CARDS.map(c => ({ ...c, portrait: c.speaker === ANSELMO ? portrait : undefined })), 'FIM');
    // última cena: a Roo de volta ao Caldeirão (a partida segue pausada por baixo); só depois vem "Jornada cumprida"
    s.game.events.once('end:done', () => {
      s.scene.resume();
      s.won = true;
      s.triggerGameOver();
    });
    s.scene.launch('End');
  }

  // Chegou ao portão da última fase: frei Anselmo espera e a confissão fecha a história.
  gateReached(): void {
    const s = this.scene;
    s.floatingText(s.player.gridX, s.player.gridY, 'O PORTÃO SE ABRE', '#9be564');
    s.coins += CONFIG.gardenVictoryBonus;
    Bank.add(CONFIG.gardenVictoryBonus);
    s.time.delayedCall(900, () => { void this.ending(); });
  }

  // Um chefe foi derrotado. Na Arena: só guarda a vitória e mostra o resultado (sem ouro nem despedida). Na campanha:
  // ouro, a queda dele, a despedida em cartões e então 'next' (segue para a fase seguinte) ou 'gate' (abre o portão).
  bossDefeated(): void {
    const s = this.scene;
    if (s.gameOver || s.transitioning) return;
    s.transitioning = true;
    const { gridX, gridY } = s.player;
    if (s.arena) {
      markArenaWin(s.arena);
      s.floatingText(gridX, gridY, 'VITÓRIA NA ARENA!', '#9be564', 14, 1400);
      s.time.delayedCall(1800, () => { s.won = true; s.triggerGameOver(); });
      return;
    }
    const boss = s.def.boss ? BOSS_DEFS[s.def.boss] : null;
    s.coins += CONFIG.bossVictoryBonus;
    Bank.add(CONFIG.bossVictoryBonus);
    s.floatingText(gridX, gridY, `${s.boss?.name ?? 'CHEFE'} DERROTADA!`, '#9be564');
    if (boss?.after === 'gate') {
      // o último chefe: depois da despedida o portão (onde Anselmo espera) se abre
      s.time.delayedCall(1600, () => {
        void this.talk(boss.farewell).then(() => { s.transitioning = false; s.openDoor(); });
      });
      return;
    }
    markStageCompleted(s.stage);
    // espera a queda dele terminar; então ele se despede (cartões) e a Roo segue para a próxima fase
    s.time.delayedCall(1600, () => {
      void this.talk(boss?.farewell ?? []).then(() => s.advanceStage());
    });
  }

  /** A fase já é a última? (o portão dela fecha a história) */
  get isLastStage(): boolean {
    return this.scene.stage >= LAST_STAGE;
  }
}
