// Liga a regra de touchButtonsShown aos botões do DOM (a cada atualização da HUD; só mexe no DOM se mudou).
import { BOMB_ORDER } from '../config';
import { touchButtonsShown } from '../input/touchContext';
import { hasBombType } from '../storage';

function setHidden(selector: string, hidden: boolean): void {
  const el = document.querySelector<HTMLElement>(selector);
  if (el && el.hidden !== hidden) el.hidden = hidden;
}

export function applyTouchContext(formActive: boolean): void {
  const shown = touchButtonsShown({
    formActive,
    hasRemote: hasBombType('remote'),
    ownedPotions: BOMB_ORDER.filter(hasBombType).length,
  });
  setHidden('[data-touch="detonate"]', !shown.detonate);
  setHidden('[data-touch="ability"]', !shown.ability);
  setHidden('[data-touch="cycle"]', !shown.cycle);
}
