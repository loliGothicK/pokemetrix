"use cache";

import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";
import { withChildSpan } from "@/lib/otel";

const rowSchema = z
  .object({
    category: z.enum(["move", "held_item", "teammate", "stat_alignment", "stat_points", "ability"]),
    rank: z.number(),
    name: z.string(),
    percentage_value: z.number().nullable(),
  })
  .readonly();

const pokemonSchema = z
  .object({
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
  })
  .readonly();

export type PokemonCacheData = z.infer<typeof pokemonSchema>;

// キャッシュ層：ファイルトップの "use cache" により全エクスポートがサーバー専用キャッシュ関数として扱われる
export async function fetchAndParseBattleData(
  format: string,
  slug: string,
  season: string = "Current",
): Promise<PokemonCacheData> {
  cacheLife("hours");
  cacheTag("battle-data-cache");

  const params = new URLSearchParams({
    format,
    season,
  });

  const res = await withChildSpan(
    "battle.fetch-external-data",
    async (span) => {
      span.setAttribute("battle.slug", slug);
      span.setAttribute("battle.format", format);
      const response = await fetch(
        `https://championsbattledata.com/api/pokemon/${slug}?${params}`,
      );
      span.setAttribute("http.response_status_code", response.status);
      return response;
    },
    { op: "http.client" },
  );

  if (!res.ok) {
    // 意図的にthrowすることで、Next.jsのキャッシュ更新を失敗させ、古いキャッシュを維持させる
    throw new Error(`API returned ${res.status}`);
  }

  const rawJson = await res.json();
  // Zodでパース（失敗時はZodErrorがthrowされ、これもキャッシュ更新をキャンセルさせる）
  return pokemonSchema.parse(rawJson);
}
