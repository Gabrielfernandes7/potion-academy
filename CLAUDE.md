# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Potion Academy** (código/pasta ainda chamados "Bomb Roo") is an HTML5 browser game using Phaser 3.90.0, written in TypeScript and built with Vite.

- **Language**: TypeScript (strict), ES modules
- **Framework**: Phaser 3.90.0 (npm dependency, pinned exactly)
- **Build**: Vite 7; tests with Vitest
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

Game state is persisted in `localStorage` under `bombroo_bank` (coins) and `bombroo_owned` (bought bomb types). **Do not rename these keys without a migration**: existing players would lose progress. They are centralized in `src/storage.ts`.

## Project Layout

```
index.html                 # markup das HUDs e overlays (DOM), sem lógica
src/
  main.ts                  # liga botões do DOM ao jogo
  config.ts                # CONFIG, ELEMENTS, BOMB_TYPES, BOMB_ORDER (balanceamento)
  storage.ts               # Storage, Bank, owned bombs (localStorage)
  audio/AudioEngine.ts     # música e efeitos sintetizados (WebAudio)
  textures/                # texturas procedurais (terrain, potions, roo, entities)
  scenes/BootScene.ts      # gera texturas e inicia Main
  scenes/MainScene.ts      # gameplay
  game/types.ts            # interfaces de Player, Bomb, Pickup, Enemy, Explosion
  game/rewards.ts          # tabela de drop (rollReward)
  game/launcher.ts         # cria o Phaser.Game (uma vez) e reinicia a cena
  ui/dom.ts                # helpers de DOM (byId, setShown)
  ui/hud.ts                # HUD em DOM
  ui/overlays.ts           # pausa e game over
  ui/shop.ts               # Caldeirão de Magia (loja)
  styles/main.css          # todo o CSS
tests/                     # testes unitários (lógica pura e storage)
```

## Theme and Gameplay

- Alchemy/potion theme: the character is a witch kangaroo ("Broomstick Roo"); bombs are potions; the HUD calls coins "POÇÃO"; the shop is the "Caldeirão de Magia".
- Time-limited (90s) Bomberman-style dungeon crawl on a 15x13 grid: destroy blocks, collect 3 gems to open the door, reach the door to win. After time runs out, the player takes periodic overtime damage.
- 4 bomb types tied to alchemical elements: Fire (normal), Water (mega), Earth (pierce), Air (remote, detonated with `D`). Elements are currently cosmetic (color/radius only).
- Controls: arrows move, `Space` bomb, `X` push ability (kicks the bomb you face, 3s cooldown), `D` remote detonate, `1-4` select bomb, `Enter` pause, `R` restart.
- Power-ups dropped by blocks: +bomb, +radius, +speed, +15s, hearts, chests, coins, gems. Three gem-carrying blocks are chosen at level start (`assignHiddenGems`) so the door can always be opened.
- Enemies wander randomly; more spawn as blocks are destroyed (`enemySpawnEvery`, `maxEnemies`).

## Key Technical Patterns

**Scenes**: `BootScene` generates all textures, then starts `MainScene`. `scene.restart()` re-runs `MainScene.init()`, which resets all per-run state (and hides the pause overlay).

**Game flow / UI**: Shop, pause and game-over screens are DOM overlays (`#shop-overlay`, `#pause-overlay`, `#gameover-overlay`) outside the canvas; the HUD is DOM too. Overlay DOM code lives in `src/ui/`; markup and CSS stay in `index.html` and `src/styles/main.css`. `MainScene.update()` returns early while the shop is open (`isShopOpen()`) and does nothing after `gameOver`/`won` except handle `R`. Keep that guard order when editing `update()`/`handleInput()`.

**Grid vs. visual position**: `player.gridX/gridY` and enemy `gridX/gridY` change when a move *starts*; the sprite tweens afterwards. Damage checks use the sprite position (player tile from `playerSprite.x/y`, enemy contact by sprite distance) so hits match what is on screen. Pickups, bombs and win check still use grid coordinates.

**Procedural Graphics**: All sprites (Roo character frames `roo_*`, potions, blocks, enemies, pickups) are generated with the Phaser Graphics API in `src/textures/`. No external image assets.

**Audio Engine**: `AudioEngine` synthesizes everything with WebAudio. Music (`enabled`/`playing`) and sound effects (`sfx`) are independent flags; `sfx` is turned on by the first click on "COMEÇAR". Win/game-over jingles are `playWinMusic()` / `playGameOverMusic()`; effects are `play('bomb'|'explosion'|'pickup'|'powerup'|'hurt'|'door')`.

**Game Constants**: Tuning lives in `src/config.ts`: `CONFIG`, `ELEMENTS`, `BOMB_TYPES`, `BOMB_ORDER`. Modify these when balancing.

## Known Gaps / Ideas (not implemented)

- Elements have no gameplay effect. Bombs are limited to 2 at a time (up to 6 with power-ups), and the remote bomb counts toward that limit until detonated. `mega` dominates `normal`.
- Single level, no progression or high score; shop has only 3 one-time items.
- Enemies don't chase; only one enemy type.
- No touch controls; canvas is fixed at 600x520 (consider `Phaser.Scale.FIT`).
- Planned: restyle the Caldeirão shop (`src/ui/shop.ts` + CSS in `src/styles/main.css`).
