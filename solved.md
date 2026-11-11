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
