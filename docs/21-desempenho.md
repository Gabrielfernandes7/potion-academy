# Desempenho (lag): o que foi medido e o que se aprendeu

Investigação de 2026-11-15, num Chromium de teste (GL por software, então os números absolutos não valem para um aparelho real; valem para comparar antes e depois). Os scripts ficam no scratchpad da sessão, fora do projeto; o método está abaixo para refazer.

## O que se descobriu

1. **Não há vazamento.** Em 60 s de jogo em tempo real (poções, formas, chefe), os objetos da cena (~340), os tweens e a memória (54 MB) ficaram estáveis. O lag não é cumulativo: é de **picos**.
2. **O pico era a explosão.** Cada casa atingida criava, no mesmo quadro, um emissor de partículas, um temporizador, duas imagens e dois tweens: **62 objetos por explosão** de uma Poção de Água (13 casas), mais a coleta de lixo depois. No celular, isso é o engasgo que se sente ao explodir.
3. **O desenho por quadro pesa mais que a lógica.** No perfil de CPU, o JavaScript do jogo quase não aparece; o que aparece é o Phaser triangulando e desenhando formas vetoriais (`earcut`, `GraphicsWebGLRenderer`) que eram limpas e redesenhadas **todo quadro**, mesmo sem nada para mostrar (brasas, muros, bolhas, vento, defesa, mira, avisos dos inimigos). A névoa também refazia uma textura do tamanho do jogo a cada quadro.
4. **O CSS de enfeite não pesa** (poeira animada, sombras, fundo): remover tudo mudou o quadro de 10,6 para 10,4 ms. Mesmo assim, em telas de toque a poeira fica parada e o fundo não é mais `fixed`.
5. **Um limite de 60 quadros (`fps.limit`) piora o jogo:** numa tela de 60 Hz o Phaser descarta quadros por ruído de tempo e cai para 42 atualizações por segundo. Foi tentado e **revertido**. Em telas de 90 a 144 Hz o jogo roda na taxa da tela; o remédio é reduzir o trabalho por quadro, não limitar.

## O que mudou (e quanto)

| Antes | Depois |
|---|---|
| 62 objetos criados por explosão | **0** (imagens e partículas reaproveitadas, animadas no `update`; sem tweens por casa) |
| `detonate` 0,65 ms (máximo 2,0) | **0,26 ms** (máximo 1,0) |
| um emissor por efeito (explosão, golpe, poeira, espinhos, vapor) | um emissor **por tipo**, reaproveitado (`game/fx/particlePool.ts`) |
| um `Text` novo por aviso flutuante | textos reaproveitados (`game/fx/objectPool.ts`) |
| gráficos limpos e redesenhados todo quadro | só quando há o que desenhar (`beginDraw` em `RooFormSystem`, `lashDirty` em `EnemySystem`) |
| névoa refeita todo quadro | só quando a posição ou o raio (em passos de 2 px) mudou |
| HUD redesenhada a cada evento | estado idêntico é ignorado |

## Regras para não voltar atrás

- **Nunca crie um emissor de partículas por efeito.** Use `fxPool(scene).burst(chave, textura, config, x, y, quantidade)`.
- **Nunca crie e destrua imagens ou textos por efeito.** Use `ObjectPool` (`acquire` e `release`). Criar um texto cria uma textura de canvas.
- **Um `Graphics` só se limpa e redesenha quando há o que mostrar** (e uma vez ao ficar vazio). Formas vetoriais (círculo, elipse, retângulo arredondado, arco) custam triangulação a cada quadro; `fillRect` é barato.
- **Uma textura grande (névoa) só se refaz quando muda.**
- Não use `fps.limit` (ver acima).

## Como medir de novo

1. Suba `npm run dev` e abra o jogo num Chromium com `playwright-core` (veja `task.md`, "Como testar por script").
2. **Perfil de CPU:** `Profiler.start` pelo CDP durante 900 quadros de jogo (andar, soltar poções, transformar) e some o tempo próprio por função. Se `(program)` domina, o gargalo é nativo (GPU, composição), não o JavaScript.
3. **Vazamento:** a cada 10 s, anote `scene.children.list.length`, `scene.tweens.getTweens().length` e o heap. Tem de ficar plano. (Um laço síncrono de `update` **não** serve: os tweens e emissores do Phaser dependem do relógio real.)
4. **Custo de uma explosão:** `performance.now()` em volta de `bombSystem.detonate(bomba)` e a contagem de `children + tweens` antes e depois.

## O que falta (só um aparelho de verdade responde)

- Medir num celular de gama baixa: o ganho é maior lá, mas não foi medido.
- Se ainda houver engasgo, os próximos suspeitos, em ordem: os `Text` da HUD (cada `setText` refaz uma textura de canvas), os tweens dos efeitos menores (golpes, avisos), e a geração das texturas das formas logo depois do menu abrir.
