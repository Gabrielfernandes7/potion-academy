# Animações e efeitos de batalha

O que já se move na partida, onde está no código e o que ficou para depois. A proposta original (2026-11-21, com inventário, custo e perguntas) foi aprovada e implementada; o texto completo está no histórico do git (`git log -- docs/24-animacoes-propostas.md`).

## Princípios
- **Pixel art como Super Bomberman 3/5:** escala inteira, sem girar sprites, sem degradê. Quadro novo sai de um quadro que já existe (`textures/derive.ts`: squash and stretch em linhas inteiras de pixels), não de um corpo desenhado do zero.
- **Desempenho** (`docs/21-desempenho.md`): partículas só pelo `fxPool` (um emissor por tipo de efeito), imagens que se repetem por `ObjectPool`, nada de um emissor por efeito.
- **Respeito à fé:** nenhuma cruz em objeto, inimigo ou ficha.

## Personagens

| O quê | Onde |
|---|---|
| Poses da Roo: dano, pôr a poção, pegar item, chegar à porta e desabar | `textures/poses.ts`, `MainScene.playPose` |
| Transformação: círculo alquímico sob os pés, clarão branco, o elemento estoura; fim com fumaça; último degrau pisca | `textures/transformFx.ts`, `RooFormSystem.transformBurst` |
| Chefes: preparo de 260 ms antes de cada golpe, fôlego depois, respiração em 4 quadros, queda em 2, idle mais rápido na fúria | `BossBase`, `addBossPoses` |
| Frei Anselmo abençoa quando o portão do jardim abre | `addAnselmoBless`, `spawnAnselmoAtGate` |
| Mestre em 4 quadros; sapo se agacha antes de saltar; lanterna com 3 quadros de chama | `textures/mestre.ts`, `EnemySystem.applyFrame` |

## Efeitos de batalha (`game/fx/battleFx.ts`)

| Momento | Efeito |
|---|---|
| Poção estoura | o miolo nasce branco por 50 ms e toma a cor do elemento; fica no chão uma marca do elemento (fuligem, poça, terra, halo frio) que some em 1,6 s (`BombSystem.scorch`) |
| Bloco quebra | lascas na cor do bloco caem com peso e sobe pó (`BLOCK_DEBRIS`, uma cor por estilo de `blockStyles.ts`) |
| Inimigo ou chefe leva golpe | clarão branco de 70 a 90 ms (`hitFlash`, devolve a cor que o sprite tinha) |
| Inimigo derrotado | achata, desce e some em 220 ms, num sopro de fumaça do elemento (`deathPoof`, `POOF_TINT`) |
| Item pego | estrelinhas na cor do brilho do item sobem em leque (`collectSparkle`) |
| Roo andando | poeirinha nos pés a cada dois passos; a Roo Ar flutua e não levanta pó (`stepDust`) |

Os dados (cores e tempos) são testados em `tests/battleFx.test.ts`.

## Para depois
- Andar, falar e partir o pão do Anselmo (ainda não há onde mostrar) e as expressões do retrato.
- Poses de ataque da Roo transformada (hoje a forma usa o próprio corpo).
- Quadros de cavar (toupeira), mergulhar (coruja), dividir (gosma) e derreter (sentinela).
- Um gesto desenhado à mão para cada chefe, com as mesmas chaves (`<prefixo>_windup_0/1`).
- Ciclo de andar da Roo com 6 a 8 quadros, se o passo ainda parecer pulo (ver `task.md`).
