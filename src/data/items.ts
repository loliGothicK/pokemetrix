import { data } from "@data/champions/items.json";
import { z } from "zod";

const ItemCategorySchema = z.enum(["berry", "held-item", "mega-evolution"]);

const ItemSchema = z.object({
  id: z.number(),
  identifier: z.string(),
  category: ItemCategorySchema,
});

export type Item = z.infer<typeof ItemSchema>;
export type ItemCategory = z.infer<typeof ItemCategorySchema>;

export const itemList: readonly Item[] = data.map((entry) => ItemSchema.parse(entry));

export const itemById = new Map(itemList.map((item) => [item.id, item]));
export const itemByIdentifier = new Map(itemList.map((item) => [item.identifier, item]));
