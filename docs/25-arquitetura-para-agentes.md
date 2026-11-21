# Arquitetura para agentes e pessoas

Guia curto para trabalhar no código sem quebrar o que já funciona. Complementa `docs/ARCH.md` (visão geral), `docs/14-estrutura-do-codigo.md` (onde fica cada coisa) e `docs/16-guia-de-extensao.md` (receitas). Este documento trata do **padrão** e das **regras que os testes garantem**.

## 1. O padrão: núcleo puro, casca Phaser

Todo comportamento do jogo tem duas partes:

| Parte | Onde | Pode importar Phaser? | Como é testada |
|---|---|---|---|
| **Regra** (sorteio, dano, área, progresso, máquina de estados) | arquivo puro, ex.: `grid.ts`, `movement.ts`, `entities/damage.ts`, `forms/RooForm.ts` | **não** | `tests/` em Node, sem navegador |
| **Ligação** (sprites, tweens, input, eventos, sons) | `*System.ts`, `*Controller.ts`, `MainScene.ts`, `scenes/` | sim | jogo rodando (`npm run smoke`) |

A ligação chama a regra; a regra não sabe que existe Phaser. Quando a regra precisa de algo do mundo (aleatório, tempo, posição), recebe como parâmetro (ex.: `roll` injetável em `buildTiles`).

## 2. Padrões que já existem (use-os, não invente outro)

- **Registro único.** Uma lista por tipo de coisa. Adicionar = uma linha.
  - Personagens: `entities/profiles.ts`
  - Inimigos: `entities/enemies/defs.ts` (`ENEMY_TYPES`)
  - Chefes: `entities/bosses/defs.ts` e `registry.ts`
  - Formas da Roo: `forms/registry.ts`
  - Capítulos e fases: `stages/index.ts` (`CHAPTER_LIST`)
  - Poções: `config.ts` (`BOMB_TYPES`, `BOMB_ORDER`)
- **Classe-base com ganchos.** `BossBase` define o ciclo; cada chefe só preenche dano, habilidades, falas e fim.
- **Sistema por assunto.** `BombSystem`, `PickupSystem`, `SleepSystem`, `EnemySystem`, `RooFormSystem`: cada um cuida de um assunto e recebe a cena. A `MainScene` só delega.
- **Reservatório.** Emissores de partícula e objetos de texto são reaproveitados (`game/fx/particlePool.ts`, `objectPool.ts`). Nunca crie um por efeito (ver `docs/21-desempenho.md`).
- **Estado persistido em um lugar.** Só `src/storage.ts` lê e grava `localStorage`. As chaves não são renomeadas sem migração.
- **Eventos entre cena e HUD.** `game/hudState.ts` define o contrato (`HUD_UPDATE`, `HUD_SELECT_BOMB`).

## 3. Regras que os testes garantem

`tests/contracts/architecture.test.ts` verifica, por imports de valor (não `import type`):

1. **Só os arquivos de ligação importam `phaser`.** A lista `PHASER_ADAPTERS` é o conjunto atual. Um arquivo novo em `src/game` que importe Phaser falha o teste.
2. **`src/game` não importa `scenes/` nem `ui/`** além da linha de base (`SCENE_UI_BASELINE`). Essa linha de base só encolhe: se uma dependência some, o teste pede para tirá-la da lista.
3. **A lista não tem entradas obsoletas.** Assim, o teste mantém a lista exata.

Essas regras são a linha de base de hoje. Qualquer exceção nova precisa de justificativa escrita no próprio arquivo de teste.

## 4. Receitas

**Adicionar uma regra nova (ex.: nova forma de dano).**
1. Escreva a função pura em arquivo sem Phaser (ou em `*Rules.ts` ao lado do sistema).
2. Escreva o teste em `tests/` antes de ligar ao Phaser.
3. Ligue no sistema (`*System.ts`). Se o arquivo ainda não importava Phaser e agora precisa, registre-o em `PHASER_ADAPTERS` com um comentário.

**Refatorar um arquivo grande (ex.: `MainScene.ts`, 976 linhas).**
1. Identifique um bloco que só calcula (sem `this.add`, `this.tweens`, `this.time`).
2. Mova o cálculo para arquivo puro e cubra com teste.
3. A cena passa a chamar o puro. Rode `npm run check`.
4. Repita bloco a bloco. Cada passo deve deixar o jogo funcionando; não misture refatoração com regra nova.

**Ao mexer em `src/game` por um agente:** antes de editar, leia o arquivo alvo e o registro do assunto. Ao terminar, rode `npm run check` (tipos, testes, build). Se um teste de contrato falhar, não ajuste a lista para passar: a dependência nova é o problema.

## 5. Checklist antes de dar por pronto

- [ ] `npm run check` passa (tipos, testes incluindo `tests/contracts/`, build).
- [ ] Nenhuma regra nova depende de Phaser sem estar num arquivo de ligação.
- [ ] Textos novos em PT-BR, sem versículos, sem emojis na UI.
- [ ] Nenhum emissor, imagem ou texto criado por efeito (use os reservatórios).
- [ ] Chaves de `localStorage` mantidas (ou migração feita em `storage.ts`).
- [ ] `task.md` atualizado (regra do `CLAUDE.md`).

## 6. Próximas etapas sugeridas (ainda não feitas)

Esta seção lista o que vale fazer em seguida, em ordem de risco crescente. Nenhuma foi executada além dos testes de contrato acima.

1. **`MainScene.ts` (976 linhas, 42 imports).** Separar o que é regra de fase (vida, tempo, objetivo) do que é ligação de cena.
2. **`RooFormSystem.ts` (949 linhas).** Separar a máquina de estados (já em `forms/RooForm.ts`) da parte visual, para que as regras de forma também sejam testadas sem Phaser.
3. **`MapScene.ts` (684 linhas).** Mover a regra de desbloqueio para `stages/mapRules.ts` (já existe) e deixar a cena só desenhar.
4. **Remover `import` de valor de Phaser em `types.ts`** trocando por `import type`, para que o tipo não crie dependência em tempo de execução.
5. **Reduzir `SCENE_UI_BASELINE`:** `PlayerController` e `StoryDirector` dependem de `ui/` para feedback (vibração e diálogo); isso pode virar um evento em `game/events.ts`.
