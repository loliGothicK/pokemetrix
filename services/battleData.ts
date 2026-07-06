import { z } from "zod";
import { unstable_cache } from "next/cache";
import { ok, err, Result } from "neverthrow";
import { Lens } from "monocle-ts";

// 1. 厳格なZodスキーマ（未知のプロパティは無視、カテゴリは実データに基づくこと）
const rowSchema = z.object({
  category: z.enum(["move", "held_item", "teammate", "stat_alignment", "stat_points", "ability"]),
  rank: z.number(),
  name: z.string(),
  percentage_value: z.number().nullable(),
});

const pokemonSchema = z.object({
  name: z.string(),
  battleName: z.string(),
  slug: z.string(),
  summary: z.object({
    battleSummary: z.object({
      Current: z.object({
        Doubles: z.object({
          rows: z.array(rowSchema),
        }),
        Singles: z.object({
          rows: z.array(rowSchema),
        }),
      }),
    }),
  }),
});

const rowsLenz = (format: "Singles" | "Doubles") => {
  return Lens.fromPath<z.infer<typeof pokemonSchema>>()([
    "summary",
    "battleSummary",
    "Current",
    format,
    "rows",
  ]);
};

// 2. キャッシュ層（ここではEitherを使わず、失敗時は必ずthrowする）
const fetchAndParseBattleData = unstable_cache(
  async (format: string, slug: string, season: string = "Current") => {
    const params = new URLSearchParams({
      format,
      season,
    });

    const res = await fetch(`https://championsbattledata.com/api/pokemon/${slug}?${params}`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      // 意図的にthrowすることで、Next.jsのキャッシュ更新を失敗させ、古いキャッシュを維持させる
      throw new Error(`API returned ${res.status}`);
    }

    const rawJson = await res.json();
    // Zodでパース（失敗時はZodErrorがthrowされ、これもキャッシュ更新をキャンセルさせる）
    return pokemonSchema.parse(rawJson);
  },
  ["battle-data-cache"], // キャッシュキー
  { revalidate: 3600 },
);

export type Info = {
  name: string;
  rank: number;
  percentage: number;
};

export type FetchResponse = {
  heldItems: Info[];
  moves: Info[];
};

// 3. サービス層（ここで初めてEither/Resultに変換し、UIに安全に渡す）
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
          name: row.name.toLowerCase().split(" ").join("-"),
          rank: row.rank,
          percentage: row.percentage_value!,
        })),
      moves: rows
        .filter(({ category }) => category === "move")
        .map((row) => ({
          name: row.name.toLowerCase().split(" ").join("-"),
          rank: row.rank,
          percentage: row.percentage_value!,
        })),
    });
  } catch (error) {
    console.error("[Service Error] データのフェッチまたはパースに失敗しました。", error);
    return err(error instanceof Error ? error : new Error("Unknown error"));
  }
}
