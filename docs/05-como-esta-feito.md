# Como está feito

Mapa do código. Para cada tarefa, o arquivo para começar.

| Quero mudar... | Comece em |
|---|---|
| um número de equilíbrio (tempo, vida, custos) | `src/config.ts` |
| as fases (tempo, inimigos, tema, história) | `src/game/stages/chapters/<capítulo>.ts` (ordem em `stages/index.ts`) |
| os tipos de inimigo | `src/game/entities/enemies/defs.ts` e a vida/fraqueza em `entities/profiles.ts` |
| a reação entre poções (fogo acende, água apaga, terra imune) | `src/game/chain.ts` |
| as regras de bombas, poções e explosões | `src/game/BombSystem.ts` (alcance puro em `blast.ts`) |
| power-ups por poção (alcance, frascos) | `src/game/upgrades.ts` |
| itens do chão, inimigos, sono da Roo | `src/game/PickupSystem.ts`, `EnemySystem.ts`, `SleepSystem.ts` |
| as regras de pickup, inimigo e sono | `src/game/pickupRules.ts`, `entities/enemies/enemyRules.ts`, `sleepRules.ts` (puros) |
| as transformações da Roo (T, X, C, V) | `src/game/forms/` (regras) e `src/game/RooFormSystem.ts` (Phaser); guia em `18-transformacoes.md` |
| o que a Roo aprende na jornada (poções, formas) | `src/game/learning.ts` |
| a história (cartões, passagens, final) | `src/game/story.ts` e `StoryDirector.ts`; roteiro em `12-historia.md` |
| a Arena e o duelo de chefes | `src/game/arena.ts`, `duel.ts` e `src/ui/arena.ts` |
| o Livro de Roo, o Manuscrito e a história em prosa | `livro.html`, `manuscrito.html`, `history.html` (scripts em `src/pages/`) |
| o desenho da Roo | `src/textures/roo.ts` |
| o desenho de poções | `src/textures/potions.ts` |
| o desenho de itens e inimigos | `src/textures/entities.ts` |
| a tabela de drop dos caixotes | `src/game/rewards.ts` |
| a HUD (vida, tempo, seletor, Roo Fire; sem legendas, em ícones) | `src/scenes/HudScene.ts` |
| o menu animado (Roo lendo, estante e alambique) | `src/scenes/MenuScene.ts` |
| o menu, pausa e fim de jogo (telas em texto) | `index.html` e `src/ui/` |
| as cores e fontes | `src/styles/main.css` (variáveis em `:root`) |
| um chefe (movimento, habilidades, falas) | `src/game/entities/bosses/<chefe>/` (`*Controller.ts`, `rules.ts`, `lines.ts`); lista única em `bosses/defs.ts` |
| as regras de um chefe (escolha de ataque, áreas, alvos) | `bosses/<chefe>/rules.ts` (puro, testado) |
| o desenho dos chefes e inimigos | `src/textures/witch.ts`, `enemiesNew.ts`, `ouroboros.ts` e as texturas do chefe em `src/textures/` |
| a janela de ajuda (botão ?) | `index.html` (`#help-overlay`) e `src/ui/help.ts` |
| os números de equilíbrio | `src/config.ts` (veja `10-equilibrio.md`) |
| ver todos os sprites | abra `/sprites.html` (veja `09-sprites.md`) |
| a música e os sons | `src/audio/AudioEngine.ts` e `src/audio/tracks.ts` |
| o que se guarda entre partidas (poções aprendidas, fases) | `src/storage.ts` |
| os controles do celular | `src/input/touch.ts` |

## Peças que se conversam

Cenas, comunicação entre telas, armazenamento e áudio estão descritos em `ARCH.md` (referência técnica); a estrutura de entidades, fases e capítulos está em `14-estrutura-do-codigo.md`. Este arquivo só diz onde mexer.

## Fases

A `MainScene` recebe `{ stage: n }` ou `{ stage: n, carry }` ao reiniciar (n de 1 a 20; `stage: 0` com `arena: '<chefe>'` abre a Arena). Sempre passe os dados de forma explícita: sem eles o Phaser reaproveita os do reinício anterior, e a jogadora voltaria a uma fase avançada depois de perder.

Cada fase é um objeto em `stages` de um capítulo (`src/game/stages/chapters/`): tempo, chance de caixotes, se tem porta, quais inimigos (`EnemyRule`: quantos no início, máximo e "a cada N caixotes"), tema visual, bloco, faixa de música e história. Os capítulos são listados em `CHAPTER_LIST` (`stages/index.ts`) e a ordem define a numeração (1 a 20). Para criar uma fase ou um capítulo, siga `16-guia-de-extensao.md`. O fluxo (porta leva à fase seguinte, chefe derrotado abre o caminho, o portão da fase 20 encerra o jogo) está em `stageFlow.ts` e na `MainScene`.

## Cuidados

- As chaves do `localStorage` (`bombroo_owned`, `bombroo_stages_completed`, `bombroo_forms`, `bombroo_arena_wins`...) estão em `src/storage.ts` e não podem mudar de nome sem migração. `bombroo_bank` (o ouro) não é mais usada. O progresso pode ser salvo e carregado em arquivo JSON pelo menu (`src/saveFile.ts`, `src/ui/saveTransfer.ts`): carregar junta o arquivo ao progresso atual, sem apagar nada; arquivos de versão mais nova são recusados.
- Os textos ficam em português e os números de equilíbrio ficam em `config.ts` e nas tabelas de `entities/profiles.ts`.
- Testes ficam em `tests/`. Rode `npm run check` (tipos, testes e build) depois de cada mudança; `npm run smoke` confere o jogo num navegador.
