# Potion Academy

<p align="center">
  <img src="docs/img/capa.png" alt="Potion Academy: a Roo mexe uma poção no caldeirão do laboratório" width="100%">
</p>

<p align="center">
  <b>Potion Academy</b> é um jogo de alquimia indie desenvolvido para navegador. Jogue com a <b>Roo</b>, uma bruxo-cachorro de capa roxa, enquanto ela atravessa uma campanha de vinte fases em cinco capítulos (o Vale, a Torre, a Biblioteca Proibida, o Observatório e o Retorno ao mosteiro), com cinco chefes, lançando poções de quatro elementos, aprendendo as transformações do mestre e quebrando caixotes.
</p>

<p align="center">
  ✨ <i>Destaque técnico:</i> Tudo é desenhado e sintetizado pelo próprio código — <b>sem imagens bitmap externas ou arquivos de áudio prontos!</b>
</p>

---

<p align="center">
  <img src="docs/img/roo-lendo.gif" alt="A Roo lendo à luz de velas" width="450">
  &nbsp;
  <img src="docs/img/frei-anselmo-lendo.gif" alt="Frei Anselmo lendo a Bíblia no mosteiro" width="320">
</p>

---

## 🎮 Como Jogar

### Pré-requisitos
Certifique-se de ter o [Node.js](https://nodejs.org/) instalado em sua máquina.

### Instalação e Execução
```bash
# Clone o repositório e acesse a pasta
git clone https://github.com/Gabrielfernandes7/potion-academy.git
cd potion-academy

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev

```

Abra `http://localhost:5173` no seu navegador.

### 🕹️ Controles

* **Teclado:** Setas para mover | **Espaço** para colocar poção | **T** para transformar na forma da poção escolhida | **X**, **C** e **V** para a habilidade, a segunda habilidade e a defesa da forma | **1 a 4** para escolher o frasco | **D** para detonar a poção de Ar | **Enter** para pausar.
* **Mobile / Touch:** O jogo conta com controles de toque automáticos (ou adicione `?touch` na URL).

---

## ✨ Principais Características

* 🔮 **Quatro Elementos que Reagem entre Si:** o fogo acende outras poções, a água apaga as de fogo e a terra é estável. Cada elemento tem explosão e som próprios. As poções de água, terra e ar são aprendidas ao longo da jornada.
* 🐕 **Quatro Transformações:** Roo Fire, Água, Terra e Ar, cada uma com habilidades e defesa próprias.
* 🗺️ **Vinte Fases em Cinco Capítulos:** Vale, Torre, Biblioteca Proibida, Observatório e Retorno, com dezenas de inimigos e a Névoa, e um mapa que libera as fases conforme o progresso.
* 🧙‍♀️ **Cinco Chefes com Avisos:** Quimera, Belladona, Leão Verde, Ouroboros e Mandrágora avisam no chão antes de cada ataque e ficam furiosos com metade da vida. Todos podem ser treinados na Arena.
* 📖 **O Livro de Roo:** a história como manuscrito animado (`/livro.html`).
* 🎶 **Trilha Sonora Procedural:** 6 faixas geradas em tempo real via WebAudio, uma para cada parte da história (cada fase tem a sua), e uma sala para ouvi-las.
* 📜 **História em Passagens:** cartões entre as fases, com pistas do mestre desaparecido, e a confissão final de frei Anselmo.
* 🎨 **Assets 100% Procedurais:** Sprites gerados em tempo real, sintetizadores de som e tipografia via `@fontsource`.
* 📱 **Design Responsivo:** funciona em celular (em pé e deitado, com controles de toque), tablet, computador e telas grandes, sem rolagem.

---

## 🛠️ Comandos Disponíveis

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento (inclui catálogo em `/sprites.html`) |
| `npm run test` | Executa os testes unitários (Vitest) |
| `npm run typecheck` | Realiza a checagem estricta de tipos com TypeScript |
| `npm run check` | Tipos, testes e build de uma vez |
| `npm run smoke` | Abre o jogo num navegador (Playwright) e confere menu, formas, Arena, as 20 fases e páginas de apoio |
| `npm run build` | Valida os tipos e gera o build de produção otimizado na pasta `dist/` |

---

## 📂 Estrutura do Projeto

```text
src/
├── main.ts         # Layout, manipuladores do DOM e áudio
├── config.ts       # Balanceamento (tamanho do mapa, vida, poções, elementos)
├── scenes/         # Cenas do Phaser (menu, partida e HUD)
├── game/           # Regras puras (fases, chefes, formas, reação entre poções, recompensas, equilíbrio)
├── textures/       # Geração procedural de sprites (Roo, Belladona, poções, cenário)
├── audio/          # Motor de áudio (WebAudio) e gerador de músicas
└── ui/             # Menus, Arena, ajuda, cartões e interfaces em DOM
tests/              # Testes unitários
docs/               # Documentação complementar do jogo e do código

```

---

## 📚 Documentação

* [Guia Completo (`docs/`)](docs/README.md): O universo do jogo, glossário, arquitetura e como criar novas mecânicas.
* [Catálogo de Sprites (`docs/09-sprites.md`)](docs/09-sprites.md): Todos os desenhos e fotos categorizadas em `docs/img/sprites/`.
* [Guia de Reutilização (`docs/11-reutilizar.md`)](docs/11-reutilizar.md): Instruções para reutilizar personagens e sistemas em outros projetos.

---

## 📝 Licença

Atualmente sem licença definida. Antes de reutilizar código ou imagens fora deste repositório, por favor, entre em contato com o autor.
