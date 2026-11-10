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
