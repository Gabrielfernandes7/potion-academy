# Equilíbrio

Equilibrar é escolher os números para o jogo ser **calmo, mas com desafio**. Todos os números ficam em `src/config.ts`.

## Metas

1. Cada poção precisa ter um motivo para ser usada (nenhuma melhor em tudo).
2. Liberar as 3 poções da loja deve levar **cerca de 6 a 7 partidas**.
3. A fase 1 deve ser vencível em 90 s por quem está aprendendo, sem pressa constante.
4. A Belladona deve ser vencida em **2 a 4 tentativas**, e perder deve parecer erro do jogador (por isso todo ataque tem aviso).

## Poções

| Poção | Alcance | Casas atingidas | Fusível | Custo | Vantagem | Desvantagem |
|---|---|---|---|---|---|---|
| Fogo | 2 | 9 | 2,0 s | 0 | rápida | alcance pequeno |
| Aqua | 3 | 13 | 2,4 s | 60 | alcance maior | fusível mais lento |
| Telúrica | 2 | 9 | 2,2 s | 90 | atravessa caixotes | mais lenta que a de Fogo |
| Etérea | 2 | 9 | manual | 120 | você escolhe quando | ocupa um frasco até o D |

Antes, a Aqua tinha alcance 4 e a Telúrica e a Etérea alcance 3, então a Aqua era melhor que a Fogo em tudo. O teste `tests/balance.test.ts` agora garante que **nenhuma poção domina outra** (`dominates` em `src/game/balance.ts`).

## Itens e limites

| Item | Antes | Agora | Por quê |
|---|---|---|---|
| +Frasco | até 6 poções | até 5 | com 6 poções a tela enchia de explosões |
| +Raio | 4 níveis | 3 | alcance 3 + 3 níveis já cobre quase o mapa |
| +Velocidade | 3 níveis | 2 | com 3 níveis a Roo corria mais que os inimigos o tempo todo |
| Baú | +2 vida | +1 | curar 2 anulava o perigo da fase |

## Economia (estimativa)

- Uma partida boa rende cerca de **40 POÇÃO** (moedas ≈ 18, baús ≈ 20, inimigos ≈ 3).
- Liberar tudo custa 60 + 90 + 120 = **270** → 6 a 7 partidas. Vencer a Belladona dá **+40**.

## Chefe

| Número | Valor | Efeito de mudar |
|---|---|---|
| `bossHp` | 8 | mais vida = duelo mais longo |
| `bossTelegraphMs` | 1200 | menos que 1000 fica injusto (teste garante o mínimo) |
| `bossCooldownMs` | 3400 | intervalo entre ataques |
| `bossFuriousCooldownMs` | 2300 | precisa ser menor que o normal e maior que o aviso |
| `bossHitInvuln` | 1400 | tempo de proteção depois de um golpe |
| `time` do duelo (em `STAGES`) | 120 s | tempo do duelo |
| `blockChance` do duelo (em `STAGES`) | 0.35 | menos caixotes = menos esconderijos |

## Fases e inimigos

Ficam em `STAGES` e `ENEMY_TYPES` (`src/config.ts`); `tests/stages.test.ts` guarda as regras abaixo.

| Número | Valor | Efeito de mudar |
|---|---|---|
| tempo do laboratório / salão / jardim | 90 / 100 / 100 s | o salão e o jardim têm mais perigo, então mais tempo |
| `moveInterval` do sapo / fantasma | 0,8 / 1,5 s | o fantasma atravessa paredes, então precisa ser bem mais lento |
| fantasmas no salão | 2 no início, até 4 | mais que 4 fecha o mapa |
| flores no jardim | 5, fixas | cada flor bloqueia uma casa |
| `flowerLashCycleMs` / `flowerWarnMs` | 3,2 s / 0,8 s | o aviso não pode ser menor que 0,6 s (justo) |
| `gardenVictoryBonus` | 30 POÇÃO | prêmio por zerar o jogo |

Reações entre poções (`src/game/chain.ts`): só o fogo acende outras poções. Isso deixa a água com um papel claro (apaga o fogo) e a terra com outro (estável).

## Como ajustar

1. Mude **um** número em `config.ts`.
2. Rode `npm run test` (os testes de equilíbrio avisam se algo ficou desbalanceado).
3. Jogue 5 partidas e anote: tempo, vida restante, POÇÃO ganha.
4. Compare com as metas acima.

## O que ainda não foi medido

Estes números vêm de análise, **não de testes com jogadores**. O primeiro passo antes de mexer em mais coisas é jogar 5 a 10 partidas, anotar e ajustar.
