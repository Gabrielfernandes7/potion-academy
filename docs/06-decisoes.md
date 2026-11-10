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
