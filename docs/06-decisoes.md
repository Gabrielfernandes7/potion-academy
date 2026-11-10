# Decisões

Um registro curto de cada escolha importante: o que foi decidido, por quê, e o que ficou de fora.
Novas decisões entram no fim.

## Não usar Rust nem WebAssembly
- **Motivo:** o jogo é pequeno. O gargalo é organização do código, não velocidade. Phaser é JavaScript.
- **Ficou de fora:** Rust, se quisermos aprender Rust, em um projeto separado.

## Separar o código em módulos com TypeScript e Vite
- **Motivo:** um arquivo de 1.500 linhas era difícil de mudar com segurança.
- **Consequência:** os testes ficam fáceis, e o build avisa de erros antes de rodar.

## Música gerada por código, uma faixa por partida
- **Motivo:** sem arquivos de áudio, o projeto continua leve. Cada partida tem uma faixa diferente da anterior, para não cansar.

## HUD dentro do jogo, menus fora
- **Motivo:** a HUD fica perto da ação. Menus e loja usam texto normal, que é mais fácil de estilizar.

## Roo com manto e sono
- **Motivo:** a personagem precisa de identidade. O sono é um sinal de que o jogador está parado, sem texto na tela.

## Sem personagens que perseguem
- **Motivo:** o jogo é sobre planejar, não sobre reflexo. Pode mudar se quisermos mais desafio.
- **Em aberto.**

## Elementos ainda sem efeito na regra
- **Motivo:** primeiro o visual e o som, depois a regra. Em aberto: o elemento pode mudar o alcance, o tempo ou o efeito da explosão.

## Duas fases: laboratório e duelo com a Belladona
- **Motivo:** o jogo tinha uma fase só e nenhum objetivo final. O duelo dá um desfecho e usa as mesmas regras (poções, explosões).
- **Consequência:** a Roo leva vida, power-ups e moedas da fase 1 para a 2. "Tentar de novo" recomeça da fase 1.

## Todo ataque do chefe tem aviso no chão
- **Motivo:** o jogo é calmo; perder deve parecer culpa do jogador, nunca surpresa. O aviso dura 1,2 s.
- **Ficou de fora:** ataques sem aviso e a Belladona perseguindo a jogadora.

## Equilíbrio por "nenhuma poção melhor em tudo"
- **Motivo:** a poção Aqua era melhor que a de Fogo sem nenhum custo. Agora toda poção paga tem uma vantagem e uma desvantagem em relação às outras (alcance maior com fusível lento, por exemplo). Um teste automático garante isso.

## Janela de ajuda escondida atrás de um "?"
- **Motivo:** quem já sabe jogar não precisa ver as teclas; quem não sabe encontra tudo em um lugar. O jogo pausa enquanto ela está aberta.

## Frascos com um formato por elemento
- **Motivo:** reconhecer o tipo de poção pelo desenho, sem ler. O mesmo formato aparece no jogo, na loja e no seletor.

## Menu com a Roo mexendo, de fato, a poção
- **Motivo:** o braço estava no sprite e não acompanhava a varinha. Agora a cena desenha o braço ligando o ombro à mão, e a Roo joga ingredientes no caldeirão (o líquido muda de cor).

## Catálogo de sprites como página do projeto
- **Motivo:** o jeito mais seguro de documentar sprites é mostrá-los. `/sprites.html` é gerada pelo próprio código e nunca fica desatualizada.

## Reação entre poções: o fogo acende, a água apaga, a terra é estável
- **Motivo:** a água era o único elemento sem regra própria. Agora cada um tem um papel: o fogo acende outras poções (corrente), a água neutraliza uma poção de fogo armada (vira vapor, sem explodir) e a terra nunca é acesa nem apagada.
- **Detalhe:** a explosão de água que apaga uma poção de fogo continua machucando quem estiver no caminho.
- **Consequência:** antes, qualquer explosão acendia outras poções. Agora só a de fogo acende; água, terra e éter não. A regra mora em `src/game/chain.ts` (uma tabela de 3 linhas) para ser fácil de mudar.
- **Em aberto:** a explosão de água também poderia apagar as chamas que o fogo deixa no chão. Fica para depois, porque o fogo ainda não deixa chamas duradouras.

## Quatro fases: laboratório, salão dos fantasmas, duelo e jardim
- **Motivo:** o jogo tinha duas fases e nenhum desfecho depois da Belladona. O salão apresenta o fantasma e a regra da água; o jardim, fora do castelo, é o epílogo.
- **Consequência:** as fases são dados (`STAGES` em `config.ts`), e a `MainScene` não tem mais `stage === 1` ou `=== 2` espalhados. A Belladona agora é a fase 3: derrotá-la leva ao jardim, e só cruzar o portão do jardim vence o jogo. "Tentar de novo" continua recomeçando da fase 1.

## Fantasma que atravessa paredes, mas é lento
- **Motivo:** dar um inimigo diferente sem quebrar o tom calmo. Ele não persegue; atravessa muralhas, caixotes e poções, e anda a 1,5 s por passo.
- **Detalhe:** dentro de uma muralha a explosão não o alcança, então ele é um risco que pede paciência, não reflexo.

## Flor do mal: fixa, com aviso, imune à água
- **Motivo:** o jardim precisava de um inimigo que obrigasse a trocar de poção. A flor é imune à Aqua (a única poção que só dá "empate" contra ela) e tem um chicote que também segue a regra de ter aviso no chão (0,8 s).
- **Ficou de fora:** flores que se multiplicam ou perseguem.

## Layout responsivo: três modos
- **Motivo:** o jogo tinha um único modo e o celular deitado ficava minúsculo (167 px numa tela de 740).
- **Consequência:** (1) em pé, os controles de toque ficam sob o jogo; (2) deitado, o jogo vai ao centro e os controles nas laterais, sem sobrepor; (3) em telas grandes o jogo cresce até 1280 px. Telas estreitas escondem o título e o nome da faixa para a barra do topo caber em uma linha.

