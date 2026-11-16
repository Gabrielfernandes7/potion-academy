# Análise de game design: Potion Academy

Escrita em 2026-11-15, com o olhar de quem projeta jogos. **Aviso de método:** li o código, os docs, os números e os sprites; **não joguei** (não tenho navegador aqui). Tudo sobre "sensação" é hipótese a confirmar em 5 a 10 partidas com gente de verdade. Onde afirmo um número, ele vem de `docs/10-equilibrio.md`, `profiles.ts` ou das fases.

---

## 1. Diagnóstico em uma página

**O que o jogo tem de forte**
- **Identidade rara.** Bomberman calmo, alquímico e com fé. Poucos jogos de grade têm tom, música procedural e uma história com mensagem.
- **Telégrafos justos.** Todo ataque de chefe avisa no chão por no mínimo 1,2 s (garantido por teste). É a regra de ouro de design de chefe, e já está feita.
- **Fraqueza por elemento + chefes com fraquezas diferentes.** Dá ao jogador um motivo para trocar de poção.
- **Aprender, não comprar.** Tirar OURO e loja foi acertado: progressão por conhecimento combina com o tema.
- **Regra pura testada.** Facilita equilibrar sem medo.

**Os cinco riscos principais (em ordem de gravidade)**
1. **Repetição do laço central.** 16 fases comuns com o mesmo objetivo (quebrar caixotes, 3 gemas, porta). Variam inimigo e cenário, não a decisão.
2. **Inimigos que não perseguem + sem pressão = pouca tensão.** O jogo se assume calmo, mas calmo sem tensão vira tedioso. Hoje a única pressão contínua é o relógio.
3. **As quatro formas competem com as quatro poções.** Há dois sistemas de "elemento" (poção na mão e forma), e a forma é escolhida pela poção. Risco de a pessoa não entender qual é a diferença.
4. **Muitos botões para um jogo "calmo".** T, X, C, V, D, 1 a 4, Espaço, Enter: no celular são 8 botões de ação. É a maior barreira de entrada.
5. **Mobile ainda é cidadão de segunda classe** (HUD com 6 a 7 px, toque pequeno), num gênero que muita gente joga no celular.

---

## 2. O laço central: onde a repetição mora

O ciclo atual é: **explorar, quebrar, pegar gema, fugir, sair**. Nas fases comuns, a decisão interessante é só "por onde quebro primeiro". Sugestões, da mais barata à mais ambiciosa:

| # | Melhoria | Por quê | Custo |
|---|---|---|---|
| 1 | **Objetivos alternativos** em algumas fases: "acenda os 3 braseiros", "leve a poção de água até a flor", "nenhum inimigo vivo", "sobreviva 60 s" | Troca a decisão sem trocar o motor. Um objetivo diferente a cada 3 a 4 fases já quebra o ritmo | médio |
| 2 | **Gemas escondidas pelo mapa, não só em caixotes** (atrás de selo, em poça, sob inimigo) | O jogador passa a ler o mapa, não só a bater em tudo | médio |
| 3 | **Uma mecânica de terreno por capítulo** (já está em `docs/ideas.md`): vapor/lama (Vale), selos (Torre), símbolos (Biblioteca), ciclos (Observatório), interações (Retorno) | É o mais forte contra a repetição. **Prototipar um só (vapor e lama) antes de prometer os cinco** | alto |
| 4 | **Fases-puzzle curtas** (30 a 45 s, poucos caixotes, uma solução elegante) entre as fases longas | Variação de ritmo: respira, ensina e dá a sensação de "esperto" | médio |
| 5 | **Pontuação de maestria opcional** (tempo, vida, frascos usados) com estrelas ou selos de alquimista | Dá motivo para rejogar sem mexer na história. Não precisa de ranking | baixo |

**Regra de ouro para fases novas:** cada fase deve responder "o que o jogador **faz de novo** aqui?" numa frase. Se a resposta for "enfrenta um inimigo diferente", ainda é a mesma fase.

---

## 3. Dificuldade e tensão

**Observações**
- Vida de 24, dano de contato 4, fogo 6, e 1,5 s de proteção após o golpe. Com corações curando 4, o jogador aguenta bastante. Isso combina com "calmo", mas **tira o peso do erro**. Não vi no código nada que faça o jogador sentir medo de uma explosão.
- O inimigo clássico "anda sem rumo" é previsível e sem ameaça. Os novos têm padrões (patrulha, mergulho, escavar, ladrão), o que é melhor.
- O tempo esgotado tira 1 de vida a cada 1,2 s: é uma punição suave, **bem escolhida** (não mata de uma vez).

**Melhorias**
1. **Inimigos que leem a poção.** Não precisa perseguir (decisão registrada): basta **fugir de uma poção acesa**, ou **se aproximar do som/da caixa quebrada**. Isso cria dança sem violar "não persegue".
2. **Um inimigo "caçador de padrão"** por capítulo: reage ao que o jogador faz (ex.: a Toupeira brota perto de onde a Roo pôs poção). Já existe um embrião disso; vale generalizar.
3. **Tensão por zonas, não só por tempo.** Ex.: poças de vapor que sobem e fecham partes do mapa, ou um "relógio de maré" que inunda uma ala. Dá urgência espacial, mais interessante que um número caindo.
4. **Dificuldade selecionável sem culpa** ("Calmo / Estudante / Mestre"): muda vida, tempo e quantidade de inimigos. Combina com o público misto (crianças, famílias, veteranos de Bomberman).
5. **Reação visível ao erro:** quando a Roo leva dano da própria poção, mostrar **por quê** (a explosão que a pegou ficou marcada por 0,5 s). Evita a sensação de injustiça.

---

## 4. Poções e formas: clareza antes de profundidade

O sistema é bonito no papel (4 poções x 4 formas x fraquezas), mas há pontos de atrito:

- **Dois níveis do mesmo elemento.** A pessoa escolhe uma poção (1 a 4) e, com T, vira a forma da poção na mão. Isso é elegante para quem já entendeu, mas **opaco no primeiro contato**. A HUD mostra ícones, mas não explica *por que* trocar.
- **A Roo de fogo "recusa" a Poção de Água.** É uma boa regra de risco/recompensa, mas a mensagem "SÓ A POÇÃO DA FORMA" aparece como texto flutuante curto. Para quem erra uma vez, isso é fricção.
- **Hoje há poucas decisões de poção no combate comum.** Um sapo cai com 2 de fogo, 3 de água... a diferença entre elas é pequena. O jogador tende a ficar com a que acabou de ganhar.

**Melhorias**
1. **Cada poção precisa ter um "puzzle favorito"** em pelo menos uma fase por capítulo, onde as outras são claramente piores. Ex.: Terra atravessa caixote (pede um corredor reto), Ar detona de longe (pede um alvo atrás de parede), Água apaga fogo (pede um braseiro).
2. **Primeiro uso de cada forma com uma "sala de lição"** (já há lições em `learning.ts`): conferir se a lição é jogável em menos de 30 s e se mostra a **consequência**, não só o texto.
3. **Resumir as formas num único gesto visual**: o medidor da HUD já faz isso; falta fazer o **sprite da Roo e o chão ao redor** comunicarem o que a forma faz (aura, rastro, pegada).
4. **Reações no chão (`FieldSystem`):** é a melhor ideia do backlog. Ela transforma 4 poções em **um sistema**, em vez de 4 ferramentas. Começar por vapor e lama, como proposto.
5. **Poder de combo, não só de dano.** Uma recompensa clara por encadear (fogo + poça = vapor que protege; terra + água = lama que atrasa o chefe) vale mais que +1 de alcance.

---

## 5. Chefes

Os cinco têm conceito, telégrafo e fúria. O que eu verificaria jogando:

| Pergunta | Por que importa |
|---|---|
| **Quantas tentativas leva?** A meta é 2 a 4 | Chefe de 28 a 32 de vida (Ouroboros, Quimera, Leão, Mandrágora) com poucos golpes por poção pode virar maratona. Meça em tempo de luta |
| **O jogador aprende ou só decora?** | Um bom chefe tem uma "janela de ataque" óbvia. Bote do Leão (2,2 s exposto) e cavar da Mandrágora já têm. Confirmar no Ouroboros e na Quimera |
| **A fúria muda o jogo ou só acelera?** | Fúria só com intervalo menor é pouco. Ideal: um **ataque novo** na fúria (já existe em vários) e **uma mudança de arena** |
| **O celular lê os avisos?** | Um chão com 9 padrões de aviso, a 40 px na tela pequena, pode virar borrão. Testar cor + forma, não só cor |
| **O chefe tem história no combate?** | As falas (`lines.ts`) são um ótimo tempero. Garantir que falem **uma vez, curto**, sem interromper o ritmo |

**Melhorias específicas** (já listadas em `docs/ideas.md`; aqui com prioridade):
1. **Belladona** (primeira que a pessoa lembra): ataques que combinam poções e alteram a arena por um tempo.
2. **Ouroboros** (último desafio): a arena também gira com o ciclo. É o clímax mecânico do jogo.
3. **Quimera** (primeiro chefe): garantir que seja o mais fácil, **mas com uma lição**: "a terra a prende". Se o jogador não descobre isso sozinho, a lição de forma Terra (fase 4) precisa vir antes dela, como já está.

**Duelo de chefes na Arena** é uma ferramenta excelente de balanceamento. Rodar de novo depois de cada ajuste e guardar a tabela de resultados em `docs/10-equilibrio.md`.

---

## 6. Primeiros minutos (onboarding)

O jogo abre com menu, carta, cartão de fase com gravura, e depois a fase 1. Para um recém-chegado:

1. **O que ensina a fase 1?** Hoje parece: mover, colocar poção, pegar gema, abrir porta. Falta ensinar **fugir da própria explosão** (o erro nº 1 de iniciante em Bomberman). Um primeiro caixote que só se abre pondo poção e recuando 2 casas resolve.
2. **O cartão de entrada de fase** é bonito, mas é mais um bloqueio antes de jogar. Garantir que **ENTER/toque pula** e que, da segunda vez, ele seja mais curto.
3. **Dicas contextuais** em vez de manual. A janela de ajuda é útil, mas ninguém lê. Mostrar a dica quando o jogador **comete o erro** (ex.: levou dano da própria poção: "afaste-se 3 casas").
4. **Primeira forma só quando fizer sentido.** A lição de cada forma já é espaçada; manter assim. Resistir à tentação de dar tudo cedo.
5. **Controles no celular:** reduzir de 8 botões para **4 primários** (andar, poção, forma, habilidade) e deixar o resto num menu radial ou em gesto (segurar = defesa, deslizar = trocar frasco). **Este é, na minha opinião, o maior ganho de acessibilidade do jogo.**

---

## 7. Ritmo de progressão e recompensa

- **Poções aprendidas no fim das fases 1, 3 e 4** e formas logo depois: ritmo bom no começo; depois da fase 4 (Ar), **o jogador já tem tudo**. As fases 5 a 20 não dão mais nenhuma ferramenta nova. Esse é o buraco de progressão.
- Os power-ups (+frasco, +raio, +velocidade, +tempo) existem, mas ficam em caixotes e são perdidos ou mantidos entre fases? Se se mantêm, o jogador chega no fim muito forte; se se perdem, falta sensação de crescimento.

**Melhorias**
1. **Uma "descoberta" por capítulo** (nova habilidade, novo tipo de bloco, nova reação) para o jogador sentir que ainda aprende na fase 12.
2. **Melhorias de forma (nível 2)** desbloqueadas por chefe: a Roo de Fogo ganha um segundo efeito depois da Belladona, a de Terra depois do Leão. Reaproveita arte, dá motivo para voltar à forma antiga.
3. **Manuscrito como recompensa.** Hoje ele é conteúdo; virar **colecionável de descobertas** (reações, fraquezas, bestiário) é barato e dá um objetivo paralelo sem inflar o jogo.
4. **Colecionáveis de história** escondidos (páginas do mestre) em lugares específicos. Dá motivo para explorar e conecta mecânica com lore.

---

## 8. Feedback sensorial ("game feel")

Pelo que o código indica, há atenção a isso (pools de partículas, sons por elemento, tremor das formas). Sugestões:

1. **Hit-stop** de 40 a 70 ms ao acertar um chefe ou inimigo (congela o jogo um instante). Muda muito a sensação de impacto, e custa quase nada.
2. **Tremor de tela proporcional** (pequeno para inimigo, médio para chefe, sem excesso: o jogo é calmo).
3. **Som de "quase".** Um tique curto quando uma explosão passa a 1 casa da Roo. Dá tensão sem dano.
4. **Contagem sonora do fusível** (um tique que acelera) para a Poção de Fogo e a de Água. Ajuda quem joga sem olhar para o relógio visual.
5. **Morte e derrota com cara de "quase!"**: na tela de game over, mostrar **o que matou** e **uma dica de como evitar**. Reduz a frustração e ensina.
6. **Movimento da Roo:** o `task.md` já registra a dúvida do "pulo" em 60/120 Hz. Se persistir, a solução proposta (ciclo de 6 a 8 quadros) vale o custo de arte: é o personagem na tela 100% do tempo.

---

## 9. Arte e interface (sem substituir a conversa do padrão visual)

- **Pixel art consistente** é um ponto forte. Dois cuidados: (a) o contraste entre **inimigos e chão** em cada tema (`gardenContrast.test.ts` já cuida do jardim; replicar o raciocínio para a Torre, a Biblioteca e o Observatório); (b) **leitura a 40 px** de cada novo inimigo e chefe.
- **Silhueta antes de cor.** Um bom teste: pintar todos os sprites de preto e ver se ainda dá para distinguir inimigo de bloco de poção. Sentinela de cera e relógio de cobre são bons exemplos de silhuetas diferentes; já a gosma e o fantasma podem se confundir.
- **Acessibilidade sem depender de cor.** O jogo tem fraqueza por elemento; **cada elemento precisa de uma forma própria** (já há △ ▽ 🜁 🜃), usada em HUD, avisos de chão e ícones de inimigo. Isso ajuda daltônicos e leitura rápida em tela pequena.
- **Texto da HUD** a 6 a 7 px no celular: é o problema mais urgente de UI. Duas saídas: (a) HUD em DOM (texto nítido, escalável), (b) HUD no canvas com layout vertical em celular em pé.
- **Cartão de fase com gravura animada** é um diferencial lindo; garantir que tenha **versão estática** para `prefers-reduced-motion` (já há o media query geral, conferir se cobre o cartão).

---

## 10. Áudio

- **Seis faixas procedurais** são uma ideia ótima e original, mas **ninguém as ouviu ainda** (está no `task.md`). Antes de mais conteúdo, uma sessão de escuta resolve: volume, andamento, se cansa em 20 minutos.
- **Música adaptativa simples:** ao entrar a fúria de um chefe, subir uma camada (percussão, oitava). Reaproveita o gerador de compassos.
- **Silêncio é ferramenta.** Num jogo calmo, 3 a 5 s de quase silêncio antes de um ataque grande de chefe aumenta o impacto.
- **Mix de efeitos:** garantir que o aviso de ataque tenha **som próprio** (não só visual), útil para o celular e para acessibilidade.

---

## 11. Meta-jogo e retenção

Hoje: mapa, fases salvas, Arena (treino e duelo), Manuscrito, Livro. Falta um **motivo para voltar depois de terminar**.

1. **Estrelas por fase** (concluir, concluir sem dano, concluir rápido). Barato, e dá meta a quem terminou.
2. **Arena com desafios diários ou semanais** (precisa da semente por partida, já no backlog).
3. **Modo "sem poção de fogo"** ou outros desafios de restrição. Combina com o tema (alquimista limitado a um elemento).
4. **Galeria do Manuscrito** que mostra o que falta descobrir (como uma barra de 12/48 descobertas). O jogador completista adora isso.
5. **Final alternativo** (a Prima Materia): só faz sentido se o desfecho atual aguentar a escolha. Se a mensagem do jogo é servir, a decisão **não deve ser um moralismo binário**: melhor que ambos os caminhos sejam legítimos, com consequências diferentes.

---

## 12. O que eu cortaria ou adiaria (disciplina de escopo)

- **Novos chefes e novos inimigos**: já são muitos (5 e 14). Validar antes de somar.
- **Crafting, laboratório persistente, familiares**: mudam a identidade do jogo; só depois de provar o laço central.
- **Cinco mecânicas de capítulo ao mesmo tempo**: fazer **uma** (vapor/lama no Vale), medir, e só então decidir as outras.
- **Refatorações grandes** (PlayerController etc.): só quando houver uma sessão com o jogo rodando para conferir.

---

## 13. Roteiro sugerido (com critérios de sucesso)

**Agora (1 a 2 semanas): confiança**
1. Rodar `npm run smoke` num navegador e ajustar o que falhar.
2. **5 a 10 partidas observadas** (você e duas pessoas que nunca viram o jogo). Anotar: onde pararam, onde erraram, o que não entenderam. *Sucesso:* uma pessoa nova chega à fase 3 sem ajuda.
3. Consertar a HUD e o toque no celular (texto legível, botões de 44 px, 4 botões primários).
4. Sessão de escuta das 6 faixas e dos sons de elemento.

**Depois (2 a 4 semanas): variedade**
5. Protótipo do **vapor e da lama** (`FieldSystem`), em **uma** fase do Vale. *Sucesso:* playtesters usam a reação **sem serem avisados**.
6. **Objetivos alternativos** em 3 a 4 fases (braseiros, sobrevivência, "nenhum inimigo vivo").
7. **Grimório** (descobertas no Manuscrito), ligado ao FieldSystem.
8. Dificuldade selecionável e dica contextual ao primeiro erro.

**Depois (1 a 2 meses): profundidade**
9. Mecânica por capítulo (Torre e Biblioteca primeiro).
10. Chefes: arena que muda (Ouroboros e Belladona).
11. Estrelas por fase, desafios da Arena com semente.
12. Final com a Prima Materia **só se** a conversa de roteiro aprovar.

---

## 14. Perguntas que só jogar responde

- O jogo é **calmo** ou **parado**? (Onde fica a tensão?)
- A pessoa entende por que existem poções **e** formas?
- A fase 12 é diferente da fase 4 na **decisão**, não só na cara?
- O chefe mais difícil é o que você acha que é?
- A música cansa? O silêncio ajuda?
- Funciona no celular de verdade, com a mão de verdade, sem se perder nos botões?

> **Resumo para decidir rápido:** o jogo já tem **alma, tom e base técnica**. O que falta para virar *ótimo* é **variedade de decisão** (reações no chão e objetivos alternativos), **clareza de controle no celular** e **dados de jogo real**. Eu faria nessa ordem, e cortaria o resto até lá.
