# Mundo

Cada personagem e item tem uma ficha curta: o que é, o que faz e um detalhe que o torna único.

## Personagens

**Roo, o bruxo-cachorro** (jogador)
- *Quer:* devolver as escrituras a frei Anselmo e descobrir o que aconteceu com o mestre, vencendo os guardiões do caminho.
- *Sabe fazer:* colocar poções e explodir as de Ar de longe. Com a tecla T vira a forma da poção na mão: **Roo Fire**, **Roo Água**, **Roo Terra** ou **Roo Ar**, cada uma com habilidade (X), segunda habilidade (C) e defesa (V); as formas são lições do mestre, aprendidas na jornada. Cada forma dura 20 s; o detalhe está em `18-transformacoes.md`.
- *Detalhe:* manto roxo com barra dourada, chapéu e varinha. Parada, ele cochila.
- *Vida e dano:* barra de 24 pontos. **Fraca ao fogo** (as próprias poções machucam mais: 6), **resiste à água** (2); terra e ar, 4.
- *Frase:* "Mais uma poção e a porta é minha."

**Belladona, a alquimista rival** (chefe do duelo na Torre, fase 8)
- *Quer:* o laboratório e as gemas só para ela. No fim da história passa a cuidar dos pobres, das viúvas e dos órfãos (`12-historia.md`).
- *Sabe fazer:* arremessar poções, fazer chover gotas e sumir em névoa.
- *Detalhe:* roupa verde-escura com detalhes verde-limão, sem chapéu: cabelo carmim preso bem alto, com uma diadema de beladona (três bagas roxas, folhas verde-limão e uma flor-sino magenta), olhos verde-limão.
- *Vida:* 20 (fogo e ar são a fraqueza; ver `10-equilibrio.md`). *Frase:* "Essas poções são minhas, cachorro!"

### Habilidades da Belladona

Toda habilidade mostra um aviso no chão por 1,2 s antes de acontecer.

| Habilidade | O que ela faz | Aviso | Quando usa |
|---|---|---|---|
| Arremesso de Fogo | joga uma poção na casa onde você está; explode em cruz de 1 casa | quadrados vermelhos e anel que encolhe | sempre (furiosa: joga duas seguidas) |
| Chuva de Gotas | 4 gotas de água caem ao seu redor; a primeira, na sua casa | quadrado azul em cada gota | só furiosa |
| Salto de Névoa | some por 0,7 s (protegida) e reaparece longe de você | fumaça e brilho | sempre |

- **Fúria:** com 10 de vida ou menos (50%), o intervalo entre habilidades cai de 3,4 s para 2,3 s.
- **Ponto fraco:** só tira vida dela uma explosão de poção sua que a alcance; depois do golpe ela fica protegida 1,4 s.
- **Contato:** encostar nela tira 1 de vida.

**Frei Anselmo, o monge** (aparece na carta, no portão do jardim e na confissão final)
- *Quer:* que as escrituras voltem e circulem entre o povo, e que Roo não as trate como pedra.
- *Sabe fazer:* escrever cartas, guardar o scriptorium do Mosteiro de São Tomás.
- *Detalhe:* hábito marrom com capuz abaixado, tonsura, barba branca, cruz de madeira e cordão com nós. Foi confessor do mestre de Roo e não o deteve.
- *Frase:* "Roo, filho do Caldeirão: preciso que busques o que eu não posso mais buscar."

**O mestre de Roo** (desaparecido, só como sombra ou silhueta)
- *Quer:* a pedra filosofal, que nunca encontrou.
- *Detalhe:* sumiu na última busca. Nas fases 2 e 4 aparece só como eco ou sombra.

## Poções (as bombas)

| Nome | Elemento | Formato | Alcance | Fusível | Papel |
|---|---|---|---|---|---|
| Poção de Fogo | fogo | balão redondo | 2 | 2,0 s | rápida e confiável (desde o começo) |
| Poção de Água | água | tubo alto | 3 | 2,4 s | alcance maior, mas lenta (aprendida no fim da fase 1) |
| Poção de Terra | terra | pote com cristais | 2 | 2,2 s | atravessa caixotes (fim da fase 3) |
| Poção de Ar | ar | losango com névoa | 2 | você decide (D) | controle total (fim da fase 4) |

Cada elemento tem seu efeito na explosão (brasas, gotas, pedriscos ou brilhos) e seu som.
Veja `10-equilibrio.md` para os motivos desses números.

### Reações entre poções

| Quando a explosão de... | alcança uma poção de... | acontece |
|---|---|---|
| fogo | fogo, água ou ar | ela explode junto (corrente) |
| fogo | terra | nada: a Poção de Terra é imune |
| água | fogo | a poção se desfaz em vapor, sem explodir ("APAGADA") |
| água, terra ou ar | qualquer outra | nada |

A explosão de água que apaga uma poção de fogo continua machucando quem estiver no caminho.

## Os blocos de cada fase

Cada fase da campanha tem um bloco destrutível próprio (`game/stages/blockStyles.ts`): O Chamado, caixote de madeira; O Caminho, bloco de sal; A Névoa, caixote com musgo; O Poço, barril de azougue; A Escadaria, laje de pedra; O Corredor, caixote lacrado com cera; A Antecâmara, caixa de frascos; O Duelo, pilha de pergaminhos; A Estrada, fardo de feno; A Ponte, pilha de pedras; Os Muros, bloco de tijolos; O Jardim, canteiro de flores. A pilha de livros acorrentados espera a Biblioteca (por ora só na Arena do Leão Verde). Só muda o desenho: as regras são as mesmas.

## Itens que caem dos caixotes

| Item | Efeito | Limite |
|---|---|---|
| Baú | guarda um item (coração ou power-up), conforme a fase; não cura sozinho (não há ouro) | |
| Coração | +4 de vida (um golpe neutro) | até 24 de vida |
| Gema | conta para abrir a porta | 3 por fase |
| +Frasco | +1 poção ao mesmo tempo, **só da poção do elemento do item** | até 5 por poção |
| +Raio | explosões mais longas, **só da poção do elemento do item** | 3 níveis por poção |
| +Velocidade | a Roo anda mais rápido | 2 níveis |
| +Tempo | +15 segundos | |

As gemas são escolhidas no começo de cada fase com porta então a porta sempre pode ser aberta. Nas fases de chefe não há gemas nem porta.

## Inimigos

Os três abaixo são os clássicos; os outros oito (Lanterna viva, Relógio de cobre, Toupeira de sal, Gosma de mercúrio, Sentinela de cera, Ratinho do celeiro, Salamandra do caldeirão e Coruja do scriptorium) estão em `19-criaturas.md`. Vida, fraqueza e imunidade de todos ficam em `src/game/entities/profiles.ts`.

**Sapo mago** (Vale e jardim)
- *Faz:* anda sem rumo, com pulinhos, e tira 1 de vida ao encostar. Morre com uma explosão.
- *Detalhe:* no laboratório aparecem mais conforme você quebra caixotes (2 no início, até 5); a contagem muda por fase (`stages/chapters/`).
- *Limite:* não persegue.

**Fantasma** (Salão dos Ecos, Névoa e Torre)
- *Faz:* flutua sem rumo (um passo a cada 1,5 s), **atravessa muralhas, caixotes e poções** e tira 1 de vida ao encostar. Morre sem deixar nada.
- *Detalhe:* dentro de uma muralha fica meio transparente e a explosão não o alcança. Começam 2, até 4 (mais um a cada 10 caixotes).
- *Limite:* não persegue nem sai da sala.
- *Imune:* só a terra. Água, fogo e ar o derrotam. Também aparece na Torre da Belladona (2 no início, até 3).

**Flor do mal** (jardim)
- *Faz:* fica fixa e **bloqueia a casa**. A cada 3,2 s mostra um aviso rosa nas 4 casas ao redor e, 0,8 s depois, chicoteia quem estiver ali (1 de vida).
- *Detalhe:* é **imune à Poção de Água**. Fogo, terra e ar a derrotam. Começam 5 no jardim.
- *Limite:* não se mexe e não se multiplica.

## Lugares

- **Os cinco capítulos:** Vale (fases 1 a 4), Torre (5 a 8), Biblioteca Proibida (9 a 12), Observatório (13 a 16) e Retorno (17 a 20); cada fase tem lugar, gravura e bloco próprios (`game/stages/chapters/`).
- **Laboratório (fase 1):** a grade de 15 por 13 casas. As muralhas de pedra não quebram.
- **Arena de Treino:** fora da campanha; um campo de chefe com o chão e o bloco da casa de cada um (ver `02-como-se-joga.md`).
- **Poço de Prata (fase 4, chefe do Vale):** campo mais aberto (menos caixotes), onde a Quimera de Mercúrio espera.
- **Salão dos fantasmas (fase 2):** o mesmo tamanho, em pedra azulada e fria.
- **Arena do duelo (fase 8, Torre de Belladona):** menos caixotes (a arena é mais aberta).
- **Jardim do mosteiro (fase 20):** fora do castelo. Grama, sebes no lugar das muralhas, canteiros de flores no lugar dos caixotes e um portão no lugar da porta.
- **Sala de Música:** a tela onde a Roo de maestro (casaca e cabelo de Beethoven) deixa escolher a música.
- **Menu:** o laboratório à luz de vela. A Roo lê um livro (a página vira de tempos em tempos), há uma estante de livros e um alambique funcionando (chama, bolhas, vapor e gotas caindo no frasco coletor). Foi trocado pelo caldeirão com a Roo mexendo a poção porque aquela cena, com camadas redesenhadas a cada quadro, deixava a tela inicial lenta; esta desenha o cenário uma vez e só anima poucos objetos.


## Leão Verde (chefe da Biblioteca Proibida, fase 12; também na Arena)

**Leão Verde, o solvente universal** (28 de vida)
- *Poder:* terra (o sal que ele já dissolveu). A **terra** não o toca (**imune**); o **ar**, a quintessência que nada dissolve, o fere muito (6); a **água** o dilui (resiste, 2); o fogo é neutro (4).
- *Bote:* some e salta sobre a sua casa, com um abalo em cruz. Depois fica **exposto** por 2,2 s e leva +2 de dano.
- *Dissolver:* um ácido verde corre pela linha da sua casa (furioso, também pela coluna) e **dissolve as suas poções** que estiverem no caminho.
- *Rugido (fúria):* atinge quase o campo todo; as casas verdes são seguras.
- *História:* nos manuscritos alquímicos o Leão Verde aparece devorando o sol, porque dissolve até o ouro. Guarda a Biblioteca Proibida: é o chefe da última fase do capítulo, e também está na Arena.

## Quimera de Mercúrio (chefe do Vale)

**Quimera de Mercúrio, prata derramada do mestre** (24 de vida)
- *Poder:* água (mercúrio). A água escorre por ela: **imune**. A **terra** é a fraqueza (6 de dano); fogo e ar machucam normal (4).
- *Cuspe:* jato de prata em linha reta que passa pela sua casa (furiosa: dois jatos em cruz).
- *Gotas:* gotas de prata caem uma depois da outra, a primeira na sua casa (3; furiosa, 5).
- *Escorrer:* vira poça (protegida), escorre e ressurge perto de você com um respingo em cruz.
- *Onda (furiosa):* faixas de 2 colunas varrem o campo; a linha verde fica seca e sempre há uma ao seu alcance.
- *Sem gemas nem porta:* ao cair, ela se despede e a Roo segue para a Torre.

## Ouroboros (chefe do Observatório)

**Ouroboros, a serpente do ciclo** (40 de vida)
- *Poder:* ar. A fraqueza **gira pelos quatro elementos** (ciclo de 9 s; regra em `bosses/ouroboros/rules.ts`): a Roo acerta com a poção da vez.
- *Ataques:* anéis, mordida e o Ciclo. Intervalo de 3,2 s entre ataques (2,1 s na fúria). O elemento oposto no ciclo é devorado: não causa dano e ainda o cura em 1. Ao cair, despede-se e a Roo segue para o Retorno.

## Mandrágora (chefe do jardim, fase 20)

**Mandrágora, a feiticeira do jardim** (28 de vida)
- *Aparência:* uma raiz de mandrágora viva, como na lenda (a raiz com forma de gente, que grita quando é arrancada): figura baixa e larga, cabeça e corpo num bulbo só, cor de raiz clara, coroa de folhas no topo, pernas de raiz bifurcadas e uma boca grande (o grito). Não usa chapéu nem manto, para não se confundir com a Belladona (alta, de vestido e cabelo preso com diadema).
- *Poder:* terra e água. Resiste às duas (dano baixo, sem cura). O **fogo** é a fraqueza (dano alto); o ar machuca normal.
- *Raízes:* raízes de terra sobem na linha e na coluna em que você está (na fase 2, em cruz).
- *Maré:* anéis de água se expandem a partir dela, um depois do outro. Uma faixa fica seca: é o caminho seguro.
- *Cavar:* some no chão e ressurge onde você estava, com um abalo. Depois fica **exposta** por cerca de 2,4 s e leva +2 de dano.
- *Grito (fase 2):* quase o mapa todo é atingido; as casas verdes são seguras.
- *Brotos (fase 2):* faz nascer até 3 flores do mal.
- *Sem gemas:* o portão do jardim abre quando ela cai.
