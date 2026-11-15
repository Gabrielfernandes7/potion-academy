// O registro das transformações: uma linha por forma. Para criar uma nova, veja docs/16-guia-de-extensao.md.
import { FIRE_FORM } from './fire';
import { WATER_FORM } from './water';
import { EARTH_FORM } from './earth';
import { AIR_FORM } from './air';
import type { FormDef, FormId } from './types';
import type { ElementId } from '../../config';

export const FORMS: Record<FormId, FormDef> = {
  fire: FIRE_FORM,
  water: WATER_FORM,
  earth: EARTH_FORM,
  air: AIR_FORM,
};

export const FORM_IDS = Object.keys(FORMS) as FormId[];

/** A forma que um elemento de poção transforma: a poção na mão escolhe a transformação (tecla T). */
export function formForElement(element: ElementId): FormId | null {
  return FORM_IDS.find(id => FORMS[id].element === element) ?? null;
}
