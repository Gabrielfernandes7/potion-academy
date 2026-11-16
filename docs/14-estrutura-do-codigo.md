# Estrutura do código: entidades, fases e capítulos

Regra de ouro: **lógica pura num arquivo, Phaser em outro.** O que é puro (sorteios, áreas, dano, regras do mapa) é testado em `tests/`; o que desenha e anima só é conferido no jogo.

## Entidades (`src/game/entities/`)
- `damage.ts`: regra de dano por elemento (puro). `profiles.ts`: a tabela de todos os personagens (vida, atributo, fraqueza, resistência, imunidade). É o único lugar para ajustar o equilíbrio.
- `enemies/`: `defs.ts` (dados), `enemyRules.ts` (puro), `EnemySystem.ts` (Phaser).
- `bosses/`: `BossBase.ts` (classe-pai), `common.ts` (puro), `defs.ts` (lista única de chefes), `registry.ts` e uma pasta por chefe (belladonna, mandrake, chimera, lion, ouroboros) com `*Controller.ts`, `rules.ts` e `lines.ts`.

**Inimigo novo:** (1) id em `EntityId` e linha em `profiles.ts`; (2) tipo em `EnemyKind` e linha em `ENEMY_TYPES` (`enemies/defs.ts`); (3) textura em `src/textures/`; (4) movimento em `EnemySystem.ts` (`MOTION`); (5) use-o nas fases. O teste de `tests/entities/damage.test.ts` confere a tabela.

**Chefe novo:** pasta `bosses/<nome>/` com `rules.ts` (puro, com testes), `lines.ts` e `<Nome>Controller.ts` que estende `BossBase` (só define dano, habilidades, falas e fim); perfil em `profiles.ts`; `boss: '<id>'` na fase (`stages/types.ts`, `BossId`) e o `new` em `MainScene.create()`.

## Fases e capítulos (`src/game/stages/`)
- `chapters/<capítulo>.ts` (`vale`, `torre`, `biblioteca`, `observatorio` e `retorno`, nesta ordem em `CHAPTER_LIST`; 4 fases cada, 20 no total): lista as fases do capítulo (`ChapterSpec`). `grouped: true` faz o capítulo aparecer no mapa do vale como um lugar só.
- `index.ts`: junta os capítulos na ordem de `CHAPTER_LIST`. **A ordem define a numeração das fases (1, 2, 3...)** e o intervalo `first..last` de cada capítulo; capítulo e posição ("1/4", "chefe") de cada fase são calculados.
- `types.ts` (tipos), `chests.ts` (tabelas de baú), `mapRules.ts` (puro: fases liberadas e fase atual), `migration.ts` (puro: renumera o progresso salvo quando uma fase é inserida).
- `StageSpec.fog` liga a névoa da fase (`game/effects/Fog.ts`).

**Fase nova:** objeto em `stages` do capítulo. **Capítulo novo:** `chapters/<nome>.ts` e uma linha em `CHAPTER_LIST`. **Inserir fases no meio muda a numeração do progresso salvo** (`bombroo_stages_completed`): aumente `STAGE_SCHEMA` e acrescente o passo em `migration.ts`, e renumere as chaves de `PASSAGE_CARDS` e do `DIARY`.

## Formas, aprendizado e Arena
- `forms/`: as quatro transformações (puro): `registry.ts` (uma linha por forma), `RooForm.ts` (máquina de estados), `fire.ts`, `water.ts`, `earth.ts`, `air.ts` e `defense.ts`. `RooFormSystem.ts` (Phaser) as liga à partida.
- `learning.ts`: poções (fim de fase) e lições das formas; `loadout.ts`: quais poções valem (todas na Arena).
- `arena.ts` e `duel.ts`: a Arena de treino e o duelo de chefes. `StoryDirector.ts`, `story.ts`, `stageArt.ts`: história e gravuras de fase.

## Testes
Espelham as pastas: `tests/entities/`, `tests/entities/bosses/`, `tests/stages/`, `tests/forms/`, `tests/effects/`; `tests/contracts/` confere que registros, HTML e textos continuam ligados. Os demais ficam em `tests/`.

## Regras de partida (`src/game/`, puras)
- `grid.ts`: muralha, área de nascimento (com canto do chefe), sorteio da grade (`buildTiles`, com `roll` injetável), porta e `isPassable` (o que bloqueia uma casa).
- `movement.ts`: velocidade, passo casa a casa com tempo que sobra (`beginStep`/`advanceStep`), direção (`facingFor`) e animação de caminhada.
- `stageFlow.ts`: o que a Roo leva para a fase seguinte (`startingState`, `carryForward`) e o que a porta decide (`doorOutcome`).

A `MainScene` só liga esses módulos ao Phaser (sprites, tweens, input). Os testes estão em `tests/grid.test.ts`, `tests/movement.test.ts` e `tests/stageFlow.test.ts`.

## Áudio (`src/audio/`)
- `AudioEngine.ts`: a API `audio` usada pelo jogo (flags, música, `play`). Não contém síntese.
- `synth.ts`: primitivas do WebAudio (cadeia com reverb, `voice`, `grain`, `crackle`, `breath`). Sem regra de jogo.
- `sounds.ts`: quais sons tocam para cada evento (`playSfx`), o som de cada elemento e as fanfarras de vitória e derrota.
- `tracks.ts`: as seis faixas e o gerador de compassos (puro).

**Efeito novo:** acrescente o nome em `SfxName` e um `case` em `playSfx` (sounds.ts). **Elemento novo:** um `case` em `elementSound` e outro em `transformSound`, se a forma tiver som próprio.
