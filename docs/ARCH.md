# Arquitetura

Documento técnico do Potion Academy. Para regras do jogo, veja `docs/`. Para o estado do trabalho, `task.md`.

## Visão geral

O jogo é uma aplicação web feita com **Phaser 3** (motor 2D) em **TypeScript**, construída com **Vite**. Não há servidor: tudo roda no navegador, e o progresso fica no `localStorage`.

Há duas camadas de interface, que convivem:

- **Canvas (Phaser):** o mundo da partida, a HUD (`HudScene`), o fundo animado do menu e o mapa.
- **DOM (HTML/CSS):** menu principal, loja, pausa, game over, carta, ajuda, sala de música e controles de toque. Ficam por cima do canvas.

```
index.html ──► src/main.ts ──► game/launcher.ts (cria o Phaser.Game uma vez)
                                   │
        ┌──────────────┬───────────┼────────────┬────────────┐
     BootScene      MenuScene   MainScene    MapScene    (DOM: ui/*)
     (texturas)     (animação)  (+HudScene)   (fases)
```

## Cenas e fluxo

| Cena | Arquivo | Papel |
|---|---|---|
| `BootScene` | `scenes/BootScene.ts` | gera as texturas procedurais e avisa `TEXTURES_READY` |
| `MenuScene` | `scenes/MenuScene.ts` | Roo mexendo a poção no caldeirão (só animação; os botões são DOM) |
| `MainScene` | `scenes/MainScene.ts` | a partida: grade, jogador, inimigos, pickups, chefe, regras das fases |
| `HudScene` | `scenes/HudScene.ts` | a faixa da HUD no canvas; roda em paralelo com `MainScene` |
| `MapScene` | `scenes/MapScene.ts` | mapa do castelo com o progresso das fases |

Fluxo de telas: `Boot → Menu → (carta) → Main + Hud`. Ao vencer uma fase, `Main` avança para a próxima (`advanceStage`). Pausa, game over e loja têm botão para voltar ao menu (`showMenu()` em `launcher.ts`).

Navegação em `game/launcher.ts`: `startGame()` (sempre com `{ stage: 1 }` explícito), `retryGame()`, `showMenu()`, `showMap()`.

**Regra de dados em reinício:** o Phaser reaproveita os dados do último `scene.restart()` quando nenhum é passado. Por isso todo reinício passa `{ stage }` (e `carry` na fase 2+).

## Comunicação entre partes

- **`MainScene` → `HudScene`:** por eventos do `game.events`. `HUD_UPDATE` (estado completo, `game/hudState.ts`) e a volta `HUD_SELECT_BOMB` (escolha de frasco por toque ou clique).
- **Entrada:** teclado (`MainScene.setupInput`) e toque (`input/touch.ts`, botões com `data-touch`). `MainScene.handleInput()` consome os dois.
- **DOM → jogo:** `launcher.ts` e `ui/*` chamam funções diretas (ex.: `startGame`, `showMap`).
- **Fim de fase/partida:** `MainScene` chama `markStageCompleted` e as telas de DOM (`ui/overlays.ts`).

## Estado e persistência

`src/storage.ts` é o único ponto que lê e grava no `localStorage`. As chaves são fixas e **não podem ser renomeadas sem migração**:

| Chave | Conteúdo |
|---|---|
| `bombroo_bank` | POÇÃO (moedas) |
| `bombroo_owned` | tipos de bomba comprados |
| `bombroo_audio` | preferência de música e efeitos |
| `bombroo_track` | (antigo) faixa escolhida na sala de música; não é mais lida |
| `bombroo_stages_completed` | fases vencidas (progresso do mapa) |

O estado de uma partida (vida, bombas, gemas, tempo) vive só na `MainScene` e não é salvo.

## Regras puras (testáveis sem Phaser)

A lógica de regra fica em arquivos sem dependência do Phaser, para os testes em `tests/` rodarem em Node:

| Arquivo | Regra |
|---|---|
| `config.ts` | todos os números: fases, inimigos, bombas, chefe, baús |
| `game/boss.ts` | habilidades, áreas de ataque e alvos do chefe |
| `game/chain.ts` | reação entre poções (fogo acende, água apaga, terra é estável) |
| `game/balance.ts` | regra de equilíbrio das poções (nenhuma domina outra) |
| `game/rewards.ts` | tabela de drop e sorteio de baús |
| `game/shopRules.ts` | estados dos cartões da loja |
| `game/bossLines.ts` | textos e sorteio das falas da Belladona |
| `textures/rooGeometry.ts` | constantes de tamanho do sprite da Roo |
| `audio/tracks.ts` | faixas, gerador de compassos e sementes (`mulberry32`) |

Quem usa as regras: `MainScene` e `BossController` (que são o lado Phaser) chamam essas funções e aplicam o resultado na tela.

## Módulos principais

- **`game/BombSystem.ts`:** bombas, explosões e empurrão. A `MainScene` cria o sistema em `create()` e chama `bombSystem.placeBomb()`, `update(delta)` e as outras ações. O chefe chama `bombSystem.spawnExplosion` para as poções dele.
- **`game/BossController.ts`:** Belladona. Uma máquina de estados (`idle`, `casting`, `blinking`, `stunned`, `defeated`) com fases de vida (normal e furiosa). Tempos usam o `delta` do jogo, então pausam com o jogo.
- **`textures/`:** todos os sprites são gerados em código com a API Graphics (sem imagens externas). `make.ts` é a fábrica comum; `index.ts` chama cada gerador. `anselmo.ts` é o personagem novo, com formas em dados e um renderizador próprio.
- **`audio/AudioEngine.ts`:** síntese com WebAudio (osciladores, filtros, reverberação por convolução) e agendador de música. Ver a seção de áudio abaixo.
- **`ui/`:** telas em DOM. `theme.ts` lê as cores das variáveis CSS (`:root`), então o canvas e o DOM usam a mesma paleta.
- **`config.ts` como dados:** `ELEMENTS`, `BOMB_TYPES`, `ENEMY_TYPES`, `STAGES` e as tabelas de baú são dados, e o código lê deles. Mudar balanceamento é mudar dados.

## Áudio

- **Música:** gerada em tempo real. `AudioEngine.schedule()` roda a cada 100 ms e agenda notas até 1 s à frente (`LOOKAHEAD_S`), para não falhar em abas em segundo plano.
- **Efeitos:** `play(nome, elemento?)`, com sons calmos (senoides e triângulos, ataque lento).
- **Carga medida:** a síntese com reverberação custa entre 6% e 9% de um núcleo em tempo real (medido num `OfflineAudioContext`); a reverberação responde por mais da metade.
- **Vazamento corrigido:** cada nota criava nós de ganho que nunca eram desconectados. Agora `release()` desconecta os nós quando o som termina. Testes em `tests/audioLoad.test.ts` verificam isso e o orçamento de notas e vozes.

## Testes

- `npm run test` (Vitest, pasta `tests/`): regras puras, storage, toque, faixas, geometria, carga de áudio.
- `npm run typecheck`: `tsc --noEmit` com `strict`.
- `npm run build`: typecheck e build de produção.
- Visual e comportamento: `npm run dev`, com `window.__game` exposto só em desenvolvimento, e `/sprites.html` para ver os sprites ampliados.

Os testes de regra não usam o navegador. Verificação de jogo (FPS, sons, sensação) é manual, ou feita com Playwright fora do projeto.

## Onde mexer

| Quero mudar | Arquivo |
|---|---|
| números do jogo | `src/config.ts` |
| regras da fase | `src/scenes/MainScene.ts` (e `game/*` quando puro) |
| chefe | `src/game/BossController.ts`, `src/game/boss.ts`, `src/game/bossLines.ts` |
| sprites | `src/textures/*.ts` (ver `docs/09-sprites.md`) |
| menu, loja, pausa | `src/scenes/MenuScene.ts`, `src/ui/*`, `index.html` |
| música e sons | `src/audio/AudioEngine.ts`, `src/audio/tracks.ts` |
| cores e layout | `src/styles/main.css` |

## Pontos de atenção

- **`MainScene.ts` tem cerca de 1.200 linhas.** Ainda concentra pickups, inimigos, sono, câmera e HUD. As bombas já saíram para `BombSystem`. Ver a proposta de divisão abaixo.
- **Lentidão:** o vazamento de nós de áudio foi a causa confirmada. A medição do FPS no navegador de teste ficou em 60, então outros gargalos só aparecem em máquinas reais.
- **Pendências de jogo:** ver `task.md`.

## Proposta de divisão da `MainScene`

Padrão recomendado: **composição com um mediador**. A `MainScene` continua sendo a cena e o ponto de entrada, mas delega cada assunto a um objeto próprio que recebe a cena no construtor:

| Subsistema | Responsabilidade | Métodos atuais |
|---|---|---|
| `PickupSystem` | sorteio, baús, coleta, portas | `spawnReward`, `collectPickup`, `openDoor` |
| `EnemySystem` | criação, movimento, dano, flor | `spawnEnemies`, `moveEnemy`, `updateFlower`, `hitEnemy` |
| `SleepSystem` | sono da Roo na menu e no tempo parado | `updateSleep`, `wake`, `spawnZzz` |

Por que este padrão e não outro:
- **Por que dividir:** um arquivo de 1.400 linhas é difícil de mudar com segurança, e cada regra depende de muitas outras.
- **Por que composição:** o jogo tem poucos tipos de objeto, sem muitas hierarquias; uma classe por assunto é suficiente.
- **Por que não ECS (entidades e componentes):** seria uma reescrita grande para um jogo deste tamanho, sem ganho claro.
- **Por que não mais padrões:** o projeto já usa os que fazem sentido: **Observer** (`game.events` entre cenas), **State** (chefe), **Factory** (`make.ts` para texturas) e **dados em tabelas** (`config.ts`) no lugar de subclasses por tipo de inimigo ou bomba.

A divisão deve ser feita em etapas pequenas, uma por vez, cada uma com testes para as regras que sair da cena. **Aplicado:** `BombSystem`. **Falta:** `PickupSystem`, `EnemySystem` e `SleepSystem`.
