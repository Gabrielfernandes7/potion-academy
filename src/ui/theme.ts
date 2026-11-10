// A fonte única de cores e fontes é o CSS (variáveis em :root, em styles/main.css).
// O canvas lê esses valores em tempo de execução para ficar igual ao restante da UI.

export interface Theme {
  panel: number;
  panelEdge: number;
  gold: number;
  goldBright: number;
  text: number;
  textMuted: string;
  info: string;
  warn: string;
  danger: string;
  fontDisplay: string;
  fontBody: string;
}

function cssVar(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function hexNumber(value: string): number {
  return parseInt(value.replace('#', ''), 16);
}

export function readTheme(): Theme {
  return {
    panel: hexNumber(cssVar('--panel-solid', '#161a18')),
    panelEdge: hexNumber(cssVar('--panel-border', '#5b4d36')),
    gold: hexNumber(cssVar('--gold', '#d9a441')),
    goldBright: hexNumber(cssVar('--gold-bright', '#f0c674')),
    text: hexNumber(cssVar('--text', '#e8dcc0')),
    textMuted: cssVar('--text-muted', '#bfae8a'),
    info: cssVar('--info', '#74b9ff'),
    warn: cssVar('--warn', '#ff9800'),
    danger: cssVar('--danger', '#ff6b6b'),
    fontDisplay: cssVar('--font-display', "Cinzel, Georgia, serif"),
    fontBody: cssVar('--font-body', "Nunito, system-ui, sans-serif"),
  };
}
