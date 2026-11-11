# Música por fase

> **Em uma frase:** cada parte do jogo tem uma faixa com clima próprio, e a tensão sobe até o duelo e cai no jardim, onde a história se resolve.

## Estudo (o que cada faixa diz)

Todas as faixas são geradas no código (`src/audio/tracks.ts`), em modos antigos e pentatônicas, com andamento lento. Diferem em tonalidade, andamento, estilo e densidade.

| Parte | Faixa | Andamento | Estilo | Densidade | Clima |
|---|---|---|---|---|---|
| Menu e carta (intro) | Nocturno com Flauta | 60 | nocturno (flauta) | 0,55 | mi bemol maior, cantada e ornamentada, ao estilo de Chopin |
| Fase 1 · O Chamado | Noite no Alambique | 66 | harpa (arpejo) | 0,50 | ré dórico, sereno |
| Fase 2 · O Caminho | Ecos no Salão | 54 | sinos esparsos | 0,30 | menor, lenta, vazia (o eco do mestre) |
| Fase 3 · O Duelo | Duelo na Torre | 80 | harpa (arpejo) | 0,70 | a mais tensa; o acorde final não resolve |
| Fase 4 · O Retorno | Jardim do Mosteiro | 68 | melodia | 0,38 | resolve na tônica: o portão e a paz |
| Confissão e final | Vésperas | 58 | sinos | 0,28 | quase só sinos, como um mosteiro ao fim do dia |

## Arco

- **Subida até o duelo:** o andamento e a densidade crescem da fase 2 para a 3 (54 → 80 BPM; 0,30 → 0,70). É o único trecho que pede pressa.
- **Queda no jardim:** a fase 4 volta ao estilo de melodia, com acordes que resolvem na tônica.
- **Silêncio dos sinos:** o final usa só sinos, para a confissão não competir com a fala.

## Regras (para não quebrar o clima)

- Andamento entre 50 e 80 BPM (`tests/tracks.test.ts`). O duelo está no teto.
- Cada fase toca a faixa da sua parte (`STAGES[].track`), sem sorteio. A semente é nova a cada vez, então a música nunca soa igual.
- Testes: `tests/storyMusic.test.ts` confere que as quatro fases têm faixas diferentes e que o duelo é o mais rápido e denso.

## Limites deste estudo

- A análise é de parâmetros, não de escuta. Não foi possível ouvir as faixas no ambiente de teste: o volume e o efeito real precisam de um ouvido humano.
- Se o duelo parecer agitado demais, reduzir `bpm` para 74 em `tracks.ts` (o teste continua passando).
