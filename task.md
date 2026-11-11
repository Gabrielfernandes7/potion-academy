# Potion Academy: estado do trabalho

Este arquivo é a memória do projeto entre sessões. Leia antes de começar, e atualize ao terminar cada tarefa.
Para o "como funciona" completo, veja `CLAUDE.md` (técnico) e `docs/` (jogo). O histórico do que já foi feito está em `solved.md`.

Última atualização: 2026-11-10 (parte 9). Alterações das partes 6 a 9 ainda **sem commit**.

## Aguardando você (nada aqui eu consigo fechar sozinho)

**Ver e ouvir no navegador** (eu só verifico por script; sensação de jogo, som e olho são seus):
- Caminhada da Roo: agora o passo é feito à mão (`stepPlayerMove`), com o tempo que sobra carregado de uma casa para a outra e um ciclo de 4 quadros a cada 2 casas. Medido por script: 3,03 px por quadro, constante, sem quadro de "parada" entre casas. Se ainda parecer pulo, diga em que tela e se é com o jogo em 60 ou 120 Hz; o próximo passo seria um ciclo de 6 a 8 quadros (arte nova da Roo).
- Contorno escuro da Roo no jardim; dano `-2` na Belladona; página do Diário depois de vencer fases; menu em pixel art; `EndScene`; cartões de despedida.
- **Belladona nova**: poses `witch_talk` (fala) e `witch_defeat` (vencida, calma, sem girar nem sumir). Ver se a derrota agora tem a dignidade certa.
- **Power-ups por poção** (`game/upgrades.ts`): `+1 RAIO` e `+1 FRASCO` valem só para a poção escolhida. Jogar e dizer se o limite por poção deixa o jogo fácil demais (alternativa: limitar o total de frascos).
- Vida entre fases: se ficar duro, subir a chance do coração em `game/rewards.ts`.
- Músicas (6 faixas, nenhuma ouvida): clima, andamento e volume. Sons dos elementos (fogo, água, terra, éter) também.
- Chance dos baús: seu exemplo (5 moedas 1%, 20 moedas 5%) é o inverso da regra implementada (quanto maior o prêmio, menor a chance). Confirmar os números (`CHEST_COMMON`/`CHEST_RICH` em `config.ts`).
- Lentidão: no meu teste (Chromium sem GPU) são 60 fps e menos de 1 ms por quadro, sem vazamento. Se persistir, preciso de aparelho/navegador, tela e se piora com o tempo.
- "Som não toca" (relato antigo): causa no seu computador não confirmada. Preciso do navegador, do sistema e de quando o som para.
- Aparelho de celular real (toque, mapa, layout): só testado por emulação.
- Equilíbrio com pessoas (roteiro em `docs/10-equilibrio.md`): 5 a 10 partidas, anotar e ajustar (era a D4).
- Licença do projeto e endereço final do site (`og:image` absoluto).

**Decisões suas, em segundo plano:**
- **Boticário**: quem é (Anselmo ou outro?), se é jogável. Minha sugestão: não jogável na primeira versão, personagem de história e da loja. Com isso sai o meta prompt (P4).
- Ato II (puzzle de recomposição das páginas, D1): vira fase nova entre 2 e 3? Padrão: sim, sala-puzzle; jardim da confissão; 5 fases. É a maior tarefa que sobra e muda a duração do jogo; você disse que quer uma primeira versão curta e bem trabalhada, então sugiro **adiar** para a versão 2.
- D3, P5, P6 (companheiros, criatura transformada, mestre em sombra) dependem do Boticário e da D1: adiar junto.
- R6: música com orçamento medido ou reverberação mais curta.

## Fila técnica (o que sobrou e eu posso fazer)

- R1 (resto): `damagePlayer` e `hitFx` (efeito de ser atingido) ainda vivem entre `MainScene` e `EnemySystem`; se o chefe passar a usá-los, mover para um módulo de efeitos. `SleepSystem.isSleeping` está sem uso.
- Fotos do catálogo: `docs/img/sprites.png` e `sprites/bosses.png` estão atualizadas; as outras sete de `docs/img/sprites/` não mudaram de conteúdo, mas o script de recorte por categoria não achou os seletores (`sprites.html` não tem `id` por categoria). Se mudar sprite de outra categoria, recortar à mão.
- HUD desenhada no canvas fica serrilhada em telas muito grandes (decisão visual: o estilo é pixel art; mudar só se você quiser texto nítido).
- Botão de toque "BOMBA" no celular: o glossário pede FRASCO/POÇÃO; conferir o texto.

## Descartado (com motivo)

- **R5, reduzir o bundle do Phaser (1,2 MB, 332 KB comprimido):** testei os dois caminhos. `phaser/src/phaser.js` com os recursos desligados dá o mesmo tamanho (a árvore já entra inteira). `phaser-core.js` cai para 664 KB, mas não tem 12 módulos que o jogo usa (`tileSprite`, partículas, formas, `Utils`, `Math.Linear`, `Display.Color`, `Curves`...): remontar à mão é frágil e só se descobre no jogo. O arquivo já é guardado em cache. Não vale para a primeira versão.
- Itens "Em aberto" antigos 5 (commits intermediários) e 0 (músicas novas; o jogo ficou com 6 faixas, uma por parte): sem ação.


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

## Armadilhas já encontradas (não repetir)

- `scene.restart()` sem dados reaproveita os dados anteriores. Passe sempre os dados.
- Câmera com `setViewport` tem offset: para o centro do mundo use `CONFIG.cols/rows * tile / 2`, não `camera.centerX`.
- Frase de `Enter`: na partida é pausa, no menu inicia o jogo. Não misturar.
- O navegador acelera timers em abas ocultas: o agendador de música usa 1 s de antecedência.
- Teclas apertadas com a janela de ajuda aberta são descartadas (`resetKeys`), para não agirem ao fechar.
- Não chame `playIdle()` ao fim de cada casa: reinicia a animação de caminhada e a Roo parece pular de bloco em bloco (ver `stepPlayerMove`).
- `sed -i` no macOS é diferente do Linux: use Python para editar arquivos.

## Mapa rápido (onde mexer)

| Quero mudar | Arquivo |
|---|---|
| números do jogo | `src/config.ts` |
| regras da fase | `src/scenes/MainScene.ts`, `src/game/{Bomb,Pickup,Enemy,Sleep}System.ts` |
| movimento e animação da Roo | `MainScene.stepPlayerMove`, `createHeroAnims` |
| power-ups por poção | `src/game/upgrades.ts` |
| chefe | `src/game/BossController.ts`, `src/game/boss.ts` |
| sprites | `src/textures/*.ts` (ver `docs/09-sprites.md`) |
| menu | `src/scenes/MenuScene.ts` e `index.html` (`#menu`) |
| loja | `src/ui/shop.ts`, `src/game/shopRules.ts` |
| música e sons | `src/audio/AudioEngine.ts`, `src/audio/tracks.ts` |
| textos de ajuda | `index.html` (`#help-overlay`) |
| cores e layout | `src/styles/main.css` |
