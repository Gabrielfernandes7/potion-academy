# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Potion Academy** (código/pasta ainda chamados "Bomb Roo") is an HTML5 browser game using Phaser 3.90.0, written in TypeScript and built with Vite.

- **Language**: TypeScript (strict), ES modules
- **Framework**: Phaser 3.90.0 (npm dependency, pinned exactly)
- **Build**: Vite 7; tests with Vitest
- **Fonts**: Cinzel (títulos) e Nunito (corpo), self-hosted via `@fontsource/*` (sem CDN)
- **Localization**: Portuguese (Brazilian). All UI and game text is hardcoded in PT-BR; keep new text in PT-BR.
- **Entry**: `index.html` → `src/main.ts`

## Commands

```bash
npm install
npm run dev        # servidor de desenvolvimento (Vite)
npm run typecheck  # tsc --noEmit
npm run build      # typecheck + build de produção em dist/
npm run test       # Vitest (tests/)
```

Em `npm run dev`, o jogo fica exposto em `window.__game` (só em desenvolvimento) para inspeção por console/testes. Abra `/?touch` para ver os controles de toque no desktop.

Game state is persisted in `localStorage` under `bombroo_bank` (coins) and `bombroo_owned` (bought bomb types). **Do not rename these keys without a migration**: existing players would lose progress. They are centralized in `src/storage.ts`.

## Project Layout

```
index.html                 # markup: topbar, canvas + menu, controles de toque, overlays (loja, pausa, game over)
src/
  main.ts                  # layout (vars CSS do canvas, modo toque), botões do DOM, nome da faixa
  config.ts                # CONFIG, CANVAS, ELEMENTS, BOMB_TYPES, BOMB_ORDER (balanceamento)
  storage.ts               # Storage, Bank, owned bombs (localStorage)
  audio/AudioEngine.ts     # WebAudio: cadeia suave + reverb, efeitos calmos, música por faixas
  audio/tracks.ts          # faixas procedurais e gerador de compassos (puro, testável)
  input/touch.ts           # entrada por toque (d-pad e botões em DOM -> jogo)
  textures/                # texturas procedurais (terrain, potions, roo, entities, hud, menu)
  textures/rooGeometry.ts  # constantes do sprite da Roo (sem Phaser, testável)
  textures/witch.ts        # sprite da Belladona (chefe)
  sprites.ts + sprites.html # catálogo de todos os sprites (abra /sprites.html no dev)
  scenes/BootScene.ts      # gera texturas e abre o menu
  scenes/MenuScene.ts      # menu: Roo mexendo uma poção no caldeirão (animado)
  scenes/MainScene.ts      # gameplay (câmera deslocada abaixo da HUD)
  scenes/HudScene.ts       # HUD dentro do canvas (cena paralela, por cima)
  game/types.ts            # interfaces de Player, Bomb, Pickup, Enemy, Explosion
  game/rewards.ts          # tabela de drop (rollReward), texturas e brilho dos itens
  game/hudState.ts         # contrato de eventos MainScene <-> HudScene, timerView
  game/shopRules.ts        # estados dos cartões da loja (puro, testável)
  game/boss.ts             # regras puras do chefe: habilidades, áreas, alvos (testável)
  game/BossController.ts   # Belladona: movimento, ataques com aviso, dano, fúria, derrota
  game/balance.ts          # regra de equilíbrio das poções (testável)
  game/events.ts           # eventos globais (TEXTURES_READY)
  game/launcher.ts         # cria o Phaser.Game ao abrir a página; navegação menu/partida
  ui/dom.ts                # helpers de DOM (byId, setShown)
  ui/theme.ts              # lê cores/fontes das variáveis CSS para o canvas
  ui/fonts.ts              # espera as fontes antes de iniciar a partida
  ui/menu.ts               # menu principal em DOM (por cima do canvas)
  ui/help.ts               # janela "Como jogar" (botão ?)
  ui/overlays.ts           # pausa e game over
  ui/shop.ts               # Caldeirão de Magia (loja)
  styles/main.css          # todo o CSS (tokens em :root)
tests/                     # testes unitários (lógica pura, storage, toque, faixas, geometria)
```

## UI

- **Fluxo de telas**: `Boot` -> `Menu` (animada, título e botões em DOM por cima) -> `Main` (+ `Hud` em paralelo). O `Phaser.Game` é criado ao abrir a página (`bootGame()`); `startGame()` troca Menu por Main; `showMenu()` volta (pausa, game over e loja têm botão para o menu). No menu, `Enter` inicia o jogo; na partida, `Enter` é pausa.
- **HUD no canvas** (`HudScene`): faixa de `CONFIG.hudHeight` px acima da grade. O canvas tem `CANVAS.height = grade + HUD`. A `MainScene` desloca a câmera com `setViewport(0, hudHeight, ...)`; as coordenadas de mundo da grade continuam começando em (0,0). Para posicionar algo no centro do mundo use `CONFIG.cols/rows * tile / 2`, **não** `camera.centerX/Y` (que inclui o offset do viewport).
- A `MainScene` envia o estado por `game.events` (`HUD_UPDATE`); a HUD devolve a escolha de frasco por `HUD_SELECT_BOMB` (toque/clique nos slots 1-4).
- **Escala responsiva**: `Phaser.Scale.FIT` dentro de `#game`, cujo tamanho é definido por CSS (`--canvas-w/--canvas-h` vêm de `CANVAS`, em `main.ts`).
- **Telas de menu** (menu, loja, pausa, game over) são DOM. Cores e fontes vivem em variáveis CSS (`:root`); o canvas as lê via `ui/theme.ts`, então mude as cores só no CSS.
- **Toque**: `data-touch="up|down|left|right|bomb|push|detonate|pause"` nos botões; `input/touch.ts` guarda o estado e `MainScene.handleInput()` o consome junto com o teclado.
- **Glossário** (use estes nomes em toda a UI): **POÇÃO** = moeda; **FRASCOS** = bombas ativas/limite (ex.: "+1 FRASCO"); **GEMAS**; **BLOCOS**; **TEMPO**; **VIDA** (corações). Os 4 tipos continuam "Poção de Fogo/Aqua/Telúrica/Etérea".
- Sem emojis na UI. Os símbolos alquímicos (△ ▽ ◇ ☿) são glifos do tema e ficam.

## Estado do trabalho

Antes de começar, leia `task.md`: ele lista o que está em aberto, as armadilhas já encontradas e como testar. Atualize-o ao fim de cada tarefa.

## Game Design Documentation

Sprites: veja `docs/09-sprites.md` (e `/sprites.html`). Equilíbrio: veja `docs/10-equilibrio.md`; ao mudar números, rode `npm run test`.

O conteúdo do jogo (regras, personagens, glossário, decisões) está em `docs/`. Antes de mudar regras ou nomes, leia `docs/README.md` e os arquivos relevantes. Use sempre os nomes do `docs/04-glossario.md` em textos e telas. Ao criar uma mecânica, siga `docs/08-como-criar-uma-mecanica.md` e registre a decisão em `docs/06-decisoes.md`.

## Key Technical Patterns

**Fases e reinício**: a `MainScene` recebe `{ stage: 1 }` ou `{ stage: 2, carry }`. **Sempre passe os dados explicitamente** ao reiniciar (`scene.restart({ stage: 1 })`): sem eles o Phaser reaproveita os do reinício anterior e voltaria à fase 2. Na fase 2 não há porta, gemas nem inimigos comuns; `BossController` cuida da Belladona, que só perde vida por `onExplosion()` de poções da jogadora. Todos os tempos do chefe usam o `delta` do jogo (não timers do navegador), então pausam junto.

**Janela de ajuda**: com `isHelpOpen()`, `MainScene.update()` congela tudo (tweens, animações, entrada) e zera as teclas, para nada acontecer ao fechar.

**Scenes**: `MainScene` launches `HudScene`. `scene.restart()` re-runs `MainScene.init()`, which resets all per-run state (hides the pause overlay, clears touch input and picks a new music track). `HudScene` persists across restarts and is stopped together with `Main` when going back to the menu.

**Game flow**: `MainScene.update()` returns early while the shop is open (`isShopOpen()`) and does nothing after `gameOver`/`won` except handle `R`. Keep that guard order when editing `update()`/`handleInput()`.

**Grid vs. visual position**: `player.gridX/gridY` and enemy `gridX/gridY` change when a move *starts*; the sprite tweens afterwards. Damage checks use the sprite position (player tile from `playerSprite.x/y`, enemy contact by sprite distance) so hits match what is on screen. Pickups, bombs and win check still use grid coordinates.

**Procedural Graphics**: All sprites are generated with the Phaser Graphics API in `src/textures/`. No external image assets.
- *Roo* (`textures/roo.ts`): poses `awake` (walk, 4 frames x 3 directions), `sleep` and `stir` (menu). The texture is `ROO_HEAD_ROOM` px taller than the tile so ears and hat are not clipped; the player sprite therefore uses `setOrigin(0.5, rooOriginY(tile))`. The cape is drawn *after* the body so it covers it (front: two flaps with the pouch showing; back: full cloak; side: hangs from the shoulders). The wand is held at the side, never over the face.
- *Power-ups* (`textures/entities.ts`): round tokens with a colored rim (`POWERUP_COLORS`) and a symbol. Power-ups and gems get a soft pulsing halo (`PICKUP_HALO`, created in `spawnPickupSprite`, destroyed in `collectPickup`).

**Audio Engine**: `AudioEngine` synthesizes everything with WebAudio, aiming for calm: only sine/triangle voices with slow attacks, a low-pass filter, a generated-impulse reverb and a gentle compressor. Music (`enabled`/`playing`) and sound effects (`sfx`) are independent flags. The player's choice is kept in `audio/prefs.ts` (`bombroo_audio`, default both on) and applied by `main.ts` (`applyMusicPref`/`applySfxPref`); the top bar has MÚSICA and EFEITOS buttons. `audio.unlock()` runs on any pointer or key press. Effects: `play('bomb'|'explosion'|'pickup'|'powerup'|'hurt'|'door', element?)`. The explosion sound depends on the element (`elementSound()`): fire = flame hiss and crackles (sulfur), water = heavy drops (mercury), earth = crystal crackle (salt), air = soft hum of a glowing gas (ether). Win/game-over jingles: `playWinMusic()` / `playGameOverMusic()`.
- *Music*: `audio/tracks.ts` holds the tracks (key, scale, tempo, chord progression) and `generateBar()`. Every game (`MainScene.init` -> `audio.nextTrack()`) picks a track different from the last and a new random seed, so even the same track varies. The topbar shows the current track name (`audio.onTrackChange`).

**Game Constants**: Tuning lives in `src/config.ts`: `CONFIG`, `ELEMENTS`, `BOMB_TYPES`, `BOMB_ORDER`. Modify these when balancing.

## Known Gaps / Ideas (not implemented)

- Elements react only through bomb chains (`game/chain.ts`): fire ignites, water neutralizes fire, earth is immune. Fire explosions leave no lasting flames yet. Bombs are limited to 2 at a time (up to 5 with power-ups), and the remote bomb counts toward that limit until detonated.
- Four stages with an ending (garden gate), but no story text, high score or saved stage progress; shop has only 3 one-time items.
- Enemies don't chase (frog, ghost, flower). There is no per-stage unlock of potions: the Aqua potion must be bought in the shop to use the new water mechanic.
- HUD text is drawn in the canvas, so it is pixel-scaled on very large screens.
- The Phaser bundle is ~1.2 MB (full build); could be trimmed by importing only the used modules.
- Audio levels were verified with an analyser, not by ear: tune `master`/`MUSIC_LEVEL` in `AudioEngine.ts` if it feels too quiet or loud.
