// O Livro de Roo (livro.html): a história contada como um manuscrito de alquimia copiado à luz de vela, em 12 aberturas.
// Cada abertura tem uma ilustração animada (à esquerda, desenhada em src/pages/livroScenes.ts) e o texto (à direita),
// com uma glosa à margem, como a que um copista deixaria. Puro e testado: o texto e a ordem moram aqui; o desenho e o
// comportamento, nas páginas. Fonte do roteiro: docs/12-historia.md e history.html.
//
// Regra de conteúdo (CLAUDE.md, "Respeito à fé"): o cristianismo entra com reverência e **sem citar versículos**: a
// mensagem é dita com as palavras da história, a de que seguir Jesus é dedicar a vida a Ele e servir os mais pobres, as
// viúvas e os órfãos. Nenhuma ilustração põe cruz em objeto, criatura ou ficha (só no mosteiro e no hábito de Anselmo).
import type { SecaoId } from './voynich';

/** As cenas animadas: uma por abertura (cada id tem um desenho em livroScenes.ts). */
export type CenaId =
  | 'capa' | 'fome' | 'laboratorio' | 'bolha' | 'belladona' | 'paes' | 'mosteiro' | 'jornada' | 'duelo' | 'ciclo' | 'retorno' | 'primavera' | 'frasco';

export interface Glosa {
  texto: string; // o que o copista anota à margem (nunca cita versículo: ver o cabeçalho)
}

export interface LivroPagina {
  id: string;
  folio: string; // "f. 1r": a numeração de um códice
  rubrica: string; // o subtítulo em latim, em vermelho, como nos manuscritos
  titulo: string;
  texto: readonly string[]; // parágrafos
  glosa: Glosa;
  legenda: string; // sob a gravura
  cena: CenaId;
  secao: SecaoId; // a seção do códice (decoração em voynichês, ver game/voynich.ts)
  faixa: string; // a música de fundo (audio/tracks.ts), se a pessoa ligar
}

export const LIVRO: readonly LivroPagina[] = [
  {
    id: 'capa', folio: 'f. 1r', rubrica: 'Incipit liber Rhoi', titulo: 'O Livro de Roo',
    texto: [
      'Este livro foi copiado à luz de vela por quem viu o que aqui se conta, num inverno em que o vale passava fome e a matéria ainda respondia a quem a soubesse ouvir.',
      'Conta de uma criatura nascida de uma bolha, de uma alquimista que tinha razão sobre a dor e errou no remédio, de um monge que guardava palavras e de um pão que só crescia quando era partido.',
      'Se o leres com pressa, não o entenderás. Lê-o como quem parte o pão: devagar, e repartindo.',
    ],
    glosa: { texto: 'O copista escreve em nome de Jesus, a quem dedicou a vida, e pede que este livro seja lido junto de quem tem fome.' },
    legenda: 'A bolha sobe da vela, e a serpente do ciclo a envolve: o fim que é começo.',
    cena: 'capa', secao: 'receitas', faixa: 'nocturno',
  },
  {
    id: 'fome', folio: 'f. 1v', rubrica: 'Anni macri', titulo: 'Os anos magros',
    texto: [
      'Há três anos o vale colhe pouco. O trigo apodreceu em pé na charneca, a febre deitou famílias inteiras, e o preço do pão passou a ser maior do que o povo tem.',
      'Nos celeiros trancados dos senhores há grão guardado para o inverno de quem pode pagar. Na porta do mosteiro de São Tomás, a fila da sopa começa antes de o sino tocar: as viúvas e os órfãos passam primeiro, por ordem de frei Anselmo, que dedicou a vida a Jesus e não sabe servi-Lo de outro modo. O caldeirão dos monges já não chega ao fim da fila.',
      'Foi nesse tempo que a fome deixou de ser uma notícia e passou a ter rosto, e quem a viu de perto nunca mais pôde fingir que a matéria era só matéria.',
    ],
    glosa: { texto: 'Na fila da sopa as viúvas esperam primeiro, e depois os órfãos. Ninguém lhes pergunta quem são: basta que tenham fome.' },
    legenda: 'O trigo seco inclina-se ao vento. Ao longe, uma única janela acesa.',
    cena: 'fome', secao: 'herbaria', faixa: 'ecos',
  },
  {
    id: 'laboratorio', folio: 'f. 2r', rubrica: 'Magister', titulo: 'O mestre',
    texto: [
      'No alto do vale vive um alquimista de capa escura e lanterna na mão. Já perdeu alguém que amava numa epidemia antiga, e desde então carrega uma pergunta que não larga: se a matéria se transforma, por que o que sofre não?',
      'Procura a pedra filosofal, mas não por ouro. Quer um remédio de tudo e um pão sem escassez. Ensina o que sabe a poucos: a medir o fogo, a ouvir a água, a respeitar a terra e a desconfiar do ar.',
      'Trabalha de madrugada, quando as velas já queimaram até o meio e o alambique borbulha sozinho. É um homem bom que confunde o poder de transformar a matéria com o de vencer os limites de quem ele ama.',
    ],
    glosa: { texto: 'O mestre sabia contar frascos e dias. Não contava os que dormiam sem comer a duas portas dali.' },
    legenda: 'O laboratório à luz de vela. O alambique canta; a sombra do mestre se debruça sobre o caderno.',
    cena: 'laboratorio', secao: 'farmaceutica', faixa: 'alambique',
  },
  {
    id: 'bolha', folio: 'f. 2v', rubrica: 'Nox bullae', titulo: 'A noite da bolha',
    texto: [
      'Numa madrugada de inverno, com as velas quase no fim, o mestre mistura o último pó de Prima Materia ao sabão de lixívia que serve para purificar os vidros e sopra por um tubo de vidro.',
      'Sobe uma bolha iridescente. Reflete o laboratório inteiro, o caldeirão, as velas, o rosto dele, e não estoura. Flutua devagar até uma capa pendurada num gancho, pousa na bolsa e se desfaz sem ruído, como quem suspira.',
      'Na bolsa respira uma criatura pequena, de orelhas caídas, que olha em volta com a calma de quem acabou de chegar. Ninguém soube explicar por que um cachorro. O mestre escreveu: a matéria responde ao que não sabemos pedir. E riscou.',
    ],
    glosa: { texto: 'Ninguém pediu para nascer. Quem recebe a vida de graça aprende a devolvê-la a quem não tem quem o receba.' },
    legenda: 'Roo, ainda bebê, dorme dentro da bolha iridescente, e as velas se refletem na película.',
    cena: 'bolha', secao: 'balneologica', faixa: 'nocturno',
  },
  {
    id: 'belladona', folio: 'f. 3r', rubrica: 'Domina Belladonna', titulo: 'Belladona',
    texto: [
      'Era a discípula do mestre e viu a noite da bolha. Cresceu numa aldeia que dependia de um senhor; na fome, o grão foi reservado a quem podia pagar. Perdeu o irmão pequeno para a fome e a mãe para a febre, e jurou nunca mais esperar.',
      'Concluiu, diante da bolha: se de um sopro e de sabão nasce quem respira, de um sopro e de sabão nasce pão. Quando o mestre sumiu, levou os cadernos, o laboratório, as gemas que fixavam as transformações e as escrituras do mosteiro, porque os cadernos diziam que ali estava a chave da multiplicação dos pães.',
      'Não é má. Tem razão sobre a dor, e é isso o que a torna perigosa: a fome não espera pela fé de ninguém. Erra no remédio. Quer fazer do pão uma receita, quando era um dom.',
    ],
    glosa: { texto: 'Belladona amava os pobres de verdade: era órfã, e viu a mãe arder de febre. O erro dela foi o remédio, não o amor.' },
    legenda: 'Belladona amassa a massa ao lado da bolha, e as chamas das velas tremem nos frascos.',
    cena: 'belladona', secao: 'herbaria', faixa: 'ecos',
  },
  {
    id: 'paes', folio: 'f. 3v', rubrica: 'Panis fractus', titulo: 'O pão partido',
    texto: [
      'Nos livros do mosteiro há uma cena que Belladona leu cem vezes. Uma multidão de cinco mil, num lugar deserto, ao cair da tarde. Os discípulos dizem: despede-os para que comprem comida. E a resposta: dai-lhes vós mesmos de comer.',
      'Havia cinco pães e dois peixes. Foram tomados, abençoados, partidos e entregues, e passaram de mão em mão, e todos comeram, e sobraram doze cestos. Belladona leu aí uma fórmula de multiplicação. Frei Anselmo leu um gesto.',
      'Ninguém ali multiplicou a matéria. Alguém repartiu o pouco que tinha, e o pouco, partido, deu para todos. Esta é a divergência que atravessa o livro inteiro: o pão não cresce por ser produzido; cresce por ser partido.',
    ],
    glosa: { texto: 'O pouco que um menino repartiu deu para todos. Quem segue Jesus aprende isto: parte o que tem, e não guarda para depois.' },
    legenda: 'Os pães passam de mão em mão, e a cesta nunca fica vazia enquanto alguém os reparte.',
    cena: 'paes', secao: 'receitas', faixa: 'jardim',
  },
  {
    id: 'mosteiro', folio: 'f. 4r', rubrica: 'Frater Anselmus', titulo: 'Frei Anselmo e o mosteiro',
    texto: [
      'No mosteiro de São Tomás, sobre a colina, vive o velho monge que foi confessor do mestre. Viu a obsessão crescer e não o deteve. Essa é a culpa que carrega junto com a lanterna.',
      'Sabe o que o mestre fez na noite da bolha. Disse-lhe que o que nasceu em suas mãos não era obra dele, era dádiva. O mestre chorou, assentiu e não acreditou. Anselmo não insistiu, e nunca se perdoou por isso.',
      'As escrituras do mosteiro estão guardadas em cofres, e Belladona as levou. Anselmo agora quer o contrário do que sempre fez: que circulem, que sejam copiadas e levadas às aldeias, porque tesouro escondido não serve a ninguém. Mas é velho, e não pode mais ir buscá-las.',
    ],
    glosa: { texto: 'Frei Anselmo dedicou a vida a Jesus. O que lhe sobrava, dava às viúvas e aos órfãos, e ainda achava pouco.' },
    legenda: 'As janelas do mosteiro acesas na noite. Um monge desce a colina com uma lanterna e uma carta.',
    cena: 'mosteiro', secao: 'herbaria', faixa: 'vesperas',
  },
  {
    id: 'jornada', folio: 'f. 4v', rubrica: 'Iter', titulo: 'A jornada',
    texto: [
      'A carta de Anselmo chega com um frasco vazio, lacrado. Há três invernos o mestre partiu sem dizer para onde, e a Roo come da sopa do mosteiro na mesma fila que todos. Belladona tomou o laboratório dela, e o pão custa mais do que o povo tem. Anselmo, que serve a Jesus servindo os pobres, as viúvas e os órfãos, pede as escrituras de volta, e promete, só a quem vier ouvi-lo, contar uma noite que a Roo não conhece: a dela.',
      'O caminho tem lugares. O Vale, de névoa baixa e poço de prata, onde a Roo aprende a medir o fogo e a ouvir a água. A Torre de Belladona, de fantasmas que são ecos. A Biblioteca Proibida, com seus livros acorrentados e o Leão Verde. O Observatório, de astrolábios e relógios, onde gira a serpente do ciclo.',
      'Em cada lugar a Roo aprende uma lição do mestre e a veste como forma: o fogo, a água, a terra, o ar. E em cada lugar descobre que o poder de transformar só serve quando orientado pelo amor ao próximo.',
    ],
    glosa: { texto: 'Nenhum lugar do caminho foi vencido pela força. Cada um foi atravessado por alguém que parou para ajudar.' },
    legenda: 'A Roo atravessa o mapa: o Vale, a Torre, a Biblioteca, o Observatório. Cada lugar acende uma luz.',
    cena: 'jornada', secao: 'astronomica', faixa: 'alambique',
  },
  {
    id: 'duelo', folio: 'f. 5r', rubrica: 'Certamen', titulo: 'O duelo na Torre',
    texto: [
      'No alto da Torre, Belladona espera sem pressa, como quem já sabia. Fala antes de lançar a primeira poção: quantas pessoas morreram de fome enquanto o mestre hesitava? Eu contei. Você sabe quantas? Anselmo guarda palavras em cofres enquanto o pão acaba.',
      'A Roo não responde com ódio. Esquiva, lança, aprende a ler os avisos que ela deixa no chão. Cada golpe dela é uma pergunta, e a Roo não tem a resposta pronta, só a vontade de dá-la ao lado dela.',
      'Quando Belladona cai, não cai por derrota. Cai por cansaço. Diz: você venceu, mas me diga, Roo, quem alimenta a aldeia amanhã? E entrega o pergaminho. Não precisa que a Roo concorde. Precisa que alguém responda. Depois, baixinho: minha mãe ardeu três noites e eu contei cada uma; a fórmula era tudo o que eu tinha, e agora não sei o que faço.',
    ],
    glosa: { texto: 'Belladona perdeu a luta, mas não perdeu o amor pelos pobres. Faltava-lhe um lugar onde pô-lo.' },
    legenda: 'Belladona e a Roo se enfrentam no alto da Torre; as poções desenham arcos de luz.',
    cena: 'duelo', secao: 'farmaceutica', faixa: 'duelo',
  },
  {
    id: 'ciclo', folio: 'f. 5v', rubrica: 'Circulus', titulo: 'O Observatório e o ciclo',
    texto: [
      'No alto do vale há uma torre de astrolábios, e nela o mestre olhava o céu para saber quando semear. Os relógios de cobre contam horas diferentes na mesma parede. Os autômatos de ronda param um instante a cada volta, como quem confere o tempo.',
      'Sob a cúpula aberta ao céu inteiro uma serpente de escamas verdes morde a própria cauda e gira. Não guarda nada: gira. A fraqueza dela passa do fogo à terra, da terra à água, da água ao ar, e é preciso esperar a roda para bater na hora certa.',
      'O Ouroboros ensina o que a Roo ainda não sabia: que há um tempo para cada coisa, que o que acaba aqui começa de novo em outro lugar. Procura no céu a estrela do caderno do mestre e não a encontra. Sob o astrolábio, porém, acha a última página dele: procurei a pedra a vida inteira; na noite da bolha tive nas mãos o que procurava e quis provar que era meu. Se eu não voltar, diga-lhe: não foi prova, foi dádiva.',
    ],
    glosa: { texto: 'O que acaba aqui começa em outro lugar: a fome dos órfãos de hoje é o dever de quem come amanhã.' },
    legenda: 'A serpente do ciclo gira sob a cúpula, e as estrelas mudam de lugar.',
    cena: 'ciclo', secao: 'astronomica', faixa: 'duelo',
  },
  {
    id: 'retorno', folio: 'f. 6r', rubrica: 'Reditus', titulo: 'O Retorno',
    texto: [
      'No jardim do mosteiro, entre sebes e canteiros, a Roo chega ao portão, e o velho monge, pela primeira vez, deixa de ser quem pede e passa a ser quem confessa. Conta que foi confessor do mestre, que viu a obsessão crescer e não o deteve, e como o mestre chorou na noite da bolha e como ele não insistiu. Não pede perdão. Pede que a Roo não repita: quando alguém procurar sem saber o que procura, fica ao lado dessa pessoa.',
      'Atrás das famílias, de capa verde e sem chapéu, espera Belladona, com um frasco vazio na mão. Veio ouvir, não pedir perdão: não saberia como. Procurou a fórmula do pão enquanto a mãe ardia de febre, e entendeu tarde que não era a fórmula que faltava, era alguém sentado ao lado. Anselmo não a absolve, que não é o ofício dele. Diz que há uma enfermaria cheia de viúvas e de órfãos da febre e um alambique que ninguém sabe acender. Ela responde: eu sei destilar a febre. Então fica.',
      'As escrituras não voltam ao cofre. Anselmo vai mandá-las copiar e levar às aldeias, porque tesouro escondido não serve a ninguém; serve o pão partido. Toma o pão, parte-o à porta e o entrega, de mão em mão. E devolve o frasco vazio. A Roo diz o que aprendeu: não nasceu para provar nada, e escolhe, todos os dias, ficar ao lado de quem tem fome.',
    ],
    glosa: { texto: 'O monge não absolveu Belladona: pôs-lhe uma colher na mão e um doente diante dela. Seguir Jesus é isto, ter as mãos ocupadas em servir.' },
    legenda: 'À porta do mosteiro, o pão é partido e passa de mão em mão. Belladona, ao fundo, ouve.',
    cena: 'retorno', secao: 'receitas', faixa: 'vesperas',
  },
  {
    id: 'primavera', folio: 'f. 6v', rubrica: 'Ver novum', titulo: 'A primavera',
    texto: [
      'As escrituras já são copiadas em três mosteiros e lidas em voz alta nas aldeias, à noite, à luz de vela. Entre elas, as palavras de um copista: a semente guardada no celeiro seco não apodrece. A semente é repartida.',
      'A fome não acabou num dia, e nenhuma poção a venceu. Mas os celeiros do vale se abriram um a um, o primeiro o do senhor que ouviu o frei, e na colheita seguinte o pão não sobrou: deu para todos. A febre recuou das casas da beira da charneca, e a enfermaria acolheu as viúvas e os órfãos que ela deixou, cuidados por Belladona como família. Nem todos foram salvos. Os que se foram foram lembrados pelo nome, e Belladona escreveu o da mãe no primeiro frasco que destilou. Ainda conta os mortos; agora conta também os alimentados.',
      'Do mestre não houve notícia. Se voltar, encontrará a porta do Caldeirão aberta, uma vela na janela e a página que deixou sob o astrolábio: não foi prova, foi dádiva. E o Caldeirão, que nunca tinha feito pão, ferveu sopa pela primeira vez, mexido por muitas mãos.',
    ],
    glosa: { texto: 'A enfermaria encheu-se de viúvas e de órfãos da febre, e Belladona cuidou deles como quem cuida da mãe que perdeu.' },
    legenda: 'O Caldeirão ferve sopa, e muitas mãos o mexem. Na janela, uma vela para o mestre.',
    cena: 'primavera', secao: 'herbaria', faixa: 'jardim',
  },
  {
    id: 'frasco', folio: 'f. 7r', rubrica: 'Vas vacuum', titulo: 'O frasco vazio',
    texto: [
      'À noite, a Roo volta ao Caldeirão, que está morno, com as velas acesas. Pousa o frasco vazio sobre a mesa. Ele não pede nada.',
      'Para Belladona, o frasco era um recipiente a encher com poder suficiente para resolver tudo. Para o mestre, a promessa de que um dia existiria a solução perfeita. Para a Roo, agora, é o lembrete de que nem tudo precisa ser possuído ou controlado. O frasco vazio é uma disposição de receber, e de dar. A Roo vê, enfim, o que o mosteiro sempre disse: o verdadeiro evangelho não é saber mais, é dedicar a vida a Jesus e servir os mais pobres, as viúvas e os órfãos, como Belladona agora faz.',
      'Lá fora, em algum lugar, as escrituras estão sendo copiadas. Por enquanto, basta mexer a poção, devagar. E do caldeirão sobe uma única bolha iridescente, sem que ninguém a tenha soprado. A pergunta com que a carta começou volta, sem resposta, a quem lê: o que você vai fazer com o que encontrou?',
    ],
    glosa: { texto: 'Dedicar a vida a Jesus e servir os mais pobres, as viúvas e os órfãos: foi isto o que o copista aprendeu, e o que quis deixar escrito.' },
    legenda: 'O frasco vazio sobre a mesa, e uma bolha que sobe do caldeirão à luz das velas.',
    cena: 'frasco', secao: 'balneologica', faixa: 'vesperas',
  },
];

/** O índice de uma abertura pelo id (para o endereço #bolha), ou 0 se não existir. */
export function indiceDe(id: string): number {
  const i = LIVRO.findIndex(p => p.id === id);
  return i < 0 ? 0 : i;
}

/** Quantas palavras tem o texto de uma abertura (para conferir que nenhuma fica longa demais para a página). */
export function palavras(p: LivroPagina): number {
  return p.texto.join(' ').split(/\s+/).filter(Boolean).length;
}
