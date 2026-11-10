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
| a música e os sons | `src/audio/AudioEngine.ts` e `src/audio/tracks.ts` |
| o que se guarda entre partidas (moedas, poções) | `src/storage.ts` |
| os controles do celular | `src/input/touch.ts` |

## Peças que se conversam

- `main.ts` liga os botões das telas de texto ao jogo.
- `launcher.ts` cria o jogo uma vez e troca entre menu e partida.
- A `MainScene` manda o estado para a `HudScene` por eventos (`game/hudState.ts`).

## Cuidados

- As chaves `bombroo_bank` e `bombroo_owned` no navegador não podem mudar de nome, senão o progresso se perde.
- Os textos ficam em português e as regras de jogo ficam em um lugar só (`config.ts`).
- Testes ficam em `tests/`. Rode `npm run test` depois de cada mudança de regra.
