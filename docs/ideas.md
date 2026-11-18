# Ideias para Potion Academy (só o que falta)

> A direção da história (fome, Belladona com razão, Roo nascida de uma bolha, o evangelho vivido como serviço aos pobres, às viúvas e aos órfãos) já foi decidida: veja `12-historia.md`, `/history.html` e `/livro.html`.
>
> Documento de trabalho. Nada aqui é regra ainda: cada escolha, ao ser aprovada, vai para `06-decisoes.md`. **Podado em 2026-11-15:** saíram as ideias que já estão no jogo (lista abaixo), para este arquivo mostrar só o que resta.

## Já feito (não precisa voltar a este arquivo)

- **Enxofre, Mercúrio e Sal** como atributos das poções (`game/entities/profiles.ts`, ícones em `ui/elementIcons.ts`), com o Ar como quintessência.
- **As quatro operações da alquimia** como as quatro formas da Roo (Fogo, Água, Terra, Ar), cada uma com lição, habilidade e segunda habilidade, e a defesa V de cada forma.
- **Criaturas simbólicas:** Salamandra, Leão Verde (chefe do Salão dos Acorrentados), Ouroboros (chefe do Observatório) e a Gosma de mercúrio. A serpente que devora a cauda é também o ciclo das fraquezas.
- **Frasco Hermético**, em parte: a Poção de Ar explode quando a Roo quer. **Passo de Chama** (Salto de vento) e **Anel de Brasas** (Escudo de brasas) existem nas formas de ar e fogo; a **Fusão com a Aqua** em parte (a Poça apaga as brasas).
- **Blocos de cada capítulo** (`game/stages/blockStyles.ts`), **névoa** como variação de fase e **Bolha protetora** da Roo.
- **Segunda forma por elemento** e **Manuscrito do Alquimista** (uma carta por personagem, com o Voynich) no lugar do Diário.
- **A história no jogo:** a Roo parte por um motivo, Belladona e o mestre têm desfecho, o livro animado conta tudo, e cada fase abre com uma gravura do livro.

## O que falta, em ordem de recomendação

1. **Reações no chão** (lama, vapor, cristais de sal). As zonas que as formas já criam (brasas, poça, muro de sal, vento) passam a reagir entre si e com as explosões. Fogo sobre a poça faz vapor (esconde quem está dentro); terra sobre a poça faz lama (todos andam devagar, a Roo também); a explosão de ar espalha o vapor. Reaproveita `EmberField`, `PuddleField` e `SaltWallField`. Custo médio.

   | Reação | Efeito na arena |
   |---|---|
   | Fogo + Água (poça) | Vapor que bloqueia a visão |
   | Terra + Água (poça) | Lama que reduz a velocidade |
   | Terra + Água | Cristais de sal que crescem no chão |
   | Ar + Fogo | Chamas que atravessam obstáculos específicos |

   As reações têm de ser previsíveis para a pessoa aprender a usá-las. **Fora de alcance** (o jogo não tem gás, eletricidade nem gelo): Fogo + Gás, Água + Eletricidade, Fogo + Gelo.
2. **Grimório de reações.** A primeira vez que cada reação acontece, abre-se no Manuscrito uma anotação do mestre à margem (o caderno dele). Liga a mecânica à história. Custo médio-baixo; depende de (1).
3. **Prima Materia como escolha.** Um item raríssimo (o Ouroboros o deixa) que a Roo pode **entregar a Anselmo** no fim, em vez de usar. É o fecho moral (o conhecimento que se reparte, como o pão). Custo baixo. Combina com a **Pedra Filosofal**, que transmuta uma essência comum em rara.

## Guardadas (sem decisão)

**Sistemas grandes (mudam a identidade do jogo):**
- **Laboratório persistente:** progressão entre partidas.
- **Ingredientes com propriedades ocultas:** a pessoa descobre receitas por experimento (a Roo acha um ingrediente, mistura, a reação vira receita no Grimório). Ex.: a Poção da Tempestade, que descarrega pelas casas molhadas (precisa de eletricidade, que o jogo não tem).
- **Alambique e Athanor:** estações de transformação (separar uma poção em essências; manter calor constante). Sobrepõem-se ao Caldeirão.
- **Solve et Coagula:** desmontar uma poção em essências ou fundir duas.
- **Homúnculo / familiar** (coleta, revela, ajuda em combate; não persegue) e a **Fênix** (um familiar que renasce uma vez). Dependem do Boticário (versão 2).
- **Dragão alquímico:** guarda ingredientes raros ou protege uma receita.

**As quatro etapas da Obra** (Nigredo, Albedo, Citrinitas, Rubedo) como subtítulo dos atos. Hoje só aparecem como cor e tom. Se virarem regra: Albedo limpa efeitos negativos.

**Chefes do Vale (não escolhidos):**
- **Gólem de Caixotes:** cada caixote quebrado vira um pedaço dele. Fraco ao fogo.
- **Homúnculo de Sal:** fraco à água (sal se dissolve), resiste à terra.
- **Basilisco de Vidro:** petrifica pelo olhar; fraco à água (reflete) e ao ar.
- **Mercenário-alquimista contratado por Belladona:** rival humano que joga poções como a Roo.
- **Espectro do Brejo:** some na névoa e reaparece.
- **Corvo de Éter:** voa por cima de muralhas e caixotes.
- **Sapo Mago gigante:** versão ampliada do sapo do laboratório.

**Blocos e cenário:**
- Blocos que não quebram, em algumas fases (só a Terra abre caminho).
- Blocos empurráveis (puzzles de rota).
- Caixotes com brilho que mostram o item escondido.
- Poças de água que o Aqua transforma em caminho; raízes que bloqueiam por um tempo.

**Mais habilidades de fogo (não feitas):**
- **Explosão Solar:** quando a transformação acaba, solta uma onda de fogo ao redor (a "última chama"), e a Roo fica uns segundos fraca.
- **Tocha viva:** acende as flores do mal vizinhas e as queima; inimigos ficam com medo da chama e se afastam.
- **Vapor da fusão com a Aqua:** nuvem que esconde a Roo dos inimigos por alguns segundos (parte da ideia das reações no chão).

**Habilidade para a Roo normal:**
- **Bolhas de sabão** (a origem dela): bloquear um tiro, carregar uma poção ou flutuar sobre uma casa. Deve ser equilibrado, sem deixar o jogo fácil.


## Da revisão de 2026-11-15 (a decidir; o que for problema está nas Issues do GitHub)

**Gameplay: um risco de repetição.** Vinte fases de "quebrar caixotes, 3 gemas, porta" podem cansar. Ideia central: **uma mecânica própria por capítulo**, reaproveitando a arquitetura (sem cinco sistemas novos):

| Capítulo | Mecânica proposta |
|---|---|
| Vale | transformação da natureza: vapor, lama e névoa como terreno (depende das reações no chão) |
| Torre | selos e mecanismos: portas seladas que só uma poção abre |
| Biblioteca | conhecimento: símbolos a interpretar, correntes a soltar, manuscritos a achar (protótipo de um puzzle antes de generalizar) |
| Observatório | ciclos: astrolábios e mecanismos temporizados que conversam com a fraqueza rotativa do Ouroboros |
| Retorno | consequência: menos combate, mais pequenas interações com o vale e seus habitantes |

**Reações no chão (`FieldSystem`).** Uma matriz de reações pura (sem Phaser) entre brasa, poça, lama, vapor e sal: duração, sobreposição, ordem e teste para cada par. Ilustrativo, a definir: fogo + poça = vapor; água + terra = lama; vento + vapor = dispersão. **Começar só por vapor e lama**; os cristais de sal esperam a validação dos dois.

**Manuscrito como diário de descobertas.** A primeira vez que a Roo vê uma reação, uma fraqueza, um comportamento de chefe ou uma forma, abre-se uma anotação do mestre ("Caderno de experimentos"). Mais: um **Bestiário** progressivo (origem, comportamento, elemento, fraquezas, onde foi visto, notas do mestre), revelado aos poucos, sem enciclopédia no começo.

**Chefes: leitura e contramedidas (sem chefe novo).** Quimera: a prata como terreno. Belladona: ataques que combinam poções e mudam a arena por um tempo. Leão Verde: o ácido corrói partes do cenário. Ouroboros: o ciclo muda também o ambiente. Mandrágora: raízes e plantas bloqueiam rotas por um tempo. Regra: todo ataque tem de ser legível no celular.

**Lore.** (1) A **Academia** como antiga instituição de alquimia da qual o mestre fazia parte, que preservou o saber mas se afastou do povo; reforça a Biblioteca Proibida e dá sentido ao nome. (2) As **quatro operações** (Calcinação/fogo, Solução/água, Coagulação/terra, Sublimação/ar) como estrutura visual no Manuscrito, ligando as formas ao que a Roo aprendeu. (3) **Prima Materia** como decisão no fim (já nas ideias acima): "o que você vai fazer com aquilo que encontrou?"; só avança se não contradisser o desfecho.

**Técnicas.** Semente por partida (mapa, posição inicial e inimigos reproduzíveis; depois, desafio diário). Exportar e importar o progresso. PWA (instalável e offline). Mais ADRs (`docs/adr/`): Phaser como motor, regras puras, geração procedural, persistência local, sistema de formas, interações ambientais. Verificação executável dos docs (links, ids de chefes e inimigos, controles, mecânicas removidas, números divergentes).

**Evitar por ora:** mais tipos de inimigo e novos chefes (validar os 11 e os 5), companheiros (versão 2), crafting complexo, ECS.

## Pontos em aberto

- [ ] Aprovar a ordem acima (reações no chão, grimório, Prima Materia).
- [ ] Se o Grimório for o Manuscrito, como aparecem as reações descobertas.
- [ ] Se a Obra vira só estética ou também regra.
- [ ] Alertas: usar os nomes do glossário (Ar, e não "Éter"); inimigos que **perseguem** contrariam a decisão "sem personagens que perseguem" (`06-decisoes.md`).
