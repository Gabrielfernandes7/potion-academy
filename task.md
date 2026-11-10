# Potion Academy: estado do trabalho

Este arquivo é a memória do projeto entre sessões. Leia antes de começar, e atualize ao terminar cada tarefa.
Para o "como funciona" completo, veja `CLAUDE.md` (técnico) e `docs/` (jogo, para qualquer pessoa).

Última atualização: 2026-11-10. Último commit: `21d466a feat(ui): add map scene with stage progress in menu`.

Sessão atual (2026-11-10, parte 3): **CONCLUÍDO**
- Implementado mapa de progresso no menu
- Rastreamento de fases concluídas no localStorage
- MapScene mostra fases em ouro (concluídas) vs verde (não concluídas)

## Como trabalhar neste projeto

- **Commits:** só quando o usuário pedir. Sem linha `Co-Authored-By`. Mensagens em inglês, no padrão `tipo(escopo): descrição`, como o histórico.
- **Idioma:** textos do jogo e documentação em português (PT-BR). Código e comentários em português, como o resto.
- **Verificar antes de dizer que está pronto:** `npm run typecheck`, `npm run test` e `npm run build`. Para visual e comportamento, abrir no navegador de teste (ver "Ferramentas de teste").
- **Não mencionar pessoas pessoais no projeto.** O projeto é um legado para uma pessoa específica, mas nada disso deve aparecer em código, docs ou commits.
- **Documentação:** cada pergunta tem seu arquivo em `docs/` (máximo ~60 linhas). Não criar documentos enormes.

## Ferramentas de teste

- `npm run dev` abre em `http://localhost:5173`. O jogo fica em `window.__game` (só em dev).
- `/sprites.html`: catálogo com todos os sprites ampliados.
- Testes automáticos: `tests/` (Vitest, 47 testes). Lógica pura: regras, loja, faixas de música, chefe, equilíbrio, geometria da Roo.
- Playwright e Chromium ficam **fora do projeto**, na pasta de scratchpad da sessão (`/private/tmp/claude-501/.../scratchpad/pw/`). Não instalar dentro do repositório.
- Áudio não pode ser ouvido em teste: medir com `AnalyserNode` (ver histórico da sessão) e pedir feedback ao usuário.

## Estado atual (o que funciona)

- **Menu** (`MenuScene.ts` + DOM): Roo mexe a poção no caldeirão, joga ingredientes, o líquido muda de cor.
- **Sala de Música** (sessão de 2026-11-10): botão SALA DE MÚSICA no menu abre `ui/musicRoom.ts`, com a Roo de maestro (pose `maestro` em `textures/roo.ts`, dois quadros animados) e a lista de faixas. A escolha vale para o menu e as partidas, salva em `bombroo_track`. Quatro faixas novas: Aurora Boreal, Pergaminho Antigo, Sinos da Torre e Sinfonia do Maestro. **Não ouvidas nem vistas no navegador**: pedir ao usuário que avalie o som e o visual do maestro.
- **Fase 1** (laboratório): gemas, porta, caixotes, poções (fogo, aqua, telúrica, etérea), power-ups, inimigos, sono da Roo.
- **Fase 2** (duelo): Belladona (`BossController.ts`), 8 de vida, habilidades com aviso no chão, fúria com metade da vida, vitória dá +40 POÇÃO. Roo leva vida, power-ups e moedas da fase 1.
- **HUD** no canvas (`HudScene.ts`), com barra da Belladona na fase 2.
- **Loja** (Caldeirão), janela "Como jogar" (botão `?`, tecla `?` ou `H`, pausa o jogo).
- **Áudio**: efeitos calmos, estouro por elemento, música diferente por partida (6 faixas + faixa própria do duelo). Botões separados MÚSICA e EFEITOS, com a escolha guardada no navegador (`bombroo_audio`). Correções de suspensão do contexto e do botão de som feitas (dentro do commit `4d3729a`, a mensagem não menciona isso).
- **Tela de jogo sem lista de controles**: as teclas ficam só na janela "?". A legenda dos elementos continua abaixo do canvas.
- **Controles de toque** (d-pad e botões) para celular.
- **Reinícios**: sempre passam `{ stage: 1 }` ou `{ stage: 2, carry }` explicitamente. Sem isso o Phaser reaproveita dados antigos (já causou bug).

## Em aberto (precisa de ação)

0. **Músicas novas (decisão pendente com o usuário).** Ele quer mais músicas além das 6 atuais. Antes de compor, perguntar o clima de cada uma (ex.: noite, floresta, tempestade, laboratório com alambiques) e o andamento. Adicionar em `src/audio/tracks.ts` (lista `TRACKS`) e manter a faixa do duelo em `BOSS_TRACK`.
0b. **Sons dos elementos** feitos (`elementSound` em `AudioEngine.ts`) e medidos, mas **não ouvidos**. Pedir ao usuário que avalie: chiado do fogo, gotas da água, crepitar da terra, zumbido do éter. Os sons de bomba pousando, dano e vitória ainda são os antigos.

1. **Som "não está reproduzindo"** (relato do usuário). Correções feitas e testadas no navegador de teste, mas **a causa real no computador dele não foi confirmada**. Faltam: navegador, sistema e quando o som para. Pedir isso antes de mexer mais.
2. **Equilíbrio não testado com pessoas.** Os números em `src/config.ts` vêm de análise. Roteiro em `docs/10-equilibrio.md` (jogar 5 a 10 partidas, anotar e ajustar).
3. **Belladona não foi ouvida nem jogada por um humano.** Os sons das habilidades do chefe só foram checados por "não dá erro". Verificar: o aviso dá tempo suficiente? A fúria é justa? Ela é fácil demais ou difícil demais?
4. **Foto do catálogo desatualizada se mudarem sprites.** Atualizar `docs/img/sprites.png` quando algum sprite mudar.
5. **Commits de uma rodada não foram verificados um a um.** Os commits intermediários podem não compilar sozinhos. Só o estado final (`HEAD`) foi testado.
6. **Testes de toque e celular** foram só com emulação do Chromium, não em aparelho real.
7. **Layout em telas muito grandes:** o texto da HUD é desenhado no canvas e fica serrilhado.
8. **Bundle do Phaser ~1,2 MB**. Dá para reduzir importando só os módulos usados.

## Ideias ainda não feitas (decisões em aberto)

- Os elementos das poções só mudam cor e som; não têm efeito na regra (ver `docs/06-decisoes.md`).
- Inimigos comuns não perseguem.
- Progressão além de duas fases, pontuação máxima e história.
- Usar a pose de sono também na Belladona (se fizer sentido).

## Armadilhas já encontradas (não repetir)

- `scene.restart()` sem dados reaproveita os dados anteriores. Passe sempre os dados.
- Câmera com `setViewport` tem offset: para o centro do mundo use `CONFIG.cols/rows * tile / 2`, não `camera.centerX`.
- Frase de `Enter`: na partida é pausa, no menu inicia o jogo. Não misturar.
- O navegador acelera timers em abas ocultas: o agendador de música usa 1 s de antecedência.
- Teclas apertadas com a janela de ajuda aberta são descartadas (`resetKeys`), para não agirem ao fechar.
- `sed -i` no macOS é diferente do Linux: use Python para editar arquivos.

## Mapa rápido (onde mexer)

| Quero mudar | Arquivo |
|---|---|
| números do jogo | `src/config.ts` |
| regras da fase 1 | `src/scenes/MainScene.ts` |
| chefe | `src/game/BossController.ts`, `src/game/boss.ts` |
| sprites | `src/textures/*.ts` (ver `docs/09-sprites.md`) |
| menu | `src/scenes/MenuScene.ts` e `index.html` (`#menu`) |
| loja | `src/ui/shop.ts`, `src/game/shopRules.ts` |
| música e sons | `src/audio/AudioEngine.ts`, `src/audio/tracks.ts` |
| textos de ajuda | `index.html` (`#help-overlay`) |
| cores e layout | `src/styles/main.css` |

## Apresentação e reaproveitamento (sessão de 2026-11-10)

- **README.md** novo, com capa (`docs/img/capa.png`), GIF da Roo lendo (`docs/img/roo-lendo.gif`) e instruções de uso.
- **Favicon** (`public/favicon.svg`: chapéu de mago e poção) e **Open Graph** em `index.html` (`public/og-image.png`). Falta o endereço final do site para `og:image` virar absoluto.
- **Pose "read"** da Roo (`roo_read_0/1`) para o GIF.
- **Folha de sprites**: botão em `/sprites.html` gera PNG + JSON com a posição de cada desenho.
- **docs/11-reutilizar.md**: três níveis de reaproveitamento (imagens, código Phaser, regras puras).
- **Licença não definida**: pendente com o autor.
- Efeitos de ser atingido por elemento (inimigos e Roo) em `MainScene.ts` (`hitFx`, `HIT_FX`, `HIT_TINT`). Verificados no navegador sem erro, mas não vistos nem ouvidos.

## Fases, reações, menu e responsividade (sessão de 2026-11-10, parte 2)

- **Quatro fases** em `STAGES` (`config.ts`): 1 laboratório, 2 salão dos fantasmas, 3 duelo, 4 jardim. Derrotar a Belladona leva ao jardim; o portão do jardim vence (+30 POÇÃO). `MainScene` não compara mais `stage` com números: use `this.def` e `this.isBossStage`.
- **Inimigos** em `ENEMY_TYPES`: sapo mago, fantasma (atravessa paredes, 1,5 s por passo, meio transparente dentro de parede) e flor do mal (fixa, bloqueia a casa, chicote com aviso de 0,8 s, imune à água). `hitEnemy()` aplica a imunidade.
- **Reação entre poções** em `game/chain.ts`: só o fogo acende outras poções; a água apaga o fogo (`neutralizeBomb`, som `fizzle`); a terra é imune. **Isso muda o comportamento antigo**, em que qualquer explosão acendia as outras.
- **Arte nova**: `textures/garden.ts` (grama, sebe, canteiro, portão) e `enemy_flower`. O salão dos fantasmas é a pedra do castelo com tom azulado (`LOOKS`).
- **Menu**: a Roo aponta a varinha para o frasco, ele levita e voa guiado por ela; o caldeirão reage por elemento (`REACTIONS` em `MenuScene.ts`); clicar num frasco da prateleira o chama.
- **Responsivo**: três modos de layout (em pé, deitado com controles nas laterais, tela grande até 1280 px). `--stage-w` agora fica no `body`: antes ficava no `:root` e nunca enxergava o `--chrome-h` do modo toque. Verificado de 320x568 a 3840x2160 sem rolagem.
- **Testes**: `chain.test.ts` e `stages.test.ts` (61 no total).
- **Pendências para decidir**: (1) a Poção Aqua precisa ser comprada (60 POÇÃO) para usar a mecânica nova: o salão dos fantasmas não a libera; (2) a história do jogo ainda não existe; (3) nada disso foi jogado de ponta a ponta por uma pessoa: as regras foram verificadas por script no navegador, não por sensação de jogo; (4) o equilíbrio do salão e do jardim (tempos, número de fantasmas e flores) é um palpite.

## Mapa de seleção de fases (sessão de 2026-11-10, parte 3) - CONCLUÍDO

- **MapScene.ts** (`scenes/`): nova cena que mostra um mapa visual do castelo com os 4 locais como botões clicáveis.
- **Integração no menu**: botão "MAPA" adicionado ao menu principal. Ao clicar, abre a MapScene.
- **Rastreamento de progresso**: `storage.ts` guarda quais fases foram concluídas. Ao ganhar uma fase, chama `markStageCompleted(stage)`.
- **Visual do progresso**: fases concluídas em ouro (0x6b5b4f) com símbolo ✓; fases não concluídas em verde (0x3a5a3a).
- **Fluxo**: Menu → Botão MAPA → MapScene com progresso. Ao clicar em uma fase, começa do zero (sempre `stage: 1, 2, 3 ou 4`).
- **Commit**: `21d466a feat(ui): add map scene with stage progress in menu`

## Próximas tarefas

0a. **Troca de frasco no toque (feito, não visto no celular):** botão TROCAR FRASCO no painel de toque (`data-touch="cycle"`) percorre as poções possuídas (`MainScene.cycleBomb`). Os slots da HUD continuam clicáveis no desktop.
0. **Bug do mapa (corrigido, não visto no navegador):** ao voltar do mapa para o menu, os botões DOM sumiam (`MapScene.backToMenu` não reexibia o menu). Também removidos os atalhos de teclado duplicados a cada visita do mapa.

1. **Contraste do jardim (feito, não visto no navegador)**: paleta em `src/textures/gardenPalette.ts` (chão pálido, sebe escura, flor magenta/vinho), testes em `tests/gardenContrast.test.ts` (mínimo 3:1). Pendente: olhar no jogo; contorno escuro na Roo não foi feito; decidir tema (cemitério/biblioteca/laboratório) só se o contraste ainda incomodar.
2. **Testar mapa no navegador**: verificar se o progresso salva corretamente ao vencer fases.
3. **Teste de celular**: verificar responsividade do mapa em telas menores.

