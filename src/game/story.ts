// Textos da história (PT-BR). Fonte: docs/12-historia.md.
// Cada cartão é uma fala; quem fala é o nome mostrado no alto. O retrato só vale para o Anselmo.

export const ANSELMO = 'Frei Anselmo';

export interface StoryCard { speaker: string; text: string }

// Jardim do mosteiro, ao pé do portão: a confissão, a chegada de Belladona, o frasco vazio e o epílogo. As partes estão
// aqui e a montagem (ENDING_CARDS) está mais abaixo, depois de ROO e MESTRE existirem.
const CONFISSAO: StoryCard[] = [
  { speaker: ANSELMO, text: 'Voltaste, Roo. E trouxeste o que restou. Basta: o que restou é o que ainda se pode ler.' },
  { speaker: ANSELMO, text: 'Não vou guardá-las de novo. Vou mandar copiá-las muitas vezes e levá-las às aldeias do vale. Tesouro escondido não serve a ninguém: serve o pão partido.' },
  { speaker: ANSELMO, text: 'E devo confessar uma coisa. Fui confessor do teu mestre. Vi que ele se perdia atrás da pedra filosofal e não o detive. Na noite da bolha, ele me contou o que fez. Eu lhe disse que o que nasceu em suas mãos não era obra dele, era dádiva. Ele chorou. Não acreditou, e eu não insisti. A culpa é minha.' },
  { speaker: ANSELMO, text: 'Não te peço perdão. Peço que não repitas. Quando alguém procurar sem saber o que procura, fica ao lado dessa pessoa.' },
  { speaker: ANSELMO, text: 'Dediquei a vida a Jesus, e aprendi tarde que isso nunca foi saber mais: é servir os pobres, as viúvas, os órfãos. Servi pouco. Tu, talvez, sirvas melhor.' },
];

const FRASCO: StoryCard[] = [
  { speaker: ANSELMO, text: 'O frasco era do mestre: deixou-o comigo na última confissão, vazio. Leva-o de volta. Ele nunca foi feito para encher. Nem tudo se enche, Roo. O que farás com ele?' },
];

// Derrota da Belladona: ela se despede antes de a Roo seguir para o jardim.
export const BELLADONA = 'Belladona';
export const BELLADONA_CARDS: StoryCard[] = [
  { speaker: BELLADONA, text: 'Você venceu. Mas me diga, Roo: quem alimenta a aldeia amanhã?' },
  { speaker: BELLADONA, text: 'Não preciso que concorde. Preciso que alguém responda. Ele guardava palavras em cofres enquanto o pão acabava; eu só quis que servissem para alguma coisa.' },
  { speaker: BELLADONA, text: 'Leve o pergaminho. Leia melhor do que eu li.' },
  { speaker: BELLADONA, text: 'Minha mãe ardeu três noites e eu contei cada uma. A fórmula era tudo o que eu tinha. Agora não sei o que faço.' },
];

// Derrota da Quimera: a prata do mestre se despede antes de a Roo seguir para a Torre.
export const CHIMERA = 'Quimera';
export const LION = 'Leão Verde';

export const LION_CARDS: StoryCard[] = [
  { speaker: LION, text: "Não sou guarda de ouro. Guardo o que o ouro não compra: livros que alguém ainda quer ler." },
  { speaker: LION, text: "Pode levar as escrituras. Leve também o que elas pedem: que ninguém passe fome por causa delas." },
];

export const CHIMERA_CARDS: StoryCard[] = [
  { speaker: CHIMERA, text: 'Eu era o que o mestre derramou quando não soube mais o que guardar: prata sem forma, sem dono.' },
  { speaker: CHIMERA, text: 'Ele quis que eu virasse pão, e eu fiquei no meio do caminho. Belladona me guardou aqui para estudar o que restou.' },
  { speaker: CHIMERA, text: 'Você me prendeu com terra, não com ódio. Poucos sabem a diferença.' },
  { speaker: CHIMERA, text: 'Siga. A torre fica depois da charneca. Lá, quem lê demais espera por você.' },
  { speaker: CHIMERA, text: "Leve o sopro que eu guardava. O ar não se prende, e por isso sempre volta." },
];

// Derrota da Mandrágora: a guardiã do portão do jardim se despede antes de o portão abrir.
export const MANDRAKE = 'Mandrágora';
export const MANDRAKE_CARDS: StoryCard[] = [
  { speaker: MANDRAKE, text: 'Eu cuidava deste jardim antes de haver mosteiro. Cada raiz aqui guarda um pedaço do que foi lido em voz alta.' },
  { speaker: MANDRAKE, text: 'Gritei para afastar quem queria arrancar tudo. Você não arrancou. Só pediu passagem.' },
  { speaker: MANDRAKE, text: 'Passe, Roo. Diga ao frei que a terra também escuta.' },
];

// Cena final no Caldeirão: uma linha por vez, devagar. A última é o título da tela de fim.
export const CAULDRON_LINES: string[] = [
  'O Caldeirão estava como Roo o deixou: morno, em silêncio.',
  'Pousou o frasco vazio sobre a mesa. Ele não pedia nada.',
  'Na primavera, o Caldeirão ferveu sopa pela primeira vez, mexido por muitas mãos: a de Belladona, a dos monges, a das famílias da fila.',
  'Roo já não era o aprendiz que partira por uma carta. Sabia quem era: não uma prova, uma dádiva. E dádiva não se guarda: reparte-se.',
  'Uma vela ficou acesa na janela, todas as noites, para o mestre, se ele voltasse.',
  'Por enquanto, bastava mexer a poção, devagar.',
];

// Passagens: o que a Roo lê, ouve e entende ao vencer cada fase (chave = fase vencida).
// Antes da próxima fase, sem pausa de jogo além da conversa. Narração da Roo em primeira pessoa.
export const ROO = 'Roo';
export const MESTRE = 'O mestre';

export const OUROBOROS = 'O Ouroboros';

export const OUROBOROS_CARDS: StoryCard[] = [
  { speaker: OUROBOROS, text: 'Eu não guardo nada. Giro: o que acaba aqui começa de novo em outro lugar, e o que o mestre estudou também.' },
  { speaker: OUROBOROS, text: 'Você aprendeu a ler o aviso e a sair do círculo. É o mais difícil: saber quando esperar a roda passar.' },
  { speaker: MESTRE, text: 'Na borda do caderno, deixada sob o astrolábio, a letra dele: "Procurei a pedra a vida inteira. Na noite da bolha tive nas mãos o que procurava e quis provar que era meu. Se eu não voltar, diga-lhe: não foi prova. Foi dádiva. E dádiva não se guarda: reparte-se."' },
  { speaker: ROO, text: 'A fenda da cúpula se abre sobre o céu inteiro. Procuro a estrela do caderno do mestre e não a encontro: ela se mudou, como tudo o que ele estudou.' },
  { speaker: ROO, text: 'Fecho o caderno e desço, em direção ao mosteiro. O que acaba aqui começa de novo lá embaixo, na sopa e no pão.' },
];


export const PASSAGE_CARDS: Record<number, StoryCard[]> = {
  1: [
    { speaker: ROO, text: 'Ao sair do laboratório, encontro no chão uma página rasgada. A letra é do mestre, a mesma das minhas lições.' },
    { speaker: ROO, text: 'Ele escreveu "a terra é de quem a cultiva", riscou e escreveu de novo. Nunca o vi hesitar diante de uma fórmula.' },
    { speaker: ROO, text: "No caixote do laboratório há um frasco de água do mestre. Aprendo a usá-lo: a água apaga o fogo, e o fogo não apaga a água." },
    { speaker: ROO, text: 'A água é a mesma em que eu nasci, a bolha. Quando a chamo de volta, ela me envolve de novo.' },
  ],
  2: [
    { speaker: ROO, text: 'Os fantasmas deste salão não têm alma. São ecos: o que foi estudado sem cuidado, repetindo-se nas paredes.' },
    { speaker: ROO, text: 'Belladona guardou aqui o que o mestre não soube descartar: experiências que ainda respondem.' },
    { speaker: MESTRE, text: '...hoje a bolha não estourou. Dentro dela, algo respira. Diga ao Anselmo que eu...' },
    { speaker: ROO, text: 'A voz se perde entre as colunas. Dizem que nasci de uma bolha; sempre achei fábula de ninar. Por que o mestre guardaria esta página?' },
    { speaker: BELLADONA, text: 'Você chegou até aqui, e ele também chegou, uma vez. Depois pediu que eu parasse de ler. Eu não parei.' },
  ],
  3: [
    { speaker: ROO, text: 'A névoa se abre devagar. Atrás de mim, a charneca desaparece como se nunca tivesse existido.' },
    { speaker: ROO, text: 'No chão, uma poça de prata respira. Ao redor, a pedra tem a letra do mestre gravada. Chego mais perto.' },
    { speaker: ROO, text: "Um frasco de terra, pesado como sal. Quando cai, a terra prende o que tenta escapar." },
    { speaker: ROO, text: 'Respeitar a terra era a terceira lição do mestre. O frasco pesa nas minhas mãos como uma promessa.' },
  ],
  5: [
    { speaker: ROO, text: 'A torre se ergue sobre o vale. Os degraus são frios, e os fantasmas daqui não têm cheiro, só silêncio.' },
    { speaker: ROO, text: 'Lá em cima, sinto o cheiro da água benta que Anselmo usava nas missas. Subo.' },
  ],
  6: [
    { speaker: ROO, text: 'O corredor tem portas trancadas com cera. Em cada selo, o mesmo símbolo do mestre.' },
    { speaker: ROO, text: 'Atrás de uma delas, ouço a voz de Belladona, calma, como quem já esperava por mim.' },
  ],
  7: [
    { speaker: ROO, text: 'Na antecâmara, os frascos brilham com um pó que cheira a farinha. Belladona tentou fazer pão com a Obra.' },
    { speaker: BELLADONA, text: 'Entre, cachorro. Quantas pessoas morreram de fome enquanto o mestre hesitava? Eu contei. Você sabe quantas? Anselmo guarda palavras em cofres enquanto o pão acaba.' },
    { speaker: BELLADONA, text: 'Minha mãe ardeu de febre três noites, à espera de um remédio que nenhum caldeirão deu. Foi aí que decidi não esperar mais.' },
  ],
  9: [
    { speaker: ROO, text: "Os livros estão presos por correntes finas, cada uma com o selo do mestre. Uma página escapa de uma delas e cai aos meus pés." },
    { speaker: ROO, text: "Não sei quem as prendeu, mas alguém cuidou delas: nenhuma está rasgada." },
  ],
  10: [
    { speaker: ROO, text: "Um copista deixou uma frase pela metade: \"a semente guardada no celeiro seco não apodrece\". Ninguém a riscou." },
    { speaker: ROO, text: "A lâmpada ainda está acesa. Sigo com cuidado, longe dos papéis." },
  ],
  11: [
    { speaker: ROO, text: "Entre as escrituras, uma página com a letra do mestre: \"quem reparte o pão não precisa de ouro\"." },
    { speaker: ROO, text: "Solto o último elo. Do salão do leão vem um ronco baixo, e a porta range." },
    { speaker: ROO, text: "Anselmo diria que quem dedica a vida a Jesus não guarda escrituras: reparte. Reparti-las é o que me resta fazer." },
  ],
  13: [
    { speaker: ROO, text: 'Subo ao Observatório pelo pátio. As lanternas andam sozinhas, de um lado a outro, e nenhuma me olha: vigiam um céu que já não está lá.' },
    { speaker: ROO, text: 'No chão, um astrolábio aponta para uma estrela que o mestre riscou num caderno. Fico um tempo parada, olhando para cima.' },
  ],
  14: [
    { speaker: ROO, text: 'Cada relógio daqui marca uma hora. O mestre dizia que o tempo da colheita não espera ninguém, e que por isso ninguém devia ter pressa.' },
    { speaker: ROO, text: 'Os autômatos de ronda param por um instante a cada volta. Aprendo o compasso deles e passo.' },
    { speaker: ROO, text: 'O mestre media o tempo das estrelas. Anselmo mede o das viúvas e dos órfãos: é mais curto e mais urgente.' },
  ],
  15: [
    { speaker: ROO, text: 'Na galeria, as estrelas estão desenhadas como manuscritos: cada constelação tem uma legenda numa letra que não decifro.' },
    { speaker: ROO, text: 'Uma coruja me observa do alto e não ataca quem apenas olha. Só avisa, num círculo, quem fica parado.' },
  ],
  17: [
    { speaker: ROO, text: 'Desço o vale com o frasco vazio. A estrada é a mesma da ida, mas agora sei o que o mestre temia.' },
    { speaker: ROO, text: 'Passo por viúvas com os filhos órfãos pela mão. Todos vão à mesma sopa. Eu também.' },
    { speaker: ROO, text: 'Não sei se volto para o Caldeirão ou se fico por aqui. Sigo, por enquanto.' },
  ],
  18: [
    { speaker: ROO, text: 'As flores de Belladona crescem até na beira do riacho. Não as toco.' },
    { speaker: ROO, text: 'Do outro lado da ponte, os muros do mosteiro já aparecem.' },
  ],
  19: [
    { speaker: ROO, text: 'O portão do mosteiro está à vista. À porta, famílias esperam a sopa. Anselmo deve estar do outro lado.' },
    { speaker: ROO, text: 'Ensaio o que vou dizer e percebo que não tenho nada a provar. Só levo o frasco.' },
  ],
};

// ---------------------------------------------------------------- o desfecho
// O que o jogo diz no fim (docs/12-historia.md, "O desfecho"): cada fio da história ganha uma resposta, mesmo quando a
// resposta é "ainda não". A fome, a febre, Belladona, o mestre e o que a Roo aprendeu.

// Belladona vem ao portão: não vence nem é vencida de novo, só chega. O trauma dela ganha o que fazer.
const BELLADONA_NO_PORTAO: StoryCard[] = [
  { speaker: ROO, text: 'Atrás das famílias, de capa verde e sem chapéu, Belladona espera com um frasco vazio na mão. Ela também veio.' },
  { speaker: BELLADONA, text: 'Vim ouvir. Não vim pedir perdão: não saberia como.' },
  { speaker: BELLADONA, text: 'Procurei a fórmula do pão enquanto minha mãe ardia de febre. Não era a fórmula que faltava. Era alguém sentado ao lado dela.' },
  { speaker: ANSELMO, text: 'Sempre quiseste dar pão aos pobres, e quiseste com verdade. Faltava dar a vida: sentar com a viúva, criar o órfão. Isso é seguir Jesus, e já o começaste sem saber.' },
  { speaker: ANSELMO, text: 'Há uma enfermaria neste mosteiro, cheia de viúvas e de órfãos da febre, e um alambique que ninguém sabe acender. Falta quem saiba destilar a febre.' },
  { speaker: BELLADONA, text: 'Eu sei destilar a febre.' },
  { speaker: ANSELMO, text: 'Então fica. Não te absolvo: não é o meu ofício. Mas há trabalho, e é de muitos.' },
  { speaker: ROO, text: 'Fui buscar quem eu era e voltei sabendo o que fazer com o que recebi. Não nasci para provar nada. Escolho, todos os dias, ficar ao lado de quem tem fome.' },
];

// A primavera seguinte: o que mudou no vale, sem milagre e sem pressa.
const EPILOGO: StoryCard[] = [
  { speaker: 'Na primavera seguinte', text: 'As escrituras já eram copiadas em três mosteiros e lidas em voz alta nas aldeias, à noite, à luz de vela. Entre elas, as palavras de um copista: a semente guardada no celeiro seco não apodrece. A semente foi repartida.' },
  { speaker: 'Na primavera seguinte', text: 'A fome não acabou num dia, e nenhuma poção a venceu. Mas os celeiros do vale se abriram um a um, o primeiro o do senhor que ouviu o frei. Na colheita seguinte o pão não sobrou. Deu para todos.' },
  { speaker: 'Na primavera seguinte', text: 'A febre recuou das casas da beira da charneca. A enfermaria acolheu as viúvas e os órfãos que ela deixou, e Belladona cuida deles como de família. Nem todos foram salvos. Os que se foram foram lembrados pelo nome, e Belladona escreveu o da mãe no primeiro frasco que destilou. Ela ainda conta os mortos. Agora conta também os alimentados.' },
  { speaker: 'Na primavera seguinte', text: 'Do mestre não houve notícia. Se voltar, encontrará a porta do Caldeirão aberta, uma vela na janela e a resposta que deixou escrita: não foi prova. Foi dádiva.' },
  { speaker: 'FIM DA JORNADA', text: 'Frei Anselmo volta ao scriptorium. Roo regressa ao Caldeirão, com o frasco vazio nas mãos.' },
];

export const ENDING_CARDS: StoryCard[] = [...CONFISSAO, ...BELLADONA_NO_PORTAO, ...FRASCO, ...EPILOGO];
