// Controle (gamepad): lê o controle padrão do navegador e alimenta o mesmo `touch` do celular.
// O mapeamento (qual botão faz o quê) é puro e testado; só `pollGamepad` usa a API do navegador.
import { touch, type TouchAction, type TouchDir } from './touch';

export type PadName = TouchDir | TouchAction;

// botões do mapeamento "standard" do navegador
export const PAD_BUTTONS: ReadonlyArray<readonly [number, PadName]> = [
  [0, 'bomb'], // A
  [2, 'ability'], // X
  [1, 'ability2'], // B
  [3, 'transform'], // Y
  [4, 'cycle'], // LB
  [5, 'defense'], // RB
  [7, 'detonate'], // RT
  [6, 'detonate'], // LT
  [9, 'pause'], // Start
  [12, 'up'], [13, 'down'], [14, 'left'], [15, 'right'], // direcional
];

const DEADZONE = 0.5;

export interface PadState { buttons: boolean[]; axes: number[] }

/** Tudo o que está apertado agora (botões e o direcional ou o analógico esquerdo). */
export function pressedNames(state: PadState): Set<PadName> {
  const out = new Set<PadName>();
  for (const [i, name] of PAD_BUTTONS) if (state.buttons[i]) out.add(name);
  const [ax = 0, ay = 0] = state.axes;
  if (ax <= -DEADZONE) out.add('left');
  else if (ax >= DEADZONE) out.add('right');
  if (ay <= -DEADZONE) out.add('up');
  else if (ay >= DEADZONE) out.add('down');
  return out;
}

let last = new Set<PadName>();

/** Compara com o quadro anterior: o que acabou de apertar vira `press`, o que soltou vira `release`. */
export function applyPad(now: Set<PadName>, before: Set<PadName>, input: Pick<typeof touch, 'press' | 'release'>): void {
  for (const n of now) if (!before.has(n)) input.press(n);
  for (const n of before) if (!now.has(n)) input.release(n);
}

export function pollGamepad(): void {
  const pads = typeof navigator.getGamepads === 'function' ? navigator.getGamepads() : [];
  const pad = Array.from(pads).find(p => p && p.connected);
  const now = pad
    ? pressedNames({ buttons: pad.buttons.map(b => b.pressed), axes: [...pad.axes] })
    : new Set<PadName>();
  applyPad(now, last, touch);
  last = now;
}

/** Liga a leitura do controle a cada quadro da tela. */
export function startGamepad(): void {
  const loop = (): void => {
    pollGamepad();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
