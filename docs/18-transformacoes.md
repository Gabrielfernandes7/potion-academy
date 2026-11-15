# Transformações da Roo: história e desenho

Status: **as quatro formas estão no jogo** (2026-11-15). O que ainda é proposta de história (o mapeamento pela Obra) está marcado abaixo. Números são ponto de partida: falta jogar o equilíbrio.

## 1. A história das transformações

As quatro transformações são **as lições do mestre**. Ele ensinou à Roo, pela ordem, a medir o fogo, ouvir a água, respeitar a terra e desconfiar do ar. Cada lição tem uma forma, um elemento e um momento da jornada, e cada uma só se aprende quando a Roo a pratica.

Nada disso é explicado com capítulo e versículo. A forma aparece na mão da Roo: ela sente a chama, a água, o peso da terra ou a leveza do ar.

### Ordem das lições (e das poções)

| Ordem | Lição do mestre | Forma | Elemento | Quando a poção vem | Quando a forma é aprendida |
|---|---|---|---|---|---|
| 1 | medir o fogo | Roo Fire | fogo | desde o começo | desde o começo |
| 2 | ouvir a água | Roo Água | água | fim da fase 1 | **meio da fase 2** (O Caminho), depois de 3 golpes da Poção de Água em inimigos |
| 3 | respeitar a terra | Roo Terra | terra | fim da fase 3 | **ao começar a fase 4** (O Poço), antes da Quimera, que a terra prende |
| 4 | desconfiar do ar | Roo Ar | ar | fim da fase 4 | **meio da fase 5** (A Escadaria), depois de 3 golpes da Poção de Ar em inimigos |

A regra: a poção vem como prêmio no fim de uma fase; a forma vem como lição na fase seguinte, depois de a Roo usar a poção e entender o que ela faz. A exceção é a Terra, porque a fase seguinte à poção é o chefe. Se a Roo vencer a fase sem chegar aos 3 golpes, aprende mesmo assim (a lição nunca se perde). Quem já tinha concluído a fase da lição num save antigo conta como tendo aprendido. Na Arena, tudo está liberado. Código: `game/learning.ts` (`FORM_LESSONS`), `RooFormSystem.noteHit/onStageBegin`, `storage.knowsForm/learnForm` (chave `bombroo_forms`).

### Por que a água é a segunda e não a primeira

A água é a forma de **nascimento**: a Roo veio de uma bolha. Por isso a Roo Água é a habilidade mais dela, e a história não precisa explicar. Ela só aprende a usar com consciência depois de aprender a poção, que é o que a fase 1 ensina.

### Mapeamento pela Obra (a decidir)

A proposta anterior ligava as etapas da Obra (Nigredo, Albedo, Citrinitas, Rubedo) às formas. Com o fogo sendo a primeira lição, o mapeamento mais coerente vem das **operações** da alquimia, na ordem em que um alquimista as faz:

- **Calcinação (fogo):** queimar para separar o que é impuro. É a primeira operação e a primeira lição.
- **Solução (água):** dissolver e purificar. É a bolha, a Albedo.
- **Sublimação (ar):** elevar ao ar o que é leve. É a tentação de ver tudo de cima, que é o caminho da Belladona.
- **Coagulação (terra):** fixar o que foi purificado, para que se possa cultivar. É o fim: "a terra é de quem a cultiva" e o pão partido.

Com isso, o livro termina na terra, que é a lição de fixar e repartir, e não no fogo. **Pergunta para você:** seguimos as operações (recomendado) ou as etapas?

## 2. Desenho das transformações

Cada forma segue o molde de `game/forms/types.ts`: três degraus de perfil, um bônus no auge para as poções do próprio elemento, uma habilidade (tecla X), uma segunda opcional (tecla C; só Terra e Ar por enquanto) e, se houver, uma passiva. Todas duram 20 s, esfriam em 4 degraus e têm 25 s de espera.

### Roo Terra (`game/forms/earth.ts`)

- **Elemento:** terra. **Tecla:** T, com a poção de terra na mão.
- **Perfil:** no auge, **imune à terra** (por isso as flores do mal, que chicoteiam com terra, não a ferem) e fraca ao ar. Ao esfriar, resiste à terra e não tem fraqueza.
- **Bônus:** +50% nas poções de terra no auge.
- **Passiva (o peso):** anda 20% mais devagar (`earthWalkFactor`, aplicado em `MainScene.moveDuration`).
- **Habilidade C, "Raiz":** a Roo afunda e viaja por baixo da terra (invisível, invulnerável, por baixo de paredes, caixotes, poções e inimigos) por 0,7 s, e **nasce onde a jogadora escolher**, como a Mandrágora: C abre a mira (o cursor começa na casa mais distante à frente), as setas o movem dentro de 4 passos, C confirma e X ou V cancelam sem gastar nada. Ao brotar, a terra racha nas quatro casas vizinhas e fere o que estiver nelas. Custa 2 s da forma, espera 5 s. Só nasce em chão livre.
- **Habilidade X, "Muro de sal":** levanta 3 casas de sal à frente, de lado a lado, por até 4 s (menos nos degraus baixos). Inimigos comuns e a própria Roo não passam, e nenhuma poção cabe em cima. **Fantasmas atravessam** (como atravessam qualquer parede). Não nasce na porta nem sobre poção, inimigo, chefe ou a Roo. A explosão **não** é barrada pelo muro. Custa 2 s da forma, espera 4 s.

### Roo Ar (`game/forms/air.ts`)

- **Elemento:** ar. **Tecla:** T, com a poção de ar na mão.
- **Perfil:** no auge, resiste ao ar e é fraca à terra. Ao esfriar, sem fraqueza.
- **Bônus:** +50% nas poções de ar no auge.
- **Passivas:** a **leveza** (anda 20% mais rápido; o preço é a fraqueza à terra) e a **visão de cima** (a névoa não esconde nada). *Antes, a forma não pegava baús; saiu, porque a punição tornava a forma quase inutilizável.*
- **Habilidade X, "Sopro":** uma linha de vento de 4 casas empurra 2 casas (1 nos degraus baixos) os inimigos comuns, que ficam atordoados, **e as poções do chão, que deslizam** (dá para pôr uma poção contra um alvo). Flores e chefes não saem do lugar. Apaga as brasas. Custa 2 s da forma, espera 3,5 s.
- **Habilidade C, "Salto de vento":** um pulo de até 3 casas por cima de inimigos, poções e muros de sal, invulnerável por 0,25 s. Não atravessa parede nem caixote. Custa 1,5 s da forma, espera 2,5 s. É a esquiva.

### A segunda habilidade (tecla C) de todas as formas

| Forma | Habilidade | O que faz |
|---|---|---|
| Fogo | **Onda de brasas** | uma explosão de fogo num losango de 2 casas em volta da Roo (sem a casa dela): fere o que estiver nele e deixa brasas. Custa 2 s, espera 5 s |
| Água | **Poça** | uma área de 3x3, duas casas à frente, por até 4 s: quem pisa anda a 40% da velocidade, as brasas se apagam e as poções de fogo caídas nela viram vapor. Custa 2 s, espera 5 s |
| Terra | **Raiz** | afunda e nasce onde a jogadora escolher (ver acima) |
| Ar | **Salto de vento** | pulo de 3 casas, invulnerável |

### Defesa (tecla V), em todas as formas (`game/forms/defense.ts`)

Toda forma tem uma defesa que dura 3 s, **corta o dano pela metade**, custa 2 s da forma e espera 6 s. V de novo desfaz antes da hora.

| Forma | Defesa | Efeito além de cortar o dano |
|---|---|---|
| Fogo | Escudo de brasas | um anel de brasas nas 4 casas ao redor, que queima quem pisa |
| Água | Bolha protetora | a bolha iridescente da Roo Água em volta dela, que **cura 1 de vida a cada 0,5 s** (até 6 em 3 s) |
| Terra | Círculo de sal | muro nas 4 casas ao redor e, ao levantar, **empurra 2 casas** o que estava nelas (inimigos comuns e poções) |
| Ar | Redemoinho | afasta 1 casa os inimigos vizinhos |

A escolha de fogo e ar foi minha (a bolha e o muro foram pedidos): o fogo fica com o que ele faz de melhor (queimar quem chega perto) e o ar com o que ele faz de melhor (afastar).

### Regras comuns a todas as formas

- A tecla T transforma na forma da poção na mão (`formForElement`): fogo → Roo Fire, água → Roo Água, terra → Roo Terra, ar → Roo Ar. Enquanto a forma dura, só a poção do elemento dela funciona (`game/loadout.ts`).
- Uma forma só se transforma se foi aprendida (ver a tabela acima; `formLearned`). Na Arena, tudo está liberado.
- Só uma forma ativa por vez.
- Cada forma tem o seu som (`audio/sounds.ts`) e a sua cor no sprite (`textures/roo*.ts`).
- Uma forma nova precisa de: um registro em `forms/registry.ts`, um arquivo puro com o perfil, uma textura por degrau e um texto no Manuscrito. O guia está em `docs/16-guia-de-extensao.md`.

### Nome

O código e o Manuscrito chamam a forma de água de "Roo Água"; a proposta é "Roo Água", com o mesmo padrão de "Roo Terra" e "Roo Ar". Renomear é trocar o texto (`FORMS.water.nome`, a página `roo-aqua`), sem mexer nas chaves das texturas.

## 3. Pontos em aberto

1. **Decidido:** as lições seguem as **operações** da alquimia (calcinação, solução, coagulação, sublimação), não as etapas da Obra (que ficam só como cor e tom). A ordem em que se aprende segue as poções.
2. O Ar ficou com leveza e visão de cima, sem punição. A fraqueza à terra basta como preço? Falta jogar.
3. **Decidido:** o Muro de sal **barra as explosões** como uma parede (as da Roo e as dos chefes; até a Poção de Terra, que atravessa caixotes, para nele). Fica mais forte como defesa e mais arriscado para quem o levanta no lugar errado.
4. Equilíbrio: 20% de peso e de leveza, 4 s de muro, 4 casas de Raiz, 3 casas de Salto, 2 casas de Sopro, 3 golpes de lição. Tudo por jogar.
5. Fogo e Água só têm uma habilidade. Ideias para a segunda (C): Fogo, uma onda de brasas em volta; Água, uma poça que escorrega e leva inimigos.
