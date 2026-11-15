# Potion Academy: tarefas resolvidas

Histórico do que já foi feito, tirado de `task.md`. Não é a lista de pendências.

Sessão atual (2026-11-10, parte 3): **CONCLUÍDO**
- Implementado mapa de progresso no menu
- Rastreamento de fases concluídas no localStorage
- MapScene mostra fases em ouro (concluídas) vs verde (não concluídas)

## Mapa de seleção de fases (sessão de 2026-11-10, parte 3) - CONCLUÍDO

- **MapScene.ts** (`scenes/`): nova cena que mostra um mapa visual do castelo com os 4 locais como botões clicáveis.
- **Integração no menu**: botão "MAPA" adicionado ao menu principal. Ao clicar, abre a MapScene.
- **Rastreamento de progresso**: `storage.ts` guarda quais fases foram concluídas. Ao ganhar uma fase, chama `markStageCompleted(stage)`.
- **Visual do progresso**: fases concluídas em ouro (0x6b5b4f) com símbolo ✓; fases não concluídas em verde (0x3a5a3a).
- **Fluxo**: Menu → Botão MAPA → MapScene com progresso. Ao clicar em uma fase, começa do zero (sempre `stage: 1, 2, 3 ou 4`).
- **Commit**: `21d466a feat(ui): add map scene with stage progress in menu`

0a. **Troca de frasco no toque (feito, não visto no celular):** botão TROCAR FRASCO no painel de toque (`data-touch="cycle"`) percorre as poções possuídas (`MainScene.cycleBomb`). Os slots da HUD continuam clicáveis no desktop.
0. **Bug do mapa (corrigido, não visto no navegador):** ao voltar do mapa para o menu, os botões DOM sumiam (`MapScene.backToMenu` não reexibia o menu). Também removidos os atalhos de teclado duplicados a cada visita do mapa.

1. **Contraste do jardim (feito, não visto no navegador)**: paleta em `src/textures/gardenPalette.ts` (chão pálido, sebe escura, flor magenta/vinho), testes em `tests/gardenContrast.test.ts` (mínimo 3:1). Pendente: olhar no jogo; contorno escuro na Roo não foi feito; decidir tema (cemitério/biblioteca/laboratório) só se o contraste ainda incomodar.

## Tarefas fáceis F1 a F3 (sessão de 2026-11-10, parte 6)

- F3. Fases renomeadas para os títulos dos atos: O CHAMADO, O CAMINHO, O DUELO, O RETORNO (`config.ts` e nomes no mapa). Chaves não mudaram.
- F2. Ícone `hud_flask_empty` (frasco vazio, sem líquido) na HUD, visível só na última fase (`HudScene.ts`).
- F1. Carta de frei Anselmo antes de uma partida nova (`ui/letter.ts`, `#letter-overlay` no `index.html`). Abre em `startGame()` e fecha com COMEÇAR, Enter ou Espaço.
  - Verificado: typecheck, 67 testes e build. Não visto no navegador.

## Personagem P3: Frei Anselmo (sessão de 2026-11-10, parte 7)

- Base recebida de outra IA (meta prompt), convertida em `src/textures/anselmo.ts`: `anselmo_front_0/1`, `anselmo_back`, `anselmo_side`.
- Mudanças sobre a base: hábito clareado (`#5c4030`) e filete de luz (`rim`) no ombro e no capuz, para não sumir sobre o chão escuro.
- Catálogo: grupo "Personagens humanos" em `src/sprites.ts`. Docs em `docs/09-sprites.md`.
- Verificado: typecheck, 67 testes e build. Não visto no catálogo: falta conferir `/sprites.html?zoom=8`.

## F4, F5 e F6 (sessão de 2026-11-10, parte 8)

- F4. Docs: Frei Anselmo e o mestre em `docs/03-mundo.md`; nomes dos atos e carta em `docs/04-glossario.md`; decisões de nome, carta e inflação em `docs/06-decisoes.md`.
- F5. Baús: mantida a tabela de chances (decisão da autora). Valores dobrados, ver abaixo.
- F6. `about/History.mdx` apagado pela autora; a história fica em `docs/12-historia.md`.
- Inflação de POÇÃO (pedido da autora): baús 5/10/20/50 → 10/20/40/100; moeda solta 1 → 2 (`CONFIG.coinPickupValue`); prêmio da Belladona 40 → 80; prêmio do jardim 30 → 60. Preços da loja iguais. `docs/10-equilibrio.md` atualizado.
- Verificado: typecheck, 67 testes e build. Não visto no navegador.

## M1. Falas da Belladona (sessão de 2026-11-10, parte 9)

- Legenda curta acima da Belladona nas habilidades, ao ser atingida (se não for a última vida), na fúria e na derrota (`game/bossLines.ts`, `BossController.say`).
- Não pausa, não bloqueia, uma por vez, some em 1,7 s. Decisão em `docs/06-decisoes.md`.
- Verificado: testes de falas (`tests/bossLines.test.ts`), typecheck, 69 testes e build. Não visto no duelo.

## Lentidão: nós de áudio que nunca eram liberados (sessão de 2026-11-10, parte 10)

- **Causa (medida):** cada nota (`voice`, `grain`, `breath`) criava nós de ganho (envelope e envio ao reverb) e os deixava conectados ao grafo para sempre. Medido com o navegador de teste: nós conectados vivos chegavam a 503 em 40 s de música, crescendo sem parar.
- **Correção:** `release()` em `src/audio/AudioEngine.ts` desconecta os nós quando a fonte termina (`onended`).
- **Depois:** nós vivos estabilizam entre 44 e 62 em 40 s. Resta uma subida leve, a investigar se persistir em partidas longas.
- **Verificado:** typecheck, 69 testes e build. O FPS na partida ficou em 60 nos dois casos (o teste roda sem GPU real); a melhora que importa é a do grafo de áudio.
- **Descartado:** partículas (cada emissor é destruído), objetos da cena (voltam ao mesmo número após as explosões) e texturas (geradas uma vez no início).

## Carga de música, testes de carga e documentação de arquitetura (sessão de 2026-11-10, parte 11)

- **Medição:** síntese da música em tempo real custa de 6% a 9% de um núcleo, e a reverberação responde por mais da metade (`scripts/bench-audio.cjs`). O vazamento de nós (parte 10) era bem maior que isso.
- **Faixas em arquivo: não aplicado.** Ganho estimado de 5% a 9% de CPU. Custo: arquivos de dezenas de MB, e a música deixaria de variar a cada partida (hoje cada jogo sorteia uma semente).
- **Duelo mais leve:** densidade 0,9 → 0,7 (`BOSS_TRACK` em `src/audio/tracks.ts`). Custo medido caiu de 0,103 para 0,087 de um núcleo.
- **Testes de carga** em `tests/audioLoad.test.ts`: orçamento de notas (abaixo de 4 por segundo), no máximo 12 vozes ao mesmo tempo, no máximo 6 nós por nota, e nenhum nó ligado depois que os sons acabam. Falam com um contexto de áudio falso.
- **`release()`** exportada de `AudioEngine.ts` para o teste.
- **Arquitetura:** `docs/ARCH.md`. Proposta de divisão da `MainScene` em subsistemas (bombas, pickups, inimigos, sono), ainda não aplicada.
- Verificado: typecheck, 74 testes e build.

## R2. Teste de fumaça (sessão de 2026-11-10, parte 12)

- `scripts/smoke.cjs`: abre o jogo, passa a carta, coloca uma bomba, espera a explosão e falha se houver erro de página ou console.
- Playwright fica fora do projeto (regra do CLAUDE.md), via variável `PW`.
- Verificado: passa no servidor de dev; falha quando o servidor não responde.

## Estudo de arquitetura: R1 (parcial), R3 e R4 (sessão de 2026-11-10, parte 13)

- **R1 (parcial), `BombSystem`:** bombas, explosões e empurrão saíram da `MainScene` para `src/game/BombSystem.ts` (221 linhas). A cena caiu de 1.410 para cerca de 1.200 linhas. A cena cria o sistema em `create()`; o chefe chama `bombSystem.spawnExplosion`. Ficou de fora: `PickupSystem`, `EnemySystem` e `SleepSystem`.
- **R3, testes sem membros privados:** `AudioEngine` ganhou `attachContext(ctx)` (público) e `playNote` ficou público. `tests/audioLoad.test.ts` não acessa mais membros privados; restam dois `as unknown as` que só convertem o contexto falso para o tipo do navegador.
- **R4, documentação:** `docs/05-como-esta-feito.md` aponta para `ARCH.md` na parte de arquitetura e atualiza a linha de explosões. `ARCH.md` reflete a extração.
- **Verificado:** typecheck, 74 testes, build, teste de fumaça (bomba colocada e explodida sem erro) e benchmark de áudio rodam sem erro.

## Desempenho, Phaser local, M4, M5 e P1 (sessão de 2026-11-10, parte 7)

- **Phaser não vem de CDN**: `index.html` só carrega `src/main.ts`; o Phaser 3.90.0 é dependência npm, fixa. Nada a baixar.
- **Diagnóstico de lentidão** (Chromium sem GPU, via Playwright): 60 fps em todas as fases, 0,4 a 0,8 ms de JS por quadro, sem vazamento de cenas, ouvintes, texturas ou nós de DOM após 6 voltas menu -> partida -> mapa -> menu. A música custa cerca de 5 a 9% de um núcleo (medido antes, `bench.json`).
- **Mudanças de custo**: `backdrop-filter: blur` removido dos overlays (borra o canvas animado a cada quadro, caro em GPU fraca); `powerPreference: 'high-performance'` e `smoothStep: false` no `Phaser.Game`; Phaser em arquivo próprio (`manualChunks`), então o navegador guarda em cache e só rebaixa o jogo (93 kB) a cada versão.
- **M4. Dano por elemento no chefe**: `BOSS_DAMAGE` em `config.ts` (fogo 2, éter 2, água 1, terra 1); vida da Belladona 8 -> 10; `onExplosion(tiles, element)`. Decisão em `docs/06-decisoes.md`; testes em `tests/boss.test.ts`.
- **M5. Diário da Roo**: botão DIÁRIO no menu, `ui/diary.ts`, `game/diary.ts` (5 páginas; uma abre a cada fase vencida). Sem chave nova: usa `bombroo_stages_completed`. Teste em `tests/diary.test.ts`.
- **P1. Contorno escuro da Roo**: `textures/outline.ts` pinta 1 px escuro em volta dos quadros de caminhada (`roo_{dir}_{0-3}`).
- Verificado: typecheck, 83 testes, build.

## Final da história, menu e vida (sessão de 2026-11-10, parte 8)

- **Caminhar menos fluido**: causa provável, `fps: { smoothStep: false }` adicionado por mim na parte 7 (tirava a suavização do delta). Removido.
- **Menu**: pixel art de ponta a ponta (a Roo em escala inteira, sem girar; líquido, braço e varinha em baixa resolução; brilhos e bolhas em pixels em faixas). Botões secundários menores e discretos, que não cobrem mais o caldeirão. A tentativa de Roo HD foi descartada.
- **Despedida da Belladona** (`BELLADONA_CARDS`): três cartões ao ser derrotada, antes do jardim.
- **M3. Cena final no Caldeirão** (`scenes/EndScene.ts`, `CAULDRON_LINES`): Roo sozinha com o frasco vazio, depois a tela "Jornada cumprida".
- **M6. Vida entre fases**: baú não cura mais; `stageClearHeal` já era 0. Decisão em `docs/06-decisoes.md`.
- **Fotos do catálogo** (`docs/img/sprites.png` e `sprites/*.png`) refeitas, com a nova categoria `humans` (Anselmo).
- **Jogo de ponta a ponta por script**: fase 3 (derrota) -> despedida -> fase 4 -> portão -> confissão -> cena final -> tela de fim, sem erros. Faltou olhar por uma pessoa.


## Sessão de 2026-11-10, parte 9

- **Caminhada da Roo**: a causa era o código, não os sprites. Cada casa (220 ms) reiniciava a animação (`playIdle` + `playWalk`) e o ciclo de 12 fps não cabia na casa. Agora o passo é manual (`stepPlayerMove`) com o tempo que sobra levado ao passo seguinte, e o ciclo de 4 quadros dura 2 casas e acompanha a velocidade. Medido por script: 3,03 px por quadro, constante, sem quadro de parada entre casas.
- **D2. Power-ups por poção** (`game/upgrades.ts`, testes em `tests/upgrades.test.ts`): alcance e número de frascos valem só para a poção escolhida; a HUD mostra ativos/limite da poção escolhida; velocidade segue global. Não precisou migrar `storage.ts` (nada disso é salvo). Decisão em `docs/06-decisoes.md`.
- **P2. Belladona**: `witch_talk_0/1` (fala, usada quando ela solta uma fala) e `witch_defeat` (vencida, olhos fechados em calma, cabeça baixa). Ela não gira nem encolhe mais ao cair.
- **R1 completo**: `PickupSystem`, `EnemySystem`, `SleepSystem` e as regras puras (`pickupRules`, `enemyRules`, `sleepRules`, `blast`) fora da `MainScene` (de 1298 para ~885 linhas). Testes novos: `systemRules`, `blast`, `upgrades` (100 no total).
- Mapa conferido por script em 390x844 com fases 1 e 2 vencidas: progresso lido de `bombroo_stages_completed` e mostrado certo.
- Fotos `docs/img/sprites.png` e `sprites/bosses.png` refeitas.
- Tentativa de R5 (bundle menor) descartada, motivo em `task.md`.

## Rodada de 2026-11-13 (movida de `task.md` em 2026-11-15)

- **Capítulo 1 e Névoa:** A NÉVOA (fase 3, `fog: { radius: 3 }`) e o chefe **Quimera de Mercúrio** (fase 4, O POÇO, com sprite, 4 habilidades, falas, despedida e diário); progresso salvo migra sozinho (`bombroo_stages_schema`, `STAGE_SCHEMA`). `src/lab/` criado (`docs/15-lab.md`).
- **Torre da Belladona** como capítulo com só fantasmas e a Belladona de chefe; **Mandrágora** (chefe do jardim, 4/4 de O Retorno) e a classe-pai `BossBase`.
- **Dano por elemento** (`game/entities/damage.ts`): todos os personagens têm barra de vida, fraqueza e resistência (`profiles.ts`); chefes em `game/entities/bosses/`.
- **Reorganização:** `game/entities/` e `game/stages/` (capítulos em `chapters/`); registros (`bosses/defs.ts`, `forms/registry.ts`); `RooFormSystem` e `StoryDirector` fora da `MainScene`; páginas em `src/pages/`; testes de contrato (`tests/contracts/`); `npm run check` e `npm run smoke`. Guia em `docs/16-guia-de-extensao.md`.
- **Roo:** habilidade de empurrar removida; **vida contínua** (24 pontos, fraca ao fogo, `game/entities/roo.ts`, barra na HUD); **Roo Fire** (T, 20 s em 4 degraus, bônus de 50% nas poções de fogo, Brasas, Labareda no X, Luz de chama na névoa); **Roo Água** (imune à água, Bolha de sabão que prende inimigos, sons novos); sprites por forma e estágio.
- **Manuscrito do Alquimista** no lugar do Diário (`/manuscrito.html`, estética do Voynich); Roo Fire, Leão Verde e depois as outras formas ganharam página.
- **Leão Verde** (chefe) e **Arena de treino** (menu ARENA, todas as poções, vencer abre a página no Manuscrito).
- **História aplicada ao jogo:** carta, fases, passagens, falas da Belladona, confissão do Anselmo; HUD refeita (ícones, sem legendas); blocos próprios por fase (12 estilos + livros); **cruzes removidas** de blocos e fichas (regra permanente em `CLAUDE.md`); verificação de celular em 360, 390, 844 deitado e tablet.
- **Power-ups elementais:** `+1 RAIO` e `+1 FRASCO` carregam a poção que fortalecem (confirmado por você).
- **Baús:** quanto maior o prêmio, menor a chance (`CHEST_COMMON`/`CHEST_RICH`), números mantidos. Documentos de regras e recompensas conferidos em 2026-11-13 (baú em `docs/03-mundo.md` corrigido).
- **Roo masculina** na prosa de `docs/12-historia.md`, `history.html` e carta, revisada frase a frase (o "ela" que sobra é a Belladona).
- **História nova (parte 11):** roteiro (`docs/12-historia.md`) e livro (`history.html`); cena do nascimento da Roo na bolha iridescente; sprites da Roo bebê (`src/textures/rooBubble.ts`, GIFs em `docs/img/`). Decisões: gênero da Roo, nomes das etapas da Obra como subtítulo.
- **Caminhada da Roo:** o passo à mão (`stepPlayerMove`) com o tempo que sobra levado ao passo seguinte (3,03 px por quadro, medido por script).
- **Descartados** (motivo em `task.md`): redução do bundle do Phaser (R5); commits intermediários e músicas novas.

## Rodada de 2026-11-14 (movida de `task.md` em 2026-11-15)

- **Páginas 404 e 500** (`404.html`, `500.html`; em dev, middleware em `vite.config.ts`; testes em `tests/contracts/errorPages.test.ts`) e botão LOG DA HISTÓRIA no menu (`history.html#log`).
- **Log da história** em `history.html`, com a regra 7 em `docs/12-historia.md`: toda mudança de fato entra lá como commit.
- **`history.html`** atualizado ao jogo (status, apêndice, Diário trocado por Manuscrito).
- **Derrota recomeça na fase perdida** (`game/retry.ts`, `tests/retry.test.ts`); antes a campanha sempre voltava à fase 1.
- **Manuscrito mais leve no celular:** o ruído do papel virou um canvas gerado uma vez (`setPaperGrain`), e saiu o `background-attachment: fixed`. (Falta confirmar num aparelho.)
- **Fase 1 com 100 s** (era 90 s). Roteiro: status das pendências corrigido; frase dos fantasmas-ecos na passagem 2.

## Rodada de 2026-11-15 (movida de `task.md`)

- **Biblioteca Proibida** é capítulo da campanha (`stages/chapters/biblioteca.ts`, 4 fases, Leão Verde no fim, entre a Torre e o Retorno); `STAGE_SCHEMA` 4.
- **Poções aprendidas, não compradas** (`game/learning.ts`: água depois da fase 1, terra depois da 3, ar depois da 4). **Loja removida** (`ui/shop.ts`, `game/shopRules.ts`, overlay, botões, CSS, testes). **OURO saiu do jogo** (`bombroo_bank` não é mais lida nem gravada; baús guardam um item).
- **Velocidade gradual:** `SPEED_STEP` 0,12; casa base 260 ms (`docs/10-equilibrio.md`).
- **Entrada da fase:** o cartão fica até ENTER ou toque (`StoryDirector.showBanner/dismissBanner`, `MainScene.introOpen`). Furos de roteiro corrigidos em `story.ts`, `vale.ts`, `retorno.ts` e no capítulo VI de `history.html`.
- **Tecla T** transforma na forma do elemento da poção na mão (`formForElement`); a Y saiu; o botão TRANSFORMAR de toque substitui ROO FIRE e ROO AQUA. Enquanto a forma dura, só a poção do elemento dela funciona (`game/loadout.ts`). **Barra de vida** verde, amarela e vermelha (`hpColor`).
- **Mapas da campanha:** a Biblioteca ganhou papel próprio (velino, prateleiras e lombadas), cenário (estantes com correntes e velas) e o ícone da estante acorrentada (antes aparecia com o mosteiro e a cruz); o subtítulo do vale conta os capítulos ainda selados (hoje, só o Observatório). `MapScene.ts` (`LOOKS`, `CHAPTER_ICON`, padrão `library`).
- **Roo Terra e Roo Ar** (`game/forms/earth.ts` e `air.ts`, sprites `rooEarth.ts`, `rooAir.ts`, `rooRecolor.ts`; sons de transformação, de fim, `wall` e `gust`; ícones e cores na HUD; ajuda; páginas no Manuscrito). Terra: imune à terra no auge, 20% mais lenta, Muro de sal. Ar: resiste ao ar, sem névoa e sem baús, Sopro.
- **Quando se aprende cada forma** (`FORM_LESSONS`): água no meio da fase 2 (3 golpes da Poção de Água), terra ao começar a fase 4 (antes da Quimera), ar no meio da fase 5 (3 golpes da Poção de Ar); se a Roo vencer a fase sem chegar lá, aprende ao fim; save novo `bombroo_forms`, e saves antigos que já passaram da fase contam como aprendidos. Decisão em `docs/06-decisoes.md`, desenho em `docs/18-transformacoes.md`.
- **Verificado:** typecheck, `npm run check` (348 testes e build) e, num navegador de teste, as quatro formas, o muro, o sopro, o peso da Terra, a Roo Ar sem baús e as duas lições. Sem erros de página.

## Rodada de 2026-11-15, parte 2

- **Duelo de chefes na Arena** (`game/duel.ts`, `MainScene.setupDuel/updateDuel/onDuelEnd`, `BossBase.foe`/`targetTile`/`placeAt`, seletor em `ui/arena.ts`, resultado em `ui/overlays.ts`, duas barras na HUD): dois chefes diferentes se enfrentam por 100 s, sem a Roo (ela só assiste). Perde quem cair primeiro; sem nocaute, perde quem tiver menos vida; vida igual é empate. Cada ataque mira o outro chefe e fere com a tabela de dano dele. Perder ou apertar R refaz o mesmo duelo (`retryData`). Testes em `tests/duel.test.ts`. Rodado em todas as 12 combinações (100 s de jogo cada), sem erros.
- **Mapas legíveis:** título, subtítulo, rótulos de fase e a dica ficam sobre uma placa de papel (`MapScene.plate`); os rótulos de fases trancadas não esmaecem mais; o rótulo perto da borda desliza para dentro da moldura. Conferido nas 5 telas.
- **Roo Terra, Raiz (C):** a Roo afunda e viaja por baixo da terra (invisível, invulnerável, passa sob paredes, caixotes e inimigos) e nasce na casa livre mais distante de uma linha de 4 casas, rachando a terra nas casas vizinhas. **Roo Ar mais útil:** leveza (20% mais rápida), Sopro que também desliza as poções e atordoa os inimigos, **Salto de vento (C)**; saiu a regra de não pegar baús. Segunda habilidade em `FormDef.ability2` / `RooForm.useAbility2`, tecla C, botão de toque HABILIDADE 2 (aparece só quando a forma tem), ajuda, Manuscrito e sons (`root`).
- **Inimigos novos:** revisão da proposta em `docs/19-criaturas.md` (seção 6), com os furos do elenco e a ordem sugerida. Nenhum foi construído ainda.

## Rodada de 2026-11-15, parte 3

- **O Observatório** (`stages/chapters/observatorio.ts`): 4 fases (o pátio, o salão dos relógios, a galeria das cartas, a cúpula), sem chefe, entre a Biblioteca e o Retorno (fases 13 a 16; o Retorno vai a 17 a 20). Tema `observatory` (pedra azul-noite), mapa com papel estrelado e cúpula, passagens 13 a 16 em `story.ts`, páginas no Manuscrito. `STAGE_SCHEMA` 5 renumera o save. `upcoming.ts` ficou vazio.
- **Quatro inimigos novos, com sprite** (`textures/enemiesNew.ts`): lanterna viva (fogo, patrulha), relógio de cobre (terra, patrulha com pausa de 2 s a cada 8 passos), toupeira de sal (terra; afunda e brota perto da Roo avisando com um monte) e coruja do scriptorium (ar; marca a casa da Roo e mergulha). Regras puras em `enemyRules.ts`, comportamento em `EnemySystem.ts`, perfis em `profiles.ts`. Lanterna e coruja também na Biblioteca.
- **Defesa (V) em todas as formas** (`forms/defense.ts`): corta o dano pela metade por 3 s. Fogo: Escudo de brasas; Água: Bolha protetora (iridescente); Terra: Círculo de sal (muro nas 4 casas, empurra 2 casas o que estava ao redor); Ar: Redemoinho (afasta os vizinhos). Botão de toque DEFESA, ajuda e HUD.
- **Raiz com destino à escolha:** C abre uma mira (setas movem o cursor dentro de 4 passos, C confirma, X ou V cancelam).
- **Contraste no jardim:** os textos flutuantes (+1 FRASCO, dano, DEFENDIDO) ganharam contorno escuro.
- **Verificado:** `npm run check` (389 testes e build) e, num navegador de teste, comportamentos dos 4 inimigos, defesa das 4 formas, empurrão do círculo, mira da Raiz, textos do jardim e o mapa do Observatório.


## Rodada de 2026-11-15, parte 4

- **Inimigos novos com mais capricho:** dois quadros de vida cada (a chama balança, os ponteiros andam, a toupeira fareja, a coruja pisca), quadros de estado (relógio dando corda na pausa, coruja mirando), brilho da lanterna no chão, rastro da toupeira debaixo da terra, sombra da coruja crescendo, sons `tick` e `hoot`, e avisos que ensinam a regra ao acertar o elemento certo.
- **Arena com transformação à escolha:** seletor na janela da Arena; a Roo luta transformada no auge, sem fim (`RooForm.pin`, `StageData.form`); recomeçar mantém a forma.
- **Bolha protetora da água cura 1 de vida a cada 0,5 s** (`bubbleHealTick`).

## Rodada de 2026-11-15, parte 5: as pendências de `task.md` (movidas de lá)

**UI (tabuleta, latão, pergaminho e luz de vela, aconchegante):** tokens quentes, fundo com luz de vela e poeira, moldura de madeira com fio de latão em volta do jogo, painéis em madeira escura com rebites e divisor de losango, botões de placa de latão (primário) e de madeira (secundário), chama de vela nos botões MÚSICA e EFEITOS e selo de cera no "?", carta, diálogos e ajuda em pergaminho com tinta, frases de ambiente nas telas de pausa e fim (`FLAVOR_*` em `ui/overlays.ts`), controles de toque em madeira. A **ajuda foi reescrita**: estava descrevendo 4 fases e a Belladona como fase 3; agora cobre as 20 fases, as quatro formas (X, C e V), as criaturas e as dicas. Um defeito meu no meio do caminho (um `.big-btn` pego pelo seletor errado apagou o CSS do chip e da Sala de Música) foi achado numa captura e corrigido; conferi que nenhum seletor se perdeu.

**Decisões tomadas com bom gosto (registradas em `docs/06-decisoes.md`):**
- Muro de sal **barra as explosões** (as da Roo e as dos chefes).
- Fogo e Água ganharam a **segunda habilidade (C)**: Onda de brasas e Poça (`forms/fire.ts` e `water.ts`, testes em `tests/forms`).
- Lições pelas **operações** da alquimia; o nome **Roo Água** substituiu "Roo Aqua" em todo o código, docs e testes.
- **Boticário e Ato II ampliado:** adiados de propósito para a versão 2.
- **Licença e endereço final:** seguem com o autor (escolha jurídica e de hospedagem); a 404 e a 500 ficaram documentadas em `docs/20-publicar.md`.

**Jogo:**
- **Ouroboros**, chefe do Observatório (`bosses/ouroboros/`, `textures/ouroboros.ts`): a fraqueza gira (fogo, terra, água, ar) com um brilho que mostra o elemento da vez, o oposto ele devora; anéis que se abrem, mordida em cruz e o Ciclo na fúria. A Cúpula agora é fase de chefe; despedida `OUROBOROS_CARDS`, página no Manuscrito, entrada na Arena e no duelo.
- **Os quatro inimigos que faltavam:** gosma de mercúrio (o fogo a divide), sentinela de cera (Torre), ratinho do celeiro (rouba itens, menos gemas, e devolve se for derrubado) e salamandra amiga (cura 4 uma vez por fase). `harmless`, `createEnemy`, `removePickup`. Os oito inimigos novos ficaram com sprites em `textures/enemiesNew.ts` e páginas no Manuscrito. A Torre deixou de ser só fantasmas.
- **Quimera rebalanceada:** 28 de vida e a Onda da fúria é de ar (os ataques todos de água não feriam três dos outros chefes e curavam a Mandrágora). Em duelo, ela resiste de 45 a 76 s (antes 18 a 47).
- **Roteiro:** página do mestre no Manuscrito (silhueta com lanterna, `textures/mestre.ts`), a **bolha iridescente no último quadro** da `EndScene`, interlúdios da Biblioteca e do Observatório em `history.html` e em `docs/12-historia.md`, tabela "Onde entra no jogo" atualizada.
- **Roo de cachorro:** as orelhas altas e retas liam como coelho; agora são caídas.

**Técnica:**
- **Texturas das formas em segundo plano:** o menu abre logo (cerca de 0,7 s contra 0,95 s) e as 1536 texturas são geradas em pedaços; `RooFormSystem` garante a forma na hora de transformar.
- **Catálogo:** as oito fotos de `docs/img/sprites/` e `sprites.png` foram refeitas com os sprites novos (cada seção tem `data-group`, então o recorte é só `section[data-group="..."]`).
- **Manuscrito no celular:** o sprite não passa mais do medalhão (a legenda "Visto em" ficava sob ele).
- **Descartadas por falta de descrição ou por ficarem sem sentido:** as "teclas U e I" (pendência antiga sem texto), o "gasto que se repete" (era da loja, que saiu), a "estimativa de economia de 80 POÇÃO" (já tinha saído de `docs/10-equilibrio.md`), "capítulos selados" (não há mais nenhum) e "o chefe do Observatório" (é o Ouroboros).
- **Verificado:** `npm run check` (416 testes e build) e, num navegador de teste, as telas da UI, o Ouroboros, os quatro comportamentos novos (cura da salamandra, divisão da gosma, roubo do ratinho e marcha da sentinela), a Roo de orelhas caídas e o catálogo.

## Rodada de 2026-11-15, parte 6: lag (investigação e correção)

Investigação medida (perfil de CPU, vazamento em tempo real, custo de uma explosão); relato completo em `docs/21-desempenho.md`.
- **Sem vazamento:** objetos, tweens e memória estáveis em 60 s de jogo. O lag era de picos.
- **A explosão criava 62 objetos de uma vez** (um emissor, um temporizador, duas imagens e dois tweens por casa). Agora: partículas compartilhadas (`game/fx/particlePool.ts`), imagens reaproveitadas (`objectPool.ts`) e animação no `update`, **0 objetos criados por explosão** e `detonate` de 0,65 para 0,26 ms. Mesmo tratamento para golpes, poeira, espinhos e vapor.
- **Textos flutuantes reaproveitados** (criar um texto cria uma textura de canvas).
- **Gráficos redesenhados só quando há o que mostrar** (formas, avisos dos inimigos), **névoa** só quando a posição ou o raio mudou, **HUD** ignora estado idêntico.
- **Tentado e revertido:** `fps.limit: 60` derruba telas de 60 Hz para 42 atualizações por segundo.
- **CSS:** o fundo deixou de ser `fixed` e a poeira fica parada em telas de toque (o custo era imperceptível no teste, mas é risco no celular).
- Testes: `tests/fx.test.ts` (419 no total).

## Rodada de 2026-11-15, parte 7: O Livro de Roo animado

- **`livro.html`** (botão **O LIVRO** do menu, no lugar do link do log, que continua em `history.html#log` e no topo do livro): a história em **12 aberturas** como um manuscrito de alquimia copiado à luz de vela. Gravura animada em pixel art à esquerda (a Roo bebê dentro da bolha iridescente no laboratório de velas, a fome no vale, o pão partido, o duelo, o ciclo do Ouroboros, o frasco vazio e a bolha que sobe), texto com letra capitular, rubrica em latim, **glosa bíblica do copista** e escrita não decifrada à direita; virada de página em 3D, deslizar, teclado, música opcional (a faixa de cada abertura), versão de uma coluna para celular, movimento reduzido.
- **O pão partido como eixo:** a multiplicação dos pães lida como fórmula por Belladona e como gesto por Anselmo; a tentação das pedras ecoa a filosofia dela; também o samaritano, o rico e Lázaro, os celeiros cheios, o tempo de cada coisa e "de graça recebestes".
- **Respeito à fé:** nenhuma figura tem cruz (a única está na torre do sino do mosteiro); `disco()` desenha discos de 1 e 2 px como quadrados, porque a conta de um disco minúsculo é um "+". O teste confere.
- Arquivos: `src/game/livro.ts` (texto, puro), `src/pages/livroScenes.ts` e `livroDraw.ts` (cenas), `livro.ts`, `src/styles/livro.css`; `docs/22-livro.md`. Testes: `tests/livro.test.ts` roda cada cena com um contexto de mentira em cinco instantes e confere texto, glosas, músicas e a regra da cruz (429 no total).

## Rodada de 2026-11-15, parte 8: o motivo da Roo e o desfecho da história

Crítica recebida: no fim ninguém dizia como os problemas se resolviam (a fome, a peste, o que houve com Belladona, o que a Roo aprendeu) e a Roo parecia só um soldado que busca algo "porque sim".
- **O motivo:** a carta e o cartão do primeiro nível agora dão três razões pessoais: a Roo come da mesma sopa que o vale, o lar (o Caldeirão) foi tomado e Anselmo sabe quem ela é, mas só conta a quem for ouvir. Arco: parte para saber o que é, volta sabendo o que fazer com o que recebeu (ver `docs/12-historia.md`).
- **Belladona:** na derrota o trauma aparece ("minha mãe ardeu três noites e eu contei cada uma... agora não sei o que faço"); no portão do mosteiro ela vem, diz "eu sei destilar a febre" e fica (Anselmo: "não te absolvo: não é o meu ofício").
- **A fome e a peste:** respostas honestas, sem milagre: celeiros abertos um a um, semente repartida, "o pão não sobrou: deu para todos"; a febre recua, nem todos se salvam e os que se foram são lembrados pelo nome.
- **O mestre:** a última página dele, achada no Observatório (cartões do Ouroboros), responde à pergunta ("não foi prova, foi dádiva"); a Roo deixa uma vela na janela.
- **O que a Roo aprendeu**, dito por ela ("não nasci para provar nada; escolho, todos os dias, ficar ao lado de quem tem fome"), e a cena final mostra o Caldeirão fervendo sopa, mexido por muitas mãos.
- **No jogo:** `ENDING_CARDS` passou de 6 para 17 cartões (montados de `CONFISSAO`, `BELLADONA_NO_PORTAO`, `FRASCO` e `EPILOGO`), `CAULDRON_LINES` ganhou 2 linhas, `BELLADONA_CARDS` e `OUROBOROS_CARDS` ganharam um cartão cada. **No livro animado:** nova abertura "A primavera" (13 no total) e as aberturas da jornada, do duelo, do ciclo e do retorno reescritas. Testes em `tests/desfecho.test.ts` (437 no total).

## Rodada de 2026-11-15, parte 9: a mensagem, as gravuras de fase e o novo Mestre

- **A mensagem sem versículos:** o livro, os docs, o histórico e os testes deixaram de citar capítulo e versículo (`Glosa` perdeu o campo `ref`; as glosas são notas do copista). O que o jogo quer dizer entra em pouco e em cada parte: **o verdadeiro evangelho é dedicar a vida a Jesus e servir os mais pobres, as viúvas e os órfãos, como Belladona passa a fazer.** Carta de Anselmo, parágrafos do livro (a fome, a jornada, o retorno, a primavera, o frasco), a história das 20 fases, as passagens 11, 14 e 17, a confissão, Belladona no portão e o epílogo. Testes: `tests/livro.test.ts` (sem versículo, mensagem presente, sem cruz) e `tests/desfecho.test.ts`.
- **Gravuras antes de cada fase:** o cartão de entrada de fase (`#intro-overlay`, `ui/stageIntro.ts`) mostra a gravura animada do livro. `game/stageArt.ts` liga as 20 fases a 16 gravuras (com variantes); `pages/placas.ts` tem as 4 novas (o poço da Quimera, a torre com escada e portas seladas, a biblioteca em 4 variantes com o Leão Verde dormindo, o observatório em 3 com lanterna, relógio e coruja). Movimento reduzido: quadro parado. Conferido no navegador de teste: as 20 gravuras, o botão COMEÇAR e Enter; `tests/stageArt.test.ts` roda cada uma com contexto de mentira.
- **O novo Mestre** (`textures/mestre.ts`): pixel art em retângulos de 1 px, 2 quadros (o segundo pisca um olho, o cristal e a chama pulsam, a barra da capa balança). Aparece no livro (laboratório e bolha) e na página do Manuscrito.
- **Docs:** `docs/22-livro.md` reescrito (13 aberturas, sem referências, gravuras de fase); `docs/ides.md` podado (saiu o que já está no jogo); CLAUDE.md, `docs/16` e `docs/README.md`.
