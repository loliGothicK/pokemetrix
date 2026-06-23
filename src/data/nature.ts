import { match } from "ts-pattern";
import { bail, Result } from "@/errors/anyhow/error";
import { right } from "fp-ts/lib/Either.js";

export const statusKeys = ["hp", "atk", "def", "spa", "spd", "spe"] as const;
export type Status = (typeof statusKeys)[number];

export const natures = [
  "Adamant",
  "Bashful",
  "Bold",
  "Brave",
  "Calm",
  "Careful",
  "Docile",
  "Gentle",
  "Hardy",
  "Hasty",
  "Impish",
  "Jolly",
  "Lax",
  "Lonely",
  "Mild",
  "Modest",
  "Naive",
  "Naughty",
  "Quiet",
  "Quirky",
  "Rash",
  "Relaxed",
  "Sassy",
  "Serious",
  "Timid",
] as const;

export type Nature = (typeof natures)[number];

export const natureObjectToString = (nature: { plus?: Status | null; minus?: Status | null }) =>
  match(nature)
    .with({ plus: "atk", minus: "spa" }, () => "Adamant" as const)
    .with({ plus: "def", minus: "atk" }, () => "Bold" as const)
    .with({ plus: "atk", minus: "spe" }, () => "Brave" as const)
    .with({ plus: "spd", minus: "atk" }, () => "Calm" as const)
    .with({ plus: "spd", minus: "spa" }, () => "Careful" as const)
    .with({ plus: "spd", minus: "def" }, () => "Gentle" as const)
    .with({ plus: "spe", minus: "def" }, () => "Hasty" as const)
    .with({ plus: "def", minus: "spa" }, () => "Impish" as const)
    .with({ plus: "spe", minus: "spa" }, () => "Jolly" as const)
    .with({ plus: "def", minus: "spd" }, () => "Lax" as const)
    .with({ plus: "atk", minus: "def" }, () => "Lonely" as const)
    .with({ plus: "spa", minus: "def" }, () => "Mild" as const)
    .with({ plus: "spa", minus: "atk" }, () => "Modest" as const)
    .with({ plus: "spe", minus: "spd" }, () => "Naive" as const)
    .with({ plus: "atk", minus: "spd" }, () => "Naughty" as const)
    .with({ plus: "spa", minus: "spe" }, () => "Quiet" as const)
    .with({ plus: "spa", minus: "spd" }, () => "Rash" as const)
    .with({ plus: "def", minus: "spe" }, () => "Relaxed" as const)
    .with({ plus: "spd", minus: "spe" }, () => "Sassy" as const)
    .with({ plus: "spe", minus: "atk" }, () => "Timid" as const)
    //  Although ‘Serious’ is ‘Spe/Spe’, in Champions, the ‘Flat’ Nature can only be selected with ‘Serious’ (as Attack/Attack).
    .with({ plus: null, minus: null }, () => "Serious" as const)
    .otherwise(() => undefined);

export const natureStringToObject = (nature: Nature | null) =>
  match(nature)
    .with("Adamant", () => ({ plus: "atk", minus: "spa" }))
    .with("Bashful", () => ({ plus: "spa", minus: "spa" }))
    .with("Bold", () => ({ plus: "spa", minus: "atk" }))
    .with("Brave", () => ({ plus: "atk", minus: "spe" }))
    .with("Calm", () => ({ plus: "spd", minus: "atk" }))
    .with("Careful", () => ({ plus: "spd", minus: "spa" }))
    .with("Docile", () => ({ plus: "spa", minus: "spa" }))
    .with("Gentle", () => ({ plus: "spd", minus: "spa" }))
    .with("Hardy", () => ({ plus: null, minus: null }))
    .with("Hasty", () => ({ plus: "spe", minus: "spa" }))
    .with("Impish", () => ({ plus: "spa", minus: "spa" }))
    .with("Jolly", () => ({ plus: "spe", minus: "spa" }))
    .with("Lax", () => ({ plus: "spa", minus: "spd" }))
    .with("Lonely", () => ({ plus: "atk", minus: "spa" }))
    .with("Mild", () => ({ plus: "spa", minus: "spa" }))
    .with("Modest", () => ({ plus: "spa", minus: "atk" }))
    .with("Naive", () => ({ plus: "spe", minus: "spd" }))
    .with("Naughty", () => ({ plus: "atk", minus: "spd" }))
    .with("Quiet", () => ({ plus: "spa", minus: "spe" }))
    .with("Quirky", () => ({ plus: "spd", minus: "spd" }))
    .with("Rash", () => ({ plus: "spa", minus: "spd" }))
    .with("Relaxed", () => ({ plus: "spa", minus: "spe" }))
    .with("Sassy", () => ({ plus: "spd", minus: "spe" }))
    .with("Serious", () => ({ plus: "spe", minus: "spe" }))
    .with("Timid", () => ({ plus: "spe", minus: "atk" }))
    .with(null, () => ({}))
    .exhaustive();

export const parseNature = (
  nature: string,
): Result<{ plus: Status | null; minus: Status | null }> =>
  match(nature)
    .with("Adamant", () => right({ plus: "atk" as const, minus: "spa" as const }))
    .with("Bashful", () => right({ plus: "spa" as const, minus: "spa" as const }))
    .with("Bold", () => right({ plus: "spa" as const, minus: "atk" as const }))
    .with("Brave", () => right({ plus: "atk" as const, minus: "spe" as const }))
    .with("Calm", () => right({ plus: "spd" as const, minus: "atk" as const }))
    .with("Careful", () => right({ plus: "spd" as const, minus: "spa" as const }))
    .with("Docile", () => right({ plus: "spa" as const, minus: "spa" as const }))
    .with("Gentle", () => right({ plus: "spd" as const, minus: "spa" as const }))
    .with("Hardy", () => right({ plus: null, minus: null }))
    .with("Hasty", () => right({ plus: "spe" as const, minus: "spa" as const }))
    .with("Impish", () => right({ plus: "spa" as const, minus: "spa" as const }))
    .with("Jolly", () => right({ plus: "spe" as const, minus: "spa" as const }))
    .with("Lax", () => right({ plus: "spa" as const, minus: "spd" as const }))
    .with("Lonely", () => right({ plus: "atk" as const, minus: "spa" as const }))
    .with("Mild", () => right({ plus: "spa" as const, minus: "spa" as const }))
    .with("Modest", () => right({ plus: "spa" as const, minus: "atk" as const }))
    .with("Naive", () => right({ plus: "spe" as const, minus: "spd" as const }))
    .with("Naughty", () => right({ plus: "atk" as const, minus: "spd" as const }))
    .with("Quiet", () => right({ plus: "spa" as const, minus: "spe" as const }))
    .with("Quirky", () => right({ plus: "spd" as const, minus: "spd" as const }))
    .with("Rash", () => right({ plus: "spa" as const, minus: "spd" as const }))
    .with("Relaxed", () => right({ plus: "spa" as const, minus: "spe" as const }))
    .with("Sassy", () => right({ plus: "spd" as const, minus: "spe" as const }))
    .with("Serious", () => right({ plus: "spe" as const, minus: "spe" as const }))
    .with("Timid", () => right({ plus: "spe" as const, minus: "atk" as const }))
    .otherwise(() => bail(`${nature}: Unknown`));
