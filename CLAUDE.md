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
index.html                 # markup: topbar, canvas, controles de toque, overlays (loja, pausa, game over)
src/
  main.ts                  # layout (vars CSS do canvas, modo toque) e botões do DOM
  config.ts                # CONFIG, CANVAS, ELEMENTS, BOMB_TYPES, BOMB_ORDER (balanceamento)
  storage.ts               # Storage, Bank, owned bombs (localStorage)
  audio/AudioEngine.ts     # música e efeitos sintetizados (WebAudio)
  input/touch.ts           # entrada por toque (d-pad e botões em DOM -> jogo)
  textures/                # texturas procedurais (terrain, potions, roo, entities, hud)
  scenes/BootScene.ts      # gera texturas e inicia Main
  scenes/MainScene.ts      # gameplay (câmera deslocada abaixo da HUD)
  scenes/HudScene.ts       # HUD dentro do canvas (cena paralela, por cima)
  game/types.ts            # interfaces de Player, Bomb, Pickup, Enemy, Explosion
  game/rewards.ts          # tabela de drop (rollReward)
  game/hudState.ts         # contrato de eventos MainScene <-> HudScene, timerView
  game/shopRules.ts        # estados dos cartões da loja (puro, testável)
  game/launcher.ts         # cria o Phaser.Game (uma vez; escala FIT) e reinicia a cena
  ui/dom.ts                # helpers de DOM (byId, setShown)
  ui/theme.ts              # lê cores/fontes das variáveis CSS para o canvas
  ui/fonts.ts              # espera as fontes antes de criar o canvas
  ui/overlays.ts           # pausa e game over
  ui/shop.ts               # Caldeirão de Magia (loja)
  styles/main.css          # todo o CSS (tokens em :root)
tests/                     # testes unitários (lógica pura, storage, toque)
```

## UI

- **HUD no canvas** (`HudScene`): faixa de `CONFIG.hudHeight` px acima da grade. O canvas tem `CANVAS.height = grade + HUD`. A `MainScene` desloca a câmera com `setViewport(0, hudHeight, ...)`; as coordenadas de mundo da grade continuam começando em (0,0). Para posicionar algo no centro do mundo use `CONFIG.cols/rows * tile / 2`, **não** `camera.centerX/Y` (que inclui o offset do viewport).
- A `MainScene` envia o estado por `game.events` (`HUD_UPDATE`); a HUD devolve a escolha de frasco por `HUD_SELECT_BOMB` (toque/clique nos slots 1-4).
- **Escala responsiva**: `Phaser.Scale.FIT` dentro de `#game`, cujo tamanho é definido por CSS (`--canvas-w/--canvas-h` vêm de `CANVAS`, em `main.ts`).
- **Telas de menu** (loja, pausa, game over) são overlays DOM. Cores e fontes vivem em variáveis CSS (`:root`); o canvas as lê via `ui/theme.ts`, então mude as cores só no CSS.
- **Toque**: `data-touch="up|down|left|right|bomb|push|detonate|pause"` nos botões; `input/touch.ts` guarda o estado e `MainScene.handleInput()` o consome junto com o teclado.
- **Glossário** (use estes nomes em toda a UI): **POÇÃO** = moeda; **FRASCOS** = bombas ativas/limite; **GEMAS**; **BLOCOS**; **TEMPO**; **VIDA** (corações). Os 4 tipos continuam "Poção de Fogo/Aqua/Telúrica/Etérea".
- Sem emojis na UI. Os símbolos alquímicos (△ ▽ ◇ ☿) são glifos do tema e ficam.

## Theme and Gameplay

- Alchemy/potion theme: the character is a witch kangaroo ("Broomstick Roo"); bombs are potions; the shop is the "Caldeirão de Magia".
- Time-limited (90s) Bomberman-style dungeon crawl on a 15x13 grid: destroy blocks, collect 3 gems to open the door, reach the door to win. After time runs out, the player takes periodic overtime damage.
- 4 bomb types tied to alchemical elements: Fire (normal), Water (mega), Earth (pierce), Air (remote, detonated with `D`). Elements are currently cosmetic (color/radius only).
- Controls: arrows move, `Space` bomb, `X` push ability (kicks the bomb you face, 3s cooldown), `D` remote detonate, `1-4` select bomb, `Enter` pause, `R` restart. On touch screens: d-pad + BOMBA/EMPURRAR/DETONAR/PAUSA.
- Idle for `CONFIG.sleepAfterMs` makes Roo fall asleep (eyes closed, floating "z"); any input wakes her.
- Power-ups dropped by blocks: +bomb, +radius, +speed, +15s, hearts, chests, coins, gems. Three gem-carrying blocks are chosen at level start (`assignHiddenGems`) so the door can always be opened.
- Enemies wander randomly; more spawn as blocks are destroyed (`enemySpawnEvery`, `maxEnemies`).

## Key Technical Patterns

**Scenes**: `BootScene` generates all textures, then starts `MainScene`, which launches `HudScene`. `scene.restart()` re-runs `MainScene.init()`, which resets all per-run state (and hides the pause overlay and clears touch input). `HudScene` persists across restarts.

**Game flow**: `MainScene.update()` returns early while the shop is open (`isShopOpen()`) and does nothing after `gameOver`/`won` except handle `R`. Keep that guard order when editing `update()`/`handleInput()`.

**Grid vs. visual position**: `player.gridX/gridY` and enemy `gridX/gridY` change when a move *starts*; the sprite tweens afterwards. Damage checks use the sprite position (player tile from `playerSprite.x/y`, enemy contact by sprite distance) so hits match what is on screen. Pickups, bombs and win check still use grid coordinates.

**Procedural Graphics**: All sprites (Roo character frames `roo_*`, potions, blocks, enemies, pickups, HUD icons) are generated with the Phaser Graphics API in `src/textures/`. No external image assets. The Roo sprites are frozen for now (do not change without being asked).

**Audio Engine**: `AudioEngine` synthesizes everything with WebAudio. Music (`enabled`/`playing`) and sound effects (`sfx`) are independent flags; `sfx` is turned on by the first click on "COMEÇAR". Win/game-over jingles are `playWinMusic()` / `playGameOverMusic()`; effects are `play('bomb'|'explosion'|'pickup'|'powerup'|'hurt'|'door')`.

**Game Constants**: Tuning lives in `src/config.ts`: `CONFIG`, `ELEMENTS`, `BOMB_TYPES`, `BOMB_ORDER`. Modify these when balancing.

## Known Gaps / Ideas (not implemented)

- Elements have no gameplay effect. Bombs are limited to 2 at a time (up to 6 with power-ups), and the remote bomb counts toward that limit until detonated. `mega` dominates `normal`.
- Single level, no progression or high score; shop has only 3 one-time items.
- Enemies don't chase; only one enemy type.
- HUD text is drawn in the canvas, so it is pixel-scaled on very large screens.
- The Phaser bundle is ~1.2 MB (full build); could be trimmed by importing only the used modules.
