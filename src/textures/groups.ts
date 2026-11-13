// Os grupos do catálogo de sprites (/sprites.html): a que família cada textura pertence, pelo prefixo do nome.
// Puro (sem Phaser): o catálogo e os testes de contrato usam o mesmo `test`. Uma textura que cai em 'other'
// provavelmente está com o nome errado (os testes de contrato avisam).
import { BOSS_DEFS, BOSS_IDS } from '../game/entities/bosses/defs';

// Cada grupo vira uma pasta em docs/img/sprites/<id>.png (ver docs/09-sprites.md).
export interface SpriteGroup { id: string; title: string; note: string; test: (key: string) => boolean }

export const SPRITE_GROUPS: SpriteGroup[] = [
  { id: 'heroes', title: 'Heróis (a Roo)', note: 'roo_{down,up,side}_0-3: andar. roo_sleep_*: dormindo. roo_stir_*: mexendo a poção (menu, sem braço). roo_maestro_*: maestro de casaca (Sala de Música). roo_read_*: de frente, lendo; vemos a capa do livro e a folha virando por cima (GIF do README).', test: k => k.startsWith('roo_') },
  { id: 'bosses', title: 'Chefes', note: 'Belladona, Mandrágora, Quimera (chimera_*) e Leão Verde (lion_*). witch_idle_0/1: parada. witch_cast: lançando poção. witch_hurt: machucada. witch_talk_0/1: falando. witch_defeat: vencida, calma, cabeça baixa.', test: k => BOSS_IDS.some(id => k.startsWith(`${BOSS_DEFS[id].sprite.prefix}_`)) },
  { id: 'humans', title: 'Personagens humanos', note: 'Frei Anselmo (anselmo_front_0/1: de frente, 1 respira; anselmo_back: de costas; anselmo_side: perfil; anselmo_retrato: de frente em 4x, vetorial, usado na carta e na confissão). Aparece na carta, no portão do jardim e na confissão final.', test: k => k.startsWith('anselmo_') },
  { id: 'enemies', title: 'Inimigos', note: 'enemy: sapo mago (laboratório e jardim). enemy_ghost: fantasma (salão dos fantasmas; atravessa paredes). enemy_flower: flor do mal (jardim; fixa, imune à água).', test: k => k.startsWith('enemy') },
  { id: 'objects', title: 'Objetos', note: 'Poções: um formato por elemento: fogo (balão), água (tubo), terra (pote), éter (losango). Itens: power-ups são fichas redondas; moeda, gema, coração e baú são itens soltos.', test: k => k.startsWith('bomb_') || k.startsWith('pickup_') },
  { id: 'effects', title: 'Efeitos', note: 'Peças pequenas dos sistemas de partículas e a explosão.', test: k => k.startsWith('menu_') || k === 'explosion' },
  { id: 'scenery', title: 'Cenário', note: 'Castelo: floor, wall, block, door. Jardim: g_floor, g_wall (sebe), g_block (canteiro), gate (portão).', test: k => /^(floor|wall|block|door|g_|gate_)/.test(k) },
  { id: 'ui', title: 'Interface (HUD)', note: 'Ícones usados na faixa de cima do jogo.', test: k => k.startsWith('hud_') },
  { id: 'other', title: 'Outros', note: 'Sprites sem grupo definido.', test: () => true },
];

/** O grupo de uma textura pelo nome (o primeiro que serve; 'other' é o último). */
export function groupOf(key: string): SpriteGroup {
  return SPRITE_GROUPS.find(g => g.test(key)) ?? SPRITE_GROUPS[SPRITE_GROUPS.length - 1];
}
