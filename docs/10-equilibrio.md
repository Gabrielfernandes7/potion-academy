# Equilíbrio

Equilibrar é escolher os números para o jogo ser **calmo, mas com desafio**. Os números ficam em `src/config.ts`, nas fases (`stages/chapters/`) e nas tabelas de `entities/profiles.ts`.

## Metas

1. Cada poção precisa ter um motivo para ser usada (nenhuma melhor em tudo).
2. As 3 poções (água, terra e ar) chegam pelo caminho (fim das fases 1, 3 e 4), sem precisar repetir fases.
3. A fase 1 deve ser vencível em 100 s por quem está aprendendo, sem pressa constante.
4. Cada chefe deve ser vencido em **2 a 4 tentativas**, e perder deve parecer erro do jogador (por isso todo ataque tem aviso).

## Poções

| Poção | Alcance | Casas atingidas | Fusível | Quando vem | Vantagem | Desvantagem |
|---|---|---|---|---|---|---|
| Fogo | 2 | 9 | 2,0 s | desde o começo | rápida | alcance pequeno |
| Água | 3 | 13 | 2,4 s | fim da fase 1 | alcance maior | fusível mais lento |
| Terra | 2 | 9 | 2,2 s | fim da fase 3 | atravessa caixotes | mais lenta que a de Fogo |
| Ar | 2 | 9 | manual | fim da fase 4 | você escolhe quando | ocupa um frasco até o D |

Antes, a de Água tinha alcance 4 e as de Terra e Ar alcance 3, então a de Água era melhor que a Fogo em tudo. O teste `tests/balance.test.ts` agora garante que **nenhuma poção domina outra** (`dominates` em `src/game/balance.ts`).

## Itens e limites

| Item | Antes | Agora | Por quê |
|---|---|---|---|
| +Frasco | até 6 poções | até 5 | com 6 poções a tela enchia de explosões |
| +Raio | 4 níveis | 3 | alcance 3 + 3 níveis já cobre quase o mapa |
| +Velocidade | 3 níveis | 2 | com 3 níveis a Roo corria mais que os inimigos o tempo todo |
| Passo base da Roo | 220 ms por casa | 300 ms | a Roo parecia rápida demais; 300 ms é igual ao sapo, e +2 velocidade (~143 ms) ainda fica mais rápida que ele. Teste: se ficar lenta demais, use 260 ms |
| Baú | +2 vida | 0 | só os corações curam; o baú guarda um item |
| Vida da Roo | 5 corações, 1 por golpe | barra de 24 pontos: contato 4, fogo 6, água 2, terra e ar 4 | a Roo ganha perfil de fraqueza (fogo) e resistência (água); 24 mantém 6 golpes neutros e dá 4 contra fogo. Coração cura 4. Testar com a Belladona, que usa fogo em 65% dos ataques |
| Formas da Roo (T, a forma da poção na mão) | 12 s só no fogo | **20 s** (era 12, depois 16) em 4 degraus de 5 s; espera comum de 25 s; poções do próprio elemento +50% (cai por degrau). **Fogo:** resiste ao fogo (2), fraca à água (6), **sem Poção de Água**; Labareda 3 casas. **Água:** imune à água, fraca ao fogo, todas as poções; Bolha de sabão: 4 casas, prende por 1,75 a 4 s. As duas habilidades custam 2 s e esperam 3,5 s | `game/forms/`; valores de teste, ainda a jogar |
| Leão Verde (Arena) | não existia | 28 de vida: terra imune, ar 6, fogo 4, água 2; Bote com exposição de 2,2 s (+2 de dano); Dissolver 1,4 s de aviso; Rugido só na fúria; espera de 3,6 s (2,5 s na fúria) | o fogo o vence em 7 golpes, o ar em 5; só na Arena, ainda a testar jogando |

## Economia (estimativa)

- O OURO e a loja foram tirados do jogo (não havia o que comprar). Baús guardam um item; moedas soltas não existem mais.
- As poções de água, terra e ar vêm como prêmio no fim das fases 1, 3 e 4 (`game/learning.ts`); a meta de 6 a 7 partidas acima passou a ser o ritmo da jornada, não de uma economia.

## Chefe

| Número | Valor | Efeito de mudar |
|---|---|---|
| `bossHp` | 20 (vem de `PROFILES.belladonna`) | mais vida = duelo mais longo |
| dano à Belladona (`damage.ts`) | fogo e ar 6 (fraqueza), água e terra 2 (resistência) | 4 golpes de fogo ou ar; 10 de água ou terra |
| `bossTelegraphMs` | 1200 | menos que 1000 fica injusto (teste garante o mínimo) |
| `bossCooldownMs` | 3400 | intervalo entre ataques |
| `bossFuriousCooldownMs` | 2300 | precisa ser menor que o normal e maior que o aviso |
| `bossHitInvuln` | 1400 | tempo de proteção depois de um golpe |
| `time` do duelo da Torre (`chapters/torre.ts`) | 120 s | tempo do duelo |
| `blockChance` do duelo (`chapters/torre.ts`) | 0.35 | menos caixotes = menos esconderijos |

## Fases e inimigos

Ficam em `stages/chapters/*.ts` e `entities/enemies/defs.ts`; `tests/stages/` guarda as regras abaixo.

| Número | Valor | Efeito de mudar |
|---|---|---|
| tempo de cada fase (`time` em `stages/chapters/`) | 100 s na fase 1; a Névoa tem 110 s | o laboratório precisa de folga para quem está aprendendo |
| `moveInterval` do sapo / fantasma | 0,8 / 1,5 s | o fantasma atravessa paredes, então precisa ser bem mais lento |
| fantasmas no Salão dos Ecos | 2 no início, até 4 | mais que 4 fecha o mapa |
| flores no jardim | 5, fixas | cada flor bloqueia uma casa |
| `flowerLashCycleMs` / `flowerWarnMs` | 3,2 s / 0,8 s | o aviso não pode ser menor que 0,6 s (justo) |

Reações entre poções (`src/game/chain.ts`): só o fogo acende outras poções. Isso deixa a água com um papel claro (apaga o fogo) e a terra com outro (estável).

## Como ajustar

1. Mude **um** número em `config.ts`.
2. Rode `npm run test` (os testes de equilíbrio avisam se algo ficou desbalanceado).
3. Jogue 5 partidas e anote: tempo, vida restante, itens dos baús.
4. Compare com as metas acima.

## O que ainda não foi medido

Estes números vêm de análise, **não de testes com jogadores**. O primeiro passo antes de mexer em mais coisas é jogar 5 a 10 partidas, anotar e ajustar.


## Dano por elemento e vida dos personagens

Fonte: `src/game/entities/profiles.ts` (`PROFILES`) e `damage.ts`. Dano-base de toda poção: 4. Fraqueza ×1,5 (6), neutro ×1 (4), resistência ×0,5 (2), imune 0. Os inimigos novos (`19-criaturas.md`) também têm linha em `PROFILES`.

| Personagem | Vida | Fraco a | Resiste | Imune | Golpes (fogo / água / terra / ar) |
|---|---|---|---|---|---|
| Sapo | 6 | terra | água | – | 2 / 3 / 1 / 2 |
| Fantasma | 6 | água | ar | terra | 2 / 1 / – / 3 |
| Flor do mal | 10 | fogo | terra | água | 2 / – / 5 / 3 |
| Quimera | 28 | terra | – | água | 7 / – / 5 / 7 |
| Belladona | 20 | fogo, ar | água, terra | – | 4 / 10 / 10 / 4 |
| Leão Verde | 28 | ar | água | terra | 7 / 14 / – / 5 |
| Ouroboros | 40 | gira pelos 4 elementos | – | – | regra do ciclo (`bosses/ouroboros/rules.ts`) |
| Mandrágora | 28 | fogo | terra, água | – | 5 / 14 / 14 / 7 |

O teste `tests/entities/damage.test.ts` confere a tabela (todo personagem tem fraqueza, nenhuma poção é a melhor contra todos e nenhum exige golpes demais).

## Velocidade (atualizado)
- Casa base: 260 ms (antes 300). Cada ponto de velocidade (máximo 2) encurta a casa em 12% (`SPEED_STEP` em `game/movement.ts`): 260 → ~232 → ~210 ms. Antes, 55% por ponto deixava o primeiro power-up quase 35% mais rápido.

## Como equilibrar com a Arena (2026-11-15)

Dois instrumentos que não dependem de jogar a campanha inteira:

1. **Treino com a transformação à escolha.** Na Arena, o seletor "Transformação para treinar" põe a Roo transformada no auge, sem fim (só as esperas das habilidades). Treine cada forma contra cada chefe e anote quantos golpes e quanta vida cada defesa economiza.
2. **Duelo de chefes** (100 s, a Roo só assiste). Serve para comparar a força dos chefes entre si e achar um que está fora da curva.

**Linha de base do duelo** (simulação de 100 s de jogo, cada lado em cada canto; Quimera com 28 de vida e a Onda de vapor de ar):

| Chefe | Resultado |
|---|---|
| Belladona, Leão Verde | vencem quase todos |
| Mandrágora | vence a Quimera; perde para o Leão e a Belladona |
| Quimera | a mais frágil (resiste de 45 a 76 s), o que combina com o primeiro chefe |
| Ouroboros | entra no duelo como o resto; a fraqueza dele gira (ver `bosses/ouroboros/rules.ts`) |

Nenhum duelo chegou ao tempo: todos terminaram em nocaute. Se mudar vida, tempos ou dano de um chefe, rode a simulação de novo (`scripts/` não tem o roteiro; está em `task.md`, "Como testar por script").
