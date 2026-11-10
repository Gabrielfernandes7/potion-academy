// Helpers de DOM. Toda a interface fora do canvas (HUD, overlays, loja) passa por aqui.

export function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Elemento #${id} não encontrado no index.html`);
  return el as T;
}

export function setShown(id: string, shown: boolean): void {
  byId(id).classList.toggle('show', shown);
}

export function isShown(id: string): boolean {
  return byId(id).classList.contains('show');
}
