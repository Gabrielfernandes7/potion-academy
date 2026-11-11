# Como está feito

Mapa do código. Para cada tarefa, o arquivo para começar.

| Quero mudar... | Comece em |
|---|---|
| um número de equilíbrio (tempo, vida, custos) | `src/config.ts` |
| as fases (tempo, inimigos, tema) e os tipos de inimigo | `STAGES` e `ENEMY_TYPES` em `src/config.ts` |
| a reação entre poções (fogo acende, água apaga, terra imune) | `src/game/chain.ts` |
| as regras de bombas, poções e explosões | `src/game/BombSystem.ts` |
| as regras de pickup, inimigo e sono | `src/scenes/MainScene.ts` (serão separadas, ver `ARCH.md`) |
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

Cenas, comunicação entre telas, armazenamento e áudio estão descritos em `ARCH.md` (referência técnica). Este arquivo só diz onde mexer.

## Fases

A `MainScene` recebe `{ stage: n }` ou `{ stage: n, carry }` ao reiniciar (n de 1 a 4). Sempre passe os dados de forma explícita: sem eles o Phaser reaproveita os do reinício anterior, e a jogadora voltaria a uma fase avançada depois de perder.

Cada fase é uma entrada em `STAGES` (`src/config.ts`): tempo, chance de caixotes, se tem porta, quais inimigos (`EnemyRule`: quantos no início, máximo e "a cada N caixotes") e o tema visual. Para criar uma fase nova, acrescente uma entrada, um tema em `LOOKS` (`MainScene.ts`) se precisar de arte própria e, se houver inimigo novo, uma entrada em `ENEMY_TYPES` e uma textura. O fluxo (porta leva à fase seguinte, chefe leva ao jardim, portão final vence) está em `stageClear` e `onBossDefeated`.

## Cuidados

- As chaves `bombroo_bank` e `bombroo_owned` no navegador não podem mudar de nome, senão o progresso se perde.
- Os textos ficam em português e as regras de jogo ficam em um lugar só (`config.ts`).
- Testes ficam em `tests/`. Rode `npm run test` depois de cada mudança de regra.
