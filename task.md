# Potion Academy: estado do trabalho

Este arquivo é a memória do projeto entre sessões. Leia antes de começar, e atualize ao terminar cada tarefa.
Para o "como funciona" completo, veja `CLAUDE.md` (técnico) e `docs/` (jogo, para qualquer pessoa).

Última atualização: 2026-11-10. Último commit: `21d466a feat(ui): add map scene with stage progress in menu`.

## Roteiro da história por fases (planejamento, sessão de 2026-11-10, parte 5)

Base: `docs/12-historia.md`. Mapa proposto (o código ainda usa os nomes atuais; renomear só textos, não chaves).

| Ato | Fase | Nome atual | Papel na história | Estado |
|---|---|---|---|---|
| I: o chamado | 1 | laboratório | Roo recebe a carta de frei Anselmo e o frasco vazio; aprende as poções | Jogável; falta a carta |
| I: o caminho | 2 | salão dos fantasmas | Ecos do mestre desaparecido, a culpa de Anselmo | Jogável; falta texto |
| II: a recomposição | 2b (nova) | — | Páginas rasuradas por Belladona; Roo recompõe o texto (puzzle) | Não feito |
| III: o duelo | 3 | duelo (Belladona) | Belladona quer transformar as escrituras em elixir; é vencida e deixada ir | Jogável; falta fala e derrota |
| Fim: o retorno | 4 | jardim | Anselmo confessa; Roo volta ao Caldeirão com o frasco vazio | Portão feito; falta confissão e cena final |

**Decisões a confirmar (o padrão está entre parênteses):**
- O Ato II vira fase nova entre 2 e 3? (padrão: sim, como sala-puzzle)
- O jardim é o cenário da confissão, ou o fim deve ser no Caldeirão, como diz a história? (padrão: jardim da confissão, depois cena final no Caldeirão)
- Quantas fases no total? (padrão: 5, com a 2b)

### Tarefas fáceis

### Tarefas médias

- M2. Confissão de Anselmo na fase 4: cartões de diálogo, sem NPC andando.
- M3. Cena final no Caldeirão: Roo sozinha, frasco vazio na HUD, sem a tela de vitória genérica.
- M4. Dano por elemento no chefe: tabela em `config.ts` e `BossController`. Registrar em `docs/06-decisoes.md` antes.
- M5. Diário do Roo: frases liberadas por fase, tela no menu, salvas em `storage.ts` com chave nova.
- M6. Pendência de vida entre fases (`stageClearHeal` ou chance de cura), decisão do usuário.

### Tarefas difíceis

- D1. Ato II: puzzle de recomposição das páginas rasuradas. Mecânica nova: seguir `docs/08-como-criar-uma-mecanica.md`, guardar progresso e definir o que é "lido".
- D2. Power-ups por tipo de poção (`fireLevel`, `bombsMax`, `speedUp` hoje são globais). Exige migração em `storage.ts` sem quebrar `bombroo_owned`.
- D3. Companheiros de viagem (boticário cético, criatura transformada): sprites, seguir a Roo e uma fala própria de cada um.
- D4. Equilíbrio do puzzle e das fases novas, com teste de pessoas (roteiro em `docs/10-equilibrio.md`).

## Arquitetura (recomendações do estudo de 2026-11-10)

Ordem de execução: R2, R1, R3, R4. R5 e R6 ficam para depois do jogo estar fechado. Concluídos: R2, R3, R4 e a primeira parte do R1 (ver `solved.md`).

- R1 (parcial). Feito: `BombSystem`. Falta: `PickupSystem`, `EnemySystem`, `SleepSystem`, uma por vez, com testes das regras que saírem. Também falta tirar a parte pura do `BombSystem` (cálculo dos raios de explosão) para teste.
- R5. Importar só os módulos do Phaser usados (bundle 1,2 MB). Depois.
- R6. Decidir a música: orçamento medido ou reverberação mais curta. Depois.

## Trilha de personagens (só esta trilha por enquanto)

Escopo: arquivos `src/textures/roo.ts`, `witch.ts`, `rooGeometry.ts`, sprites de inimigos humanos, `sprites.ts` e `docs/09-sprites.md`. Não mexer em regras, fases ou áudio.

- P1. Roo: contorno escuro para contraste no jardim (pendência da parte 2).
- P2. Belladona: pose de fala (boca aberta) e pose de derrota que não humilhe.
- P4. Boticário cético (novo, companheiro, difícil de ler a expressão em 40x50).
- P5. Criatura transformada por Belladona (novo, pode ser o mais difícil).
- P6. Mestre desaparecido (novo, só como sombra ou silhueta nas fases 2 e 4).

### Meta prompt para receber arte de personagem

Fluxo: o usuário envia este texto a outra IA (ex.: DeepSeek) para criar a **base** do personagem. Eu só **melhoro** a base recebida (ajustes de forma, cor, contraste e pose), para economizar tokens e reduzir erros. A resposta chega no formato abaixo.

```
Você vai desenhar um personagem do Potion Academy. O jogo não usa imagens:
cada personagem é uma lista de formas que o código desenha com Phaser.

Como o personagem é feito:
- Grade de 40 px de largura por 50 px de altura (Roo e Belladona). Origem no canto
  superior esquerdo. Os pés ficam a 3 px do fundo. Os 10 px de cima são para
  orelhas e chapéu.
- O jogo espelha o lado direito para o esquerdo. Desenhe só o lado direito; detalhes
  assimétricos valem para o espelho também.
- Desenhe em camadas, do fundo para a frente: sombra, corpo, roupa, rosto, acessórios.
- Contorno escuro e cores fortes: legível sobre chão claro (grama, pedra) e escuro.
- Cada pose é um conjunto de quadros. Entre quadros só mudam deslocamentos de 1 a 3 px.
- Sem texto dentro do sprite. Sem emojis. Nomes em português.

Formato da resposta (use exatamente esta ordem):
1. Resumo em duas linhas: quem é, qual pose.
2. Paleta: nome, hex, uso.
3. Formas por camada, em tabela, em coordenadas do grid (x para a direita, y para
   baixo): camada | tipo (rect, ellipse, circle, triangle, polygon, line) | x | y | w | h
   ou pontos | cor | alfa | observação.
4. Quadros: para cada quadro, só as formas que mudam, com o deslocamento em x e y.
5. Imagem de referência ampliada 8x (320x400) com a grade, só para conferir.
6. Checklist: legível em 40x50? orelhas e chapéu dentro dos 10 px de cima? Nada
   cobre o rosto? Contraste com chão claro e escuro? Sem texto?

Não entregue código Phaser nem imagem gerada por IA.
```

**Como eu trabalho um personagem (só melhorias):** recebo a base gerada pela outra IA no formato acima; converto as formas em `make()` no arquivo de textura; ajusto o que o checklist apontar (legibilidade, contraste, nada cobrir o rosto); abro `/sprites.html?zoom=8` para conferir; rodo `npm run typecheck` e `npm run test` (contraste e geometria da Roo).

**Cenário (ambientação medieval):** o jardim fica perto de outra torre, de Belladona. O duelo acontece nessa torre. Ordem sugerida: laboratório → salão dos fantasmas → jardim → torre (duelo) → mosteiro.

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

## Próximas tarefas

(Itens já feitos foram para `solved.md`.)

2. **Testar mapa no navegador**: verificar se o progresso salva corretamente ao vencer fases.
3. **Teste de celular**: verificar responsividade do mapa em telas menores.


## Sessão de 2026-11-10, parte 4

**Feito (não visto no navegador):**
- Removida a introdução duplicada do chefe (`BossController.intro`). Fica só o cartão de entrada da fase (`MainScene.showStageBanner`). O texto antigo "FASE 2" estava errado na fase 3.
- Sorteio de baús por fase: `StageDef.chest` em `config.ts` (tabelas `CHEST_COMMON` e `CHEST_RICH`), `rollChestCoins` em `game/rewards.ts`, valor guardado em `Pickup.value`. Regra: quanto maior a recompensa, menor a chance. Chances: fase 1 (5 moedas 70%, 10 moedas 25%, 20 moedas 4%, 50 moedas 1%); fases 2 a 4 (55/30/12/3%). **O exemplo do usuário (5 moedas 1%, 20 moedas 5%) é o inverso da regra; pedir confirmação dos números.** Testes em `tests/chestOdds.test.ts` e `tests/rewards.test.ts`.

**Pendente (decisão do usuário):**
- Vida entre fases: o código já leva a vida (`advanceStage`). Causas prováveis do "sempre cheio": `stageClearHeal: 1` e corações/baús curando. Aguardando escolha entre zerar `stageClearHeal` ou reduzir as chances de cura.

**Mecânica futura (ainda não feita, registrar em `docs/06-decisoes.md` quando for implementar):**
- **Dano por tipo de poção no chefe:** cada poção causa um dano diferente à Belladona. Exemplo: água causa menos dano, fogo causa mais. Precisa de uma tabela `dano por elemento` no chefe (`config.ts`, `BossController`).
- **Power-ups por poção:** o ganho de um power-up (alcance, número de frascos etc.) vale só para a poção escolhida no momento, não para todas. Ex.: aumentar o alcance da poção de fogo não muda o alcance das outras. Hoje `fireLevel`, `bombsMax` e `speedUp` são globais do jogador; isso exige guardar o nível por tipo de poção (`Player` e `storage.ts`, com cuidado para não quebrar `bombroo_owned`).

**Limpeza de código sem uso (mesma sessão):** `knip` e `tsc --noUnusedLocals` limpos. Removida `getCompletedStages` (storage). Tirado `export` de símbolos usados só dentro do próprio arquivo (classe `AudioEngine`, `drawRooFrame`, `drawWitchFrame`, `openHelp/closeHelp/toggleHelp`, tipos de `tracks`, `config`, `shopRules`, `types`). Re-exportação de `roo.ts` removida: `MainScene` importa `rooOriginY` de `rooGeometry.ts`. Typecheck, 67 testes e build passam.

**Varredura de CSS, public e docs/img (mesma sessão):** nenhuma classe CSS, variável `--` ou imagem sem uso (os "seletores" sem uso eram cores hex). Único arquivo sem referência: `about/History.mdx`, que ainda é o resumo original; decidir se fica, se vira `docs/12-historia.md` ou se é apagado.

**Avisos na tela (mesma sessão, não vistos no navegador):** `floatingText` agora fica 650 ms parado antes de subir e sumir em 450 ms (power-ups, BLOQUEADA, APAGADA, IMUNE). "PORTA ABERTA!" nasce sobre a porta, com 16 px e 1400 ms de permanência, em vez de ficar no centro da grade.
