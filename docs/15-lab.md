# Lab: testar ideias antes de entrarem no jogo

`src/lab/` é só para desenvolvimento (não entra no build). Abra `/lab.html` com `npm run dev`; a barra no alto troca de experimento (`/lab.html?exp=<id>`).

```
lab.html                    # página-casca: barra, palco e painel
src/lab/
  main.ts                   # lê ?exp=, monta barra e painel, cria o Phaser.Game
  types.ts                  # LabExperiment (id, título, tamanho, painel HTML, cena)
  registry.ts               # lista de experimentos
  arena/LabArena.ts         # cena-base: mapa com muralhas, pilares, blocos e a Roo andando
  experiments/
    fog.ts                  # névoa (mesmo módulo da fase A NÉVOA)
    fireRoo.ts              # Roo de fogo
```

## Experimento novo
1. Crie `src/lab/experiments/<nome>.ts` e exporte um `LabExperiment`.
2. Se precisar de mapa, estenda `LabArena` e use `onCreate()` / `onUpdate()`; senão, faça uma cena Phaser comum.
3. Acrescente em `registry.ts`.

## Regras
- **O lab importa o jogo, nunca o contrário.** Nada em `src/game`, `src/scenes` ou `src/ui` importa de `src/lab`.
- Um experimento usa os módulos reais (texturas, efeitos, regras puras). Assim, o que funciona no lab entra no jogo sem reescrever.
- Ao aprovar uma ideia: mova a lógica para `src/game/` (regra pura em arquivo próprio, com teste) e deixe o experimento como demonstração.
