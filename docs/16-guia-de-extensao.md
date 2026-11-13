# Guia de extensão: onde mexer quando o jogo cresce

O jogo muda muito nos **personagens, nas formas, nas fases e nos textos**, e quase nada na **estrutura** (cenas, sistemas, telas). Este guia separa as duas coisas: o que é **dado** (você acrescenta uma entrada) e o que é **mecanismo** (quase não se mexe). Depois de qualquer mudança, rode `npm run check`.

## O padrão: um registro por tipo de coisa

Cada tipo de coisa que se multiplica tem **uma lista única**, escrita como `Record<Id, Definição>`. O TypeScript não compila se faltar uma entrada, e os **testes de contrato** (`tests/contracts/`) dizem exatamente o que mais falta.

| O que se multiplica | A lista única | O que ela alimenta sozinha |
|---|---|---|
| **Chefes** | `game/entities/bosses/defs.ts` (metadados) e `registry.ts` (fábrica) | texturas, cartão da Arena, grupo do catálogo de sprites, nascimento, despedida, o que acontece ao vencer |
| **Transformações** da Roo | `game/forms/registry.ts` | máquina de estados, HUD, proibição de poção, textura por estágio, botão de toque |
| **Inimigos comuns** | `game/entities/enemies/defs.ts` | movimento, dano, textura |
| **Personagens (números)** | `game/entities/profiles.ts` | vida, fraqueza, resistência, imunidade, página do Manuscrito |
| **Fases e capítulos** | `game/stages/chapters/<capítulo>.ts` e `CHAPTER_LIST` | numeração, mapa, música, bloco, inimigos |
| **Capítulos ainda selados** | `game/stages/upcoming.ts` | mapa do vale (sem acesso) |
| **Blocos** | `game/stages/blockStyles.ts` + `textures/blocks.ts` | um estilo por fase |
| **Poções** | `config.ts` (`BOMB_TYPES`) | loja, HUD, explosão |
| **Páginas do Manuscrito** | `game/manuscrito.ts` | tabs e cartas |
| **Textos da história** | `game/story.ts` e o `story` de cada fase | cartões, passagens, final |

O que **não** é dado (e quase não muda): `MainScene` (o laço da partida), `BombSystem`, `EnemySystem`, `PickupSystem`, `RooFormSystem` (as formas), `StoryDirector` (cartão de fase, passagens, despedida), `launcher`, as telas em DOM (`ui/`).

## Receitas

### Um chefe novo
1. `game/entities/profiles.ts`: id em `EntityId` e a linha com vida, fraqueza, resistência e imunidade.
2. `game/stages/types.ts`: o id em `BossId`.
3. Pasta `game/entities/bosses/<id>/`: `rules.ts` (puro, com teste), `lines.ts`, `<Id>Controller.ts` (estende `BossBase`; copie o do Leão Verde).
4. `textures/<id>.ts`: `draw<Id>Textures(g, tile)` com `<prefixo>_idle_0/1`, `_cast`, `_hurt`, `_talk_0/1`, `_defeat`.
5. `bosses/defs.ts`: **uma entrada** (perfil, sprite, onde nasce, o que acontece ao vencer, despedida, cartão da Arena).
6. `bosses/registry.ts`: **uma linha** na fábrica.
7. `game/manuscrito.ts`: a página (com `arenaId`); texto à vontade.
8. Se for entrar na campanha: uma fase `kind: 'boss'` com `boss: '<id>'` e a despedida em `story.ts`.

Não é preciso mexer em: `MainScene`, `textures/index.ts`, `arena.ts`, `sprites.ts`. O teste `tests/contracts/bosses.test.ts` confere o resto.

### Uma transformação nova (uma forma da Roo)
1. `game/forms/<forma>.ts`: o `FormDef` (nome, elemento, tecla, perfil por degrau, bônus, poção proibida, habilidade) e as regras puras da habilidade, com teste.
2. `game/forms/types.ts`: o id em `FormId`; `game/forms/registry.ts`: uma linha.
3. `textures/roo<Forma>.ts`: o pintor do sprite (recolore a Roo e põe efeitos por estágio e tremor); uma linha em `FORM_PAINTERS` (`textures/rooFormTextures.ts`).
4. `game/RooFormSystem.ts`: só se a habilidade for nova (um `case` em `useAbility`).
5. `index.html`: botão de toque `data-touch="transform<Forma>"` e a linha na ajuda; `input/touch.ts`: o nome em `TOUCH_NAMES`.
6. `audio/AudioEngine.ts`: o timbre em `transformSound` e em `formEnd`.
7. `game/manuscrito.ts`: a página com `forma: '<id>'`.

### Uma fase ou um capítulo novo
Uma entrada em `stages` do capítulo (ou `chapters/<nome>.ts` + uma linha em `CHAPTER_LIST`, tirando o capítulo de `UPCOMING_CHAPTERS`). Inserir fases no meio **muda a numeração**: aumente `STAGE_SCHEMA` e acrescente o passo em `stages/migration.ts`. Texto: o `story` da fase e, se couber, uma passagem em `PASSAGE_CARDS`.

### Um bloco novo
Um estilo em `blockStyles.ts` (`BlockStyle`, `BLOCK_TEXTURE`, `BLOCK_NAME`) e o desenho em `textures/blocks.ts`. **Nada em forma de cruz** (veja "Respeito à fé").

### Uma página nova (como o Manuscrito ou o catálogo)
Um `.html` na raiz, um `.ts` em `src/pages/` (use `bootPage` e `prepareTextures` de `pages/shared.ts` se precisar das texturas do jogo), uma linha em `vite.config.ts` (`input`). O teste `tests/contracts/html.test.ts` confere os ids e o script.

## Como testar

| Comando | O que faz |
|---|---|
| `npm run test` | os testes de regra pura e de contrato (rápidos) |
| `npm run test:watch` | o mesmo, rodando a cada mudança |
| `npm run typecheck` | os tipos |
| `npm run check` | tipos, testes e o build de produção (rode antes de dizer que acabou) |
| `PW=... npm run smoke` | abre o jogo num navegador (com o `npm run dev` ligado): menu, fase 1, as duas transformações, todos os chefes na Arena e as páginas de apoio |

Regra de ouro: **regra de jogo vive em arquivo puro** (sem Phaser, com teste em `tests/`); o arquivo do Phaser só desenha e liga. Assim o que se muda toda semana (números, habilidades, falas) se testa em milissegundos.

## Respeito à fé

O jogo toca em temas cristãos com reverência (o mosteiro, frei Anselmo, as escrituras). Por isso:
- **Nenhuma cruz em objeto que se destrói, em inimigo, armadilha, bloco ou ficha.** A cruz só aparece onde há reverência: no hábito de frei Anselmo e no mosteiro (a capela do mapa).
- Nenhum símbolo sagrado em algo que explode, queima ou é pisado. Use outras formas: círculos, triângulos, tábuas, selos de anel.
- Nada de piada, paródia ou desfecho que ridicularize a fé. A história não prega (regra de roteiro 1), mas também não zomba.
- O formato de explosão em "cruz" (quatro direções) é geometria de jogo, não símbolo; as fichas e os desenhos **não** o representam como cruz.
