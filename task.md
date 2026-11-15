# Potion Academy: estado do trabalho

Este arquivo é a memória do projeto entre sessões: **só o que está em aberto**. Leia antes de começar e atualize ao terminar cada tarefa.
O que já foi feito (e o histórico por rodada) está em `solved.md`. Para o "como funciona", veja `CLAUDE.md` (técnico) e `docs/` (jogo).

Última atualização: 2026-11-15. Tudo das últimas rodadas está **sem commit** (ver `git status`).

## Aguardando você: jogar e dizer

Eu só verifico por script (regra pura, testes, e o jogo rodando num navegador de teste). Sensação de jogo, som e olho são seus.

- **Roo Terra e Roo Ar (novas, 2026-11-15):** equilíbrio (20% de peso e de leveza, muro de 4 s, Raiz de 4 casas, Salto de 3, Sopro de 2, lição de 3 golpes); se os sprites leem bem em 40 px; sons (transformação, muro, sopro, raiz). Rodei no navegador: troca de textura, muro, Sopro empurrando inimigo e poção, Raiz por baixo de uma parede, Salto por cima de um sapo, lições da Terra (fase 4) e da água (3 golpes). Não joguei uma partida inteira.
- **Duelo de chefes (Arena):** a simulação (12 combinações, 100 s de jogo) mostra a **Quimera perdendo de todos** e Belladona e Leão Verde dominando; nenhum duelo foi ao tempo. É um sinal para você decidir se rebalanceia os chefes (vida, tempos, dano) antes de ajustar a Roo.
- **Observatório e inimigos novos (2026-11-15):** equilíbrio das 4 fases (tempos, quantidades), se lanterna, relógio, toupeira e coruja leem bem e avisam a tempo; se o tema azul-noite agrada; texto das passagens 13 a 16. Rodei 30 s simulados na cúpula (toupeira afundou, coruja marcou, relógio travou, todos andaram) e conferi os sprites e o mapa.
- **Defesa (V) em todas as formas e Raiz com mira:** a escolha do Escudo de brasas (fogo) e do Redemoinho (ar) foi minha; equilíbrio (corta 50%, 3 s, espera 6 s). Se o círculo de sal prende demais a Roo (3 s).
- **Mapas:** conferi no navegador as 5 telas (vale e os 4 capítulos). Os nomes das fases ficam sobre uma placa de papel e não esmaecem; falta só você olhar no celular.
- **Roo Fire e Roo Aqua:** bônus de 50%, espera de 25 s, custo da Labareda, a Bolha de sabão.
- **Vida da Roo** (24 pontos, fraca ao fogo) e o ritmo das fases agora que sapo e fantasma levam 1 a 3 golpes (`docs/10-equilibrio.md`). Fase 1 com 100 s.
- **Chefes:** Quimera (24 de vida, tempos, faixa própria, sprite), Mandrágora (14 de vida, água cura 1, fogo 3), Leão Verde (a fase da Biblioteca usa a arena já existente), Belladona na Torre.
- **Power-ups por poção** (`+1 RAIO`, `+1 FRASCO` só para a poção escolhida): fica fácil demais? Alternativa: limitar o total de frascos. Velocidade gradual (`SPEED_STEP` 0,12).
- **Caminhada da Roo:** o passo à mão (`stepPlayerMove`). Se ainda parecer pulo, diga a tela e se é 60 ou 120 Hz; o próximo passo seria um ciclo de 6 a 8 quadros (arte nova).
- **Músicas** (6 faixas, nenhuma ouvida) e sons dos elementos: clima, andamento, volume (`docs/13-musica.md`). **Passagens** entre fases (`PASSAGE_CARDS`): ritmo e português.
- **Equilíbrio com pessoas:** 5 a 10 partidas, anotar e ajustar (roteiro em `docs/10-equilibrio.md`). A estimativa de economia de lá (80 POÇÃO por partida) é do tempo do OURO: reescrever.
- **"Som não toca" (relato antigo):** causa no seu computador não confirmada. Preciso de navegador, sistema e de quando o som para.
- **Manuscrito lento no celular:** o ruído do papel já é um canvas gerado uma vez; falta testar num celular de verdade. Suspeito restante: os 12 ícones com `feDisplacementMap` (filtro `#rough`) por página.
- **Vistos no celular, sem correção:** a legenda "Visto em" fica sob o sprite no medalhão; o sprite ainda lê como coelho.
- **Contorno escuro da Roo no jardim**, dano `-2` na Belladona, menu em pixel art, `EndScene`, cartões de despedida: nunca vistos por uma pessoa.

## Decisões suas

- **Mapeamento das lições pela Obra:** operações (recomendado) ou etapas (`docs/18-transformacoes.md`, "Pontos em aberto").
- **Nome "Roo Aqua"** (código, Manuscrito) → "Roo Água"? Só trocar o texto; as chaves das texturas ficam.
- **Muro de sal:** deve barrar também a onda das explosões? Hoje barra só quem anda.
- **Fogo e Água com uma segunda habilidade (C)?** Ideias em `docs/18-transformacoes.md` (onda de brasas; poça que escorrega).
- **Mais inimigos:** faltam gosma de mercúrio, sentinela de cera, ratinho do celeiro e salamandra amiga (`docs/19-criaturas.md`, seções 6 e 7). A Torre ainda só tem fantasmas.
- **Chefe do Observatório:** o capítulo entrou sem chefe (a cúpula é o desfecho). Quer um chefe? Pede sprite, controlador, falas, perfil e página no Manuscrito.
- **Boticário** (quem é, se é jogável; sugestão: não jogável na primeira versão) e **Ato II** (puzzle de recomposição das páginas, fase nova entre 2 e 3; sugestão: adiar para a versão 2). D3, P5 e P6 (companheiros, criatura transformada, mestre em sombra) dependem disso.
- **Licença** do projeto (o README segue sem) e **endereço final** do site (`og:image` absoluto).
- **Hospedagem:** o servidor precisa mandar 404 para `404.html` e erros 5xx para `500.html`.
- **Música (R6):** orçamento medido ou reverberação mais curta.
- **Gasto que se repete** (depois de conversar) e capítulo narrado da Biblioteca no livro (`history.html`): sem decisão.

## Roteiro (`docs/12-historia.md`)

- Falta: página do mestre no Manuscrito; a bolha no último quadro; os capítulos selados; o fantasma-eco já está na passagem 2.
- Você revisa os furos de roteiro (a Roo é masculina na prosa; os cartões ficam por ora, e no futuro um vídeo da história no lugar).
- Teclas **U e I** (pendência antiga, sem descrição; confirmar se ainda vale).

## Fila técnica (o que sobrou e eu posso fazer)

- Fotos do catálogo: `docs/img/sprites.png` e `sprites/bosses.png` estão atualizadas; as outras sete de `docs/img/sprites/` não mudaram de conteúdo, mas o script de recorte não achou os seletores (`sprites.html` não tem `id` por categoria). Também faltam as fotos de Roo Terra e Roo Ar no catálogo.
- 1536 texturas de forma são geradas no boot (eram 768). Se o menu demorar a abrir em aparelho fraco, gerar cada forma só na primeira transformação (`addRooFormTextures(scene, { forms: [id] })` já aceita isso).
- A habilidade de empurrar da Roo foi removida; o Sopro do ar faz um papel parecido (só em inimigos comuns). Ideias guardadas em `docs/ides.md`.
- HUD no canvas fica serrilhada em telas muito grandes (decisão visual do estilo pixel art; mudar só se você quiser texto nítido).

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

- **Commits:** só quando o usuário pedir. Mensagens em inglês, no padrão `tipo(escopo): descrição`, como o histórico.
- **Idioma:** textos do jogo e documentação em português (PT-BR). Código e comentários em português, como o resto.
- **Verificar antes de dizer que está pronto:** `npm run typecheck`, `npm run test` e `npm run build`. Para visual e comportamento, abrir no navegador de teste (ver "Ferramentas de teste").
- **Não mencionar pessoas pessoais no projeto.** O projeto é um legado para uma pessoa específica, mas nada disso deve aparecer em código, docs ou commits.
- **Documentação:** cada pergunta tem seu arquivo em `docs/` (máximo ~60 linhas). Não criar documentos enormes.

## Ferramentas de teste

- `npm run dev` abre em `http://localhost:5173`. O jogo fica em `window.__game` (só em dev).
- `/sprites.html`: catálogo com todos os sprites ampliados.
- Testes automáticos: `tests/` (Vitest, 348 testes). Lógica pura: regras, formas, lições, faixas de música, chefes, equilíbrio, geometria da Roo; `tests/contracts/` confere que registros, HTML e textos continuam ligados.
- Playwright e Chromium ficam **fora do projeto**. O Chromium já está em `~/Library/Caches/ms-playwright/` e o módulo `playwright-core` no cache do `npx`; `PW=... npm run smoke` os usa. Não instalar dentro do repositório. Para testar por script, depois de `scene.start('Main', ...)` chame `endIntro()`: com o cartão de entrada aberto, a `update` não roda e nada anda (nem `forms.update`).
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
| regras da fase | `src/scenes/MainScene.ts`, `src/game/{Bomb,Pickup,Sleep}System.ts`, `src/game/entities/enemies/EnemySystem.ts` |
| movimento e animação da Roo | `MainScene.stepPlayerMove`, `createHeroAnims` |
| power-ups por poção | `src/game/upgrades.ts` |
| chefes | `src/game/entities/bosses/defs.ts` (lista única) e uma pasta por chefe |
| transformações da Roo | `src/game/forms/` (regras), `src/game/RooFormSystem.ts` (jogo), `src/game/learning.ts` (quando se aprende), `src/textures/roo{Fire,Water,Earth,Air}.ts` |
| mapas (campanha) | `src/scenes/MapScene.ts` (`LOOKS`, `CHAPTER_ICON`, `drawPattern`, `drawChapterScenery`), `src/game/stages/` |
| sprites | `src/textures/*.ts` (ver `docs/09-sprites.md`) |
| menu | `src/scenes/MenuScene.ts` e `index.html` (`#menu`) |
| música e sons | `src/audio/AudioEngine.ts`, `src/audio/tracks.ts` |
| textos de ajuda | `index.html` (`#help-overlay`) |
| cores e layout | `src/styles/main.css` |
