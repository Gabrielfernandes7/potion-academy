# Base para um novo jogo

Este documento separa o que é **base reutilizável** (motor, som, arte procedural, interface, persistência, testes) do que é **conteúdo do Potion Academy** (personagens, fases, história, nomes). Quem começa outro jogo aqui troca o conteúdo e mantém a base.

Pré-requisito de leitura: `docs/25-arquitetura-para-agentes.md` (o padrão núcleo puro / ligação com Phaser).

## 1. O que é base (mantenha)

| Área | Arquivos | O que faz | Para o novo jogo |
|---|---|---|---|
| Entrada e boot | `src/main.ts`, `game/launcher.ts`, `scenes/BootScene.ts` | cria o Phaser, navega entre telas | reaproveite; troque só as cenas |
| Persistência | `src/storage.ts`, `src/saveFile.ts`, `src/ui/saveTransfer.ts` | lê e grava o save, exporta e importa arquivo | troque as chaves (ver seção 5) |
| Preferências | `src/audio/prefs.ts`, `src/ui/settings.ts`, `src/input/keymap.ts` | volume, teclas trocáveis | reaproveite |
| Entrada | `src/input/touch.ts`, `touchContext.ts`, `gamepad.ts` | toque, controle, teclado | reaproveite |
| Interface em DOM | `src/ui/menu.ts`, `overlays.ts`, `help.ts`, `dom.ts`, `theme.ts`, `fonts.ts` | menus, pausa, ajuda, cores lidas do CSS | reaproveite a estrutura; troque o texto |
| Estilo | `src/styles/main.css` (tokens em `:root`) | cores, fontes, espaçamentos | troque os tokens da paleta |
| Pools | `game/fx/particlePool.ts`, `objectPool.ts` | reaproveitam partículas e textos | reaproveite (regra de desempenho) |
| Testes | `tests/`, `tests/contracts/`, `scripts/smoke.cjs` | unitários, contratos e navegador | reaproveite a estrutura |

## 2. Sprites e arte (procedural)

Não há imagem externa: tudo é desenhado por código em `src/textures/`.

- **Como funciona:** cada arquivo desenha uma textura com a API de `Graphics` do Phaser e a registra no `generateTextures` (`textures/index.ts`). Ex.: `roo.ts` (personagem), `enemiesNew.ts` (inimigos), `terrain.ts` (blocos e chão).
- **Utilitários reaproveitáveis:** `textures/outline.ts` (contorno escuro de 1 px), `derive.ts` (variantes de cor), `groups.ts`, `poses.ts` (poses por quadro), `rooRecolor.ts` (troca de cor de um sprite).
- **Catálogo:** `src/sprites.ts` + `sprites.html` mostram todos os sprites em `/sprites.html` no dev. Use-o para revisar arte antes de mexer no jogo.
- **Regra de estilo:** escala inteira, sem girar sprite, sem degradê suave (ver `docs/09-sprites.md`).
- **Para um personagem novo:** crie `textures/<nome>.ts`, registre no `index.ts` e adicione uma linha no catálogo. Os tamanhos em grade estão em `textures/rooGeometry.ts` (exemplo de constantes sem Phaser, testáveis).

## 3. Som

- **Motor:** `audio/AudioEngine.ts` (contexto, flags, agendador da música, API `audio`). Não contém síntese.
- **Primitivas:** `audio/synth.ts` (cadeia com reverb, voz, grão de ruído, sopro). Sem regra de jogo.
- **Efeitos:** `audio/sounds.ts` liga cada evento a um som (`playSfx`). Para um som novo: escreva a função com as primitivas e registre o nome.
- **Músicas:** `audio/tracks.ts` gera faixas procedurais; `SCENE_TRACKS` diz qual faixa toca em cada parte do jogo. Cada execução usa semente nova.
- **Ajuste:** os níveis estão em `AudioEngine.ts` (`master`, `MUSIC_LEVEL`). O `CLAUDE.md` registra que foram medidos com analisador, não por ouvido: teste ao trocar.

## 4. História e textos

- **Textos de tela:** `src/game/story.ts` (cartões de fase, passagens, final), `ui/letter.ts` (carta inicial), `ui/dialogue.ts` (cartões com retrato), `ui/stageIntro.ts` (cartão de entrada de fase).
- **Direção na partida:** `game/StoryDirector.ts` decide quando cada cartão aparece.
- **Roteiro:** escreva o roteiro em `docs/` (o `docs/12-historia.md` é o modelo), e o código só guarda os textos.
- **Regra de conteúdo do projeto:** o `CLAUDE.md` tem regras próprias (ex.: "não citar versículos"; textos em PT-BR). Revise-as antes de reaproveitar: são escolhas deste jogo, não da base.

## 5. O que é conteúdo (troque)

| Conteúdo | Onde está | Cuidado |
|---|---|---|
| Personagens e equilíbrio | `game/entities/profiles.ts`, `config.ts` | a tabela é o único lugar de ajuste |
| Inimigos e chefes | `game/entities/enemies/defs.ts`, `bosses/defs.ts` | registro único; siga `docs/16-guia-de-extensao.md` |
| Fases e capítulos | `game/stages/chapters/`, `stages/index.ts` | a ordem define a numeração do progresso salvo |
| Poções, formas, elementos | `config.ts` (`BOMB_TYPES`), `game/forms/` | os nomes são do jogo (ex.: Enxofre, Mercúrio, Sal, Ar) |
| Nomes e textos | `index.html`, `ui/*`, `story.ts` | PT-BR; o glossário está em `docs/04-glossario.md` |
| Chaves de save | `storage.ts` | **prefixo `bombroo_`**: num jogo novo, use outro prefixo desde o início, senão saves de jogos diferentes se misturam no mesmo navegador |

## 6. Receita: começar um jogo novo a partir desta base

1. **Copie o repositório** para uma pasta nova, sem o histórico do Potion Academy (`rm -rf .git && git init`).
2. **Renomeie o projeto:** `package.json` (nome e versão), `index.html` (título), `CLAUDE.md` (visão geral e regras de conteúdo).
3. **Troque o prefixo das chaves** em `src/storage.ts` (`bombroo_` → o seu). Faça isso antes de qualquer jogador ter save.
4. **Zere o conteúdo:** mantenha um registro de exemplo de cada tipo (um personagem, uma fase, um chefe) para o teste de contrato passar; apague o resto.
5. **Troque a paleta** nas variáveis de `:root` em `styles/main.css` e, no canvas, as cores lidas por `ui/theme.ts`.
6. **Troque a arte:** substitua os desenhos em `textures/` mantendo os nomes de textura que o código usa (ou ajuste as chamadas).
7. **Troque o som:** ajuste `audio/sounds.ts` e `tracks.ts`.
8. **Escreva a história** em `docs/` e os textos em `story.ts`.
9. **Rode `npm run check`** e `npm run smoke` (o smoke testa caminhos do Potion Academy; reescreva os passos para o seu jogo).
10. **Atualize `task.md`** e `docs/` ao terminar cada parte, como neste projeto.

## 7. Avisos de acoplamento

- **Arquitetura:** `tests/contracts/architecture.test.ts` lista exceções do Potion Academy (`PHASER_ADAPTERS`, `SCENE_UI_BASELINE`). Num jogo novo, comece com as listas vazias.
- **Testes de contrato** (`tests/contracts/`) conferem registros deste jogo; apague os que não se aplicam.
- **Desempenho:** `docs/21-desempenho.md` tem as regras de partículas e de redesenho. Mantenha-as.
- **Smoke:** `scripts/smoke.cjs` está escrito para este jogo. Use-o como modelo, não como verificação pronta.
