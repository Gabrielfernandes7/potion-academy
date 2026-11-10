// Menu principal em DOM (#menu), exibido por cima da cena do menu no canvas.
import { byId, isShown, setShown } from './dom';

export function setMenuVisible(visible: boolean): void {
  setShown('menu', visible);
  document.body.classList.toggle('in-menu', visible);
}

export function isMenuVisible(): boolean {
  return isShown('menu');
}

export function bindMenuButtons(handlers: { play: () => void; shop: () => void; music: () => void; map?: () => void }): void {
  byId('menu-play').onclick = handlers.play;
  byId('menu-shop').onclick = handlers.shop;
  byId('menu-music').onclick = handlers.music;
  if (handlers.map) byId('menu-map').onclick = handlers.map;
}
