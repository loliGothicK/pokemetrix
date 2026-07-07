export type Gender = "male" | "female" | "unknown";
export type EV = [
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  17,
  18,
  19,
  20,
  21,
  22,
  23,
  24,
  25,
  26,
  27,
  28,
  29,
  30,
  31,
  32,
][number];

export const types = [
  "normal",
  "fighting",
  "flying",
  "poison",
  "ground",
  "rock",
  "bug",
  "ghost",
  "steel",
  "fire",
  "water",
  "grass",
  "electric",
  "psychic",
  "ice",
  "dragon",
  "dark",
  "fairy",
  "stellar",
] as const;

export type Type = (typeof types)[number];

export const moveCategories = ["physical", "special", "status"] as const;

export type MoveCategory = (typeof moveCategories)[number];

export const moveRanges = [
  "self",
  "single-target",
  "user's-side",
  "opponent's-side",
  "entire-field",
  "all-opponents",
  "single-ally",
  "all-allies",
  "all-pokemon",
  "random-opponent",
  "varies",
] as const;

export type MoveRange = (typeof moveRanges)[number];

export const moveClassifications = [
  "contact",
  "sound-based",
  "punch",
  "biting",
  "slicing",
  "ball-and-bomb",
  "wind",
  "powder",
] as const;

export type MoveClassification = (typeof moveClassifications)[number];
