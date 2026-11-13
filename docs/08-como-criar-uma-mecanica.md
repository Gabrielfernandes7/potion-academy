# Como criar uma mecânica

Uma mecânica é uma regra nova, como "a poção de gelo congela inimigos". Para criar uma, preencha este molde antes de programar.

## O molde

1. **Nome:** uma frase curta.
2. **Situação:** em que momento acontece? Um exemplo concreto, com posições e tempos.
3. **Regra:** o que muda, em uma ou duas frases.
4. **Números:** os valores, e onde ficam (`config.ts`).
5. **Exemplo:** o que o jogador vê, do início ao fim.
6. **Casos estranhos:** o que acontece se duas coisas ao mesmo tempo, ou se o jogador estiver em um lugar impossível?
7. **Como testar:** um teste automático, ou um passo a passo para verificar na tela.

## Exemplo preenchido: Sono

1. **Nome:** a Roo dorme quando fica parada.
2. **Situação:** o jogador não aperta nenhuma tecla por 5 segundos.
3. **Regra:** a Roo fecha os olhos e mostra "z" subindo. Qualquer tecla a acorda.
4. **Números:** `sleepAfterMs: 5000` e `zzzIntervalMs: 1400` em `config.ts`.
5. **Exemplo:** a Roo para no meio da sala. Depois de 5 segundos, ele cochila. Quando o jogador aperta seta, ele acorda e anda.
6. **Casos estranhos:** se o jogador apertar uma tecla no mesmo instante em que ele acorda, ele anda normalmente (sem ficar preso em animação de sono).
7. **Como testar:** deixar o jogo parado por 6 segundos e verificar que o estado de sono ligou.

## Depois de criar

- Atualize `02-como-se-joga.md` se o jogador precisa saber da regra.
- Registre a decisão em `06-decisoes.md`, com o motivo.
