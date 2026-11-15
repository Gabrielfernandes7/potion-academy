# O Livro de Roo (livro.html)

A história do jogo contada como um **manuscrito de alquimia copiado à luz de vela**, em 13 aberturas. Abre pelo botão **O LIVRO** do menu (ou em `/livro.html`; `#bolha` leva direto à abertura da bolha). É a versão animada de `history.html` (a prosa) e de `docs/12-historia.md` (o roteiro).

## O que a pessoa vê

- **À esquerda, uma gravura animada** em pixel art (200x150, ampliada sem suavização), com os personagens do próprio jogo: a Roo, Belladona, frei Anselmo, o mestre em sombra. As velas tremem, a bolha muda de cor, a multidão respira, o céu gira.
- **À direita, o texto**, com letra capitular em vermelho e ouro, a rubrica em latim, uma **glosa do copista** à margem (uma anotação curta, em voz de quem copia, sem citar versículo) e uma linha de escrita não decifrada (voynichês), como no Manuscrito do Alquimista.
- **A virada de página** dobra a folha em 3D em torno da lombada; deslizar o dedo, as setas do teclado, os pontos (chamas de vela) e os botões também viram. Há **música opcional** (a faixa de cada abertura). Em tela estreita vira uma coluna só (gravura em cima, texto embaixo), sem a dobra.
- Com `prefers-reduced-motion`, a gravura fica parada (um quadro bem iluminado) e a virada é só uma troca.

## As 13 aberturas

| # | Abertura | Cena | O que a cena mostra | Ideia da glosa do copista |
|---|---|---|---|---|
| 1 | O Livro de Roo | `capa` | a bolha sobe da vela, dentro do anel da serpente do ciclo | o pão de cada dia, pedido e dado |
| 2 | Os anos magros | `fome` | o trigo seco ao vento sob a lua, o mosteiro com uma janela acesa | celeiros cheios e mesas vazias |
| 3 | O mestre | `laboratorio` | o laboratório à luz de vela, o alambique que borbulha, o mestre em sombra | contar os dias com sabedoria |
| 4 | A noite da bolha | `bolha` | **a Roo bebê dentro da bolha iridescente, no laboratório iluminado por velas** | o que nasce é dádiva, não produto |
| 5 | Belladona | `belladona` | ela amassa a massa ao lado de uma bolha: "de um sopro e de sabão nasce pão" | o remédio que esquece de quem tem fome |
| 6 | O pão partido | `paes` | a multidão ao pôr do sol, os pães passando de mão em mão, a cesta que não esvazia | o pão repartido que sobra |
| 7 | Frei Anselmo e o mosteiro | `mosteiro` | o monge desce a colina com a lanterna, as janelas acesas | quem parou na estrada para ajudar |
| 8 | A jornada | `jornada` | o mapa: a Roo anda e cada lugar (Vale, Torre, Biblioteca, Observatório) se acende | uma lanterna basta para o próximo passo |
| 9 | O duelo na Torre | `duelo` | Belladona e a Roo, poções em arcos, relâmpago | quem ficou à porta enquanto se discutia |
| 10 | O Observatório e o ciclo | `ciclo` | a serpente gira, a fraqueza passa de elemento em elemento | o tempo de cada coisa |
| 11 | O Retorno | `retorno` | o portão, as famílias, o pão partido à porta | o pão partido à porta, em casa |
| 12 | A primavera | `primavera` | o Caldeirão ferve sopa, mexido por muitas mãos; Belladona destila a febre; uma vela na janela para o mestre | as viúvas e os órfãos servidos primeiro |
| 13 | O frasco vazio | `frasco` | o frasco sobre a mesa e uma bolha que sobe do caldeirão | de graça recebemos, de graça damos |

## A ideia que o livro defende

O pão do mosteiro é o eixo: **Belladona lê a multiplicação dos pães como uma fórmula, e frei Anselmo a lê como um gesto.** Ela tem razão sobre a fome e erra no remédio; ele guardou palavras em cofres e agora quer o contrário, que circulem. A Roo, nascida de uma bolha que ninguém pediu, é a dádiva que desmente a receita.

**A mensagem, dita em pouco e espalhada por todas as partes (sem aula):** o verdadeiro evangelho é dedicar a vida a Jesus e servir os mais pobres, as viúvas e os órfãos, como Belladona passa a fazer. Aparece na carta de Anselmo, nas glosas, nos parágrafos de "A fome", "A jornada", "O Retorno", "A primavera" e "O frasco vazio", na história de cada fase, nas passagens e nos cartões do fim. O livro termina onde começa, em silêncio e em vela, devolvendo a pergunta a quem lê.

## Respeito à fé

O cristianismo entra com reverência, sem pregação e sem ridicularizar nada (regra de `CLAUDE.md`). **O livro e o jogo não citam versículos nem capítulos**: a fé aparece em gestos (partir o pão, acender a vela, abrir o celeiro) e em falas curtas sobre Jesus, os pobres, as viúvas e os órfãos. **Nenhuma figura tem cruz**: a única, minúscula, está na torre do sino do mosteiro, onde a regra a permite. Discos de 1 e 2 px saem quadrados (`disco()` em `livroDraw.ts`), porque o desenho de um disco assim é um "+". Os testes conferem os três pontos (sem versículo, a mensagem presente, sem cruz): `tests/livro.test.ts`.

## As gravuras antes de cada fase

O mesmo livro abre cada fase da campanha: o cartão de entrada (`#intro-overlay`) mostra a **gravura animada** da fase em cima, depois o lugar, o nome, a história da fase e a dica, com o botão COMEÇAR (ou Enter). As 20 fases usam as 12 cenas do livro mais 4 novas (o poço, a torre, a biblioteca e o observatório), com variantes por fase (Biblioteca: acorrentada, escritório, cofre e o Leão Verde dormindo; Observatório: astrolábios com a lanterna, relógios com o relógio, mapas estelares com a coruja).

| Fase | Gravura | Fase | Gravura |
|---|---|---|---|
| 1 | laboratório | 11 | biblioteca (cofre) |
| 2 | a bolha | 12 | biblioteca (Leão Verde) |
| 3 | os anos magros | 13 a 15 | observatório (3 variantes) |
| 4 | o poço (Quimera) | 16 | o ciclo (Ouroboros) |
| 5, 6 | torre (escada, portas seladas) | 17 | a jornada |
| 7 | Belladona | 18 | o pão partido |
| 8 | o duelo | 19 | o mosteiro |
| 9, 10 | biblioteca (estantes, escritório) | 20 | o retorno |

A Arena de treino abre com a gravura do duelo. Com `prefers-reduced-motion` a gravura fica parada.

## Onde está cada coisa

| O quê | Arquivo |
|---|---|
| texto, glosas, ordem, música de cada abertura (puro, testado) | `src/game/livro.ts` |
| as 12 cenas animadas | `src/pages/livroScenes.ts` (`CENAS`) |
| as 4 gravuras novas e o conjunto das 16 (`PLACAS`) | `src/pages/placas.ts` |
| qual gravura abre cada fase (puro, testado) | `src/game/stageArt.ts` (`PLACAS_DAS_FASES`, `placaDaFase`) |
| o cartão de entrada de fase (DOM, laço de 30 quadros por segundo) | `src/ui/stageIntro.ts`; ligado em `StoryDirector.showBanner()` |
| utilitários de pixel art (vela, chama, bolha, brilho em degraus) | `src/pages/livroDraw.ts` |
| a página: virada, música, toque, teclado, carregamento dos sprites | `src/pages/livro.ts` |
| o HTML e o estilo | `livro.html`, `src/styles/livro.css` |

## Como acrescentar uma abertura

1. Em `src/game/livro.ts`: um objeto em `LIVRO` (três parágrafos, uma glosa do copista, sem referência bíblica, a legenda, a seção do códice e a faixa) e o id em `CenaId`.
2. Em `src/pages/livroScenes.ts`: a função da cena (`(c, t, sprites) => void`, pintando o quadro inteiro de 200x150) e uma linha em `CENAS`. Os sprites do jogo que ela usar entram em `SPRITES_DAS_CENAS`.
3. Em `tests/livro.test.ts`: ajuste a contagem e a lista de folios. O teste roda cada cena com um contexto de mentira e pega erro de conta (NaN) e de digitação.
4. Rode `npm run check`; depois abra `/livro.html#<id>` e olhe.

## Para revisar

O texto das aberturas é do roteiro de `docs/12-historia.md`, reescrito com a voz de um copista. Quem escreveu o roteiro deve revisar as glosas, o lugar da mensagem em cada parte e a frase de Belladona (a filosofia dela, "de um sopro e de sabão nasce pão"), que é o centro dramático.
