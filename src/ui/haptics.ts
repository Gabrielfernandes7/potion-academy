// Vibração curta no celular (só quando o jogo está em modo de toque): dá retorno ao levar dano sem depender do som.
// Sem suporte (desktop, iOS Safari) não faz nada.
export function buzz(ms = 40): void {
  try {
    if (document.body.classList.contains('touch-on')) navigator.vibrate?.(ms);
  } catch {
    // alguns navegadores bloqueiam a vibração fora de um gesto: tudo bem
  }
}
