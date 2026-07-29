import { data } from "@data/master/abilities.json";
import { z } from "zod";

const AbilitySchema = z
  .object({
    id: z.number(),
    identifier: z.string(),
  })
  .readonly();

export type Ability = z.infer<typeof AbilitySchema>;

export const abilityList: readonly Ability[] = data.map((entry) => AbilitySchema.parse(entry));

export const abilityById = new Map(abilityList.map((ability) => [ability.id, ability]));
export const abilityByIdentifier = new Map(
  abilityList.map((ability) => [ability.identifier, ability]),
);
