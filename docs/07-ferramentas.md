# Ferramentas

## O que instalar

- **Node.js** versão 20 ou mais nova (testado com a 22).
- Um navegador moderno (Chrome, Edge ou Firefox).

## Como rodar

```bash
npm install        # uma vez, para baixar as dependências
npm run dev        # abre o jogo em http://localhost:5173
```

Para ver os controles de toque no computador, abra `/?touch`.

## Como testar

```bash
npm run test       # testes da lógica pura (regras, loja, faixas de música)
npm run typecheck  # confere os tipos
npm run build      # confere tudo e gera a versão final em dist/
```

## Dependências

- **Phaser 3.90.0:** o motor do jogo.
- **Vite:** roda o jogo em desenvolvimento e gera a versão final.
- **TypeScript:** ajuda a evitar erros.
- **Vitest:** testes.
- **Cinzel e Nunito** (fontes, hospedadas no próprio projeto).
