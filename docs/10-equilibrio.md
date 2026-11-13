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
| Passo base da Roo | 220 ms por casa | 300 ms | a Roo parecia rápida demais; 300 ms é igual ao sapo, e +2 velocidade (~143 ms) ainda fica mais rápida que ele. Teste: se ficar lenta demais, use 260 ms |
| Baú | +2 vida | 0 | só os corações curam; o baú dá OURO |

## Economia (estimativa)

- Uma partida boa rende cerca de **60 OURO** (moedas ≈ 18, baús ≈ 20, inimigos ≈ 6, estimativa). Moedas e baús foram reduzidos (OURO acumulava sem ter o que comprar); os preços da loja não mudaram.
- Liberar tudo custa 60 + 90 + 120 = **270** → 3 a 4 partidas. Vencer a Belladona dá **+80**.

## Chefe

| Número | Valor | Efeito de mudar |
|---|---|---|
| `bossHp` | 10 | mais vida = duelo mais longo |
| `BOSS_DAMAGE` | fogo 2, éter 2, água 1, terra 1 | a poção inicial (fogo) tira 2: o duelo cabe em 5 golpes; água e terra pedem 10 |
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
| `gardenVictoryBonus` | 60 OURO | prêmio por zerar o jogo |
| `bossVictoryBonus` | 80 OURO | prêmio por vencer a Belladona |
| `coinPickupValue` | 1 OURO | valor de cada moeda solta |

Reações entre poções (`src/game/chain.ts`): só o fogo acende outras poções. Isso deixa a água com um papel claro (apaga o fogo) e a terra com outro (estável).

## Como ajustar

1. Mude **um** número em `config.ts`.
2. Rode `npm run test` (os testes de equilíbrio avisam se algo ficou desbalanceado).
3. Jogue 5 partidas e anote: tempo, vida restante, OURO ganho.
4. Compare com as metas acima.

## O que ainda não foi medido

Estes números vêm de análise, **não de testes com jogadores**. O primeiro passo antes de mexer em mais coisas é jogar 5 a 10 partidas, anotar e ajustar.


## Dano por elemento e vida dos personagens

Fonte: `src/game/entities/damage.ts` (`PROFILES`). Dano-base de toda poção: 4. Fraqueza ×1,5 (6), neutro ×1 (4), resistência ×0,5 (2), imune 0.

| Personagem | Vida | Fraco a | Resiste | Imune | Golpes (fogo / água / terra / éter) |
|---|---|---|---|---|---|
| Sapo | 6 | terra | água | – | 2 / 3 / 1 / 2 |
| Fantasma | 6 | água | éter | terra | 2 / 1 / – / 3 |
| Flor do mal | 10 | fogo | terra | água | 2 / – / 5 / 3 |
| Belladona | 20 | fogo, éter | água, terra | – | 4 / 10 / 10 / 4 |
| Mandrágora | 28 | fogo | terra, água | – | 5 / 14 / 14 / 7 |

O teste `tests/damage.test.ts` garante: todo personagem tem fraqueza, nenhuma poção é a melhor contra todos e nenhum personagem exige mais de 14 golpes.
