// Textos da história (PT-BR). Fonte: docs/12-historia.md.
// Cada cartão é uma fala; quem fala é o nome mostrado no alto. O retrato só vale para o Anselmo.

export const ANSELMO = 'Frei Anselmo';

export interface StoryCard { speaker: string; text: string }

// Jardim do mosteiro, ao pé do portão: a confissão e o frasco vazio.
export const ENDING_CARDS: StoryCard[] = [
  { speaker: ANSELMO, text: 'Voltaste, Roo. E trouxeste o que restou. Basta: o que restou é o que ainda se pode ler.' },
  { speaker: ANSELMO, text: 'Não vou guardá-las de novo. Vou mandar copiá-las muitas vezes e levá-las às aldeias de Vale. Tesouro escondido não serve a ninguém: serve o pão partido.' },
  { speaker: ANSELMO, text: 'E devo confessar uma coisa. Fui confessor do teu mestre. Vi que ele se perdia atrás da pedra filosofal e não o detive. Achei que era só ciência. A culpa é minha.' },
  { speaker: ANSELMO, text: 'Não te peço perdão. Peço que não repitas. Quando alguém procurar sem saber o que procura, fica ao lado dessa pessoa.' },
  { speaker: ANSELMO, text: 'Leva o frasco de volta. Ele nunca foi feito para encher. Nem tudo se enche, Roo. O que farás com ele?' },
  { speaker: 'FIM DA JORNADA', text: 'Frei Anselmo volta ao scriptorium. Roo regressa ao Caldeirão, com o frasco vazio nas mãos.' },
];

// Derrota da Belladona: ela se despede antes de a Roo seguir para o jardim.
export const BELLADONA = 'Belladona';
export const BELLADONA_CARDS: StoryCard[] = [
  { speaker: BELLADONA, text: 'Então é assim que termina. Eu só queria que as palavras servissem para alguma coisa.' },
  { speaker: BELLADONA, text: 'Ele me disse que estava tudo escrito. Eu quis ler o que faltava. Foi isso, Roo: só isso.' },
  { speaker: BELLADONA, text: 'Leve o pergaminho, então. Leia melhor do que eu li.' },
];

// Cena final no Caldeirão: uma linha por vez, devagar. A última é o título da tela de fim.
export const CAULDRON_LINES: string[] = [
  'O Caldeirão estava como Roo o deixou: morno, em silêncio.',
  'Pousou o frasco vazio sobre a mesa. Ele não pedia nada.',
  'Lá fora, em algum lugar, as escrituras já eram copiadas.',
  'Por enquanto, bastava mexer a poção, devagar.',
];
