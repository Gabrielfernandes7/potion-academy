// Quais botões de toque aparecem agora (puro, testável). Quem está começando vê só o essencial:
// andar, POÇÃO, TRANSFORMAR e PAUSA. Os outros entram quando servem (issue #18).

export interface TouchContext {
  formActive: boolean; // a Roo está transformada
  hasRemote: boolean; // já aprendeu a poção de Ar (a única que se explode à mão)
  ownedPotions: number; // quantas poções já tem
}

export interface TouchButtonsShown {
  detonate: boolean;
  ability: boolean;
  cycle: boolean;
}

export function touchButtonsShown(c: TouchContext): TouchButtonsShown {
  return {
    detonate: c.hasRemote, // DETONAR só faz algo com a poção de Ar
    ability: c.formActive, // a habilidade só existe transformada (a 2ª e a defesa já seguiam isso)
    cycle: c.ownedPotions > 1, // com uma poção só, não há o que trocar
  };
}
