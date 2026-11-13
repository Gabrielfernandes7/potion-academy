// O registro das transformações: uma linha por forma. Para criar uma nova, veja docs/16-guia-de-extensao.md.
import { FIRE_FORM } from './fire';
import { WATER_FORM } from './water';
import type { FormDef, FormId } from './types';

export const FORMS: Record<FormId, FormDef> = {
  fire: FIRE_FORM,
  water: WATER_FORM,
};

export const FORM_IDS = Object.keys(FORMS) as FormId[];
