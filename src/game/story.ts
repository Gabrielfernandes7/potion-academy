// Textos da história (PT-BR). Fonte: docs/12-historia.md.
// Cada cartão é uma fala; quem fala é o nome mostrado no alto. O retrato só vale para o Anselmo.

export const ANSELMO = 'Frei Anselmo';

export interface StoryCard { speaker: string; text: string }

// Jardim do mosteiro, ao pé do portão: a confissão e o frasco vazio.
export const ENDING_CARDS: StoryCard[] = [
  { speaker: ANSELMO, text: 'Voltaste, Roo. E trouxeste o que restou. Basta: o que restou é o que ainda se pode ler.' },
  { speaker: ANSELMO, text: 'Não vou guardá-las de novo. Vou mandar copiá-las muitas vezes e levá-las às aldeias de Vale. Tesouro escondido não serve a ninguém: serve o pão partido.' },
  { speaker: ANSELMO, text: 'E devo confessar uma coisa. Fui confessor do teu mestre. Vi que ele se perdia atrás da pedra filosofal e não o detive. Na noite da bolha, ele me contou o que fez. Eu lhe disse que o que nasceu em suas mãos não era obra dele, era dádiva. Ele chorou. Não acreditou, e eu não insisti. A culpa é minha.' },
  { speaker: ANSELMO, text: 'Não te peço perdão. Peço que não repitas. Quando alguém procurar sem saber o que procura, fica ao lado dessa pessoa.' },
  { speaker: ANSELMO, text: 'Leva o frasco de volta. Ele nunca foi feito para encher. Nem tudo se enche, Roo. O que farás com ele?' },
  { speaker: 'FIM DA JORNADA', text: 'Frei Anselmo volta ao scriptorium. Roo regressa ao Caldeirão, com o frasco vazio nas mãos.' },
];

// Derrota da Belladona: ela se despede antes de a Roo seguir para o jardim.
export const BELLADONA = 'Belladona';
export const BELLADONA_CARDS: StoryCard[] = [
  { speaker: BELLADONA, text: 'Você venceu. Mas me diga, Roo: quem alimenta a aldeia amanhã?' },
  { speaker: BELLADONA, text: 'Não preciso que concorde. Preciso que alguém responda. Ele guardava palavras em cofres enquanto o pão acabava; eu só quis que servissem para alguma coisa.' },
  { speaker: BELLADONA, text: 'Leve o pergaminho. Leia melhor do que eu li.' },
];

// Derrota da Quimera: a prata do mestre se despede antes de a Roo seguir para a Torre.
export const CHIMERA = 'Quimera';
export const CHIMERA_CARDS: StoryCard[] = [
  { speaker: CHIMERA, text: 'Eu era o que o mestre derramou quando não soube mais o que guardar: prata sem forma, sem dono.' },
  { speaker: CHIMERA, text: 'Você me prendeu com terra, não com ódio. Poucos sabem a diferença.' },
  { speaker: CHIMERA, text: 'Siga. A torre fica depois da charneca. Lá, quem lê demais espera por você.' },
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
  'Lá fora, em algum lugar, as escrituras já eram copiadas.',
  'Por enquanto, bastava mexer a poção, devagar.',
];

// Passagens: o que a Roo lê, ouve e entende ao vencer cada fase (chave = fase vencida).
// Antes da próxima fase, sem pausa de jogo além da conversa. Narração da Roo em primeira pessoa.
export const ROO = 'Roo';
export const MESTRE = 'O mestre';

export const PASSAGE_CARDS: Record<number, StoryCard[]> = {
  1: [
    { speaker: ROO, text: 'Ao sair do laboratório, encontro no chão uma página rasgada. A letra é do mestre, a mesma das minhas lições.' },
    { speaker: ROO, text: 'Ele escreveu "a terra é de quem a cultiva", riscou e escreveu de novo. Nunca o vi hesitar diante de uma fórmula.' },
  ],
  2: [
    { speaker: MESTRE, text: '...hoje a bolha não estourou. Dentro dela, algo respira. Diga ao Anselmo que eu...' },
    { speaker: ROO, text: 'A voz se perde entre as colunas. Dizem que nasci de uma bolha; sempre achei fábula de ninar. Por que o mestre guardaria esta página?' },
    { speaker: BELLADONA, text: 'Você chegou até aqui, e ele também chegou, uma vez. Depois pediu que eu parasse de ler. Eu não parei.' },
  ],
  3: [
    { speaker: ROO, text: 'A névoa se abre devagar. Atrás de mim, a charneca desaparece como se nunca tivesse existido.' },
    { speaker: ROO, text: 'No chão, uma poça de prata respira. Ao redor, a pedra tem a letra do mestre gravada. Chego mais perto.' },
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
    { speaker: BELLADONA, text: 'Entre, canguru. Quantas pessoas morreram de fome enquanto o mestre hesitava? Eu contei. Você sabe quantas? Anselmo guarda palavras em cofres enquanto o pão acaba.' },
  ],
  9: [
    { speaker: ROO, text: 'Desço o vale com o frasco vazio. A estrada é a mesma da ida, mas agora sei o que o mestre temia.' },
    { speaker: ROO, text: 'Não sei se volto para o Caldeirão ou se fico por aqui. Sigo, por enquanto.' },
  ],
  10: [
    { speaker: ROO, text: 'As flores de Belladona crescem até na beira do riacho. Não as toco.' },
    { speaker: ROO, text: 'Do outro lado da ponte, os muros do mosteiro já aparecem.' },
  ],
  11: [
    { speaker: ROO, text: 'O portão do mosteiro está à vista. À porta, famílias esperam a sopa. Anselmo deve estar do outro lado.' },
    { speaker: ROO, text: 'Ensaio o que vou dizer e percebo que não tenho nada a provar. Só levo o frasco.' },
  ],
};
