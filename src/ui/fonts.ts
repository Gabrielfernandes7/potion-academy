// O canvas só desenha texto com a fonte certa se ela já estiver carregada.
// Espera as fontes (com um limite de tempo) antes de criar o jogo.
const FONTS = ['700 20px Cinzel', '700 14px Nunito'];

export async function ensureFonts(timeoutMs = 1500): Promise<void> {
  if (typeof document === 'undefined' || !('fonts' in document)) return;
  const load = Promise.all(FONTS.map(f => document.fonts.load(f))).then(() => undefined, () => undefined);
  const timeout = new Promise<void>(resolve => setTimeout(resolve, timeoutMs));
  await Promise.race([load, timeout]);
}
