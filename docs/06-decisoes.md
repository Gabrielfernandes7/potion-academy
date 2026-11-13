# Decisões

Um registro curto de cada escolha importante: o que foi decidido, por quê, e o que ficou de fora.
Novas decisões entram no fim.

## Não usar Rust nem WebAssembly
- **Motivo:** o jogo é pequeno. O gargalo é organização do código, não velocidade. Phaser é JavaScript.
- **Ficou de fora:** Rust, se quisermos aprender Rust, em um projeto separado.

## Separar o código em módulos com TypeScript e Vite
- **Motivo:** um arquivo de 1.500 linhas era difícil de mudar com segurança.
- **Consequência:** os testes ficam fáceis, e o build avisa de erros antes de rodar.

## Música gerada por código, uma faixa por partida
- **Motivo:** sem arquivos de áudio, o projeto continua leve. Cada partida tem uma faixa diferente da anterior, para não cansar.

## HUD dentro do jogo, menus fora
- **Motivo:** a HUD fica perto da ação. Menus e loja usam texto normal, que é mais fácil de estilizar.

## Roo com manto e sono
- **Motivo:** a personagem precisa de identidade. O sono é um sinal de que o jogador está parado, sem texto na tela.

## Sem personagens que perseguem
- **Motivo:** o jogo é sobre planejar, não sobre reflexo. Pode mudar se quisermos mais desafio.
- **Em aberto.**

## Elementos ainda sem efeito na regra
- **Motivo:** primeiro o visual e o som, depois a regra. Em aberto: o elemento pode mudar o alcance, o tempo ou o efeito da explosão.

## Duas fases: laboratório e duelo com a Belladona
- **Motivo:** o jogo tinha uma fase só e nenhum objetivo final. O duelo dá um desfecho e usa as mesmas regras (poções, explosões).
- **Consequência:** a Roo leva vida, power-ups e moedas da fase 1 para a 2. "Tentar de novo" recomeça da fase 1.

## Todo ataque do chefe tem aviso no chão
- **Motivo:** o jogo é calmo; perder deve parecer culpa do jogador, nunca surpresa. O aviso dura 1,2 s.
- **Ficou de fora:** ataques sem aviso e a Belladona perseguindo a jogadora.

## Equilíbrio por "nenhuma poção melhor em tudo"
- **Motivo:** a poção Aqua era melhor que a de Fogo sem nenhum custo. Agora toda poção paga tem uma vantagem e uma desvantagem em relação às outras (alcance maior com fusível lento, por exemplo). Um teste automático garante isso.

## Janela de ajuda escondida atrás de um "?"
- **Motivo:** quem já sabe jogar não precisa ver as teclas; quem não sabe encontra tudo em um lugar. O jogo pausa enquanto ela está aberta.

## Frascos com um formato por elemento
- **Motivo:** reconhecer o tipo de poção pelo desenho, sem ler. O mesmo formato aparece no jogo, na loja e no seletor.

## Menu com a Roo mexendo, de fato, a poção
- **Motivo:** o braço estava no sprite e não acompanhava a varinha. Agora a cena desenha o braço ligando o ombro à mão, e a Roo joga ingredientes no caldeirão (o líquido muda de cor).

## Catálogo de sprites como página do projeto
- **Motivo:** o jeito mais seguro de documentar sprites é mostrá-los. `/sprites.html` é gerada pelo próprio código e nunca fica desatualizada.

## Reação entre poções: o fogo acende, a água apaga, a terra é estável
- **Motivo:** a água era o único elemento sem regra própria. Agora cada um tem um papel: o fogo acende outras poções (corrente), a água neutraliza uma poção de fogo armada (vira vapor, sem explodir) e a terra nunca é acesa nem apagada.
- **Detalhe:** a explosão de água que apaga uma poção de fogo continua machucando quem estiver no caminho.
- **Consequência:** antes, qualquer explosão acendia outras poções. Agora só a de fogo acende; água, terra e éter não. A regra mora em `src/game/chain.ts` (uma tabela de 3 linhas) para ser fácil de mudar.
- **Em aberto:** a explosão de água também poderia apagar as chamas que o fogo deixa no chão. Fica para depois, porque o fogo ainda não deixa chamas duradouras.

## Quatro fases: laboratório, salão dos fantasmas, duelo e jardim
- **Motivo:** o jogo tinha duas fases e nenhum desfecho depois da Belladona. O salão apresenta o fantasma e a regra da água; o jardim, fora do castelo, é o epílogo.
- **Consequência:** as fases são dados (`STAGES` em `config.ts`), e a `MainScene` não tem mais `stage === 1` ou `=== 2` espalhados. A Belladona agora é a fase 3: derrotá-la leva ao jardim, e só cruzar o portão do jardim vence o jogo. "Tentar de novo" continua recomeçando da fase 1.

## Fantasma que atravessa paredes, mas é lento
- **Motivo:** dar um inimigo diferente sem quebrar o tom calmo. Ele não persegue; atravessa muralhas, caixotes e poções, e anda a 1,5 s por passo.
- **Detalhe:** dentro de uma muralha a explosão não o alcança, então ele é um risco que pede paciência, não reflexo.

## Flor do mal: fixa, com aviso, imune à água
- **Motivo:** o jardim precisava de um inimigo que obrigasse a trocar de poção. A flor é imune à Aqua (a única poção que só dá "empate" contra ela) e tem um chicote que também segue a regra de ter aviso no chão (0,8 s).
- **Ficou de fora:** flores que se multiplicam ou perseguem.

## Layout responsivo: três modos
- **Motivo:** o jogo tinha um único modo e o celular deitado ficava minúsculo (167 px numa tela de 740).
- **Consequência:** (1) em pé, os controles de toque ficam sob o jogo; (2) deitado, o jogo vai ao centro e os controles nas laterais, sem sobrepor; (3) em telas grandes o jogo cresce até 1280 px. Telas estreitas escondem o título e o nome da faixa para a barra do topo caber em uma linha.

## Fases com nome de ato, e carta antes da primeira
- **Motivo:** o nome "Laboratório" dizia o lugar, mas não a história. Os títulos dos atos (O CHAMADO, O CAMINHO, O DUELO, O RETORNO) contam o arco de Roo e aparecem no cartão de entrada e no mapa.
- **Consequência:** a carta de frei Anselmo abre cada partida nova (`ui/letter.ts`). Ela não reabre ao tentar de novo depois de perder, para não atrasar a volta.
- **Ficou de fora:** trocar os nomes por lugares, ou a carta em cada fase.

## Ganhos de POÇÃO dobrados (inflação), preços da loja iguais
- **Motivo:** pedido da autora do jogo, que quer mais inflação de POÇÃO. Os preços ficaram iguais para que as compras fiquem mais baratas em termos relativos.
- **Consequência:** baús, moedas soltas, moedas de inimigos e os prêmios de chefe (80) e de jardim (60) dobraram. A tabela de chances dos baús não mudou; só os valores.
- **Ficou de fora:** reajustar os preços da loja. Se a compra ficar barata demais, esse é o próximo ajuste.

## Falas curtas da Belladona, sem pausar o jogo
- **Motivo:** a Belladona era só um alvo que lança poções. Uma fala curta em cada habilidade, ao ser atingida e na derrota dá personalidade sem mudar a regra.
- **Consequência:** a fala é uma legenda de 1,7 s acima dela, no máximo uma por vez (`game/entities/bosses/belladonna/lines.ts`). Não pausa, não bloqueia e não muda tempos de aviso nem de dano.
- **Ficou de fora:** diálogos com janela, que interromperiam o ritmo do duelo.

## Uma música para cada parte do jogo (fim do sorteio)
- **Motivo:** dez faixas sorteadas não contavam a história e cansavam. Agora são seis, todas lentas, em modos antigos e pentatônicas (alaúde, harpa e sinos), para um clima de lareira e mosteiro: Nocturno com Flauta (menu e carta), Noite no Alambique (fase 1), Ecos no Salão (fase 2), Duelo na Torre (fase 3), Jardim do Mosteiro (fase 4) e Vésperas (confissão e final).
- **Consequência:** a faixa de cada parte está em `SCENE_TRACKS` (`audio/tracks.ts`) e cada fase aponta a sua em `STAGES[].track`. A semente continua nova a cada vez, então a mesma faixa nunca soa igual. A Sala de Música virou um lugar para ouvir cada parte; não muda o que toca nas fases. A chave `bombroo_track` não é mais lida.
- **Ficou de fora:** voltar a sortear faixas, ou deixar a jogadora trocar a música de uma fase.

## Frei Anselmo na história: carta, portão e confissão
- **Motivo:** o monge existia só na carta. A história pede que ele volte no fim, confesse e devolva o frasco vazio (`docs/12-historia.md`).
- **Consequência:** ele aparece no portão do jardim quando as gemas abrem a porta. Ao cruzar o portão, a cena pausa e seis cartões de diálogo (`ui/dialogue.ts`) fecham a história, antes da tela "Jornada cumprida". Os textos ficam em `game/story.ts`.
- **Ficou de fora:** Anselmo andando; escolhas de resposta (a pergunta final é do jogador, não do jogo).

## Mapa: pergaminho com caminho e fases seladas
- **Motivo:** o mapa era um castelo genérico, com rótulos sobrepostos, fases sempre abertas e só o jardim contava como vencido.
- **Consequência:** `MapScene` desenha o Vale das Fórmulas, com o caminho entre os quatro lugares. Cada fase vencida (1 a 3 ao cruzar a porta ou vencer a Belladona; 4 na confissão) fica marcada e libera a seguinte (`game/stages/mapRules.ts`). A Roo fica na fase à frente; Anselmo, no mosteiro. Quem tinha só o jardim vencido (progresso antigo) tem todas as fases abertas.

## Dano por elemento no chefe
- **Motivo:** todas as poções tiravam 1 de vida da Belladona, então escolher o elemento não mudava o duelo.
- **Consequência:** `BOSS_DAMAGE` (`config.ts`): fogo e éter tiram 2; água e terra, 1 (a água alcança mais longe; a terra atravessa caixotes). A vida subiu de 8 para 10. O aviso `-N` mostra o dano. Inimigos comuns continuam morrendo com um golpe.
- **Ficou de fora:** resistências (ex.: Belladona imune a um elemento) e dano diferente na fúria.

## Baú só dá POÇÃO; cura vem dos corações
- **Motivo:** a vida chegava cheia a cada fase (cura de +1 no baú, nos corações e ao passar de fase), o que tirava o peso do perigo. `stageClearHeal` já era 0.
- **Consequência:** o baú não cura mais; só os corações (`rollReward`) devolvem vida. A vida passa de uma fase para a seguinte sem bônus.
- **Ficou de fora:** cura parcial ao vencer a fase; se o jogo ficar duro demais, o ajuste é subir a chance do coração em `game/rewards.ts`.

## Despedida da Belladona e cena final no Caldeirão
- **Motivo:** a fala de derrota era uma legenda de 1,7 s, fácil de perder; e a história terminava na confissão, sem voltar ao Caldeirão.
- **Consequência:** ao cair, a Belladona fala em três cartões (`BELLADONA_CARDS`) antes do jardim. Depois da confissão, `EndScene` mostra a Roo no Caldeirão com o frasco vazio, quatro linhas (`CAULDRON_LINES`), e então a tela "Jornada cumprida".
- **Ficou de fora:** animação da Roo mexendo a poção no final; Belladona com retrato.

## Pixel art em tudo, inclusive no menu
- **Motivo:** o jogo é pixel art, no espírito do Super Bomberman 3 e 5. Uma tentativa de deixar a Roo suave no menu (vetor ampliado) foi descartada: o certo é o fundo e os efeitos combinarem com a Roo, e não o contrário.
- **Consequência:** a Roo do menu usa escala inteira (3x) e não gira. Líquido, braço e varinha do menu são desenhados em baixa resolução e ampliados sem suavização (`pixelLayer` em `MenuScene`). Brilhos (`menu_puff`) e bolhas são feitos de pixels em faixas, sem degradê suave.
- **Ficou de fora:** os anéis de onda na água do menu e o texto/HUD (fonte vetorial) continuam suaves.

## Power-ups por poção
- **Motivo:** alcance e frascos eram globais; aumentar o alcance da Poção de Fogo mudava todas as outras.
- **Consequência:** `+1 RAIO` e `+1 FRASCO` valem só para a poção escolhida ao coletar (`game/upgrades.ts`). O limite de frascos é por poção (a HUD mostra ativos/limite da poção escolhida), então dá para ter frascos de tipos diferentes ao mesmo tempo. A velocidade de caminhada continua global. Nada disso é salvo em `localStorage` (só vale na partida e passa de fase em fase), então não precisou de migração.
- **Ficou de fora:** equilíbrio com testes de pessoas: se ficar fácil demais ter vários tipos ao mesmo tempo, limitar o total de frascos.

## História: a fome, Belladona com razão e a Roo nascida de uma bolha
- **Motivo:** Belladona só queria "rasurar" e tinha uma filosofia rasa (furo de roteiro). A lição cristã pedia um conflito moral real.
- **Consequência:** o pano de fundo passa a ser uma fome inspirada na de 1315–1322 (Vale fictício). Belladona perdeu o irmão e a mãe, tem razão no problema e erra na solução (poder para controlar). O mestre busca a pedra por medo de perder a Roo, que nasceu de uma bolha de sabão iridescente no Caldeirão (dádiva, não produto). Os ecos cristãos são a multiplicação dos pães, o samaritano e o rico e Lázaro, sem pregação. O texto corrido vive em `history.html` e o roteiro em `docs/12-historia.md`.
- **Ficou de fora:** aplicar no jogo (cartas, `BELLADONA_CARDS`, `ENDING_CARDS`, Diário) e os companheiros. Em aberto: os nomes das etapas da Obra como subtítulo, a bolha no último quadro.

## Roo é masculino; cartas são o formato atual
- **Motivo:** a carta de Anselmo já trata a Roo como "filho"; o gênero estava em aberto nos documentos.
- **Consequência:** Roo é "o bruxo-canguru" e usa "ele" em todos os textos (docs, livro e cartas). Belladona continua feminina. Os cartões de história seguem como estão; no futuro podem ser trocados por um vídeo da história da Roo.
- **Em aberto:** o gênero da Roo deixa de ser pergunta; restam os nomes das etapas da Obra e a bolha no último quadro.

## Moeda vira OURO; moedas e baús rendem menos
- **Motivo:** o saldo acumulava sem ter o que comprar (só 3 poções, uma vez cada). A POÇÃO como moeda confundia com a poção; a temática medieval pede "ouro".
- **Consequência:** a moeda se chama OURO na interface e nos textos. Moeda solta vale 1 (era 2) e os baús pela metade (5 a 50). Preços da loja iguais. Falta um gasto que se repita (decisão em aberto).

## Torre da Belladona: fase de chefe com fantasma (teste)
- **Motivo:** cada capítulo tem 3 fases e um chefe. A Torre é o chefe do capítulo 1 e a Belladona já estava lá.
- **Consequência:** a Torre tem só fantasmas como inimigos. O fantasma passou a ser imune só à Telúrica (antes não era imune a nada), o que vale também no salão dos ecos. Água (água benta), fogo e éter o derrotam com o dano normal. Não há fraqueza do fantasma ao éter: é um teste.
- **Em aberto:** se o éter deve perder para o ar (teria de ser uma regra de dano extra por inimigo, que ainda não existe).

## Capítulo da Torre: três fases e o duelo
- **Motivo:** cada capítulo tem 3 fases e um chefe. O Duelo (Torre) passa a ter três fases de fantasmas (A Escadaria, O Corredor, A Antecâmara) e, na quarta, a Belladona.
- **Consequência:** são 7 fases (lab, salão, três da Torre, duelo, jardim). As três da Torre usam a faixa de música do salão, porque há só seis faixas. O progresso salvo em `bombroo_stages_completed` tem números antigos (3 = duelo, 4 = jardim): quem já jogou pode ver fases marcadas como vencidas por engano. Ainda não há migração.
- **Em aberto:** textos das três fases da Torre (feitos como rascunho), e se o jardim recebe um chefe.

## Capítulos e posição na fase
- **Motivo:** o jogador precisa saber em que capítulo está (A TORRE / DUELO, 1/4 a chefe) e que o RETORNO é o capítulo seguinte à Belladona.
- **Consequência:** `StageDef` tem `chapter` e `part` (opcionais). A tela de entrada mostra "CAPÍTULO · 1/4" acima do lugar. O Retorno é um capítulo de uma fase só, por enquanto.

## Mapa em dois níveis: vale e capítulo
- **Motivo:** o jogador precisa ver o capítulo como um lugar e, dentro dele, as quatro fases (1/4 a 4/4).
- **Consequência:** o mapa do vale mostra O Chamado, O Caminho e os dois capítulos, A Torre / Duelo (fases 3 a 6) e O Retorno (fases 7 a 10). Tocar num capítulo abre o mapa dele. Vencer o chefe (fase 6) libera a fase 7 (1/4 de O Retorno). O Retorno tem três fases de estrada (rascunho) e o jardim (4/4), com Anselmo no portão.
- **Em aberto:** os textos e os inimigos das fases 7 a 9 são rascunho. O progresso salvo com números antigos ainda não tem migração.

## Chefe do jardim: a Mandrágora, e uma classe-pai para os chefes
- **Motivo:** o jardim (4/4 de O Retorno) ganha um chefe: a Mandrágora, feiticeira da terra e da água, vulnerável ao fogo. Belladona e Mandrágora precisavam dividir o que é comum.
- **Consequência:** `game/entities/bosses/BossBase.ts` é a classe-pai (vida, fases, tempos que pausam com o jogo, avisos, explosões, dano, fúria, derrota, falas, cura). Cada chefe só define nome, tabela de dano, habilidades, falas e sprites (`BelladonnaController` = Belladona, `MandrakeController` = Mandrágora). Regras puras em `boss.ts` e `mandrake.ts`. `StageDef.boss` diz qual chefe a fase tem.
- **Mandrágora (28 de vida):** fogo é a fraqueza; terra e água só resistem (ver a decisão de dano por elemento, abaixo; a cura pela água foi retirada). Habilidades: Raízes (linha e coluna de terra), Maré (anéis de água em sequência, com uma faixa seca), Cavar (some e ressurge onde você estava; fica EXPOSTA 2,4 s com dano extra), e na fase 2 o Grito (casas verdes são seguras) e Brotos (faz nascer flores do mal, até 3).
- **Fluxo:** no jardim não há gemas; o portão abre quando ela cai (despedida em cartões), Anselmo espera no portão e o final segue como antes.
- **Em aberto:** equilíbrio (vida, tempos, dano) só testado por script; sprite novo, vale revisar.

## Dano por elemento: perfil por personagem e barra de vida em todos
- **Motivo:** cada personagem tem um atributo principal, fraquezas, resistências e imunidades. Antes havia tabelas soltas (dano do chefe, `immune` dos inimigos) e inimigos comuns morriam de um golpe.
- **Consequência:** `game/entities/profiles.ts` tem `PROFILES` e `game/entities/damage.ts` tem `damageTo()`;  (vida, atributo, `weak`, `resist`, `immune`) e `damageTo()`. Toda poção causa 4 de dano-base; fraqueza ×1,5, resistência ×0,5, imunidade 0. Sapo e fantasma (6 de vida) caem de um golpe na fraqueza e de dois no neutro; a flor tem 10. Inimigos feridos mostram barra de vida. Belladona 20, Mandrágora 28.
- **Tabela:** sapo (água; fraco a terra, resiste água), fantasma (éter; fraco a água benta, resiste éter, imune a terra), flor do mal (terra; fraca a fogo, resiste terra, imune a água), Belladona (terra; fraca a fogo e éter, resiste água e terra), Mandrágora (terra; fraca a fogo, resiste terra e água).
- **Mandrágora sem cura:** a água só resiste (planta também morre de excesso de água). Exposta (depois de Cavar), leva +2 de dano.
- **Em aberto:** só testado por script; vale jogar para ver o ritmo das fases com inimigos que levam mais de um golpe.

## Power-ups de alcance e de frasco são elementais
- **Motivo:** o item de alcance (chama) fortalecia a poção que estivesse escolhida na hora de pegá-lo, mesmo a de água. O item dizia uma coisa e fazia outra.
- **Consequência:** `+1 RAIO` e `+1 FRASCO` nascem já com uma poção, sorteada entre as que a Roo tem. A cor do item (aro, cruz de explosão ou líquido do frasco) mostra qual poção ele fortalece, e só ela recebe o bônus, não importa qual esteja escolhida. Com só o Fogo comprado, todos são de Fogo. Texturas `pickup_radius_<elemento>` e `pickup_flask_<elemento>`; regra do sorteio em `pickPowerupPotion` (`game/pickupRules.ts`).
- **Em aberto:** se o sorteio entre as poções que a Roo tem deve ser uniforme (hoje é) ou favorecer a escolhida.

## Capítulo 1 (O Vale) com a fase da Névoa; migração do progresso; lab
- **Motivo:** o primeiro capítulo ganha mais uma fase, com névoa (só se vê o que está perto). O capítulo agrupa as fases como os outros. Para testar ideias sem mexer no jogo, nasce o `src/lab/`.
- **Consequência:** `O VALE` (`stages/chapters/vale.ts`) tem 3 fases (O Chamado, O Caminho, A Névoa) e ainda não tem chefe. São 11 fases. A Névoa é a fase 3, então as seguintes subiram um número; o progresso salvo é renumerado uma vez (`bombroo_stages_schema`, `stages/migration.ts`). `PASSAGE_CARDS` e `DIARY` foram renumerados. O mapa do vale agora tem 3 lugares (um por capítulo) e o mapa de cada capítulo posiciona qualquer número de fases.
- **Névoa:** `game/effects/Fog.ts` (camada escura com círculo claro em torno da Roo, em degraus de pixel art) e `fogRules.ts` (puro); a fase liga com `fog: { radius }`. Só atrapalha a visão: inimigos e regras são os mesmos.
- **Lab:** `src/lab/` modular (`registry`, `LabArena`, experimentos). Ver `docs/15-lab.md`.
- **Em aberto:** o chefe do capítulo 1; saves de antes da versão de 10 fases podem ficar com fases marcadas por engano.
