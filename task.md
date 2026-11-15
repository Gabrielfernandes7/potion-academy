# Potion Academy: estado do trabalho

Este arquivo é a memória do projeto entre sessões: **só o que está em aberto**. Leia antes de começar e atualize ao terminar cada tarefa.
O que já foi feito (e o histórico por rodada) está em `solved.md`. Para o "como funciona", veja `CLAUDE.md` (técnico) e `docs/` (jogo).

Última atualização: 2026-11-15. As rodadas desta data estão commitadas até `f806677`; o que veio depois (UI, Ouroboros, mais inimigos, segunda habilidade do fogo e da água, Muro que barra explosões, Roo de orelhas caídas) está **sem commit** (`git status`).

## Aguardando você: jogar, ouvir e olhar

Eu verifico por script (regra pura, testes, simulações e o jogo rodando num navegador de teste). Sensação de jogo, som e olho são seus. **Dica:** na Arena dá para treinar com cada transformação contra cada chefe, e o duelo de chefes mostra quem está fora da curva (`docs/10-equilibrio.md`).

- **Equilíbrio das formas:** 20% de peso (Terra) e de leveza (Ar), muro de 4 s que agora barra explosões, Raiz de 4 casas, Salto de 3, Sopro de 2, Onda de brasas (2 casas), Poça (3x3, 4 s), defesa (corta 50%, 3 s, espera 6 s), lição de 3 golpes. Bônus de 50% das formas, espera de 25 s, custo das habilidades. A Bolha protetora cura 1 de vida a cada 0,5 s (entendi "a cada segundo 0,5" assim; se era a cada 1 s, mude `BUBBLE_HEAL_EVERY_MS`).
- **Chefes:** o Ouroboros (32 de vida, ciclo de 9 s, anéis, mordida e o Ciclo) nunca foi jogado; a Quimera (28 de vida, Onda de ar na fúria), a Mandrágora (14 de vida na campanha, água cura 1), o Leão Verde e a Belladona.
- **As fases novas:** o Observatório (4 fases, tema azul-noite), a Névoa com gosma, a Torre com sentinela, o Retorno com ratinho, o Caldeirão com salamandra: tempos, quantidades e se os avisos (monte da toupeira, círculo da coruja, rastro da gosma) dão tempo de reagir. O texto das passagens (13 a 15) e a despedida do Ouroboros.
- **Os 8 inimigos novos:** se leem bem em 40 px (conferi o catálogo, `docs/img/sprites/enemies.png`), sons de tique (relógio) e de pio (coruja).
- **UI nova** (tabuleta de madeira, latão, pergaminho e vela): conferi menu, carta, ajuda, Arena, fim de jogo e celular em pé, mas **só no navegador de teste**. Falta ver em celular de verdade, em telas deitadas e com o sistema em modo claro.
- **Roo de orelhas caídas:** agora lê como cachorro; vale ver andando, nas quatro formas e no jardim.
- **Vida da Roo** (24, fraca ao fogo), o ritmo das fases agora que sapo e fantasma levam 1 a 3 golpes (`docs/10-equilibrio.md`), fase 1 com 100 s, power-ups por poção (fica fácil demais? alternativa: limitar o total de frascos) e a velocidade gradual (`SPEED_STEP` 0,12).
- **Caminhada da Roo:** o passo à mão (`stepPlayerMove`). Se ainda parecer pulo, diga a tela e se é 60 ou 120 Hz; o próximo passo seria um ciclo de 6 a 8 quadros (arte nova).
- **Músicas** (6 faixas, nenhuma ouvida) e sons dos elementos e das formas: clima, andamento, volume (`docs/13-musica.md`). A pergunta R6 (reverberação mais curta ou orçamento medido) só se responde ouvindo.
- **"Som não toca" (relato antigo):** causa no seu computador não confirmada. Preciso de navegador, sistema e de quando o som para.
- **Manuscrito lento no celular:** o ruído do papel já é um canvas gerado uma vez; falta testar num aparelho. Suspeito restante: os 12 ícones com `feDisplacementMap` (filtro `#rough`) por página. A legenda "Visto em" já não fica sob o sprite.
- **Nunca vistos por uma pessoa:** contorno escuro da Roo no jardim, dano `-2` na Belladona, o menu em pixel art, a `EndScene` (agora com a bolha que sobe), os cartões de despedida.
- **Equilíbrio com pessoas:** 5 a 10 partidas, anotar e ajustar (roteiro em `docs/10-equilibrio.md`).

## Decisões que só você pode tomar

- **Licença do projeto** (o README segue sem): é uma escolha jurídica, não minha.
- **Endereço final do site** (`og:image` e `og:url` absolutos): depende de onde será hospedado. A 404 e a 500 estão explicadas para Nginx, Apache e hospedeiros estáticos em `docs/20-publicar.md`.
- **Versão 2 (adiado de propósito):** o Boticário (quem é, se é jogável) e o Ato II ampliado (puzzle de recomposição das páginas), e os companheiros que dependem deles (D3, P5, P6).

## Roteiro (`docs/12-historia.md`)

- Você revisa os furos de roteiro e o texto dos interlúdios novos no livro (Biblioteca e Observatório). A Roo é masculina na prosa; os cartões ficam por ora, e no futuro um vídeo da história no lugar.
- Os nomes das etapas da Obra (Nigredo, Albedo...) como subtítulo dos atos: hoje só como cor e tom.

## Fila técnica (o que sobrou e eu posso fazer)

- HUD no canvas fica serrilhada em telas muito grandes (decisão visual do estilo pixel art; mudar só se você quiser texto nítido).
- A Torre ainda tem pouco além de fantasmas e sentinelas; mais variedade só com a sua opinião depois de jogar.

## Como testar por script (para a próxima sessão)

- O Chromium já está em `~/Library/Caches/ms-playwright/` e o módulo `playwright-core` no cache do `npx`; os scripts de teste ficam no scratchpad da sessão, não no projeto. Depois de `scene.start('Main', ...)`, chame `endIntro()` (com o cartão de entrada aberto a `update` não roda).
- **Duelo de chefes sem esperar:** `scene.start('Main', { stage: 0, arena: A, duel: B })`, `endIntro()` e um laço `while (!m.gameOver && t < 130000) { m.update(t, 50); t += 50; }`; o texto do resultado está em `#go-title` e `#go-stats`.
- **Inimigos e formas:** `m.enemySystem.createEnemy(kind, x, y)`, `m.forms.useDefense()`, `m.forms.useAbility2()`; zere a grade com `m.grid[y][x] = 0` para um corredor livre.

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
