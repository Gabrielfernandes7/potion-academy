# Potion Academy: estado do trabalho

Este arquivo é a memória do projeto entre sessões. Leia antes de começar, e atualize ao terminar cada tarefa.
Para o "como funciona" completo, veja `CLAUDE.md` (técnico) e `docs/` (jogo). O histórico do que já foi feito está em `solved.md`.

Última atualização: 2026-11-11 (parte 10: história em passagens, música por fase, README). Alterações das partes 6 a 10 ainda **sem commit**.

## História nova (parte 11): só o roteiro, ainda não aplicada no jogo

- Escrito: `docs/12-historia.md` (roteiro) e `history.html` (livro). Direção: fome, Belladona com razão, mestre que busca a pedra por medo de perder a Roo, Roo nascida de uma bolha, ecos cristãos sem pregação.
- Falta aplicar no jogo, na ordem sugerida: `BELLADONA_CARDS`, `ENDING_CARDS` (cartão da bolha), carta (`index.html`), `STAGES`, `PASSAGE_CARDS`, `DIARY`. Tabela completa em `history.html#jogo`.
- Cena do nascimento da Roo (bolha iridescente) pronta em `history.html`; ver no navegador e dizer o que ajustar (ritmo, cores, enquadramento). Pode virar cena do jogo depois.
- Sprites novos: Roo bebê na bolha iridescente, em duas poses: fetal (deitadinha de lado, dormindo, sem chapéu) e observando (acordada, olhando em volta, mão na bolha). Laço de 16 quadros em `src/textures/rooBubble.ts` (texturas `roo_bubble_{fetal,observe}_0..15`); GIFs em `docs/img/roo-bolha-*.gif` (cópia em `public/img/`), gerados por `scripts/bubble-gif.mjs` (ffmpeg + `npm i --no-save @napi-rs/canvas`). Na `history.html`: capa = observando, capítulo II = fetal. Mascote arquivado em `docs/mascote/`.
- Decisões suas: gênero da Roo (carta diz "filho"), nomes das etapas da Obra como subtítulo, bolha no último quadro.

## Feito nesta rodada (2026-11-13)

- Roo masculina na prosa de `docs/12-historia.md` e `history.html` (revisado frase a frase).
- Torre da Belladona (teste): é o chefe do capítulo 1, com só fantasmas (2 no início, até 3). Fantasma imune só à Telúrica. Testes ajustados (105 passam). Falta jogar.
- **Pendente:** o jardim tem chefe? (a Belladona agora é o chefe da Torre). Ver item abaixo.
- **Pendente:** Belladona como chefe do jardim. Falta decidir o que acontece com a fase da Torre (duelo): (a) vira fase normal, e a campanha fica com 3 fases + chefe; (b) sai da campanha.
- **Pendente:** gasto que se repete (depois de conversar); barra de vida contínua (ver item acima).

- Mandrágora (chefe do jardim, 4/4 de O Retorno) e classe-pai `BossBase`: feitas e testadas por script (115 testes; fase rodada em navegador sem erros). **Falta jogar**: equilíbrio (14 de vida, água cura 1, fogo 3), sprite e as falas dela.

- Dano por elemento (`game/entities/damage.ts`): todos os personagens têm barra de vida, fraqueza e resistência; Mandrágora sem cura pela água; chefes em `game/bosses/`. 122 testes passam. **Falta jogar**: o ritmo das fases agora que sapo e fantasma levam 1 a 3 golpes (números em `docs/10-equilibrio.md`).

- Reorganização (2026-11-13): `src/game/entities/` (enemies, bosses, damage, profiles) e `src/game/stages/` (capítulos em `chapters/`, `index.ts` calcula numeração, capítulo e posição). Guia em `docs/14-estrutura-do-codigo.md`. 128 testes passam.
- Power-ups `+1 RAIO` e `+1 FRASCO` agora elementais (carregam a poção que fortalecem). **Falta jogar** para ver se o sorteio uniforme entre as poções que a Roo tem agrada.
- **Próximo:** inimigo novo no primeiro capítulo (começa pelo perfil em `profiles.ts` e `enemies/defs.ts`) e blocos visuais próprios por capítulo (hoje só há três temas: stone, crypt, garden).

- Capítulo 1 (O Vale) ganhou a fase A NÉVOA (fase 3; 11 fases no total) com `fog: { radius: 3 }`; progresso salvo migra sozinho (`bombroo_stages_schema`). `src/lab/` criado (experimentos `fog` e `fire-roo`; `docs/15-lab.md`). 136 testes passam. **Falta jogar** a Névoa (raio, escuridão, dificuldade com fantasmas) e **definir o chefe do capítulo 1**.

## Aguardando você (nada aqui eu consigo fechar sozinho)

**Ver e ouvir no navegador** (eu só verifico por script; sensação de jogo, som e olho são seus):
- Caminhada da Roo: agora o passo é feito à mão (`stepPlayerMove`), com o tempo que sobra carregado de uma casa para a outra e um ciclo de 4 quadros a cada 2 casas. Medido por script: 3,03 px por quadro, constante, sem quadro de "parada" entre casas. Se ainda parecer pulo, diga em que tela e se é com o jogo em 60 ou 120 Hz; o próximo passo seria um ciclo de 6 a 8 quadros (arte nova da Roo).
- Roo é masculino (decidido, `docs/06-decisoes.md`): textos de `docs/`, `history.html` e carta usam "ele". Revisado em 2026-11-13 frase a frase em `docs/12-historia.md` e `history.html`; "ela" restante é a Belladona. Os cartões ficam por ora; no futuro, um vídeo da história da Roo no lugar.
- Contorno escuro da Roo no jardim; dano `-2` na Belladona; página do Diário depois de vencer fases; menu em pixel art; `EndScene`; cartões de despedida.
- **Power-ups por poção** (`game/upgrades.ts`): confirmado pelo usuário, `+1 RAIO` e `+1 FRASCO` valem só para a poção escolhida. Falta jogar e dizer se fica fácil demais (alternativa: limitar o total de frascos).
- **Vida em barra contínua (proposta, não decidida):** trocar os corações por uma barra de vida contínua, e cada poção causar um efeito diferente sobre ela. Perguntas: (1) o que cada elemento faz na barra (dano, cura, outro efeito)? (2) quanto vale a barra inteira (hoje são 5 corações)?
- Músicas (6 faixas, nenhuma ouvida): clima, andamento e volume. Parâmetros de cada uma e o arco da tensão em `docs/13-musica.md`; o duelo foi para 80 BPM. Sons dos elementos (fogo, água, terra, éter) também.
- Passagens entre fases (`PASSAGE_CARDS`, fases 1 e 2): ver se o ritmo do jogo não quebra e se o texto soa natural em português.
- Chance dos baús: confirmado, quanto maior o prêmio, menor a chance (`CHEST_COMMON`/`CHEST_RICH` em `config.ts`). Os números atuais ficam como estão.
- "Som não toca" (relato antigo): causa no seu computador não confirmada. Preciso do navegador, do sistema e de quando o som para.
- Equilíbrio com pessoas (roteiro em `docs/10-equilibrio.md`): 5 a 10 partidas, anotar e ajustar (era a D4).
- Licença do projeto: **sua decisão** (o README continua sem licença). Endereço final do site (`og:image` absoluto).
- Regras e recompensas nos documentos: conferido em 2026-11-13 (baú em `docs/03-mundo.md` corrigido: dava "+5 e +1 vida", agora POÇÃO sorteada e sem cura, como no código). Ainda não conferido: a estimativa de economia de `docs/10-equilibrio.md` (80 POÇÃO por partida).

**Ideia para depois: Roo com fogo (decisão de desenho, sem código ainda):**
- Power-up de fogo (`+1 RAIO`) muda a aparência da Roo enquanto o efeito dura.
- Perguntas em aberto: (1) só o de fogo para testar, ou todos com a sua cor? (2) (a) capa com bordas laranja e vermelhas e chapéu amarelo, ou (b) a Roo inteira com brilho de chama? Recomendação: (a) e começar só pelo fogo, por ser mais legível em 40 px.

**Decisões suas, em segundo plano:**
- **Boticário**: quem é (Anselmo ou outro?), se é jogável. Minha sugestão: não jogável na primeira versão, personagem de história e da loja. Com isso sai o meta prompt (P4).
- Ato II (puzzle de recomposição das páginas, D1): vira fase nova entre 2 e 3? Padrão: sim, sala-puzzle; jardim da confissão; 5 fases. É a maior tarefa que sobra e muda a duração do jogo; você disse que quer uma primeira versão curta e bem trabalhada, então sugiro **adiar** para a versão 2.
- D3, P5, P6 (companheiros, criatura transformada, mestre em sombra) dependem do Boticário e da D1: adiar junto.
- R6: música com orçamento medido ou reverberação mais curta.

## Fila técnica (o que sobrou e eu posso fazer)

- Fotos do catálogo: `docs/img/sprites.png` e `sprites/bosses.png` estão atualizadas; as outras sete de `docs/img/sprites/` não mudaram de conteúdo, mas o script de recorte por categoria não achou os seletores (`sprites.html` não tem `id` por categoria). Se mudar sprite de outra categoria, recortar à mão.
- HUD desenhada no canvas fica serrilhada em telas muito grandes (decisão visual: o estilo é pixel art; mudar só se você quiser texto nítido).

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
| chefe | `src/game/entities/bosses/belladonna/BelladonnaController.ts`, `src/game/entities/bosses/belladonna/rules.ts` |
| sprites | `src/textures/*.ts` (ver `docs/09-sprites.md`) |
| menu | `src/scenes/MenuScene.ts` e `index.html` (`#menu`) |
| loja | `src/ui/shop.ts`, `src/game/shopRules.ts` |
| música e sons | `src/audio/AudioEngine.ts`, `src/audio/tracks.ts` |
| textos de ajuda | `index.html` (`#help-overlay`) |
| cores e layout | `src/styles/main.css` |
