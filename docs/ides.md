# Ideias de alquimia para Potion Academy

> A direção da história (fome, Belladona com razão, Roo nascida de uma bolha) já foi decidida: veja `12-historia.md` e `/history.html`.
>
> Documento de trabalho. Reúne o texto de ideias recebido, um resumo e a avaliação de encaixe no jogo atual. Nada aqui é regra ainda: cada escolha, ao ser aprovada, vai para `06-decisoes.md`.

## Resumo em uma página

**Ideia central:** a alquimia como linguagem de jogo. Não vencer pela força das explosões, e sim pelo conhecimento das transformações.

**Cinco fontes de inspiração:** alquimia histórica, simbolismo, laboratórios, criaturas alquímicas e experimentação.

### Ideias por tipo

**A. Narrativa e estética (pouco custo de regra)**
- **Quatro etapas da Grande Obra** (Nigredo, Albedo, Citrinitas, Rubedo) como progressão visual e de história. Já há quatro fases com nome de ato no jogo.
- **Enxofre, Mercúrio e Sal** como três atributos ocultos das poções (combustão, fluidez, estabilidade).
- **Criaturas simbólicas** (Salamandra, Dragão, Fênix, Leão Verde) como temas de inimigos e familiares.

**B. Mecânicas pequenas (encaixam no que existe)**
- **Reações elementais em tabela.** O jogo já tem fogo que acende, água que neutraliza e terra estável (`src/game/chain.ts`). Expandir é o passo natural.
- **Prima Materia**, item raro que altera uma poção ou libera uma receita.
- **Frasco Hermético**, que guarda uma explosão para depois. Parecido com a bomba remota já existente.

**C. Sistemas grandes (mudam a identidade do jogo)**
- **Grimório de receitas**: descobrir reações por experimento e guardá-las. Pode ser o Diário da Roo ampliado.
- **Laboratório persistente**: progressão entre partidas.
- **Ingredientes com propriedades ocultas**.
- **Cenário que reage**: lama, cristais, vapor que muda o chão.
- **Alambique e Athanor**: estações de transformação. Sobrepõem-se ao Caldeirão de Magia.
- **Solve et Coagula**: desmontar uma poção em essências ou fundir duas.

**D. Companheiros**
- **Homúnculo / familiar** que coleta, revela ou ajuda em combate.

### Recomendação

Escolher um conjunto pequeno que se reforça:

1. **A Grande Obra como espinha dorsal.** As quatro fases viram as quatro etapas, sem trocar os nomes dos atos. A busca do mestre segue a mesma ordem.
2. **Reações elementais expandidas, com o Diário como Grimório.** Cada reação descoberta vira uma página.
3. **Prima Materia e a pedra filosofal** como elo entre a história do mestre e a jogabilidade.

Ficam para depois: cenário que reage, familiar, estações de transformação e Solve et Coagula.

### Alertas

- O texto usa **Ar**; o jogo usa **Etérea** (glossário). Usar o nome do glossário.
- Reações com **gás, eletricidade e gelo** usam elementos que o jogo não tem. Só entram se esses elementos forem criados.
- Inimigos que **perseguem** contrariam a decisão "Sem personagens que perseguem" (`06-decisoes.md`).

## Encaixe com o jogo atual

| Ideia | Já existe? | Encaixe | Custo |
|---|---|---|---|
| Quatro etapas da Obra | Quatro fases com nome de ato | Muito alto | Baixo |
| Enxofre / Mercúrio / Sal | Não | Alto: Enxofre≈Fogo, Mercúrio≈Água, Sal≈Telúrica, Éter como quintessência | Baixo |
| Reações em tabela | Parcial (fogo, água, terra) | Alto; já há "Em aberto" para éter e terra | Médio |
| Grimório de receitas | Diário da Roo (páginas por fase) | Alto como Diário ampliado | Médio a alto |
| Prima Materia / pedra filosofal | Não | Alto: a história cita a busca do mestre | Médio |
| Cenário que reage | Não | Médio; muda o caráter do jogo | Alto |
| Alambique / Athanor | Caldeirão de Magia (loja) | Médio, como função do Caldeirão | Médio |
| Homúnculo / familiar | Não | Médio; não persegue | Alto |
| Criaturas simbólicas | Três inimigos, sem perseguição | Bom, se seguirem a regra de não perseguir | Médio por inimigo |
| Frasco Hermético | Bomba remota | Parcial | Baixo |
| Solve et Coagula | Não | Médio; depende do Caldeirão | Médio |

## Pontos em aberto

- [ ] Qual conjunto aprovar (sugestão: itens 1, 2 e 3 da recomendação).
- [ ] Se o Grimório for o Diário, como aparecem as reações descobertas.
- [ ] Se a Prima Materia é item de fase, de loja ou de história.
- [ ] Se a Obra vira só estética ou também regra (ex.: Albedo limpa efeitos negativos).

---

## Texto original recebido

<!-- Texto colado pelo usuário, mantido na íntegra. -->

A alquimia oferece muito mais do que poções coloridas. Ela pode ser a própria linguagem de gameplay de Potion Academy: transformar materiais, provocar reações, descobrir propriedades ocultas e aceitar que toda transformação tem consequências.

Eu exploraria cinco fontes de inspiração: alquimia histórica, simbolismo, laboratórios, criaturas alquímicas e experimentação.

### 1. Os princípios alquímicos como mecânicas

[Elements, Directions, Guardians: Part 1  — Fio Gede Parma](https://images.openai.com/static-rsc-4/bFcTWFMSPg6hDzaA56a4T7gXEzPlJlvd6LY-VtGtkyLkWaxCXZCvggJvut9xZQSj5PjFcy7oLkOraHAOm8nmogJ9vDqGydI94MKjF6UBDEfZ3L-spgVjiwD9nI_gViBp3MDqL7PNPCA0rXugmV7XoyoRgx57mz2jfPFq-R8csTM?purpose=inline)

Prima Materia — matéria primordial

Uma substância misteriosa que pode se transformar em qualquer elemento. No jogo, seria um recurso raro capaz de alterar uma poção ou permitir uma receita especial.

[Solve et Coagula. The Sacred Pulse of Transformation | by Doriana Proca | Medium](https://images.openai.com/static-rsc-4/E89-Oh_qF4-4i6zbXa1JVfa5AqYipbfhcBaSWz3Pu606bT_dnlHAm215w0x5PcwO-4wAqM16vzHHzmRR2OywHOgChc7kKU_EVBK0twy1LBFUQMJRApsXjuZ478sIb0k3zdguP3eILt6H-b4qAlJLE2RMvrSMZqPALQcFdTcjIrc?purpose=inline)

Solve et Coagula — dissolver e coagular

Separar algo em seus componentes e depois recombiná-los. Poderia permitir desmontar uma poção em essências ou fundir duas poções em uma nova.

[Not the mystical east india's long tradition of materialism | Will Buckingham](https://images.openai.com/static-rsc-4/LSLCKdslQ_BEtbBraNNcSz2ZWlEHiqSkFDlKufoLeuEaFDtW7PoYU1Uw08bzHkFhWTnLmm-f7xxbTCOwzEJYZ1HFSJWx8sOfwUBwDDierA14vwHwHmIcMH8-MpGIDjq7CplHH36Lzf0Dxtxh4dwmj-3FuPNRaQCuX9mSpIHze1U?purpose=inline)

Os quatro elementos

Fogo, Água, Terra e Ar. Cada elemento representa propriedades, não apenas dano. Fogo aquece, Água dissolve, Terra estabiliza e Ar dispersa.

[錬金術のシンボル一覧と意味｜元素記号の起源](https://images.openai.com/static-rsc-4/A90Iz9K_NtDq-yMY7UxEnfseeGSATkqDa_e4xGUQHdp_LSNyVXlt4TXCcE6w4Z86et4SB0CZE5vQnoT8x_oI8dNrg_HyjslYXjn_1NIv7N46TK2B4EH3vmA-pI4u3gwrj02jN1W-WeF4xgQySqFuCxHhBRpaXH9wX5Yzjaustm0?purpose=inline)

Enxofre, Mercúrio e Sal

Três princípios simbólicos da alquimia ocidental: combustibilidade/atividade, volatilidade/fluidez e corpo/estabilidade. Podem inspirar três atributos ocultos das poções.

Uma aplicação interessante: duas poções podem ter o mesmo elemento, mas propriedades diferentes. Uma poção de fogo pode ser instável e explosiva; outra, purificada, pode produzir uma chama persistente.

### 2. Processos alquímicos como progressão

A alquimia histórica descrevia transformações em etapas. Podemos transformar isso em uma progressão visual e mecânica.

[Nigredo (Blackening) (Alchemy) — Cross-Tradition Resonances | Neon Memoir](https://images.openai.com/static-rsc-4/y5-jKoXmwedrI2WTKcsr2IwwY7HGuWiOF0fVAGnT4BLHryjfi3n-X5xwo3X4NjcvA_2euF5U71XVU6MAgonv4SeuoRhyxg-l4dhDJyMhllWJvz4W-rw6I58IVrR76lnFaEsxwEuOaSruuaaUkH98pTl8q9W0nkUuNKhWDtQuQg8?purpose=inline)

Nigredo — decomposição

A matéria é escurecida e separada. No jogo: enfraquecer inimigos, decompor obstáculos e extrair essências de materiais.

[Alquimia Pt1 - Ciencias Ocultas | Acast](https://images.openai.com/static-rsc-4/xXMYtLv82S3F5xFGW3_d1TCfZPHT3WJ7WAt2JMSo6R66QNmKYpVMMXzbla8ZTt8CmC_EUUwlP-9Npc7gjjQAVYOL9baA3Janp17PwCBpvQSBtTaXTj2F3xg9mKIJ1e3xngnPN4gfnhpn4fD6GLXKJ-sP65WReG3G1Wi766xUywE?purpose=inline)

Albedo — purificação

Remover impurezas. No jogo: limpar efeitos negativos, purificar poções contaminadas e criar explosões mais precisas.

[Цитринитас — Рувики: Интернет-энциклопедия](https://images.openai.com/static-rsc-4/5-0F9DJlV75L7c4KLHaOW6HOGgLSvgvcXGuCltwYR0-b7-gaDru_poW78GehRFgMqNiBvSdiyU9GSKnx-3NW98zob66V3bZ3o3xKLrrkoXyB3uKSloR8WATG0xIJ78Zl7IPyQhz8qqAGfHafWXJXuBceG2ZTD9iornOcxnXAVxw?purpose=inline)

Citrinitas — iluminação

A matéria alcança um estado superior. No jogo: revelar caminhos secretos, identificar fraquezas e descobrir receitas.

[Rubedo as Phoenix Rising: The Red King & Queen United | Alchemical Perfection  – Nicole's ritual universe](https://images.openai.com/static-rsc-4/EPLujJumqto_0_U2GelxvypFBxJelSQmxh877YISnzBg967ZI6-pdVdvNDZKgbn_AzJWLYCEvreWcSHa-PhNtUjZzwPBRVRtPFgT9QFGBQ78T41ednOOarWGpX9jVX2MRQ_BQsuaMnZvRnTsarWb2fWUZ8d66RQsFz8etegw6Gw?purpose=inline)

Rubedo — consumação

A transformação se completa. No jogo: poções lendárias, efeitos combinados e habilidades definitivas.

Essas quatro etapas podem inclusive dar nome às quatro grandes regiões do jogo, ou funcionar como capítulos de evolução da Roo.

### 3. Objetos alquímicos que podem virar itens do jogo

[Philosopher’s Stone: Real Myth Meets Wizarding Fiction - Fantasy Fragment](https://images.openai.com/static-rsc-4/hwMWmJ6ZVAbk2nKpVdSLptJgXmgYtQYBt_igyxKlkfKrwfKJR6HGBtEpRZkpVQ3GRZP20a5hr5wMzreFAc9fL-um9SnGLaVJH3EL1x7ZiuxKxyj64h8KW_yGLYLRlChRhJlJcj-OQI4ag12StgHvl9MSAhi9LF7TAPtCc59apiE?purpose=inline)

Pedra Filosofal

Artefato lendário capaz de transmutar materiais. Poderia transformar uma essência comum em uma essência rara.

[Ouroboros: Ancient Infinity Symbol Used By Different Ancient Civilizations - Ancient Pages](https://images.openai.com/static-rsc-4/a1xg3r70HOWf7LWUZTDLdlWSQlx4gYLGe9BPc25tRYM7T8T9YmRjOvWrNzS08fdVs_l94fgnKHjyFDeInXjcBoJN1Nef1k8_Rx-akat_Tnox1Y6yxCNKCKb8zbrVUN66iwlbnm48UZNOv0UUgYQDt5Zzv1U9LrjVUG_sZJcIeZs?purpose=inline)

Ouroboros

Serpente que devora a própria cauda, símbolo de ciclo e renovação. Uma poção com efeito que se repete ou retorna à origem.

[CSMBR Pisa on Instagram: "Medical Alchemy Series 7: Cooking, Purification and Distillation Methods, Lombardy 1463 Fig. 1: Bain-Marie ("Balneum Mariae") Fig. 2: … | History of chemistry, Distillation, Lombardy](https://images.openai.com/static-rsc-4/T2PQtBk5ZUO1jBO5el_iwFaiZTnidTlf07nPcgmRW6mFEKJoAV4nEdlztHEgahNEyV6X7C4eSY45FzwYeV1AUiSdmMBZJ2YdZOH6-JMrHbqk5KdvYGOvCpgH_UDrvEtjdiMGVxK8yysm8Nl4jaKux2aS3yXU1o3WHeJ0mMDeBgQ?purpose=inline)

Alambique

Equipamento de destilação. Poderia separar uma poção em componentes e recuperar ingredientes.

[An alchemist by their athanor | Secret society symbols, Alchemy, Alchemist](https://images.openai.com/static-rsc-4/lIk4qCdEwtlHZ1X84L3kmZUDWXZ-8cbCS1x_zi0mWF2PzAkJKo73pBpr63Ea5yP4Y8wPYwljHCZf2S0ki7o1e2B8uFNcIV5EOYpEa6Fg3WFjUxvlcNqRYP_8zbJI2dx9aB7mbkJW2HCQZvudfwh-CorR2oA68gx-2vvRWKiSoc0?purpose=inline)

Athanor

Forno alquímico projetado para manter calor constante. Poderia aprimorar poções enquanto a personagem sobrevive à arena.

[Magic The Gathering Card Artworks Gemini Image Prompt | PromptBase](https://images.openai.com/static-rsc-4/M3UITxUUaIpndOxJVRwAIhkDEx-nu1ail9QjUhYBGZv8czO_gKh1hmquVxRx4Daj2c-NV4QsYN6uCuxggKXxgrmxLK5bUWmWl_a5hYx5_HWFUQZmIz6G4EsZ3K--bd2uJiTWkgrfl8sgY1lSpCBFidF0eVwNSxrD2sqFkPWV5TM?purpose=inline)

Frasco Hermético

Recipiente que preserva substâncias. Poderia armazenar uma explosão e liberá-la posteriormente.

[The Homunculus in Alchemy – Superstition Library](https://images.openai.com/static-rsc-4/qfxY0qSxquvarJliBYOvb5CZTW1XjlbLmpmiIdqdl9chj1HIZVptMu7klv3ESXRoPPeZO3D6VeDSubmP1IxIGMmyCqHw4wpktYAevURQDNrVT7KinIKaA4153IIT8h341LkPjKrC5NIJvnbZbUtvqOEnNSHVM7ia0PL50JuDMhs?purpose=inline)

Homúnculo

Criatura artificial da tradição alquímica. Poderia ser um familiar que coleta ingredientes, revela segredos ou ajuda em combate.

### 4. A alquimia pode transformar o próprio cenário

Aqui está uma oportunidade especialmente interessante para um jogo inspirado em Bomberman: as reações químicas podem afetar as casas da arena.

[《魔法工艺/Magicraft》官方中文|奇术工匠绿色版 \_ 小白游戏网](https://images.openai.com/static-rsc-4/X8DFS9Y5KUutlLAU96MhonoqI0yP54sGrcbvgo5c4m0nNBkUv0k977ROX8k2G4Uocta_nJJ-EsNXoaszsjB1uXMuRA6bjgTPeSkEjOvu4CbIMITj6JklloHIdQy0xYnnXHX0J_rCRU6yQOtxOKp03mLqmtMpueEp7m1P5jhnELk?purpose=inline)

[Blossom Tales: The Sleeping King - Screenshots](https://images.openai.com/static-rsc-4/mm6VpdSYK8dFZSVvvrGNCSFXegnCojExNx2RXTzHsa2N13Jr0KW__4vpD2NlJ-R5hv4RALXhu4wVI3FMEVj6Jpp5MEUzKb1QQJ_5FsjQUliXEx5jtPGxWKklL8JiJqSCYhgZdQRmw8OYcN3XEc0x0O7CHLmDU4N5BV3OO2L8eUQ?purpose=inline)

[Cute Fantasy Shroomlands - 16x16 top down pixel art asset pack by Kenmi](https://images.openai.com/static-rsc-4/eFE9ac_k4sFONaq9EkSzLgRCy53cii4pQa_zj1bAioBt7xJAt7Ve0kU0kCUVRfhGQhn4RNIN81-nRR2ZMRo8bzj9EgLOlIPhkp1dTzGPAA_TaQi0AMcM7fY7j5QB2m_BXksTcazxiKCV2pC4Y5OZr_sL-jov8lHbSb2XzAedcpk?purpose=inline)

11

| Reação              | Possível efeito na arena                     |
| ------------------- | -------------------------------------------- |
| Fogo + Gás          | Explosão ampliada                            |
| Água + Eletricidade | Descarga pelas casas molhadas                |
| Água + Terra        | Lama que reduz velocidade                    |
| Fogo + Gelo         | Vapor que bloqueia a visão                   |
| Terra + Água        | Cristais que crescem no chão                 |
| Éter + Fogo         | Chamas que atravessam obstáculos específicos |

O importante é que as reações sejam previsíveis o suficiente para o jogador aprender a utilizá-las estrategicamente.

### 5. Criaturas e símbolos alquímicos

[Nemo Vir - Gallery](https://images.openai.com/static-rsc-4/xPCG9iC3pKl-DXS5wn3bxo-8JGGylDRezTjw8_y5ZNy1Z6QmkEoDD-o2K0u_wGASb9tFtKiBhslRrgAASgjwC-ivc1C-tJXvRG06oBy_ebE7Orkp8kgodHClzifzdTUj1T7k1XWuPxNKy7Zq5Pnatsa3hPtRYTEgSx2qY8T4Ke8?purpose=inline)

Salamandra

Criatura tradicionalmente associada ao fogo. Poderia ser imune a explosões de fogo e deixar essências quando derrotada.

[BibliOdyssey: The Ripley Scroll | Art, Ripley, Medieval manuscript](https://images.openai.com/static-rsc-4/Kju69wTtl9gI_hUJtpo-K5BGFcXi4soM0z2kDP4tkd33hykwaDy7OGR_cuRXZCy27AeX-ToQgEJkgH3PeLpRLEYbuD3B9KdCvrL50tPK9Tx-OfWXMOH_ScmpfBE_dx3NXJG6HztPAOjpsLGSSOwt8ldZxaR-XM9HE81BLipMQBc?purpose=inline)

Dragão alquímico

Símbolo de matéria bruta e transformação. Poderia guardar ingredientes raros ou proteger uma receita.

[Meet a Medievalist Maker - by Kristen Haas Curtis](https://images.openai.com/static-rsc-4/Vy6k-sObEnKvEJlsCghr_3e1MBpvtsRqQ5DluXixC_aUZS1ZKDQuouDFRrjGP0SIqKJSB6LpQCYbEXo0t27aS2XqZiaUoobF1K3hpi0lRLx9gjoWoIWqDLm-hSOuiNA5l9UNvEALf6HlClHxcKTnsEcrGDz4JVkflko0a7BW7gw?purpose=inline)

Fênix

Representa morte e renascimento. Um familiar que renasce uma vez após a derrota.

[Mylius version of 'Rosarium' series coloured](https://images.openai.com/static-rsc-4/3s3CMccSmprpj4HAKY17FVSoIvodYoz-9nebimo-BhbcaSXFEimiJKFiOUzQlEZQ6acFyIbUzVlNTatYXMDLcUHr9wcuKZ3zF8cY2VZ-VI6Fnw1I19JtnmxjTo7xDB6PZqZs6MwtF8fBWG1ZtIzjIxrmbJjmpp3i4CPsRjTD-Jw?purpose=inline)

Leão Verde

Figura simbólica da alquimia associada a processos de dissolução. Poderia consumir obstáculos e deixar resíduos alquímicos.

### 6. Minha proposta: um sistema de alquimia experimental

Em vez de simplesmente entregar poderes prontos, faria o jogador descobrir receitas.

[Potion Craft: Alchemist Simulator](https://images.openai.com/static-rsc-4/kl_FEhY4z1AXK90_KwprM3BqrrSjN4drh6-gG9c6Xcn3emWiJChVrX3uLDBYca8mdmZAlUGh0jK8DejjWsaihpOI2CrYAiI0Lv5thPkG9z4RdCAoXueB3N5uUpYa-w8UN_spEP1DUdhFUSMx1uNAF1jrhp_VbfukWfXghQtqamg?purpose=inline)

[store.playstation.com](https://store.playstation.com/en-us/product/UP0097-PPSA09608_00-3926585099094242?utm_source=chatgpt.com)

Imagine este ciclo:

1. Roo encontra um ingrediente desconhecido.
2. O ingrediente possui propriedades que podem ser descobertas.
3. Ela experimenta misturá-lo com outras essências.
4. A combinação produz uma reação, talvez até inesperada.
5. A receita é registrada no Grimório.
6. A receita passa a ser uma opção permanente durante as partidas.

Um exemplo:

Experimento: Poção da Tempestade

[Pixel potions :: Behance](https://images.openai.com/static-rsc-4/g2zzzfy12Hcy4u4obqn9ljQBT5ydS1xf5hVAhOCKPhdPWmBN-2BARe04xaw8JyRu3CG8SLA7J_BIFk7AVD4McqEVu08qoxq9eEdFQyVL3AKAj_ognM5IrWwWavT1bjYRYoh9fsENykf_tOne9V4Z0U3s3ygcx7uNSloz5gVEQsI?purpose=inline)

Aqua

# +

[pixel-art \<lora:FF_Potion - Free AI Art by | Tensor.Art | Tensor.Art](https://images.openai.com/static-rsc-4/q80esvewQ8HGunw9mQa4QQ5da_MFI_z-DxDWIrwLhc2VHZKJg-7Bb6a6bBYmlNdTs93BpQc9_IH8H8M-ilkoMzhtiiwb8kxPHu_2twn2jwyqPDHt4XysccbVjSbjuWlSk7sMHleiVZoSmMdSQAYcQPVUcVrAVQhp0DY3onsa_IQ?purpose=inline)

Éter

[Thunder Potion by TrulyMalicious on DeviantArt](https://images.openai.com/static-rsc-4/N18QO2noepc7J50JX6iXEZuCrPTLin_idB6XzzVJml7ZV8MCW-3gZWY6n1vJLM0f4Q_DSZFllGLkVCtOtIdBsiKrsbIMVUl7Ei7EckeQ18U66pTlVfhWA_kVdqLjVqtTp9qgVBxZe-OEMn9PDdsOJ9Q0FVBBrr8Cioy_Zx-1VeA?purpose=inline)

Poção da Tempestade

Receita descoberta

Ao explodir, dispara descargas elétricas pelas casas conectadas por água.

### 7. Cinco ideias que eu priorizaria

| Prioridade | Sistema                               | Por que vale a pena                                  |
| ---------- | ------------------------------------- | ---------------------------------------------------- |
| 1          | Grimório de receitas                  | Dá motivo para experimentar e retornar               |
| 2          | Reações elementais                    | Diferencia o jogo de um Bomberman convencional       |
| 3          | Laboratório persistente               | Cria progressão entre partidas                       |
| 4          | Ingredientes com propriedades ocultas | Incentiva exploração e descoberta                    |
| 5          | Homúnculo/familiar                    | Adiciona personalidade e possibilidades estratégicas |

Minha recomendação de design: não transforme Potion Academy em um jogo que apenas usa poções como bombas. Faça dele um jogo sobre descoberta alquímica, no qual o jogador aprende a manipular as propriedades da matéria para dominar a arena.

Isso pode se tornar a identidade central do jogo: não vencer pela força das explosões, mas pelo conhecimento das transformações.
