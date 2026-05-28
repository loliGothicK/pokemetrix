export const types = [
  "Normal",
  "Fire",
  "Water",
  "Electric",
  "Grass",
  "Ice",
  "Fighting",
  "poison",
  "Ground",
  "Flying",
  "Psychic",
  "Bug",
  "Rock",
  "Ghost",
  "Dragon",
  "Dark",
  "Steel",
  "Fairy",
] as const;

export type Type = (typeof types)[number];

export const moveCategories = ["physical", "special", "status"] as const;

export type MoveCategory = (typeof moveCategories)[number];

export const moveRanges = [
  "self",
  "single-target",
  "user's-side",
  "entire-field",
  "all-opponents",
  "all-allies",
] as const;

export type MoveRange = (typeof moveRanges)[number];

export const moveClassifications = [
  "contact",
  "sound-based",
  "punch",
  "biting",
  "slicing",
  "bullet",
  "wind",
  "powder",
] as const;

export type MoveClassification = (typeof moveClassifications)[number];
