# Sprites

Um sprite é um desenho do jogo (personagem, item, cenário). **Neste projeto nenhum sprite é uma imagem pronta:** todos são desenhados pelo código, com formas simples (círculos, triângulos, retângulos).

## Ver todos os sprites

- **Ao vivo:** com `npm run dev` ligado, abra `http://localhost:5173/sprites.html`. A página gera os mesmos desenhos do jogo, agrupa e rotula. `?zoom=8` amplia mais.
- **Foto:** `docs/img/sprites.png` (atualize quando mudar um sprite: abra a página e salve uma captura).

![Catálogo de sprites](img/sprites.png)

## Regras de todos os sprites

- O tile do mapa tem **40 × 40 px**. Itens, poções, inimigos e cenário cabem em 40 × 40.
- **Roo e Belladona têm 40 × 50 px:** 10 px a mais em cima (`ROO_HEAD_ROOM`) para as orelhas e o chapéu não serem cortados. O ponto de apoio do sprite é o centro do tile; por isso o jogo usa `setOrigin(0.5, rooOriginY(tile))`.
- Os pés ficam a 3 px do fundo da textura.
- O lado direito é o desenho; o esquerdo é o mesmo sprite espelhado (`flipX`).
- Cores com contorno claro nos frascos, escuras nos personagens. Cada elemento tem a sua cor (veja `config.ts`).

## Personagens

**Roo** (`src/textures/roo.ts`)
| Chaves | O que é |
|---|---|
| `roo_down_0-3`, `roo_up_0-3`, `roo_side_0-3` | andando de frente, de costas e de lado (4 quadros cada) |
| `roo_sleep_{down,up,side}_0-1` | dormindo: olhos fechados, cabeça caída, respiração |
| `roo_stir_0-1` | pose do menu: de lado, sem braço e sem varinha (a cena os desenha em movimento) |

O manto é desenhado **depois** do corpo, por isso cobre as costas, os ombros e os braços. A varinha fica ao lado do corpo, nunca sobre o rosto.

**Belladona** (`src/textures/witch.ts`)
| Chaves | O que é |
|---|---|
| `witch_idle_0-1` | parada (o manto e o chapéu balançam) |
| `witch_cast` | lançando poção: braço levantado, boca aberta, brilho verde |
| `witch_hurt` | machucada: olhos fechados em X, boca para baixo |

## Poções (`src/textures/potions.ts`)

| Chave | Elemento | Formato |
|---|---|---|
| `bomb_normal` | fogo | balão de fundo redondo, líquido vermelho com brasas |
| `bomb_mega` | água | tubo alto, líquido azul com onda e gotas |
| `bomb_pierce` | terra | pote largo com cristais verdes |
| `bomb_remote` | éter | frasco em losango com névoa lilás |

## Itens (`src/textures/entities.ts`)

- Power-ups (fichas com aro colorido): `pickup_bomb_up` (lilás), `pickup_fire_up` (laranja), `pickup_speed_up` (ciano), `pickup_time_up` (amarelo).
- Soltos: `pickup_coin`, `pickup_gem`, `pickup_heart`, `pickup_chest`.
- Inimigo: `enemy`.

## Cenário, HUD e efeitos

- Cenário (`terrain.ts`): `floor1`, `floor2`, `wall`, `block`, `door_closed`, `door_open`.
- HUD (`hud.ts`): `hud_heart`, `hud_heart_empty`, `hud_hourglass`.
- Peças de partículas (`menu.ts`): `menu_spark`, `menu_bubble`, `menu_puff` (usadas no menu, nas explosões, nos brilhos).

## Como criar um sprite novo

1. Escolha o arquivo certo em `src/textures/` (ou crie um) e uma **chave** com o padrão `grupo_nome` (ex.: `pickup_chave`).
2. Copie uma função parecida (ex.: o baú) e troque formas e cores. Use `make('chave', (g, T) => { ... })`: `T` vale 40.
3. Se for um personagem, use a altura `rooTextureHeight(T)` (50) e desenhe a partir do chão.
4. Registre a função em `src/textures/index.ts`.
5. Abra `/sprites.html` e confira o desenho ampliado.
6. Coloque o sprite no jogo com `this.add.image(x, y, 'chave')`.
7. Atualize esta tabela e a foto `docs/img/sprites.png`.

Dica: desenhe em camadas, do fundo para a frente (sombra, corpo, roupa, rosto, acessórios). O que é desenhado depois cobre o que veio antes.
