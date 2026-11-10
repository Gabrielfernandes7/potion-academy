# Como está feito

Mapa do código. Para cada tarefa, o arquivo para começar.

| Quero mudar... | Comece em |
|---|---|
| um número de equilíbrio (tempo, vida, custos) | `src/config.ts` |
| as regras de uma explosão, pickup ou inimigo | `src/scenes/MainScene.ts` |
| o desenho da Roo | `src/textures/roo.ts` |
| o desenho de poções | `src/textures/potions.ts` |
| o desenho de itens e inimigos | `src/textures/entities.ts` |
| a tabela de drop dos caixotes | `src/game/rewards.ts` |
| a HUD (corações, tempo, seletor) | `src/scenes/HudScene.ts` |
| o menu animado (caldeirão e Roo) | `src/scenes/MenuScene.ts` |
| o menu, pausa, loja e fim de jogo (telas em texto) | `index.html` e `src/ui/` |
| as cores e fontes | `src/styles/main.css` (variáveis em `:root`) |
| a Belladona (movimento, habilidades, vida) | `src/game/BossController.ts` |
| as regras do chefe (escolha de ataque, áreas, alvos) | `src/game/boss.ts` |
| o desenho da Belladona | `src/textures/witch.ts` |
| a janela de ajuda (botão ?) | `index.html` (`#help-overlay`) e `src/ui/help.ts` |
| os números de equilíbrio | `src/config.ts` (veja `10-equilibrio.md`) |
| ver todos os sprites | abra `/sprites.html` (veja `09-sprites.md`) |
| a música e os sons | `src/audio/AudioEngine.ts` e `src/audio/tracks.ts` |
| o que se guarda entre partidas (moedas, poções) | `src/storage.ts` |
| os controles do celular | `src/input/touch.ts` |

## Peças que se conversam

- `main.ts` liga os botões das telas de texto ao jogo.
- `launcher.ts` cria o jogo uma vez e troca entre menu e partida.
- A `MainScene` manda o estado para a `HudScene` por eventos (`game/hudState.ts`).

## Fases

A `MainScene` recebe `{ stage: 1 }` ou `{ stage: 2, carry }` ao reiniciar. Sempre passe os dados de forma explícita: sem eles o Phaser reaproveita os do reinício anterior, e a jogadora voltaria à fase 2 depois de vencer.

## Cuidados

- As chaves `bombroo_bank` e `bombroo_owned` no navegador não podem mudar de nome, senão o progresso se perde.
- Os textos ficam em português e as regras de jogo ficam em um lugar só (`config.ts`).
- Testes ficam em `tests/`. Rode `npm run test` depois de cada mudança de regra.
