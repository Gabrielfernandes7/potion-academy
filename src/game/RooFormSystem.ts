// As transformações da Roo na partida (Phaser): a forma ativa, a habilidade (X), as brasas, as bolhas, o sprite
// e a luz. As regras puras estão em game/forms/ (testadas); aqui só há desenho, som e ligação com a cena.
// A MainScene cria um destes em create() e só delega: transform(), useAbility(), update(), boost(), onBlast().
import Phaser from 'phaser';
import { BOMB_ORDER, BOMB_TYPES, CONFIG, EMPTY, ElementId } from '../config';
import type { MainScene } from '../scenes/MainScene';
import { hitFx } from './entities/hitEffects';
import { inArenaLoadout, setFormElement } from './loadout';
import { FORM_LESSONS, formLearned, lessonReached, lessonsAtStart, lessonsForHit, type LessonForm } from './learning';
import { knowsForm, learnForm } from '../storage';
import { ENEMY_TYPES } from './entities/enemies/defs';
import type { Enemy, Bomb } from './types';
import {
  AIR_SIGHT_RADIUS, BUBBLE_STEP_MS, EmberField, PuddleField, novaTiles, puddleTiles, SaltWallField, LEAP_MS, ROOT_MS, airSeesThroughFog, airWalkFactor, earthWalkFactor, gustPush, gustStunMs, gustTarget,
  gustTiles, leapTarget, rootBurstTiles, rootTarget, iridescent, FORMS, formForElement, FormId, FormView, RooForm, boostedDamage, bubbleAt, bubblePath, fireLight, flameTiles,
  formView, guardedDamage, profileOf, saltWallTiles, trapMs, aimMove, rootCandidates, ringNeighbors, RING_PUSH_STEPS, WHIRL_PUSH_STEPS, BUBBLE_HEAL, bubbleHealTick,
  type FormDefense,
} from './forms';
import { NO_FORM_LABEL, setAbility2Label, setAbilityLabel, setDefenseLabel } from '../ui/abilityButton';
import { FORM_TREMOR_MS, FORM_TREMOR_STEPS, formTextureKey } from '../textures/rooFormTextures';
import type { DamageProfile } from './entities/damage';
import { addRooFormTextures } from '../textures/rooFormTextures';

const T = CONFIG.tile;
const center = (n: number): number => n * T + T / 2;

// Cor de cada forma: o aviso de transformação, o clarão da câmera.
const FORM_LOOK: Record<FormId, { text: string; flash: [number, number, number] }> = {
  fire: { text: '#ffa94d', flash: [255, 140, 40] },
  water: { text: '#7fd6ff', flash: [90, 190, 255] },
  earth: { text: '#c9b27a', flash: [150, 120, 60] },
  air: { text: '#e3f0fa', flash: [220, 235, 250] },
};

interface Gust { tiles: Array<{ x: number; y: number }>; dir: { x: number; y: number }; t: number }
const GUST_FX_MS = 420;

interface Bubble { path: Array<{ x: number; y: number }>; from: { x: number; y: number }; t: number }

export class RooFormSystem {
  readonly form = new RooForm();
  readonly embers = new EmberField();
  readonly walls = new SaltWallField();
  readonly puddles = new PuddleField();
  private gusts: Gust[] = [];
  // Defesa (V): a que está de pé, quanto falta e as casas de sal do círculo (para desfazer junto)
  private guard: { def: FormDefense; ms: number; walls: Array<{ x: number; y: number }>; healMs: number } | null = null;
  // Mira da Raiz: o cursor, enquanto a jogadora escolhe onde brotar
  private aim: { x: number; y: number } | null = null;
  private burrowMs = 0; // tempo que falta debaixo da terra (Roo Terra, Raiz)
  private lessonHits = new Map<LessonForm, number>(); // golpes da poção de cada lição, nesta partida
  private bubbles: Bubble[] = [];
  private clockMs = 0; // relógio do jogo (não anda na pausa): as brasas e as bolhas contam o tempo por ele
  private tremor = 0;
  private tremorMs = 0;
  private applied = false;
  private hudMs = 0;
  private readonly emberGfx: Phaser.GameObjects.Graphics;
  private readonly bubbleGfx: Phaser.GameObjects.Graphics;
  private readonly wallGfx: Phaser.GameObjects.Graphics;
  private readonly gustGfx: Phaser.GameObjects.Graphics;
  private readonly guardGfx: Phaser.GameObjects.Graphics;
  private readonly aimGfx: Phaser.GameObjects.Graphics;

  constructor(private readonly scene: MainScene) {
    this.emberGfx = scene.add.graphics().setDepth(3);
    this.bubbleGfx = scene.add.graphics().setDepth(11);
    this.wallGfx = scene.add.graphics().setDepth(3);
    this.gustGfx = scene.add.graphics().setDepth(11);
    this.guardGfx = scene.add.graphics().setDepth(11);
    this.aimGfx = scene.add.graphics().setDepth(12);
    setFormElement(null);
    setAbilityLabel(NO_FORM_LABEL);
    setAbility2Label(null);
    setDefenseLabel(null);
  }

  // ---------- leitura ----------

  /** O perfil de dano da Roo agora (muda com a forma e o degrau). */
  profile(): DamageProfile {
    return profileOf(this.form.id, this.form.stage);
  }

  hudView(): FormView {
    return { ...formView(this.form), guarding: !!this.guard };
  }

  /** Bônus das poções do elemento da forma para as explosões da Roo (poção e Labareda). */
  boost(base: number, element: ElementId): number {
    return boostedDamage(this.form.id, base, element, this.form.stage);
  }

  /** Arena: a Roo luta transformada, no auge, sem tempo para acabar (a poção da forma já vem na mão). */
  pinForm(id: FormId): void {
    const s = this.scene;
    const def = FORMS[id];
    this.form.pin(id);
    addRooFormTextures(s, { forms: [id] }); // a Arena começa transformada: os quadros precisam existir já
    const potion = BOMB_ORDER.find(p => BOMB_TYPES[p].element === def.element);
    if (potion) s.bombType = potion;
    this.syncFormElement();
    setAbilityLabel(def.ability.short);
    setAbility2Label(def.ability2?.short ?? null);
    setDefenseLabel(def.defense.short);
    s.updateHud();
  }

  /** O peso e a leveza: quanto o passo da Roo demora (a Terra anda 20% mais devagar, o Ar 20% mais rápido). */
  walkFactor(): number {
    if (this.form.id === 'earth') return earthWalkFactor(this.form.stage); // o peso
    if (this.form.id === 'air') return airWalkFactor(this.form.stage); // a leveza
    return 1;
  }

  /** Há um muro de sal nesta casa? (a MainScene o consulta em isFree) */
  isSaltWall(x: number, y: number): boolean {
    return this.walls.has(x, y, this.clockMs);
  }

  // ---------- lições (a forma é aprendida na jornada: game/learning.ts) ----------

  // As lições não valem na Arena (lá tudo já está liberado).
  private learning(): boolean {
    return !this.scene.arena;
  }

  private teach(form: LessonForm): void {
    if (knowsForm(form)) return;
    learnForm(form);
    const s = this.scene;
    const { gridX, gridY } = s.player;
    const def = FORMS[form];
    s.floatingText(gridX, gridY - 1, `APRENDEU: ${def.nome.toUpperCase()}`, FORM_LOOK[form].text, 14, 2600);
    s.floatingText(gridX, gridY - 2, `T COM A ${BOMB_TYPES[FORM_LESSONS[form].potion].label.toUpperCase()}`, '#f5e6c0', 11, 2600);
    s.play('powerup');
    s.updateHud();
  }

  /** A fase começou (o cartão de entrada fechou): as lições que vêm de graça, como a da Terra antes da Quimera. */
  onStageBegin(): void {
    if (!this.learning()) return;
    for (const f of lessonsAtStart(this.scene.stage)) this.teach(f);
  }

  /** Um golpe de poção da Roo atingiu um inimigo: conta para a lição da forma desse elemento. */
  noteHit(element: ElementId): void {
    if (!this.learning()) return;
    for (const f of lessonsForHit(this.scene.stage, element)) {
      if (knowsForm(f)) continue;
      const n = (this.lessonHits.get(f) ?? 0) + 1;
      this.lessonHits.set(f, n);
      if (lessonReached(f, n)) this.teach(f);
    }
  }

  // ---------- ações ----------

  /**
   * Tecla T: transforma na forma do elemento da poção que a Roo segura (fogo → Roo Fire, água → Roo Água, terra → Roo Terra, ar → Roo Ar).
   * Enquanto a forma dura, só a poção desse elemento funciona.
   */
  transform(): void {
    const s = this.scene;
    const { gridX, gridY } = s.player;
    const element = BOMB_TYPES[s.bombType].element;
    const id = formForElement(element);
    if (!id) {
      s.floatingText(gridX, gridY - 1, 'ESTA POÇÃO AINDA NÃO TEM FORMA', '#bfae8a', 12, 1200);
      return;
    }
    const def = FORMS[id];
    addRooFormTextures(s, { forms: [id] }); // garante os quadros da forma (se o boot ainda não os gerou, gera agora)
    if (!formLearned(id, knowsForm, inArenaLoadout())) {
      s.floatingText(gridX, gridY - 1, 'AINDA NÃO APRENDIDA', '#bfae8a', 12, 1200);
      return;
    }
    if (!this.form.start(id)) {
      if (!this.form.active) s.floatingText(gridX, gridY - 1, 'ESFRIANDO...', '#bfae8a', 12, 900);
      return;
    }
    this.embers.clear();
    const look = FORM_LOOK[id];
    s.floatingText(gridX, gridY - 1, `${def.nome.toUpperCase()}!`, look.text, 16, 1200);
    s.play('transform', def.element);
    s.cameras.main.flash(200, look.flash[0], look.flash[1], look.flash[2]);
    this.syncFormElement();
    setAbilityLabel(def.ability.short);
    setAbility2Label(def.ability2?.short ?? null);
    setDefenseLabel(def.defense.short);
    s.updateHud();
  }

  /** X: a habilidade da forma (Labareda, Bolha de sabão, Muro de sal ou Sopro). */
  useAbility(): void {
    const s = this.scene;
    const { gridX, gridY, dir } = s.player;
    const def = this.form.def;
    if (!def) {
      s.floatingText(gridX, gridY - 1, 'T: TRANSFORMA-SE', '#bfae8a', 11, 1000);
      return;
    }
    if (s.player.moving) return;
    const open = (x: number, y: number): boolean => s.getTile(x, y) === EMPTY;
    const from = { x: gridX, y: gridY };
    let tiles: Array<{ x: number; y: number }>;
    switch (def.ability.id) {
      case 'flame': tiles = flameTiles(from, dir, def.ability.range, open); break;
      case 'bubble': tiles = bubblePath(from, dir, def.ability.range, open); break;
      case 'gust': tiles = gustTiles(from, dir, def.ability.range, open); break;
      case 'salt': tiles = saltWallTiles(from, dir, (x, y) => this.canRaiseWall(x, y)); break;
      default: return;
    }
    if (tiles.length === 0) return;
    if (!this.form.useAbility()) {
      s.floatingText(gridX, gridY - 1, 'ESPERA...', '#bfae8a', 12, 700);
      return;
    }
    switch (def.ability.id) {
      case 'flame':
        s.bombSystem.flameBlast(tiles);
        break;
      case 'bubble':
        this.bubbles.push({ path: tiles, from, t: 0 });
        s.play('bubble');
        break;
      case 'salt':
        this.walls.raise(tiles, this.clockMs, this.form.stage);
        s.play('wall');
        s.cameras.main.shake(70, 0.004);
        break;
      case 'gust':
        this.blow(tiles, dir);
        break;
      default:
        break;
    }
    s.updateHud();
  }

  /** C: a segunda habilidade da forma (Raiz da Terra, Salto de vento do Ar). */
  useAbility2(): void {
    const s = this.scene;
    const { gridX, gridY, dir } = s.player;
    const def = this.form.def?.ability2;
    if (!def) {
      if (!this.form.active) s.floatingText(gridX, gridY - 1, 'T: TRANSFORMA-SE', '#bfae8a', 11, 1000);
      return;
    }
    if (s.player.moving) return;
    const from = { x: gridX, y: gridY };
    const land = (x: number, y: number): boolean => this.canLand(x, y);
    if (def.id === 'root') {
      this.startAim();
      return;
    }
    if (def.id === 'nova' || def.id === 'puddle') {
      this.areaAbility(def.id, from, dir, def.range);
      return;
    }
    const to = leapTarget(from, dir, def.range, (x, y) => s.getTile(x, y) === EMPTY, land);
    if (!to) {
      s.floatingText(gridX, gridY - 1, 'SEM ONDE POUSAR', '#bfae8a', 11, 900);
      return;
    }
    if (!this.form.useAbility2()) {
      s.floatingText(gridX, gridY - 1, 'ESPERA...', '#bfae8a', 12, 700);
      return;
    }
    this.leap(to);
    s.updateHud();
  }

  // Onda de brasas (fogo) e Poça (água): habilidades de área; só gastam se houver casas onde agir.
  private areaAbility(id: 'nova' | 'puddle', from: { x: number; y: number }, dir: { x: number; y: number }, range: number): void {
    const s = this.scene;
    const open = (x: number, y: number): boolean => s.getTile(x, y) === EMPTY && !(x === s.doorX && y === s.doorY && !s.doorOpen);
    const tiles = id === 'nova' ? novaTiles(from, range, open) : puddleTiles(from, dir, range, open);
    if (tiles.length === 0) {
      s.floatingText(from.x, from.y - 1, 'SEM ESPAÇO', '#bfae8a', 11, 900);
      return;
    }
    if (!this.form.useAbility2()) {
      s.floatingText(from.x, from.y - 1, 'ESPERA...', '#bfae8a', 12, 700);
      return;
    }
    if (id === 'nova') {
      s.bombSystem.flameBlast(tiles); // fere o que estiver nas casas...
      this.embers.ignite(tiles, this.clockMs, this.form.stage); // ...e deixa brasas
      this.puff(s.playerSprite.x, s.playerSprite.y, 0xffa94d);
    } else {
      this.puddles.spread(tiles, this.clockMs, this.form.stage);
      this.embers.douse(tiles);
      for (const bomb of [...s.bombSystem.bombs]) {
        if (bomb.element === 'fire' && tiles.some(t => t.x === bomb.gridX && t.y === bomb.gridY)) s.bombSystem.neutralizeBomb(bomb);
      }
      s.play('bubble');
      this.puff(s.playerSprite.x, s.playerSprite.y, 0x7fd6ff);
    }
    s.updateHud();
  }

  /** Há poça de água nesta casa? (os inimigos dentro dela andam bem mais devagar) */
  inPuddle(x: number, y: number): boolean {
    return this.puddles.has(x, y, this.clockMs);
  }

  // ---------- Raiz: a jogadora escolhe onde brotar ----------

  isAiming(): boolean {
    return this.aim !== null;
  }

  // Abre a mira: o cursor começa na casa livre mais distante à frente (o antigo comportamento) e as setas o movem.
  private startAim(): void {
    const s = this.scene;
    const from = { x: s.player.gridX, y: s.player.gridY };
    const range = this.form.def?.ability2?.range ?? 4;
    if (!this.form.ability2Ready) {
      s.floatingText(from.x, from.y - 1, 'ESPERA...', '#bfae8a', 12, 700);
      return;
    }
    const spots = rootCandidates(from, range, (x, y) => this.canLand(x, y));
    if (spots.length === 0) {
      s.floatingText(from.x, from.y - 1, 'SEM CHÃO LIVRE', '#bfae8a', 11, 900);
      return;
    }
    this.aim = rootTarget(from, s.player.dir, range, (x, y) => this.canLand(x, y)) ?? spots[0];
    s.floatingText(from.x, from.y - 1, 'ESCOLHA ONDE BROTAR (C)', FORM_LOOK.earth.text, 11, 1400);
  }

  /** A mira recebe as setas (um passo), o C (confirma) e o X ou V (cancelam). */
  aimInput(step: { x: number; y: number }, confirm: boolean, cancel: boolean): void {
    const s = this.scene;
    if (!this.aim) return;
    const from = { x: s.player.gridX, y: s.player.gridY };
    const range = this.form.def?.ability2?.range ?? 4;
    if (cancel || !this.form.active) {
      this.aim = null;
      return;
    }
    if (step.x !== 0 || step.y !== 0) {
      this.aim = aimMove(this.aim, step, from, range, (x, y) => s.getTile(x, y) !== null);
      s.play('pickup');
    }
    if (!confirm) return;
    const to = this.aim;
    if (!this.canLand(to.x, to.y)) {
      s.floatingText(to.x, to.y, 'OCUPADO', '#bfae8a', 11, 700);
      return;
    }
    this.aim = null;
    if (!this.form.useAbility2()) return;
    this.burrow(to);
    s.updateHud();
  }

  // ---------- Defesa (V) ----------

  /** O dano que a Roo leva com a defesa de pé (cortado pela metade); sem defesa, o dano inteiro. */
  reduceDamage(damage: number): number {
    return guardedDamage(damage, !!this.guard, this.guard?.def.reduce);
  }

  /** V: levanta a defesa da forma; com ela de pé, desfaz. */
  useDefense(): void {
    const s = this.scene;
    const { gridX, gridY } = s.player;
    if (this.guard) {
      this.endGuard();
      s.updateHud();
      return;
    }
    if (!this.form.active) {
      s.floatingText(gridX, gridY - 1, 'T: TRANSFORMA-SE', '#bfae8a', 11, 1000);
      return;
    }
    if (s.player.moving) return;
    const def = this.form.useDefense();
    if (!def) {
      s.floatingText(gridX, gridY - 1, 'ESPERA...', '#bfae8a', 12, 700);
      return;
    }
    this.guard = { def, ms: def.guardMs, walls: [], healMs: 0 };
    const me = { x: gridX, y: gridY };
    const ring = ringNeighbors(me);
    s.floatingText(gridX, gridY - 1, def.nome.toUpperCase(), FORM_LOOK[this.form.id ?? 'fire'].text, 12, 1000);
    switch (def.id) {
      case 'embers': {
        const open = ring.filter(n => s.getTile(n.x, n.y) === EMPTY);
        this.embers.ignite(open, this.clockMs, this.form.stage);
        s.play('flame');
        break;
      }
      case 'bubble':
        s.play('bubble');
        break;
      case 'salt-ring': {
        // empurra o que estava ao redor e levanta o muro nas casas que ficaram livres
        for (const n of ring) this.pushAt(n.x, n.y, n.dir, RING_PUSH_STEPS, 0);
        const free = ring.filter(n => this.canRaiseWall(n.x, n.y));
        this.walls.raise(free, this.clockMs, this.form.stage);
        this.guard.walls = free.map(n => ({ x: n.x, y: n.y }));
        s.play('wall');
        s.cameras.main.shake(80, 0.004);
        break;
      }
      case 'whirl':
        for (const n of ring) this.pushAt(n.x, n.y, n.dir, WHIRL_PUSH_STEPS, 0);
        this.gusts.push({ tiles: ring.filter(n => s.getTile(n.x, n.y) === EMPTY), dir: { x: 0, y: -1 }, t: 0 });
        s.play('gust');
        break;
    }
    s.updateHud();
  }

  // Termina a defesa: o muro do círculo cai e o efeito some.
  private endGuard(): void {
    if (!this.guard) return;
    this.walls.remove(this.guard.walls);
    this.guard = null;
    this.guardGfx.clear();
    this.scene.updateHud();
  }

  // Empurra o que está numa casa (inimigo comum, poção) `steps` casas na direção; chefes e flores ficam.
  private pushAt(x: number, y: number, dir: { x: number; y: number }, steps: number, stunMs: number): void {
    const s = this.scene;
    for (const e of s.enemySystem.enemies) {
      if (e.alive && !ENEMY_TYPES[e.kind].rooted && e.gridX === x && e.gridY === y) this.pushEnemy(e, dir, steps, stunMs);
    }
    for (const b of s.bombSystem.bombs) {
      if (!b.detonated && b.gridX === x && b.gridY === y) this.pushBomb(b, dir, steps);
    }
  }

  private pushEnemy(e: Enemy, dir: { x: number; y: number }, steps: number, stunMs: number): void {
    const s = this.scene;
    const canEnter = (x: number, y: number): boolean => {
      const passes = ENEMY_TYPES[e.kind].passWalls;
      const tile = s.getTile(x, y);
      const free = passes ? tile !== null && !(x === s.doorX && y === s.doorY && !s.doorOpen) : s.isFree(x, y);
      return free && !s.enemySystem.enemies.some(o => o !== e && o.alive && o.gridX === x && o.gridY === y);
    };
    const to = gustTarget({ x: e.gridX, y: e.gridY }, dir, steps, canEnter);
    if (to.x === e.gridX && to.y === e.gridY) return;
    e.fromX = e.sprite.x;
    e.fromY = e.sprite.y;
    e.hopY = dir.y !== 0;
    e.moveT = 0;
    e.gridX = to.x;
    e.gridY = to.y;
    e.moveTimer += stunMs; // atordoado: demora a andar de novo
    s.floatingText(to.x, to.y, 'AFASTADO!', '#e3f0fa', 11, 700);
  }

  private pushBomb(b: Bomb, dir: { x: number; y: number }, steps: number): void {
    const s = this.scene;
    const canEnter = (x: number, y: number): boolean => s.isFree(x, y) && !(s.playerTile().x === x && s.playerTile().y === y);
    const to = gustTarget({ x: b.gridX, y: b.gridY }, dir, steps, canEnter);
    if (to.x === b.gridX && to.y === b.gridY) return;
    b.gridX = to.x;
    b.gridY = to.y;
    s.tweens.killTweensOf(b.sprite);
    s.tweenSpriteTo(b.sprite, to.x, to.y, 220, 'Sine.easeOut');
  }

  // Uma casa onde a Roo pode pousar ou brotar: chão livre, sem poção, inimigo, chefe, muro de sal e sem a porta fechada.
  private canLand(x: number, y: number): boolean {
    const s = this.scene;
    if (s.getTile(x, y) !== EMPTY || s.hasBomb(x, y) || this.isSaltWall(x, y)) return false;
    if (x === s.doorX && y === s.doorY && !s.doorOpen) return false;
    if (s.enemySystem.enemies.some(e => e.alive && e.gridX === x && e.gridY === y)) return false;
    return !(s.boss && !s.boss.defeated && s.boss.gridX === x && s.boss.gridY === y);
  }

  // Raiz: a Roo afunda, viaja por baixo da terra (invisível, invulnerável) e brota na casa de destino.
  private burrow(to: { x: number; y: number }): void {
    const s = this.scene;
    this.burrowMs = ROOT_MS;
    s.player.invulnerable = Math.max(s.player.invulnerable, ROOT_MS + 100);
    s.movePlayerTo(to.x, to.y, ROOT_MS);
    s.playerSprite.setVisible(false);
    this.puff(s.playerSprite.x, s.playerSprite.y, 0x8d6e43);
    s.play('root');
    s.floatingText(to.x, to.y, 'RAIZ', FORM_LOOK.earth.text, 11, 500);
  }

  // Ao brotar: a terra racha nas casas vizinhas e fere o que estiver nelas (com a tabela de dano de terra).
  private emerge(): void {
    const s = this.scene;
    s.playerSprite.setVisible(true);
    const tiles = rootBurstTiles({ x: s.player.gridX, y: s.player.gridY }, (x, y) => s.getTile(x, y) === EMPTY);
    this.puff(s.playerSprite.x, s.playerSprite.y, 0xc9b27a);
    if (tiles.length > 0) s.bombSystem.earthBlast(tiles);
    s.cameras.main.shake(80, 0.004);
  }

  // Salto de vento: um pulo curto e rápido por cima de tudo que não é parede; invulnerável durante o pulo.
  private leap(to: { x: number; y: number }): void {
    const s = this.scene;
    s.player.invulnerable = Math.max(s.player.invulnerable, LEAP_MS + 60);
    this.puff(s.playerSprite.x, s.playerSprite.y, 0xeaf3fa);
    s.movePlayerTo(to.x, to.y, LEAP_MS);
    this.gusts.push({ tiles: [{ x: to.x, y: to.y }], dir: s.player.dir, t: 0 });
    s.play('gust');
  }

  // Um sopro de poeira ou vento na cor dada.
  private puff(x: number, y: number, color: number): void {
    const s = this.scene;
    const e = s.add.particles(x, y, 'menu_puff', {
      speed: { min: 15, max: 50 }, lifespan: { min: 300, max: 600 },
      scale: { start: 0.35, end: 0.9 }, alpha: { start: 0.6, end: 0 }, tint: [color], emitting: false,
    }).setDepth(12);
    e.explode(8);
    s.time.delayedCall(700, () => e.destroy());
  }

  // O muro só nasce em casa livre: chão vazio, sem poção, sem a porta, sem inimigo, sem chefe e sem a Roo.
  private canRaiseWall(x: number, y: number): boolean {
    const s = this.scene;
    if (s.getTile(x, y) !== EMPTY || s.hasBomb(x, y)) return false;
    if (x === s.doorX && y === s.doorY) return false;
    if (this.isSaltWall(x, y)) return false;
    const me = s.playerTile();
    if (me.x === x && me.y === y) return false;
    if (s.enemySystem.enemies.some(e => e.alive && e.gridX === x && e.gridY === y)) return false;
    return !(s.boss && !s.boss.defeated && s.boss.gridX === x && s.boss.gridY === y);
  }

  // O Sopro: cada inimigo comum da linha é empurrado para a frente, até onde o caminho deixar. Flores e chefes ficam.
  private blow(tiles: Array<{ x: number; y: number }>, dir: { x: number; y: number }): void {
    const s = this.scene;
    this.gusts.push({ tiles, dir, t: 0 });
    s.play('gust');
    this.embers.douse(tiles);
    const steps = gustPush(this.form.stage);
    const boss = s.boss;
    if (boss && !boss.defeated && tiles.some(t => t.x === boss.gridX && t.y === boss.gridY)) s.floatingText(boss.gridX, boss.gridY, 'IMUNE', '#c5e1a5');
    const enemies = s.enemySystem.enemies
      .filter(e => e.alive && !ENEMY_TYPES[e.kind].rooted && tiles.some(t => t.x === e.gridX && t.y === e.gridY))
      // os de mais longe primeiro: abrem caminho para os de trás
      .sort((a, b) => ((b.gridX - a.gridX) * dir.x + (b.gridY - a.gridY) * dir.y));
    for (const e of enemies) {
      const canEnter = (x: number, y: number): boolean => {
        const passes = ENEMY_TYPES[e.kind].passWalls;
        const tile = s.getTile(x, y);
        const free = passes ? tile !== null && !(x === s.doorX && y === s.doorY && !s.doorOpen) : s.isFree(x, y);
        return free && !s.enemySystem.enemies.some(o => o !== e && o.alive && o.gridX === x && o.gridY === y);
      };
      const to = gustTarget({ x: e.gridX, y: e.gridY }, dir, steps, canEnter);
      if (to.x === e.gridX && to.y === e.gridY) continue;
      e.fromX = e.sprite.x;
      e.fromY = e.sprite.y;
      e.hopY = dir.y !== 0;
      e.moveT = 0;
      e.gridX = to.x;
      e.gridY = to.y;
      e.moveTimer += gustStunMs(this.form.stage); // atordoado: demora a andar de novo
      s.floatingText(to.x, to.y, 'SOPRO!', '#e3f0fa', 11, 700);
    }
    // as poções do chão também deslizam (e podem ser postas contra um alvo)
    const bombs = s.bombSystem.bombs
      .filter(b => !b.detonated && tiles.some(t => t.x === b.gridX && t.y === b.gridY))
      .sort((a, b) => ((b.gridX - a.gridX) * dir.x + (b.gridY - a.gridY) * dir.y));
    for (const b of bombs) {
      const canEnter = (x: number, y: number): boolean => s.isFree(x, y) && !(s.playerTile().x === x && s.playerTile().y === y);
      const to = gustTarget({ x: b.gridX, y: b.gridY }, dir, steps, canEnter);
      if (to.x === b.gridX && to.y === b.gridY) continue;
      b.gridX = to.x;
      b.gridY = to.y;
      s.tweens.killTweensOf(b.sprite);
      s.tweenSpriteTo(b.sprite, to.x, to.y, 220, 'Sine.easeOut');
    }
  }

  /** Uma explosão da Roo: o fogo acende brasas (só na forma de fogo); a água apaga as brasas. */
  onBlast(tiles: Array<{ x: number; y: number }>, element: ElementId): void {
    const s = this.scene;
    if (element === 'fire' && this.form.id === 'fire') this.embers.ignite(tiles, this.clockMs, this.form.stage);
    else if (element === 'water' && this.embers.douse(tiles) > 0) {
      s.floatingText(tiles[0].x, tiles[0].y, 'APAGADAS', '#a8e6f5');
      s.play('fizzle');
    }
  }

  /** A bolha de um inimigo preso estourou (ou a bolha chegou ao fim): estalo e respingo. */
  pop(px: number, py: number): void {
    hitFx(this.scene, px, py, 'water');
    this.scene.play('pop');
  }

  // ---------- por quadro ----------

  update(delta: number): void {
    const s = this.scene;
    this.clockMs += delta;
    const was = { stage: this.form.stage, active: this.form.active, ability: this.form.abilityReady, id: this.form.id };
    this.form.tick(delta);
    this.tremorMs += delta;
    if (this.tremorMs >= FORM_TREMOR_MS) {
      this.tremorMs = 0;
      this.tremor = (this.tremor + 1) % FORM_TREMOR_STEPS;
    }
    if (was.active && !this.form.active && was.id) {
      s.play('formEnd', FORMS[was.id].element);
      setAbility2Label(null);
      setDefenseLabel(null);
      this.endGuard();
      this.aim = null;
      if (was.id === 'air') s.floatingText(s.player.gridX, s.player.gridY - 1, 'DE VOLTA AO CHÃO', '#bfae8a', 11, 1000);
      setAbilityLabel(NO_FORM_LABEL);
    }
    this.syncFormElement();
    // as brasas queimam inimigos comuns que pisam nelas
    for (const enemy of [...s.enemySystem.enemies]) {
      if (enemy.alive && this.embers.lit(enemy.gridX, enemy.gridY, this.clockMs)) s.enemySystem.burnEnemy(enemy);
    }
    this.updateBubbles(delta);
    this.applyTexture();
    this.drawEmbers();
    this.drawBubbles();
    this.drawWalls();
    this.drawPuddles();
    this.drawGusts(delta);
    this.updateGuard(delta);
    this.drawAim();
    this.updateBurrow(delta); // depois do vento: os dois dividem o mesmo gráfico
    // Névoa: a luz de chama abre mais (+0,5 casa por degrau); a visão de cima do ar a dissipa de vez
    if (s.fog && s.def.fog) {
      const sees = this.form.id === 'air' && airSeesThroughFog(this.form.stage);
      s.fog.setRadius(sees ? AIR_SIGHT_RADIUS : s.def.fog.radius + (this.form.id === 'fire' ? fireLight(this.form.stage) : 0));
    }
    // a HUD só é reenviada quando algo muda, e a cada 100 ms enquanto a barra anda
    this.hudMs += delta;
    const changed = was.stage !== this.form.stage || was.active !== this.form.active || was.ability !== this.form.abilityReady;
    if (changed || ((this.form.active || this.form.cooldownMs > 0) && this.hudMs >= 100)) {
      this.hudMs = 0;
      s.updateHud();
    }
  }

  private syncFormElement(): void {
    setFormElement(this.form.formElement);
  }

  // Troca o quadro da Roo pelo da forma do degrau atual (mesma direção e quadro de caminhada), sem mexer na
  // animação: o corpo anda como sempre e o efeito vibra por cima.
  private applyTexture(): void {
    const sprite = this.scene.playerSprite;
    const id = this.form.id;
    const stage = this.form.stage;
    const base = sprite.anims.currentFrame?.textureKey ?? '';
    const m = /^roo_(down|up|side)_([0-3])$/.exec(base);
    if (id && stage > 0 && m) {
      sprite.setTexture(formTextureKey(id, stage, m[1], m[2], this.tremor));
      this.applied = true;
    } else if (stage === 0 && this.applied) {
      if (m) sprite.setTexture(base);
      this.applied = false;
    }
  }

  // A defesa de pé: conta o tempo, desenha o efeito da forma em volta da Roo e cai ao acabar (ou se a forma acabar).
  private updateGuard(delta: number): void {
    const g = this.guardGfx;
    g.clear();
    const guard = this.guard;
    if (!guard) return;
    guard.ms -= delta;
    if (guard.ms <= 0 || !this.form.active) {
      this.endGuard();
      return;
    }
    const s = this.scene;
    // a bolha cura: 1 de vida a cada 0,5 s
    if (guard.def.id === 'bubble') {
      const tick = bubbleHealTick(guard.healMs, delta);
      guard.healMs = tick.accMs;
      for (let i = 0; i < tick.heals && s.player.hp < CONFIG.maxHp; i++) {
        s.player.hp = Math.min(CONFIG.maxHp, s.player.hp + BUBBLE_HEAL);
        s.floatingText(s.player.gridX, s.player.gridY - 1, `+${BUBBLE_HEAL}`, '#9be564', 12, 350);
        s.updateHud();
      }
    }
    const x = s.playerSprite.x;
    const y = s.playerSprite.y - 2;
    if (guard.ms < 600 && Math.floor(this.clockMs / 90) % 2 === 0) return; // pisca quando está acabando
    switch (guard.def.id) {
      case 'bubble':
        this.drawBubble(g, x, y, 24); // a bolha iridescente da Roo Água, grande em volta dela
        break;
      case 'embers': {
        const phase = Math.floor(this.clockMs / 120);
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * Math.PI * 2 + phase * 0.15;
          g.fillStyle(i % 2 === 0 ? 0xffa94d : 0xd6452f, 0.9).fillRect(Math.round(x + Math.cos(a) * 22) - 1, Math.round(y + Math.sin(a) * 20) - 1, 3, 3);
        }
        break;
      }
      case 'salt-ring':
        g.lineStyle(2, 0xf6f2e2, 0.8).strokeCircle(x, y, 22);
        g.fillStyle(0xf6f2e2, 0.12).fillCircle(x, y, 22);
        break;
      case 'whirl': {
        const spin = this.clockMs / 160;
        for (let i = 0; i < 3; i++) {
          const a0 = spin + i * 2.1;
          g.lineStyle(2, 0xeaf3fa, 0.9).beginPath().arc(x, y, 20 + i * 2, a0, a0 + 1.3).strokePath();
        }
        break;
      }
    }
  }

  // A mira da Raiz: as casas onde a Roo pode brotar em verde-claro, o cursor com borda forte.
  private drawAim(): void {
    const g = this.aimGfx;
    g.clear();
    const a = this.aim;
    if (!a) return;
    const s = this.scene;
    const range = this.form.def?.ability2?.range ?? 4;
    const from = { x: s.player.gridX, y: s.player.gridY };
    for (const t of rootCandidates(from, range, (x, y) => this.canLand(x, y))) {
      g.fillStyle(0xc9b27a, 0.22).fillRect(t.x * T + 3, t.y * T + 3, T - 6, T - 6);
    }
    const ok = this.canLand(a.x, a.y);
    const pulse = 0.65 + 0.35 * Math.sin(this.clockMs / 120);
    g.fillStyle(ok ? 0x9be564 : 0xd6452f, 0.3 * pulse).fillRect(a.x * T + 2, a.y * T + 2, T - 4, T - 4);
    g.lineStyle(3, ok ? 0xf5e6c0 : 0xff8a80, 1).strokeRect(a.x * T + 2, a.y * T + 2, T - 4, T - 4);
  }

  // Debaixo da terra: um monte de terra marca por onde a Roo passa; ao fim ela brota.
  private updateBurrow(delta: number): void {
    if (this.burrowMs <= 0) return;
    this.burrowMs -= delta;
    const s = this.scene;
    if (this.burrowMs <= 0) {
      this.burrowMs = 0;
      this.emerge();
      return;
    }
    // o monte de terra anda com a Roo
    const x = s.playerSprite.x;
    const y = s.playerSprite.y + 8;
    const k = this.gustGfx;
    k.fillStyle(0x5d4228, 1).fillRect(Math.round(x) - 9, Math.round(y) - 3, 18, 8);
    k.fillStyle(0x8d6e43, 1).fillRect(Math.round(x) - 6, Math.round(y) - 6, 12, 5);
    k.fillStyle(0xc9b27a, 1).fillRect(Math.round(x) - 3 + (Math.floor(this.clockMs / 80) % 2) * 4, Math.round(y) - 8, 3, 2);
  }

  // ---------- bolhas ----------

  private updateBubbles(delta: number): void {
    const s = this.scene;
    for (const b of [...this.bubbles]) {
      b.t += delta;
      const { index, done } = bubbleAt(b.path.length, b.t);
      const frac = (b.t / BUBBLE_STEP_MS) - Math.floor(b.t / BUBBLE_STEP_MS);
      // a bolha "entra" na casa na metade do passo
      const tile = done ? b.path[b.path.length - 1] : (frac >= 0.5 ? b.path[index] : b.path[Math.max(0, index - 1)]);
      const boss = s.boss;
      if (boss && !boss.defeated && boss.gridX === tile.x && boss.gridY === tile.y) {
        s.floatingText(tile.x, tile.y, 'IMUNE', '#c5e1a5');
        this.endBubble(b, tile);
        continue;
      }
      const enemy = s.enemySystem.enemies.find(e => e.alive && e.trapMs <= 0 && e.gridX === tile.x && e.gridY === tile.y);
      if (enemy) {
        s.enemySystem.trapEnemy(enemy, trapMs(this.form.stage || 1));
        this.bubbles = this.bubbles.filter(x => x !== b);
        continue;
      }
      if (done && b.t >= b.path.length * BUBBLE_STEP_MS) this.endBubble(b, tile);
    }
  }

  private endBubble(b: Bubble, tile: { x: number; y: number }): void {
    this.bubbles = this.bubbles.filter(x => x !== b);
    this.pop(center(tile.x), center(tile.y));
  }

  private bubblePos(b: Bubble): { x: number; y: number } {
    const pts = [b.from, ...b.path];
    const s = Math.min(b.path.length, b.t / BUBBLE_STEP_MS);
    const k = Math.min(pts.length - 2, Math.floor(s));
    const f = s - k;
    return { x: center(pts[k].x) + (center(pts[k + 1].x) - center(pts[k].x)) * f, y: center(pts[k].y) + (center(pts[k + 1].y) - center(pts[k].y)) * f };
  }

  // Bolha de sabão iridescente: miolo quase transparente com películas coloridas que giram devagar, um anel em
  // 12 trechos de cores diferentes (rosa, amarelo, ciano, violeta, verde) que roda com o tempo, e dois brilhos.
  private drawBubble(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number): void {
    const shift = Math.floor(this.clockMs / 130);
    const spin = this.clockMs / 900;
    g.fillStyle(0xdaf4ff, 0.14).fillCircle(x, y, r);
    for (let i = 0; i < 3; i++) {
      const a = spin + i * 2.1;
      g.fillStyle(iridescent(i * 2, shift), 0.26).fillCircle(x + Math.cos(a) * r * 0.42, y + Math.sin(a) * r * 0.42, r * 0.36);
    }
    const seg = 12;
    for (let i = 0; i < seg; i++) {
      const a0 = (i / seg) * Math.PI * 2;
      g.lineStyle(2.4, iridescent(i, shift), 0.95).beginPath().arc(x, y, r, a0, a0 + (Math.PI * 2) / seg + 0.05).strokePath();
    }
    g.fillStyle(0xffffff, 0.95).fillRect(Math.round(x - r * 0.55), Math.round(y - r * 0.65), 3, 2);
    g.fillStyle(0xffffff, 0.7).fillRect(Math.round(x + r * 0.4), Math.round(y + r * 0.35), 2, 2);
  }

  private drawBubbles(): void {
    const g = this.bubbleGfx;
    g.clear();
    for (const b of this.bubbles) {
      const p = this.bubblePos(b);
      this.drawBubble(g, p.x, p.y + Math.sin(this.clockMs / 140) * 1.5, 11);
    }
    // inimigos presos: uma bolha grande em volta, que pulsa e pisca quando está acabando
    for (const e of this.scene.enemySystem.enemies) {
      if (!e.alive || e.trapMs <= 0) continue;
      if (e.trapMs < 600 && Math.floor(this.clockMs / 90) % 2 === 0) continue;
      this.drawBubble(g, e.sprite.x, e.sprite.y - 2, 19 + Math.sin(this.clockMs / 160));
    }
  }

  // ---------- muro de sal e sopro ----------

  // O muro: blocos de sal em pixels, com a borda escura; piscam quando estão para cair.
  private drawWalls(): void {
    const g = this.wallGfx;
    g.clear();
    for (const w of this.walls.active(this.clockMs)) {
      if (w.left < 700 && Math.floor(this.clockMs / 90) % 2 === 0) continue;
      const x = w.x * T;
      const y = w.y * T;
      g.fillStyle(0xcfc8ae, 1).fillRect(x + 2, y + 6, T - 4, T - 8);
      g.fillStyle(0xf6f2e2, 1).fillRect(x + 2, y + 6, T - 4, 6);
      for (let i = 0; i < 4; i++) {
        const cx = x + 5 + i * 8;
        g.fillStyle(0xf6f2e2, 1).fillTriangle(cx, y + 6, cx + 3, y + 1 + (i % 2) * 3, cx + 6, y + 6);
      }
      g.fillStyle(0x8a7f60, 1).fillRect(x + 2, y + T - 4, T - 4, 2);
      g.lineStyle(2, 0x3a3224, 1).strokeRect(x + 2, y + 6, T - 4, T - 8);
    }
  }

  // A poça: água em pixels, com anéis que se abrem e somem; pisca perto do fim. Fica no gráfico das brasas (por baixo).
  private drawPuddles(): void {
    const g = this.emberGfx;
    const phase = Math.floor(this.clockMs / 260);
    for (const p of this.puddles.active(this.clockMs)) {
      if (p.left < 700 && Math.floor(this.clockMs / 100) % 2 === 0) continue;
      const x = p.x * T;
      const y = p.y * T;
      g.fillStyle(0x3d8fd0, 0.32).fillRect(x + 2, y + 2, T - 4, T - 4);
      g.fillStyle(0x8fd6ff, 0.28).fillRect(x + 6, y + 6, T - 12, T - 12);
      const r = 4 + ((phase + p.x + p.y) % 3) * 3;
      g.lineStyle(1, 0xd8f3ff, 0.8).strokeCircle(x + T / 2, y + T / 2, r);
    }
  }

  // O sopro: três fios claros que correm pela linha, em pixels, e somem.
  private drawGusts(delta: number): void {
    const g = this.gustGfx;
    g.clear();
    for (const w of [...this.gusts]) {
      w.t += delta;
      if (w.t >= GUST_FX_MS) { this.gusts = this.gusts.filter(x => x !== w); continue; }
      const p = w.t / GUST_FX_MS;
      const n = w.tiles.length;
      for (let k = 0; k < 3; k++) {
        const along = Math.min(n, p * (n + 1) + k * 0.25) ;
        const a = Math.floor(along);
        const t0 = w.tiles[Math.min(n - 1, a)];
        const off = (k - 1) * 9;
        const x = center(t0.x) + (along - a) * T * w.dir.x + (w.dir.y !== 0 ? off : 0);
        const y = center(t0.y) + (along - a) * T * w.dir.y + (w.dir.x !== 0 ? off : 0);
        g.fillStyle(0xffffff, 0.85 * (1 - p)).fillRect(Math.round(x) - 5, Math.round(y) - 1, 10, 2);
        g.fillStyle(0xbcd8ee, 0.8 * (1 - p)).fillRect(Math.round(x) - 8, Math.round(y) + 1, 5, 1);
      }
    }
  }

  // ---------- brasas ----------

  // Brasas em xadrez de pixels que alternam entre quadros (sem degradê); piscam quando estão acabando.
  private drawEmbers(): void {
    const g = this.emberGfx;
    g.clear();
    const phase = Math.floor(this.clockMs / 180);
    for (const e of this.embers.active(this.clockMs)) {
      if (e.left < 600 && Math.floor(this.clockMs / 100) % 2 === 0) continue;
      for (let py = 0; py < 4; py++) {
        for (let px = 0; px < 4; px++) {
          if ((px + py + phase) % 2 !== 0) continue;
          g.fillStyle((px + py) % 3 === 0 ? 0xd6452f : 0xffa94d, 0.75);
          g.fillRect(e.x * T + px * (T / 4), e.y * T + py * (T / 4), T / 4, T / 4);
        }
      }
    }
  }
}

