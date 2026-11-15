# Criaturas: o que há e o que propomos (proposta)

Status: **proposta para discussão**. Nada aqui foi implementado (a seção 6, de 2026-11-15, é a mais recente). O jogo hoje tem três inimigos comuns e quatro chefes.

## 1. O que já existe

| Criatura | Tipo | Atributo | Fraqueza | Imune | Onde aparece |
|---|---|---|---|---|---|
| Sapo mago | comum | água | terra | — | O Chamado, A Escadaria, O Retorno |
| Fantasma | comum | ar | água | terra | O Caminho, A Névoa, a Torre, a Biblioteca |
| Flor do mal | comum (fixa) | terra | fogo | água | O Jardim, A Ponte, Os Muros |
| Quimera | chefe | água | terra | água | O Poço |
| Belladona | chefe | terra | fogo, ar | — | O Duelo |
| Mandrágora | chefe | terra | fogo | — | O Jardim |
| Leão Verde | chefe | terra | ar | terra | O Cofre (Biblioteca) |

Os inimigos comuns não se movem em perseguição. A Roo precisa de pouco para sobreviver, e a dificuldade vem de posição, tempo e as poções.

## 2. Critérios para uma criatura nova

- **Cozy:** a criatura tem comportamento previsível, avisa antes de agir e não ataca de surpresa sem sinal.
- **Respeito à fé:** nada de cruz em criatura, e nenhuma criatura ridiculariza a fé (ver `CLAUDE.md`).
- **Lugar na história:** cada criatura tem um motivo para estar ali (o mestre, a fome, as escrituras).
- **Regra clara:** cada uma se derrota por um elemento que se entende de imediato, como os atuais.
- **Uma ideia por criatura:** nada de três mecânicas juntas.

## 3. Propostas

### Lanterna viva (comum, fogo)
- **O que é:** um espírito de chama que nasce nas lamparinas da biblioteca.
- **Comportamento:** anda em linha reta pelas estantes e para antes de cada obstáculo. Não machuca a Roo: acende a casa por onde passa, e a casa acesa queima caixotes de madeira (uma pequena armadilha de fogo).
- **Fraqueza:** água. **Imune:** fogo.
- **Onde:** O Scriptorium e As Estantes. **Sentido:** são as lâmpadas que o livro diz que ainda estão acesas.

### Gosma de mercúrio (comum, água)
- **O que é:** um limo líquido que escorre pelas paredes do poço.
- **Comportamento:** anda devagar. Quando é atingida por fogo, se divide em duas, cada uma com metade da vida.
- **Fraqueza:** terra (a terra a prende). **Imune:** água (ela se mistura com a água).
- **Onde:** O Poço (antes da Quimera) e a Névoa. **Sentido:** é o mercúrio que escapou do caldeirão.

### Coruja do scriptorium (comum, ar)
- **O que é:** a coruja que guarda a biblioteca dos copistas.
- **Comportamento:** voa por cima dos caixotes. A cada 6 s, marca uma casa com um círculo e, um instante depois, mergulha. Quem está na casa é atingido.
- **Fraqueza:** terra. **Imune:** nada.
- **Onde:** O Scriptorium. **Sentido:** vigia as escrituras, mas não ataca quem apenas lê. Só ataca quem está parado no círculo.

### Ratinho do celeiro (comum, terra, sem dano)
- **O que é:** um rato que come o grão dos celeiros trancados.
- **Comportamento:** foge da Roo. Se alcança uma gema ou um baú antes da Roo, leva o item e some pela parede.
- **Fraqueza:** fogo (espanta-o para sempre). **Não machuca.**
- **Onde:** A Ponte e Os Muros. **Sentido:** é a fome em forma pequena: o que sobra no celeiro vira comida de quem não tinha. Cozy, mas com perda.

### Relógio de cobre (comum, terra)
- **O que é:** um autômato de bronze que patrulha uma linha do observatório.
- **Comportamento:** anda sempre no mesmo ritmo, de ida e volta. Trava por 2 s a cada volta completa.
- **Fraqueza:** água (a ferrugem). **Imune:** terra.
- **Onde:** O Observatório (quando existir). **Sentido:** o tempo das colheitas, que não espera.

### Salamandra do caldeirão (amiga, fogo)
- **O que é:** uma lagartixa de brasa que dorme perto das pedras quentes do Caldeirão.
- **Comportamento:** não ataca. Se a Roo passa por ela, aquece a Roo e devolve 1 de vida (uma vez por fase).
- **Fraqueza:** água (ela se apaga). **Não machuca.**
- **Onde:** A fase inicial do Caldeirão ou o salão antes do duelo. **Sentido:** a criatura amiga que lembra que o Caldeirão é um lar. Esta é a criatura que deixa o jogo aconchegante.

## 4. Ordem sugerida

1. **Salamandra** (amiga): é a mais fácil de escrever e a que mais cria clima.
2. **Ratinho do celeiro**: liga a jogabilidade à fome.
3. **Lanterna viva** e **coruja**: fecham o clima da Biblioteca.
4. **Gosma** e **relógio de cobre**: ficam para o poço e o observatório.

## 5. Perguntas

1. Criaturas amigas (salamandra) entram no jogo, ou o jogo fica só com inimigos?
2. O ratinho que rouba um item é justo, ou é frustração demais?
3. Quantas criaturas novas por capítulo? Sugiro no máximo uma por fase.

## 6. Revisão (2026-11-15): o que falta e o que as formas novas pedem

**Furos do elenco atual** (sapo de água, fantasma de ar, flor de terra):
- **Não há inimigo de fogo.** A Poção de Água e a Roo Água nunca têm contra quem brilhar, e a Roo Fire não encontra imunidade nem resistência para jogar.
- **A Torre é monótona:** as três fases só têm fantasmas.
- **Ninguém reage às formas novas.** O Muro de sal, a Raiz, o Sopro e o Salto de vento só se testam contra sapos que andam ao acaso.
- **Os comuns não têm "aviso" próprio:** só a flor avisa no chão. Quem avisa ensina o Salto de vento a ser uma esquiva de verdade.

**Novas ideias, pensadas para essas lacunas** (todas seguem os critérios da seção 2):

| Criatura | Elemento | Uma ideia | Interage com | Onde |
|---|---|---|---|---|
| **Lanterna viva** (da seção 3) | fogo | acende as casas por onde passa; a casa acesa queima caixote de madeira | a Roo Água a apaga; o Sopro a leva para longe | Estantes, Scriptorium |
| **Toupeira de sal** | terra | some debaixo da terra deixando um monte que avisa, e brota ao lado da Roo 1,5 s depois | o Muro de sal fecha a casa em que ela quer brotar; o Salto desvia | Névoa, Estrada, Ponte |
| **Gosma de mercúrio** (da seção 3) | água | se divide em duas ao levar fogo | o Sopro desliza as gosmas para o mesmo corredor; a Terra as prende | Poço (antes da Quimera) |
| **Coruja do scriptorium** (da seção 3) | ar | marca uma casa e mergulha 1 s depois | o Salto de vento é a esquiva natural | Scriptorium, Cofre |
| **Sentinela de cera** | terra | uma armadura que anda em linha reta e só vira quando bate; lenta e resistente | o Sopro a empurra, a Raiz passa por baixo dela | Torre (quebra a monotonia dos fantasmas) |
| **Ratinho do celeiro** (da seção 3) | terra | rouba gema ou baú e foge | a Roo Ar o alcança (anda 20% mais rápido) | Ponte, Muros |
| **Salamandra** (amiga, da seção 3) | fogo | devolve 1 de vida, uma vez por fase | — | Caldeirão |

Cobertura de elementos depois disso: fogo (lanterna, salamandra), água (sapo, gosma), terra (flor, toupeira, sentinela, ratinho), ar (fantasma, coruja).

**Ordem sugerida (mudou):**
1. **Lanterna viva:** fecha o furo do fogo e é a mais fácil de ler.
2. **Toupeira de sal:** a única que espelha a Raiz da Roo Terra e dá uso ao Muro de sal.
3. **Gosma de mercúrio:** a que mais testa a regra "elemento certo no momento certo", antes da Quimera.
4. **Sentinela de cera:** resolve a Torre.
5. Coruja, ratinho e salamandra por último.

**Para construir uma:** o perfil em `game/entities/profiles.ts`, uma linha em `enemies/defs.ts` (`ENEMY_TYPES`), a textura em `src/textures/`, o movimento em `EnemySystem.ts` (`MOTION`), a regra própria em `enemies/enemyRules.ts` (puro, com teste) e as fases em `stages/chapters/`. A lista `EnemyKind` precisa de mais um nome por criatura.
