# Estrutura do código: entidades, fases e capítulos

Regra de ouro: **lógica pura num arquivo, Phaser em outro.** O que é puro (sorteios, áreas, dano, regras do mapa) é testado em `tests/`; o que desenha e anima só é conferido no jogo.

## Entidades (`src/game/entities/`)
- `damage.ts`: regra de dano por elemento (puro). `profiles.ts`: a tabela de todos os personagens (vida, atributo, fraqueza, resistência, imunidade). É o único lugar para ajustar o equilíbrio.
- `enemies/`: `defs.ts` (dados), `enemyRules.ts` (puro), `EnemySystem.ts` (Phaser).
- `bosses/`: `BossBase.ts` (classe-pai), `common.ts` (puro), e uma pasta por chefe com `*Controller.ts`, `rules.ts` e `lines.ts`.

**Inimigo novo:** (1) id em `EntityId` e linha em `profiles.ts`; (2) tipo em `EnemyKind` e linha em `ENEMY_TYPES` (`enemies/defs.ts`); (3) textura em `src/textures/`; (4) movimento em `EnemySystem.ts` (`MOTION`); (5) use-o nas fases. O teste de `tests/entities/damage.test.ts` confere a tabela.

**Chefe novo:** pasta `bosses/<nome>/` com `rules.ts` (puro, com testes), `lines.ts` e `<Nome>Controller.ts` que estende `BossBase` (só define dano, habilidades, falas e fim); perfil em `profiles.ts`; `boss: '<id>'` na fase (`stages/types.ts`, `BossId`) e o `new` em `MainScene.create()`.

## Fases e capítulos (`src/game/stages/`)
- `chapters/<capítulo>.ts` (hoje `vale`, `torre`, `retorno`): lista as fases do capítulo (`ChapterSpec`). `grouped: true` faz o capítulo aparecer no mapa do vale como um lugar só.
- `index.ts`: junta os capítulos na ordem de `CHAPTER_LIST`. **A ordem define a numeração das fases (1, 2, 3...)** e o intervalo `first..last` de cada capítulo; capítulo e posição ("1/4", "chefe") de cada fase são calculados.
- `types.ts` (tipos), `chests.ts` (tabelas de baú), `mapRules.ts` (puro: fases liberadas e fase atual), `migration.ts` (puro: renumera o progresso salvo quando uma fase é inserida).
- `StageSpec.fog` liga a névoa da fase (`game/effects/Fog.ts`).

**Fase nova:** objeto em `stages` do capítulo. **Capítulo novo:** `chapters/<nome>.ts` e uma linha em `CHAPTER_LIST`. **Inserir fases no meio muda a numeração do progresso salvo** (`bombroo_stages_completed`): aumente `STAGE_SCHEMA` e acrescente o passo em `migration.ts`, e renumere as chaves de `PASSAGE_CARDS` e do `DIARY`.

## Testes
Espelham as pastas: `tests/entities/`, `tests/entities/bosses/`, `tests/stages/`. Os demais ficam em `tests/`.
