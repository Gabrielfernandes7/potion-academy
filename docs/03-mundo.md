# Mundo

Cada personagem e item tem uma ficha curta: o que é, o que faz e um detalhe que o torna único.

## Personagens

**Roo, a bruxa-canguru** (jogadora)
- *Quer:* sair do laboratório com as gemas e vencer a rival.
- *Sabe fazer:* colocar poções, empurrá-las e explodir as etéreas de longe.
- *Detalhe:* manto roxo com barra dourada, chapéu e varinha. Parada, ela cochila.
- *Frase:* "Mais uma poção e a porta é minha."

**Belladona, a alquimista rival** (chefe da fase 3)
- *Quer:* o laboratório e as gemas só para ela.
- *Sabe fazer:* arremessar poções, fazer chover gotas e sumir em névoa.
- *Detalhe:* roupa verde-escura com detalhes verde-limão, chapéu torto com faixa magenta, cabelo carmim, olhos verde-limão.
- *Vida:* 8. *Frase:* "Essas poções são minhas, canguru!"

### Habilidades da Belladona

Toda habilidade mostra um aviso no chão por 1,2 s antes de acontecer.

| Habilidade | O que ela faz | Aviso | Quando usa |
|---|---|---|---|
| Arremesso de Fogo | joga uma poção na casa onde você está; explode em cruz de 1 casa | quadrados vermelhos e anel que encolhe | sempre (furiosa: joga duas seguidas) |
| Chuva de Gotas | 4 gotas de água caem ao seu redor; a primeira, na sua casa | quadrado azul em cada gota | só furiosa |
| Salto de Névoa | some por 0,7 s (protegida) e reaparece longe de você | fumaça e brilho | sempre |

- **Fúria:** com 4 de vida ou menos (50%), o intervalo entre habilidades cai de 3,4 s para 2,3 s.
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
| Poção de Fogo | fogo | balão redondo | 2 | 2,0 s | rápida e confiável |
| Poção Aqua | água | tubo alto | 3 | 2,4 s | alcance maior, mas lenta |
| Poção Telúrica | terra | pote com cristais | 2 | 2,2 s | atravessa caixotes |
| Poção Etérea | éter | losango com névoa | 2 | você decide (D) | controle total |

Cada elemento tem seu efeito na explosão (brasas, gotas, pedriscos ou brilhos) e seu som.
Veja `10-equilibrio.md` para os motivos desses números.

### Reações entre poções

| Quando a explosão de... | alcança uma poção de... | acontece |
|---|---|---|
| fogo | fogo, água ou éter | ela explode junto (corrente) |
| fogo | terra | nada: a Telúrica é imune |
| água | fogo | a poção se desfaz em vapor, sem explodir ("APAGADA") |
| água, terra ou éter | qualquer outra | nada |

A explosão de água que apaga uma poção de fogo continua machucando quem estiver no caminho.

## Itens que caem dos caixotes

| Item | Efeito | Limite |
|---|---|---|
| Moeda | +1 POÇÃO | |
| Baú | +5 POÇÃO e +1 vida | |
| Coração | +1 vida | máximo 5 |
| Gema | conta para abrir a porta | 3 por fase |
| +Frasco | +1 poção ao mesmo tempo | até 5 |
| +Raio | explosões mais longas | 3 níveis |
| +Velocidade | a Roo anda mais rápido | 2 níveis |
| +Tempo | +15 segundos | |

As gemas são escolhidas no começo de cada fase com porta (1, 2 e 4), então a porta sempre pode ser aberta. No duelo (fase 3) não há gemas nem porta.

## Inimigos

**Sapo mago** (laboratório e jardim)
- *Faz:* anda sem rumo, com pulinhos, e tira 1 de vida ao encostar. Morre com uma explosão e deixa uma moeda.
- *Detalhe:* no laboratório aparecem mais conforme você quebra caixotes (2 no início, até 5). No jardim são 2, até 3.
- *Limite:* não persegue.

**Fantasma** (salão dos fantasmas)
- *Faz:* flutua sem rumo (um passo a cada 1,5 s), **atravessa muralhas, caixotes e poções** e tira 1 de vida ao encostar. Deixa uma moeda.
- *Detalhe:* dentro de uma muralha fica meio transparente e a explosão não o alcança. Começam 2, até 4 (mais um a cada 10 caixotes).
- *Limite:* não persegue nem sai da sala.

**Flor do mal** (jardim)
- *Faz:* fica fixa e **bloqueia a casa**. A cada 3,2 s mostra um aviso rosa nas 4 casas ao redor e, 0,8 s depois, chicoteia quem estiver ali (1 de vida).
- *Detalhe:* é **imune à Poção Aqua**. Fogo, Telúrica e Etérea a derrotam. Começam 5 no jardim.
- *Limite:* não se mexe e não se multiplica.

## Lugares

- **Laboratório (fase 1):** a grade de 15 por 13 casas. As muralhas de pedra não quebram.
- **Salão dos fantasmas (fase 2):** o mesmo tamanho, em pedra azulada e fria.
- **Arena do duelo (fase 3):** menos caixotes (a arena é mais aberta).
- **Jardim do castelo (fase 4):** fora do castelo. Grama, sebes no lugar das muralhas, canteiros de flores no lugar dos caixotes e um portão no lugar da porta.
- **Sala de Música:** a tela onde a Roo de maestro (casaca e cabelo de Beethoven) deixa escolher a música.
- **Caldeirão de Magia:** a loja.
- **Menu:** a Roo mexe uma poção no caldeirão. De tempos em tempos ela aponta a varinha para um frasco da prateleira, ele levita e voa guiado por ela até o caldeirão, que reage de um jeito próprio de cada elemento (labareda, respingo, pedras ou redemoinho de névoa). Clicar num frasco da prateleira o chama na hora.
