# Reaproveitar os personagens e o código

Este jogo foi feito para ser copiado. Há três jeitos de usar o que está aqui, do mais simples ao mais profundo.

## 1. Só as imagens (qualquer engine)

Os desenhos são gerados pelo código, mas o projeto também os exporta como imagem.

1. Rode `npm run dev` e abra `http://localhost:5173/sprites.html`.
2. Clique em **Baixar folha de sprites**. Você recebe:
   - `potion-academy-sprites.png`: todos os desenhos numa grade;
   - `potion-academy-sprites.json`: a posição de cada um.

Exemplo do JSON:

```json
{
  "image": "potion-academy-sprites.png",
  "cell": { "w": 40, "h": 50 },
  "frames": { "roo_read_0": { "x": 0, "y": 256, "w": 40, "h": 50 } }
}
```

Em Unity, Godot, Phaser, Pixi ou qualquer outra engine, basta cortar o retângulo `x, y, w, h` de cada chave. Os desenhos são em pixel art: use o filtro de vizinho mais próximo (nearest) para não ficarem borrados.

## 2. Os desenhos como código (Phaser)

Cada personagem é uma função que desenha com o Phaser Graphics. Para copiar um personagem para outro projeto:

| Arquivo | O que traz | Depende de |
|---|---|---|
| `src/textures/make.ts` | o ajudante que transforma um desenho em textura | Phaser |
| `src/textures/roo.ts` | a Roo: andar, dormir, ler, Sala de Música | `rooGeometry.ts`, Phaser |
| `src/textures/rooGeometry.ts` | medidas da Roo (altura, apoio) | nada (puro, testável) |
| `src/textures/witch.ts` | a Belladona (chefe) | Phaser |
| `src/textures/entities.ts` | sapo mago, fantasma, moedas, gemas | `make.ts` |

Para usar a Roo, por exemplo:

```ts
import { drawRooTextures } from './textures/roo';
// dentro de uma cena de Phaser: g é um Graphics temporário
drawRooTextures(g, 40); // gera roo_down_0, roo_read_0, roo_sleep_side_0 etc.
```

Ao copiar, traga também `make.ts` e `rooGeometry.ts`, e ajuste `tile` (40 px) se o seu jogo usar outro tamanho.

## 3. As regras do jogo

- `src/config.ts`: os números (tamanho do mapa, vida, tempo, custo das poções). Mude aqui e o resto lê daqui.
- `src/game/balance.ts`, `src/game/shopRules.ts`, `src/game/boss.ts`: regras puras, sem Phaser. Dá para reaproveitar e testar com `npm run test`.
- `src/audio/tracks.ts`: gerador de músicas procedurais, sem dependências.

## Antes de copiar

- Os desenhos e textos são do projeto Potion Academy. Confirme a licença antes de usar em um produto (veja o README).
- Os textos do jogo estão em português. Procure por strings em `src/` e em `index.html` para traduzir.
- Para trocar a cor de um elemento, mude `ELEMENTS` em `src/config.ts`; os frascos, a HUD e a loja leem daqui.

## Checklist para um projeto novo

1. Copie a pasta `src/textures/` que você precisa e as dependências listadas acima.
2. Gere as texturas com a função de geração (`generateTextures`, em `src/textures/index.ts`) ou só as partes que quiser.
3. Abra `/sprites.html` no seu projeto, se copiar o catálogo, e confira os desenhos.
4. Para o GIF ou a capa do seu projeto, veja a seção "Gerar imagens" do README.
