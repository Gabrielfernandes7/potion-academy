// A máquina de estados das transformações (pura): uma forma por vez, 20 s, esfriando em 4 degraus, com uma
// espera comum depois que acaba, e a habilidade da forma (X) gastando um pedaço do tempo. Quem define
// o que cada forma faz é o FormDef (fire.ts, water.ts); aqui só há tempo e estado.
import type { ElementId } from '../../config';
import { FORM_COOLDOWN_MS, FORM_MS, formStage } from './stages';
import { FORMS } from './registry';
import type { FormDef, FormId, FormStage } from './types';

export class RooForm {
  private kind: FormId | null = null;
  private remaining = 0;
  private cooldown = 0;
  private abilityCd = 0;

  /** A forma ativa (ou null). */
  get id(): FormId | null { return this.kind; }
  get def(): FormDef | null { return this.kind ? FORMS[this.kind] : null; }
  get active(): boolean { return this.remaining > 0; }
  get stage(): FormStage { return formStage(this.remaining); }
  get remainingMs(): number { return this.remaining; }
  get cooldownMs(): number { return this.cooldown; }
  get abilityCooldownMs(): number { return this.abilityCd; }
  get ready(): boolean { return !this.active && this.cooldown <= 0; }
  get abilityReady(): boolean { return this.active && this.abilityCd <= 0; }
  /** A poção deste elemento está proibida agora? (a Roo Fire não usa água) */
  forbids(element: ElementId): boolean { return this.active && this.def?.forbids === element; }
  /** O elemento proibido agora, para a HUD e para trocar de poção. */
  get forbiddenElement(): ElementId | null { return this.active ? this.def?.forbids ?? null : null; }

  /** Transforma na forma pedida, se der (nenhuma ativa e sem espera). Devolve se transformou. */
  start(id: FormId): boolean {
    if (!this.ready) return false;
    this.kind = id;
    this.remaining = FORM_MS;
    this.abilityCd = 0;
    return true;
  }

  /** Habilidade da forma: só transformada e fora da espera. Gasta parte da transformação (pode encerrá-la). */
  useAbility(): boolean {
    const d = this.def;
    if (!d || !this.abilityReady) return false;
    this.abilityCd = d.ability.cooldownMs;
    this.spend(d.ability.costMs);
    return true;
  }

  /** Gasta tempo da transformação; se zerar, ela acaba e começa a espera. */
  spend(ms: number): void {
    if (this.remaining <= 0) return;
    this.remaining = Math.max(0, this.remaining - ms);
    if (this.remaining === 0) this.cooldown = FORM_COOLDOWN_MS;
  }

  tick(deltaMs: number): void {
    this.abilityCd = Math.max(0, this.abilityCd - deltaMs);
    if (this.remaining > 0) this.spend(deltaMs);
    else if (this.cooldown > 0) this.cooldown = Math.max(0, this.cooldown - deltaMs);
  }
}

export interface FormView {
  form: FormId | null; // a forma ativa
  active: boolean;
  stage: FormStage;
  ratio: number; // quanto resta da transformação (1 a 0)
  cooldownRatio: number; // quanto falta para poder transformar de novo (1 a 0)
  abilityReady: boolean;
  forbids: ElementId | null; // poção proibida agora
}

/** O que a HUD precisa saber da transformação. */
export function formView(f: RooForm): FormView {
  return {
    form: f.active ? f.id : null,
    active: f.active,
    stage: f.stage,
    ratio: f.active ? f.remainingMs / FORM_MS : 0,
    cooldownRatio: f.cooldownMs / FORM_COOLDOWN_MS,
    abilityReady: f.abilityReady,
    forbids: f.forbiddenElement,
  };
}
