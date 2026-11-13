// Manuscrito do Alquimista: uma página por personagem, em forma de carta (puro, testável).
// Os números (vida, força, fraqueza) vêm da tabela de personagens (game/entities/profiles.ts), então
// nunca divergem do jogo; aqui ficam só os textos e quando a página se revela. A tela está em manuscrito.ts.
import { ELEMENTS, ElementId } from '../config';
import { type DamageProfile, multiplierFor } from './entities/damage';
import { PROFILES, type EntityId } from './entities/profiles';
import type { SecaoId } from './voynich';
import { profileOf, type FormId } from './forms';

export type ManuscritoGroup = 'heroi' | 'aliado' | 'inimigo' | 'chefe';

export interface ManuscritoSkill { nome: string; texto: string }

export interface ManuscritoEntry {
  id: string;
  nome: string;
  titulo: string; // linha curta sob o nome
  grupo: ManuscritoGroup;
  secao: SecaoId; // seção do códice em que a página "foi escrita" (ver game/voynich.ts)
  perfil?: EntityId; // personagens que lutam; Anselmo não tem
  perfilDireto?: DamageProfile; // perfil que não está na tabela de personagens (a Roo transformada)
  forma?: FormId; // a página é de uma transformação da Roo (o teste de contrato exige uma página por forma)
  arenaId?: string; // id do chefe na Arena (BossId), se ele luta lá: vencê-lo abre a página
  selado?: boolean; // só abre depois de vencer o chefe na Arena (o capítulo dele ainda está selado)
  sprite: { frames: readonly string[]; zoom: number; ms?: number }; // texturas do jogo; ms = tempo entre quadros
  visto: string; // onde aparece
  fase: number; // fase em que a página se revela (a página abre quando essa fase é alcançada)
  habilidades: readonly ManuscritoSkill[];
  nota: string; // anotação do alquimista, em primeira pessoa
}

export const GRUPOS: Record<ManuscritoGroup, string> = {
  heroi: 'Alquimista',
  aliado: 'Aliado',
  inimigo: 'Criaturas',
  chefe: 'Chefes',
};

export const MANUSCRITO: readonly ManuscritoEntry[] = [
  {
    id: 'roo', nome: 'Roo', titulo: 'Bruxo-canguru, aprendiz do Caldeirão', grupo: 'heroi', perfil: 'roo',
    secao: 'farmaceutica',
    sprite: { frames: ['roo_down_0', 'roo_down_1', 'roo_down_2', 'roo_down_3'], zoom: 5 },
    visto: 'Laboratório do Caldeirão', fase: 1,
    habilidades: [
      { nome: 'Colocar poção', texto: 'Põe um frasco no chão. Cada poção tem o seu elemento, alcance e tempo.' },
      { nome: 'Explodir poções etéreas', texto: 'Com a tecla D, detona de longe os frascos de éter, no instante em que escolher.' },
      { nome: 'Trocar de frasco', texto: 'Alterna entre as poções que já comprou no Caldeirão de Magia (teclas 1 a 4).' },
    ],
    nota: 'Aprendi cedo que as minhas próprias poções também queimam. O fogo me fere mais que qualquer outra coisa; a água, quase nada. Sigo cada passo com cuidado.',
  },
  {
    id: 'roo-fire', nome: 'Roo Fire', titulo: 'A chama que a alquimista veste', grupo: 'heroi', perfilDireto: profileOf('fire', 4),
    forma: 'fire',
    secao: 'farmaceutica',
    sprite: { frames: Array.from({ length: 8 }, (_, t) => `roo_fire_4_down_0_${t}`), zoom: 5, ms: 110 },
    visto: 'Em qualquer fase, com a tecla T', fase: 1,
    habilidades: [
      { nome: 'Transformação (T)', texto: 'Dura 20 s e esfria em 4 degraus, e a capa, o chapéu e as orelhas voltam ao normal aos poucos. Depois, 25 s de espera.' },
      { nome: 'A chama recusa a água', texto: 'Enquanto a forma durar, a Roo não pode usar a Poção Aqua: a chama a rejeita.' },
      { nome: 'Poções de fogo +50%', texto: 'No auge, a Poção de Fogo de 4 tira 6. O bônus cai a cada degrau e só vale para as poções dela.' },
      { nome: 'Brasas', texto: 'A explosão de fogo deixa brasas no chão. Queimam inimigos comuns; chefes são imunes. Uma explosão de água as apaga.' },
      { nome: 'Labareda (X)', texto: 'Um jato de fogo de 3 casas à frente. Custa 2 s da transformação e tem 3,5 s de espera.' },
      { nome: 'Luz de chama', texto: 'Na névoa, enxerga até 2 casas a mais, e a visão volta ao normal conforme a chama esfria.' },
    ],
    nota: 'A chama cobra o preço de qualquer fogo: resisto às minhas próprias poções, mas a água me apaga de uma vez. Não dura mais que vinte respirações; uso cada uma, e nenhuma poção de água.',
  },
  {
    id: 'roo-aqua', nome: 'Roo Aqua', titulo: 'A água que a alquimista veste', grupo: 'heroi', perfilDireto: profileOf('water', 4),
    forma: 'water',
    secao: 'balneologica',
    sprite: { frames: Array.from({ length: 8 }, (_, t) => `roo_water_4_down_0_${t}`), zoom: 5, ms: 110 },
    visto: 'Em qualquer fase, com a tecla Y', fase: 1,
    habilidades: [
      { nome: 'Transformação (Y)', texto: 'Dura 20 s e esfria em 4 degraus: as bolhas vão se desfazendo e a capa volta ao normal. Depois, 25 s de espera.' },
      { nome: 'Imune à água', texto: 'No auge, a água não a machuca: nem a Poção Aqua, nem a maré, nem os sapos de água (o contato continua doendo). O fogo segue sendo a fraqueza.' },
      { nome: 'Poções de água +50%', texto: 'No auge, a Poção Aqua ganha metade a mais de dano. O bônus cai a cada degrau.' },
      { nome: 'Bolha de sabão (X)', texto: 'Sopra uma bolha que flutua até 4 casas. Se alcança um inimigo comum, o prende dentro dela até estourar. Chefes são imunes. Custa 2 s da forma.' },
    ],
    nota: 'A água me reconhece e não me machuca. Gosto de soprar bolhas: elas prendem o que não precisa ser ferido. O fogo, esse, continua sendo o meu ponto fraco.',
  },
  {
    id: 'anselmo', nome: 'Frei Anselmo', titulo: 'Guardião do scriptorium de São Tomás', grupo: 'aliado',
    secao: 'receitas',
    sprite: { frames: ['anselmo_front_0', 'anselmo_front_1'], zoom: 5 },
    visto: 'A carta, o portão do jardim e a confissão', fase: 1,
    habilidades: [
      { nome: 'Escrever cartas', texto: 'Chamou a Roo com uma carta e um frasco vazio, sem dizer tudo o que sabia.' },
      { nome: 'Guardar as escrituras', texto: 'Cuida do scriptorium do Mosteiro de São Tomás e quer vê-las copiadas e lidas.' },
    ],
    nota: 'Não luta. Foi confessor do mestre e não o deteve. Confio nele, mas anoto: ele sabe mais do que contou.',
  },
  {
    id: 'sapo', nome: 'Sapo mago', titulo: 'Anfíbio de laboratório', grupo: 'inimigo', perfil: 'frog',
    secao: 'balneologica',
    sprite: { frames: ['enemy'], zoom: 6 },
    visto: 'Laboratório e jardim', fase: 1,
    habilidades: [
      { nome: 'Pulinhos', texto: 'Anda sem rumo, de casa em casa. Não persegue ninguém.' },
      { nome: 'Contato', texto: 'Encostar nele machuca. Morre com poucas explosões e deixa uma moeda.' },
    ],
    nota: 'Vive do calor do caldeirão. O chapéu com estrela é só pose: não conjura nada. A terra o derruba de um golpe.',
  },
  {
    id: 'fantasma', nome: 'Fantasma', titulo: 'Eco dos que estudaram demais', grupo: 'inimigo', perfil: 'ghost',
    secao: 'astronomica',
    sprite: { frames: ['enemy_ghost'], zoom: 6 },
    visto: 'Salão dos Ecos e Torre', fase: 2,
    habilidades: [
      { nome: 'Atravessar', texto: 'Passa por muralhas, caixotes e poções. Dentro da pedra, a explosão não o alcança.' },
      { nome: 'Flutuar', texto: 'Um passo lento a cada 1,5 s. Não sai da sala e não persegue.' },
    ],
    nota: 'A Poção Telúrica passa por ele como por névoa. A água, porém, o desfaz: lembra as bênçãos que Anselmo fazia.',
  },
  {
    id: 'quimera', nome: 'Quimera de Mercúrio', titulo: 'Prata viva derramada no poço', grupo: 'chefe', perfil: 'chimera',
    arenaId: 'chimera',
    secao: 'balneologica',
    sprite: { frames: ['chimera_idle_0', 'chimera_idle_1'], zoom: 5 },
    visto: 'Poço de Prata, fim do Vale', fase: 4,
    habilidades: [
      { nome: 'Cuspe', texto: 'Um jato de prata em linha reta, até na diagonal, que passa pela sua casa. Furiosa, cospe em cruz.' },
      { nome: 'Gotas de prata', texto: 'Gotas caem uma depois da outra, a primeira onde você está. Furiosa, são cinco.' },
      { nome: 'Escorrer', texto: 'Vira poça, protegida, e ressurge perto de você com um respingo em cruz.' },
      { nome: 'Onda (fúria)', texto: 'Faixas de mercúrio varrem o campo. Uma linha fica seca, sempre ao seu alcance.' },
    ],
    nota: 'Leão, bode e serpente num corpo só, como mandam os bestiários. Mas esta é de mercúrio: a água escorre por ela e só a terra a prende.',
  },
  {
    id: 'leao', nome: 'Leão Verde', titulo: 'Solvente universal, guardião da Biblioteca Proibida', grupo: 'chefe', perfil: 'lion',
    arenaId: 'lion',
    secao: 'astronomica', selado: true,
    sprite: { frames: ['lion_idle_0', 'lion_idle_1'], zoom: 5 },
    visto: 'Biblioteca Proibida (capítulo selado); por ora, só na Arena', fase: 1,
    habilidades: [
      { nome: 'Bote', texto: 'Some e salta sobre a sua casa, com um abalo em cruz. Depois fica exposto e leva dano extra.' },
      { nome: 'Dissolver', texto: 'Um ácido verde corre pela linha da sua casa e dissolve as suas poções no caminho. Furioso, também pela coluna.' },
      { nome: 'Rugido (fúria)', texto: 'Atinge quase o campo todo. As casas verdes são seguras.' },
    ],
    nota: 'Os manuscritos o mostram devorando o sol: o verde dissolve até o ouro. A terra, que é sal, ele já dissolveu. O éter, que nada dissolve, o queima.',
  },
  {
    id: 'belladona', nome: 'Belladona', titulo: 'Alquimista rival, dona da Torre', grupo: 'chefe', perfil: 'belladonna',
    arenaId: 'belladonna',
    secao: 'herbaria',
    sprite: { frames: ['witch_idle_0', 'witch_idle_1'], zoom: 5 },
    visto: 'Torre de Belladona', fase: 8,
    habilidades: [
      { nome: 'Arremesso de Fogo', texto: 'Joga uma poção na casa onde você está. Furiosa, joga duas seguidas.' },
      { nome: 'Chuva de Gotas', texto: 'Quatro gotas de água caem ao seu redor. Só na fúria.' },
      { nome: 'Salto de Névoa', texto: 'Some por um instante, protegida, e reaparece longe de você.' },
    ],
    nota: 'Quer ler o que ficou escrito. Entendo o motivo. Todo golpe dela avisa no chão antes de cair: leio o aviso e me movo.',
  },
  {
    id: 'flor', nome: 'Flor do mal', titulo: 'Sentinela das margens', grupo: 'inimigo', perfil: 'flower',
    secao: 'herbaria',
    sprite: { frames: ['enemy_flower'], zoom: 6 },
    visto: 'Ponte e jardim', fase: 10,
    habilidades: [
      { nome: 'Raiz', texto: 'Fica fixa e bloqueia a casa. Não se mexe nem se multiplica.' },
      { nome: 'Chicote', texto: 'A cada 3,2 s avisa em rosa as quatro casas ao redor e, 0,8 s depois, chicoteia.' },
    ],
    nota: 'A água só a alimenta: não adianta molhá-la. O fogo é o que a queima.',
  },
  {
    id: 'mandragora', nome: 'Mandrágora', titulo: 'Feiticeira do jardim do mosteiro', grupo: 'chefe', perfil: 'mandrake',
    arenaId: 'mandrake',
    secao: 'herbaria',
    sprite: { frames: ['mandrake_idle_0', 'mandrake_idle_1'], zoom: 5 },
    visto: 'Jardim do Mosteiro', fase: 12,
    habilidades: [
      { nome: 'Raízes', texto: 'Raízes sobem na linha e na coluna onde você está. Furiosa, em cruz.' },
      { nome: 'Maré', texto: 'Anéis de água se expandem um depois do outro. Uma faixa fica seca: o caminho seguro.' },
      { nome: 'Cavar', texto: 'Some no chão e ressurge onde você estava. Depois fica exposta e leva dano extra.' },
      { nome: 'Grito e Brotos (fúria)', texto: 'Um grito quase total, com casas verdes seguras, e flores do mal que nascem.' },
    ],
    nota: 'Cuidava do jardim antes de haver mosteiro. Terra e água a sustentam; só o fogo a ameaça.',
  },
];

export function entryById(id: string): ManuscritoEntry | undefined {
  return MANUSCRITO.find(e => e.id === id);
}

/**
 * A página abre quando a fase dela foi alcançada (`reached` diz se a fase está liberada no mapa) ou quando o
 * chefe dela já foi vencido na Arena (`beaten`). Páginas seladas (capítulo ainda fechado) só abrem pela Arena.
 */
export function isEntryOpen(
  entry: ManuscritoEntry, reached: (stage: number) => boolean, beaten: readonly string[] = [],
): boolean {
  if (beaten.includes(entry.arenaId ?? entry.id)) return true;
  if (entry.selado) return false;
  return entry.fase <= 1 || reached(entry.fase);
}

export interface CardStats {
  atributo: { nome: string; alquimia: string; simbolo: string; elemento: ElementId };
  vida: number;
  forca: { resiste: ElementId[]; imune: ElementId[] };
  fraqueza: ElementId[];
  recebe: Record<ElementId, number>; // multiplicador de dano por elemento (0 = imune)
}

const NOMES = (els: readonly ElementId[]): ElementId[] => [...els];

/** Atributo, vida, força e fraqueza de um perfil de personagem. */
export function cardStats(profile: DamageProfile): CardStats {
  const el = ELEMENTS[profile.element];
  return {
    atributo: { nome: el.name, alquimia: el.alchemy, simbolo: el.symbol, elemento: profile.element },
    vida: profile.maxHp,
    forca: { resiste: NOMES(profile.resist), imune: NOMES(profile.immune) },
    fraqueza: NOMES(profile.weak),
    recebe: {
      fire: multiplierFor(profile, 'fire'), water: multiplierFor(profile, 'water'),
      earth: multiplierFor(profile, 'earth'), air: multiplierFor(profile, 'air'),
    },
  };
}

export function statsOf(entry: ManuscritoEntry): CardStats | null {
  if (entry.perfil) return cardStats(PROFILES[entry.perfil]);
  return entry.perfilDireto ? cardStats(entry.perfilDireto) : null;
}

/** Texto do elemento: "FOGO (Enxofre)". */
export function elementLabel(el: ElementId): string {
  return `${ELEMENTS[el].name} (${ELEMENTS[el].alchemy})`;
}
