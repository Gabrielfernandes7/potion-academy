// Entrada por toque: d-pad e botões em DOM alimentam o jogo sem depender do teclado.
// A lógica (estado/consumo) não toca no DOM, então é testável; só bind() usa o DOM.

export type TouchDir = 'up' | 'down' | 'left' | 'right';
export type TouchAction = 'bomb' | 'push' | 'detonate' | 'pause';

const DIRS: TouchDir[] = ['up', 'down', 'left', 'right'];

export class TouchInput {
  held: Record<TouchDir, boolean> = { up: false, down: false, left: false, right: false };
  private justDirs = new Set<TouchDir>();
  private justActions = new Set<TouchAction>();
  private activity = false;
  private pendingRelease = new Set<TouchDir>();

  press(name: TouchDir | TouchAction): void {
    this.activity = true;
    if ((DIRS as string[]).includes(name)) {
      const dir = name as TouchDir;
      this.held[dir] = true;
      this.justDirs.add(dir);
      this.pendingRelease.delete(dir); // tocou de novo: cancela a soltura adiada
    } else {
      this.justActions.add(name as TouchAction);
    }
  }

  // Se o dedo sobe antes de o jogo ler o toque (um frame), a soltura é adiada até o fim
  // do frame (clearJust), para que o toque rápido ainda valha um passo.
  release(name: TouchDir | TouchAction): void {
    if (!(DIRS as string[]).includes(name)) return;
    const dir = name as TouchDir;
    if (this.justDirs.has(dir)) this.pendingRelease.add(dir);
    else this.held[dir] = false;
  }

  releaseAll(): void {
    for (const d of DIRS) this.held[d] = false;
    this.pendingRelease.clear();
  }

  // "Acabou de apertar": verdadeiro uma única vez por toque.
  consumeDir(d: TouchDir): boolean {
    return this.justDirs.delete(d);
  }

  consumeAction(a: TouchAction): boolean {
    return this.justActions.delete(a);
  }

  // Chamado ao fim de cada frame de entrada.
  clearJust(): void {
    this.justDirs.clear();
    this.justActions.clear();
    for (const d of this.pendingRelease) this.held[d] = false;
    this.pendingRelease.clear();
  }

  get anyHeld(): boolean {
    return DIRS.some(d => this.held[d]);
  }

  // Houve algum toque desde a última consulta? (usado para acordar a personagem)
  consumeActivity(): boolean {
    const a = this.activity;
    this.activity = false;
    return a;
  }

  // Liga botões marcados com data-touch="up|down|left|right|bomb|push|detonate|pause".
  bind(root: ParentNode): void {
    root.querySelectorAll<HTMLElement>('[data-touch]').forEach(el => {
      const name = el.dataset.touch as TouchDir | TouchAction;
      el.addEventListener('pointerdown', e => {
        e.preventDefault();
        el.setPointerCapture(e.pointerId);
        el.classList.add('pressed');
        this.press(name);
      });
      const up = (): void => {
        el.classList.remove('pressed');
        this.release(name);
      };
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
      el.addEventListener('lostpointercapture', up);
      el.addEventListener('contextmenu', e => e.preventDefault());
    });
  }
}

export const touch = new TouchInput();
