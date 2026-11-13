# Como se joga

## Objetivo

O jogo tem **quatro fases**:

1. **Laboratório:** pegar **3 gemas** e chegar à **porta** em 90 segundos. A porta só abre com as 3 gemas. Inimigos: sapos magos.
2. **Salão dos fantasmas:** igual ao laboratório (3 gemas e a porta), em 100 segundos, com **fantasmas** e um sapo.
3. **Duelo:** derrotar a bruxa **Belladona** (10 de vida; fogo e éter tiram 2, água e terra tiram 1) em 120 segundos.
4. **Jardim:** fora do castelo. Pegar 3 gemas e chegar ao **portão** em 100 segundos, entre sapos magos e **flores do mal**. Cruzar o portão encerra o jogo.

Ao passar de uma fase para a seguinte, a Roo leva a vida (sem bônus), os power-ups e as moedas.

## Controles

| Ação | Teclado | Celular |
|---|---|---|
| Andar | setas | botões de direção |
| Colocar poção | Espaço | BOMBA |
| Explodir poções etéreas | D | DETONAR |
| Transformar em Roo Fire (20 s) | T | ROO FIRE |
| Transformar em Roo Aqua (20 s) | Y | ROO AQUA |
| Habilidade da forma (Labareda ou Bolha de sabão) | X | HABILIDADE |
| Escolher o frasco | 1, 2, 3, 4 | toque no seletor |
| Pausar | Enter | PAUSA |
| Recomeçar | R | botão no fim do jogo |
| Ajuda (tela com todas as teclas) | ? ou H | botão ? |

O botão **?** fica no topo, ao lado do botão de som. A ajuda **pausa o jogo** enquanto está aberta.

## Regras

- **Tempo:** 90 s no laboratório, 100 s no salão e no jardim e 120 s no duelo. O item +15 s soma tempo (até o dobro do tempo da fase).
- **Vida:** uma barra contínua de 24 pontos, como a dos chefes. O contato com inimigo ou chefe tira 4. Uma explosão tira pelo elemento: **fogo 6** (a fraqueza, inclusive as poções dela), **água 2** (a resistência), terra e éter 4. Depois de um golpe há 1,5 s de proteção. Cada coração cura 4.
- **Poções ao mesmo tempo:** começa com 2; cada +frasco soma 1, até 5.
- **Caixotes:** ao quebrar, podem deixar um item. Caixotes e muralhas bloqueiam a explosão.
- **Tempo esgotado:** a Roo perde 1 de vida a cada 1,2 s. Ele precisa terminar logo.
- **Descanso:** parada por 5 s, ele cochila. Qualquer tecla a acorda.

## Exemplos

- A poção de fogo explode em cruz, 2 casas para cada lado (9 casas). Um caixote no caminho para o braço da cruz.
- Se uma explosão de **fogo** alcança outra poção, ela explode junto. A **Telúrica** nunca é acesa por isso.
- Se uma explosão de **Aqua** alcança uma poção de **fogo**, a poção se desfaz em vapor e não explode. A explosão de Aqua continua machucando.
- Aqua, Telúrica e Etérea não acendem outras poções.
- A poção telúrica atravessa os caixotes e limpa uma fileira.
- A poção etérea fica armada até você apertar D e conta no limite de poções.
- Atrás de um caixote você fica protegida da explosão.

## O duelo

- A Belladona anda devagar e usa 3 habilidades (veja `03-mundo.md`).
- **Antes de cada ataque aparece um aviso no chão:** quadrados coloridos onde a explosão vai pegar e um anel que encolhe. Você tem 1,2 s para sair.
- Uma explosão de **sua** poção que a alcança tira 1 de vida dela. Depois do golpe ela fica protegida por 1,4 s e para de atacar por um instante.
- Com metade da vida ou menos ela fica **furiosa** e ataca mais rápido.

## O salão dos fantasmas

- O **fantasma** atravessa muralhas, caixotes e poções, mas anda devagar (um passo a cada 1,5 s). Dentro de uma muralha ele fica meio transparente e **a explosão não o alcança**: espere que ele saia.

## O jardim

- As **flores do mal** não se mexem e **bloqueiam a casa** onde estão. A cada 3,2 s, aparece um aviso rosa nas quatro casas ao redor; 0,8 s depois elas chicoteiam quem estiver ali.
- São **imunes à Poção Aqua**: a explosão azul não as machuca. Use fogo, Telúrica ou Etérea.

## Como se perde

- A vida da Roo chega a zero. "Tentar de novo" recomeça na fase 1.

## Como se ganha

- Derrotar a Belladona dá **+80 OURO** e abre o caminho para o jardim.
- Cruzar o portão do jardim vence o jogo e dá **+60 OURO**.

## Loja

No **Caldeirão de Magia** você gasta OURO para liberar poções (veja a tabela em `03-mundo.md`).
O OURO vem das moedas, dos baús e da vitória sobre a Belladona.

## Arena de treino

O botão **ARENA** do menu abre uma lista de chefes (Quimera, Belladona, Mandrágora e o Leão Verde) para treinar quando quiser. Cada cartão mostra o desenho, a vida, a fraqueza e a imunidade. Na Arena **todas as poções estão liberadas**, o tempo é de sobra (10 min) e nada conta para a jornada: não há ouro, nem fase vencida. Vencer guarda o chefe como vencido e abre a página dele no Manuscrito. "Tentar novamente" (ou R) recomeça a mesma luta.

## As transformações

A Roo se transforma em **Roo Fire** (tecla **T**) ou **Roo Aqua** (tecla **Y**), uma de cada vez. Cada forma dura **20 segundos** e vai esfriando em 4 degraus (as cores e os efeitos voltam ao normal aos poucos). Quando acaba, há 25 s de espera, comum às duas. O medidor fica na HUD, ao lado dos frascos: a chama (T) e a gota (Y) acesas quando está pronto; os 4 degraus mostram o tempo que resta; o X aparece quando a habilidade está pronta.

### Roo Fire (T)
- **Poções de fogo mais fortes:** +50% de dano no auge (a Poção de Fogo de 4 tira 6), e o bônus cai a cada degrau.
- **Perfil trocado:** a Roo Fire **resiste ao fogo** (as próprias poções machucam só 2) e fica **fraca à água** (6).
- **Não pode usar a Poção Aqua** enquanto durar: a chama a recusa. Se a poção escolhida era a Aqua, o jogo troca por outra ao transformar, e o slot fica apagado.
- **Brasas:** a explosão de fogo deixa brasas no chão. Queimam inimigos comuns (chefes são imunes) e nunca machucam a Roo. Uma explosão de água as apaga.
- **Labareda (X):** um jato de fogo de 3 casas à frente, com o dano de uma poção de fogo. Custa 2 s da forma e tem espera de 3,5 s.
- **Luz de chama:** na névoa, a Roo enxerga até 2 casas a mais.

### Roo Aqua (Y)
- **Imune à água** no auge: a Poção Aqua, a maré e a chuva não a machucam (o contato com inimigos de água continua doendo). Esfriando, vira resistência. O fogo segue sendo a fraqueza.
- **Poções de água +50%** no auge. Pode usar todas as poções, inclusive a de fogo.
- **Bolha de sabão (X):** a Roo sopra uma bolha que flutua até 4 casas. Se alcança um inimigo comum, **o prende dentro dela** (ele não anda, não machuca e não chicoteia) por até 4 s, mais nos degraus altos; depois estoura. Chefes são imunes (a bolha só estoura). Custa 2 s da forma e tem espera de 3,5 s.

Cada forma tem som de transformação (o fogo ruge e estala; a água borbulha subindo), de fim, e a habilidade tem som próprio.
