// A direção da história na partida (Phaser): o cartão de entrada de cada fase, a passagem entre fases, o final
// com frei Anselmo e a despedida dos chefes. Os textos estão em game/story.ts e nas fases (stages/chapters);
// o que cada chefe faz ao ser vencido está no registro (entities/bosses/defs.ts: `after` e `farewell`).
// A MainScene cria um destes em create() e só delega.
import { audio } from '../audio/AudioEngine';
import { SCENE_TRACKS } from '../audio/tracks';
import { markArenaWin, markStageCompleted } from '../storage';
import { showDialogue } from '../ui/dialogue';
import { hideStageIntro, showStageIntro } from '../ui/stageIntro';
import type { MainScene } from '../scenes/MainScene';
import { BOSS_DEFS } from './entities/bosses/defs';
import { LAST_STAGE } from './stages/index';
import { ANSELMO, ENDING_CARDS, PASSAGE_CARDS, type StoryCard } from './story';

export class StoryDirector {
  private bannerOpen = false;

  constructor(private readonly scene: MainScene) {
    // se a fase reinicia ou a partida vai ao menu com o cartão aberto, a gravura some junto
    scene.events.once('shutdown', () => { this.bannerOpen = false; hideStageIntro(); });
  }

  // Cartão de entrada da fase: número e lugar, nome, uma frase da história e (se houver) a dica.
  // Fica na tela até a jogadora começar (ENTER ou toque): `dismissBanner()`. A fase espera por isso.
  showBanner(): void {
    const s = this.scene;
    const def = s.def;
    const head = def.chapter ? `${def.chapter} · ${def.part ?? ''}`.replace(/ · $/, '') : `FASE ${s.stage}`;
    this.bannerOpen = true;
    showStageIntro({
      textures: s.textures,
      stage: s.arena ? 0 : s.stage, // a Arena e o duelo usam a gravura do duelo
      head: `${head} · ${def.place.toUpperCase()}`,
      name: def.name,
      story: def.story,
      tip: def.tip,
      onStart: () => s.endIntro(),
    });
  }

  // Fecha o cartão de entrada: a fase começa.
  dismissBanner(): void {
    if (!this.bannerOpen) return;
    this.bannerOpen = false;
    hideStageIntro();
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
    s.time.delayedCall(900, () => { void this.ending(); });
  }

  // Um chefe foi derrotado. Na Arena: só guarda a vitória e mostra o resultado (sem despedida). Na campanha:
  // a queda dele, a despedida em cartões e então 'next' (segue para a fase seguinte) ou 'gate' (abre o portão).
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
