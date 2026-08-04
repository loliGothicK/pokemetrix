import { ok, err, Result } from "neverthrow";
import { Lens } from "monocle-ts";
import { fetchAndParseBattleData, type PokemonCacheData } from "@services/battleDataCache";

const rowsLenz = (format: "Singles" | "Doubles") => {
  return Lens.fromPath<PokemonCacheData>()(["summary", "battleSummary", "Current", format, "rows"]);
};

export type Info = {
  readonly name: string;
  readonly rank: number;
  readonly percentage: number;
};

export type FetchResponse = {
  readonly heldItems: readonly Info[];
  readonly moves: readonly Info[];
};

// サービス層（ここで初めてEither/Resultに変換し、UIに安全に渡す）
export async function fetchBattleData(
  slug: string,
  format: "Singles" | "Doubles",
): Promise<Result<FetchResponse, Error>> {
  try {
    const data = await fetchAndParseBattleData(format, slug);
    const rows = rowsLenz(format).get(data);
    return ok({
      heldItems: rows
        .filter(({ category }) => category === "held_item")
        .map((row) => ({
          name: row.name.replace(/'/g, "").toLowerCase().split(" ").join("-"),
          rank: row.rank,
          percentage: row.percentage_value!,
        })),
      moves: rows
        .filter(({ category }) => category === "move")
        .map((row) => ({
          name: row.name.replace(/'/g, "").toLowerCase().split(" ").join("-"),
          rank: row.rank,
          percentage: row.percentage_value!,
        })),
    });
  } catch (error) {
    console.error("[Service Error] データのフェッチまたはパースに失敗しました。", error);
    return err(error instanceof Error ? error : new Error("Unknown error"));
  }
}
