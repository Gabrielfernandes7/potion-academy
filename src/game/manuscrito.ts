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
    id: 'roo', nome: 'Roo', titulo: 'Bruxo-cachorro, aprendiz do Caldeirão', grupo: 'heroi', perfil: 'roo',
    secao: 'farmaceutica',
    sprite: { frames: ['roo_down_0', 'roo_down_1', 'roo_down_2', 'roo_down_3'], zoom: 5 },
    visto: 'Laboratório do Caldeirão', fase: 1,
    habilidades: [
      { nome: 'Colocar poção', texto: 'Põe um frasco no chão. Cada poção tem o seu elemento, alcance e tempo.' },
      { nome: 'Explodir poções de ar', texto: 'Com a tecla D, detona de longe os frascos de ar, no instante em que escolher.' },
      { nome: 'Trocar de frasco', texto: 'Alterna entre as poções que a Roo já aprendeu (teclas 1 a 4).' },
    ],
    nota: 'Aprendi cedo que as minhas próprias poções também queimam. O fogo me fere mais que qualquer outra coisa; a água, quase nada. Sigo cada passo com cuidado.',
  },
  {
    id: 'roo-fire', nome: 'Roo Fire', titulo: 'A chama que a alquimista veste', grupo: 'heroi', perfilDireto: profileOf('fire', 4),
    forma: 'fire',
    secao: 'farmaceutica',
    sprite: { frames: Array.from({ length: 8 }, (_, t) => `roo_fire_4_down_0_${t}`), zoom: 5, ms: 110 },
    visto: 'Com a poção de fogo na mão, com a tecla T', fase: 1,
    habilidades: [
      { nome: 'Transformação (T)', texto: 'Dura 20 s e esfria em 4 degraus, e a capa, o chapéu e as orelhas voltam ao normal aos poucos. Depois, 25 s de espera.' },
      { nome: 'Só a chama', texto: 'Enquanto a forma durar, só a Poção de Fogo funciona: as outras poções não respondem à chama.' },
      { nome: 'Poções de fogo +50%', texto: 'No auge, a Poção de Fogo de 4 tira 6. O bônus cai a cada degrau e só vale para as poções dela.' },
      { nome: 'Brasas', texto: 'A explosão de fogo deixa brasas no chão. Queimam inimigos comuns; chefes são imunes. Uma explosão de água as apaga.' },
      { nome: 'Labareda (X)', texto: 'Um jato de fogo de 3 casas à frente. Custa 2 s da transformação e tem 3,5 s de espera.' },
      { nome: 'Onda de brasas (C)', texto: 'Uma explosão de fogo num losango de 2 casas em volta da Roo (sem a casa dela): fere o que estiver nele e deixa brasas. É a saída de quem foi cercado. Custa 2 s da forma, espera 5 s.' },
      { nome: 'Luz de chama', texto: 'Na névoa, enxerga até 2 casas a mais, e a visão volta ao normal conforme a chama esfria.' },
    ],
    nota: 'A chama cobra o preço de qualquer fogo: resisto às minhas próprias poções, mas a água me apaga de uma vez. Não dura mais que vinte respirações; uso cada uma, e nenhuma poção de água.',
  },
  {
    id: 'roo-aqua', nome: 'Roo Água', titulo: 'A água que a alquimista veste', grupo: 'heroi', perfilDireto: profileOf('water', 4),
    forma: 'water',
    secao: 'balneologica',
    sprite: { frames: Array.from({ length: 8 }, (_, t) => `roo_water_4_down_0_${t}`), zoom: 5, ms: 110 },
    visto: 'Com a poção de água na mão, com a tecla T (aprendida na fase 2, O Caminho)', fase: 2,
    habilidades: [
      { nome: 'Transformação (T)', texto: 'Dura 20 s e esfria em 4 degraus: as bolhas vão se desfazendo e a capa volta ao normal. Depois, 25 s de espera. Transforma com a poção de água na mão. Aprendida no meio do Salão dos Ecos, depois de três golpes da Poção de Água.' },
      { nome: 'Imune à água', texto: 'No auge, a água não a machuca: nem a maré, nem os sapos de água (o contato continua doendo). O fogo segue sendo a fraqueza.' }, { nome: 'Só a água', texto: 'Enquanto a forma durar, só a Poção de Água funciona: as outras poções não respondem à forma.' },
      { nome: 'Poções de água +50%', texto: 'No auge, a Poção de Água ganha metade a mais de dano. O bônus cai a cada degrau.' },
      { nome: 'Poça (C)', texto: 'A água se espalha numa área de 3x3, duas casas à frente, por até 4 s. Quem pisa nela anda a menos da metade da velocidade; as brasas se apagam e as poções de fogo se desfazem em vapor. Custa 2 s da forma, espera 5 s.' },
      { nome: 'Bolha de sabão (X)', texto: 'Sopra uma bolha que flutua até 4 casas. Se alcança um inimigo comum, o prende dentro dela até estourar. Chefes são imunes. Custa 2 s da forma.' },
    ],
    nota: 'A água me reconhece e não me machuca. Gosto de soprar bolhas: elas prendem o que não precisa ser ferido. O fogo, esse, continua sendo o meu ponto fraco.',
  },
  {
    id: 'roo-terra', nome: 'Roo Terra', titulo: 'O sal que a alquimista veste', grupo: 'heroi', perfilDireto: profileOf('earth', 4),
    forma: 'earth',
    secao: 'herbaria',
    sprite: { frames: Array.from({ length: 8 }, (_, t) => `roo_earth_4_down_0_${t}`), zoom: 5, ms: 110 },
    visto: 'Com a poção de terra na mão, com a tecla T (aprendida ao chegar ao Poço, fase 4)', fase: 4,
    habilidades: [
      { nome: 'Transformação (T)', texto: 'Dura 20 s e esfria em 4 degraus: o sal vai caindo e a capa volta ao normal. Depois, 25 s de espera. Transforma com a poção de terra na mão. Vem como lição antes da Quimera, que a terra prende.' },
      { nome: 'Imune à terra', texto: 'No auge, a terra não a machuca: as flores do mal não conseguem chicoteá-la. O ar é a fraqueza.' },
      { nome: 'O peso', texto: 'Transformada, anda 20% mais devagar. É o preço de ficar firme.' },
      { nome: 'Só a terra', texto: 'Enquanto a forma durar, só a Poção de Terra funciona: as outras poções não respondem à forma.' },
      { nome: 'Poções de terra +50%', texto: 'No auge, a Poção de Terra ganha metade a mais de dano. O bônus cai a cada degrau.' },
      { nome: 'Muro de sal (X)', texto: 'Levanta três casas de sal à frente, de lado a lado, por até 4 s. Inimigos comuns não passam (fantasmas atravessam) e nenhuma poção cabe em cima. Custa 2 s da forma, espera 4 s.' },
      { nome: 'Raiz (C)', texto: 'Afunda e viaja por baixo da terra (invulnerável, por baixo de paredes, caixotes e inimigos) e nasce na casa livre mais distante de uma linha de 4 casas. Ao brotar, a terra racha nas casas ao redor e fere o que estiver nelas. Custa 2 s da forma, espera 5 s.' },
    ],
    nota: 'O sal fixa o que o fogo separou. Fico pesada e firme, como quem decide ficar; e o vento, que não tem peso nenhum, é o único que me move do lugar.',
  },
  {
    id: 'roo-ar', nome: 'Roo Ar', titulo: 'O vento que a alquimista veste', grupo: 'heroi', perfilDireto: profileOf('air', 4),
    forma: 'air',
    secao: 'astronomica',
    sprite: { frames: Array.from({ length: 8 }, (_, t) => `roo_air_4_down_0_${t}`), zoom: 5, ms: 110 },
    visto: 'Com a poção de ar na mão, com a tecla T (aprendida na Escadaria da Torre, fase 5)', fase: 5,
    habilidades: [
      { nome: 'Transformação (T)', texto: 'Dura 20 s e esfria em 4 degraus: os fios de vento vão se desfazendo e a capa volta ao normal. Depois, 25 s de espera. Transforma com a poção de ar na mão. Aprendida no meio da Escadaria, depois de três golpes da Poção de Ar.' },
      { nome: 'Resiste ao ar', texto: 'No auge, o ar a fere menos. A terra é a fraqueza.' },
      { nome: 'A leveza', texto: 'Transformada, anda 20% mais rápido. O preço é a fraqueza à terra.' },
      { nome: 'A visão de cima', texto: 'A névoa não a esconde: vê a grade inteira.' },
      { nome: 'Só o ar', texto: 'Enquanto a forma durar, só a Poção de Ar funciona: as outras poções não respondem à forma.' },
      { nome: 'Poções de ar +50%', texto: 'No auge, a Poção de Ar ganha metade a mais de dano. O bônus cai a cada degrau.' },
      { nome: 'Sopro (X)', texto: 'Um vento em linha de 4 casas empurra 2 casas para a frente (1 nos degraus baixos) os inimigos comuns, que ficam atordoados, e as poções do chão, que deslizam. Flores e chefes não saem do lugar. Apaga as brasas. Custa 2 s da forma, espera 3,5 s.' },
      { nome: 'Salto de vento (C)', texto: 'Um pulo de até 3 casas, por cima de inimigos, poções e muros de sal, invulnerável durante o pulo. Não atravessa parede nem caixote. Custa 1,5 s da forma, espera 2,5 s.' },
    ],
    nota: 'De cima se vê tudo, e é por isso que o ar tenta: dá vontade de nunca descer. Aprendi a soprar o que me atrapalha, a saltar o que não vale a briga e a lembrar que o pão está no chão.',
  },
  {
    id: 'mestre', nome: 'O mestre', titulo: 'Quem me ensinou a medir o fogo', grupo: 'aliado',
    secao: 'balneologica',
    sprite: { frames: ['mestre_sombra_0', 'mestre_sombra_1'], zoom: 6, ms: 700 },
    visto: 'Nas páginas que ele deixou, a partir do Salão dos Ecos', fase: 2,
    habilidades: [
      { nome: 'As quatro lições', texto: 'Ensinou a medir o fogo, ouvir a água, respeitar a terra e desconfiar do ar. Cada lição virou uma forma que aprendi a vestir: Roo Fire, Roo Água, Roo Terra e Roo Ar.' },
      { nome: 'A busca', texto: 'Procurava a pedra filosofal não por ouro, mas por um remédio de tudo e por um pão sem escassez. Já tinha perdido alguém numa epidemia antiga.' },
      { nome: 'O medo', texto: 'Depois da noite da bolha, a busca ganhou um segundo motivo: o medo de que uma bolha estoure. Não me deixou rastro, só páginas riscadas.' },
    ],
    nota: 'Não aparece: só a letra, a lanterna e a voz. Escreveu "a matéria responde ao que não sabemos pedir" e riscou. Tenho a impressão de que a página riscada era a mais verdadeira.',
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
      { nome: 'Contato', texto: 'Encostar nele machuca. Morre com poucas explosões.' },
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
    nota: 'A Poção de Terra passa por ele como por névoa. A água, porém, o desfaz: lembra as bênçãos que Anselmo fazia.',
  },
  {
    id: 'lanterna', nome: 'Lanterna viva', titulo: 'Chama de lamparina que aprendeu a andar', grupo: 'inimigo', perfil: 'lantern',
    secao: 'farmaceutica',
    sprite: { frames: ['enemy_lantern'], zoom: 6 },
    visto: 'Estantes da Biblioteca e Pátio do Observatório', fase: 9,
    habilidades: [
      { nome: 'Patrulha', texto: 'Anda em linha reta e volta quando bate numa parede ou num caixote. Não persegue.' },
      { nome: 'Brilho', texto: 'A chama balança e ilumina o chão em volta: dá para vê-la de longe, mesmo na penumbra.' },
      { nome: 'Contato', texto: 'Encostar nela machuca. A chama é pequena; o vidro, não. A água a apaga (APAGADA).' },
    ],
    nota: 'São as lâmpadas que os copistas deixaram acesas, e que ainda procuram quem as apague. A água faz isso; o fogo, nunca.',
  },
  {
    id: 'relogio', nome: 'Relógio de cobre', titulo: 'Autômato de ronda do Observatório', grupo: 'inimigo', perfil: 'clock',
    secao: 'astronomica',
    sprite: { frames: ['enemy_clock'], zoom: 6 },
    visto: 'Salão dos Relógios e Cúpula', fase: 14,
    habilidades: [
      { nome: 'Ronda', texto: 'Anda sempre no mesmo ritmo, de ida e volta, em linha reta.' },
      { nome: 'Dar corda', texto: 'A cada volta completa (8 passos) trava por 2 s, de olhos fechados e com a chave de lado: é a hora de passar. Os passos de perto fazem tique.' },
    ],
    nota: 'O tempo das colheitas não espera ninguém, e este autômato também não. Mas aprendi o compasso: a água o enferruja, a terra escorre por ele.',
  },
  {
    id: 'toupeira', nome: 'Toupeira de sal', titulo: 'Habitante das lajes do Observatório', grupo: 'inimigo', perfil: 'mole',
    secao: 'herbaria',
    sprite: { frames: ['enemy_mole'], zoom: 6 },
    visto: 'Galeria das Cartas e Cúpula', fase: 15,
    habilidades: [
      { nome: 'Afundar', texto: 'Depois de andar um tempo, some debaixo da terra por 1,4 s. Nada a alcança lá.' },
      { nome: 'Rastro', texto: 'Um monte de terra anda de onde ela afundou até onde vai sair: dá para seguir o caminho dela com os olhos.' },
      { nome: 'Brotar', texto: 'Deixa um monte com a borda clara na casa onde vai sair, a 2 ou 3 casas da Roo. O Muro de sal fecha o buraco. O ar a desentoca de vez (DESENTOCADA).' },
    ],
    nota: 'Cava como eu cavo, na Roo Terra. Mas ela avisa o lugar antes de sair, e eu agradeço. O ar a tira do buraco; a terra, que ela é, não a fere.',
  },
  {
    id: 'coruja', nome: 'Coruja do scriptorium', titulo: 'Guardiã das escrituras', grupo: 'inimigo', perfil: 'owl',
    secao: 'astronomica',
    sprite: { frames: ['enemy_owl'], zoom: 6 },
    visto: 'Scriptorium da Biblioteca e Galeria das Cartas', fase: 10,
    habilidades: [
      { nome: 'Voo', texto: 'Voa por cima de paredes e caixotes, devagar, sem rumo.' },
      { nome: 'Mergulho', texto: 'A cada 6 s pia duas vezes, arregala os olhos e marca a casa onde você está com um círculo que encolhe e uma sombra que cresce no chão: ela vem de cima. 1 s depois, mergulha. Quem saiu da casa escapa.' },
    ],
    nota: 'Vigia as escrituras, mas não ataca quem apenas lê. Só quem fica parado no círculo. O Salto de vento do ar é a esquiva dela; a terra a derruba.',
  },
  {
    id: 'gosma', nome: 'Gosma de mercúrio', titulo: 'Prata viva que escapou do caldeirão', grupo: 'inimigo', perfil: 'slime',
    secao: 'balneologica',
    sprite: { frames: ['enemy_slime', 'enemy_slime_1'], zoom: 6, ms: 380 },
    visto: 'A Névoa, na charneca do Vale', fase: 3,
    habilidades: [
      { nome: 'Escorrer', texto: 'Anda devagar, de casa em casa, deixando uma poça de prata. Não persegue.' },
      { nome: 'Dividir', texto: 'Quando leva fogo e sobrevive, parte-se em duas, cada uma com metade da vida que sobrou. No máximo seis ao mesmo tempo.' },
    ],
    nota: 'O fogo a multiplica, e foi assim que aprendi: cada golpe errado deixava mais uma. A água passa por ela sem efeito; só a terra a prende e a desfaz.',
  },
  {
    id: 'sentinela', nome: 'Sentinela de cera', titulo: 'Armadura de vela, guarda da Torre', grupo: 'inimigo', perfil: 'sentinel',
    secao: 'farmaceutica',
    sprite: { frames: ['enemy_sentinel', 'enemy_sentinel_1'], zoom: 6, ms: 420 },
    visto: 'Escadaria, Corredor e Antecâmara da Torre', fase: 5,
    habilidades: [
      { nome: 'Marcha', texto: 'Anda em linha reta, devagar, e só vira quando bate numa parede ou num caixote.' },
      { nome: 'Cera', texto: 'Resiste à terra e aguenta muitos golpes. O fogo a derrete, e muito.' },
    ],
    nota: 'Belladona fez a guarda das velas que sobraram dos selos. É lenta e previsível: basta ler o corredor. O fogo, que ela tanto teme, é o que resolve.',
  },
  {
    id: 'ratinho', nome: 'Ratinho do celeiro', titulo: 'Fome em forma pequena', grupo: 'inimigo', perfil: 'rat',
    secao: 'herbaria',
    sprite: { frames: ['enemy_rat', 'enemy_rat_1'], zoom: 6, ms: 300 },
    visto: 'A Ponte e Os Muros, no caminho do mosteiro', fase: 18,
    habilidades: [
      { nome: 'Fugir', texto: 'Foge da Roo quando ela chega a 3 casas. Não machuca ninguém.' },
      { nome: 'Roubar', texto: 'Corre até o item mais próximo no chão (menos as gemas) e o leva. Some pela parede depois de 3 s e o item some com ele.' },
      { nome: 'Derrubar', texto: 'Se for derrubado antes de fugir, devolve o que levava, no lugar onde caiu.' },
    ],
    nota: 'Não é maldade: é fome. O celeiro trancado deixou migalhas, e ele só as quer. Um estouro de fogo o espanta; eu prefiro chegar antes dele.',
  },
  {
    id: 'salamandra', nome: 'Salamandra do caldeirão', titulo: 'Lagartixa de brasa que dorme nas pedras quentes', grupo: 'aliado', perfil: 'salamander',
    secao: 'farmaceutica',
    sprite: { frames: ['enemy_salamander', 'enemy_salamander_1'], zoom: 6, ms: 500 },
    visto: 'O Laboratório do Caldeirão', fase: 1,
    habilidades: [
      { nome: 'Aquecer', texto: 'Se a Roo chega perto dela, devolve 4 de vida, uma vez por fase.' },
      { nome: 'Não machuca', texto: 'Anda devagar entre as pedras quentes e não ataca ninguém. A água a apaga: cuidado com onde cai a Poção de Água.' },
    ],
    nota: 'O Caldeirão sempre foi um lar, e ela o lembra. Passo perto dela quando preciso de um pouco de calor.',
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
    id: 'ouroboros', nome: 'Ouroboros', titulo: 'A serpente do ciclo, no alto do Observatório', grupo: 'chefe', perfil: 'ouroboros',
    arenaId: 'ouroboros',
    secao: 'astronomica',
    sprite: { frames: ['ouro_idle_0', 'ouro_idle_1'], zoom: 5, ms: 450 },
    visto: 'A Cúpula do Observatório', fase: 16,
    habilidades: [
      { nome: 'O ciclo', texto: 'A fraqueza gira a cada 9 s (6,5 s furioso): fogo, terra, água, ar. Um brilho em volta dele mostra o elemento da vez: 4 de dano. Os vizinhos no ciclo causam 1; o oposto, dois passos adiante, ele devora (nada). Ele veste o elemento da vez: os golpes dele são desse elemento.' },
      { nome: 'Anéis', texto: 'Dois anéis se abrem a partir dele, um depois do outro (raio 2 e raio 4). Só o anel machuca: dá para ficar dentro ou fora.' },
      { nome: 'Mordida', texto: 'Uma linha que passa pela sua casa. Furioso, em cruz.' },
      { nome: 'O Ciclo (fúria)', texto: 'O elemento vira de uma vez e quase o campo todo é atingido. As casas verdes são seguras.' },
    ],
    nota: 'Não guarda nada: gira. O que acaba aqui começa de novo em outro lugar. Aprendi com ele a esperar a roda passar em vez de bater na hora errada. Cada elemento tem a sua vez.',
  },
  {
    id: 'leao', nome: 'Leão Verde', titulo: 'Solvente universal, guardião da Biblioteca Proibida', grupo: 'chefe', perfil: 'lion',
    arenaId: 'lion',
    secao: 'astronomica',
    sprite: { frames: ['lion_idle_0', 'lion_idle_1'], zoom: 5 },
    visto: 'A Biblioteca Proibida, no Salão dos Acorrentados', fase: 12,
    habilidades: [
      { nome: 'Bote', texto: 'Some e salta sobre a sua casa, com um abalo em cruz. Depois fica exposto e leva dano extra.' },
      { nome: 'Dissolver', texto: 'Um ácido verde corre pela linha da sua casa e dissolve as suas poções no caminho. Furioso, também pela coluna.' },
      { nome: 'Rugido (fúria)', texto: 'Atinge quase o campo todo. As casas verdes são seguras.' },
    ],
    nota: 'Os manuscritos o mostram devorando o sol: o verde dissolve até o ouro. A terra, que é sal, ele já dissolveu. O ar, que nada dissolve, o queima.',
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
    visto: 'Ponte e jardim', fase: 18,
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
    visto: 'Jardim do Mosteiro', fase: 20,
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
