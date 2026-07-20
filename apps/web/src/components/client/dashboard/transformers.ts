/**
 * Transformer レジストリ
 *
 * SQL クエリの結果に対して、クライアントサイドで追加の変換を行うための仕組み。
 * - プリセット: 定義済みの変換関数を ID で選択する
 * - カスタム: ユーザーが JS 関数本体を文字列で記述し、new Function で実行する
 *
 * Transformer のシグネチャ:
 *   (rows: Record<string, unknown>[]) => Record<string, unknown>[]
 */

export interface Transformer {
  readonly id: string;
  /** i18n key for display name */
  readonly labelKey: string;
  /** i18n key for description */
  readonly descriptionKey: string;
  readonly fn: (rows: Record<string, unknown>[]) => Record<string, unknown>[];
}

// ─────────────────────────────────────────────────────────────────────────────
// プリセット実装
// ─────────────────────────────────────────────────────────────────────────────

/** 勝率・試合数サマリーを計算する */
function calcWinRate(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  const total = rows.length;
  if (total === 0) return [{ winRate: "0.0%", total: 0, wins: 0, losses: 0, draws: 0 }];

  const wins = rows.filter((r) => r.result === "win").length;
  const losses = rows.filter((r) => r.result === "loss").length;
  const draws = rows.filter((r) => r.result === "draw").length;
  const rate = ((wins / total) * 100).toFixed(1);

  return [{ winRate: `${rate}%`, total, wins, losses, draws }];
}

/** 現在の連勝 / 連敗ストリークを計算する（playedAt 昇順ソート済みを前提） */
function calcStreak(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  if (rows.length === 0) return [{ streak: "—", count: 0 }];

  const sorted = [...rows].sort((a, b) =>
    String(a.playedAt ?? "").localeCompare(String(b.playedAt ?? "")),
  );

  const lastRow = sorted[sorted.length - 1];
  if (!lastRow || !lastRow.result) return [{ streak: "—", count: 0 }];

  const streakResult = lastRow.result as string;
  let count = 0;

  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].result === streakResult) {
      count++;
    } else {
      break;
    }
  }

  const label = streakResult === "win" ? " W" : streakResult === "loss" ? " L" : " D";
  return [{ streak: `${count}${label}`, count, type: streakResult ?? "—" }];
}

/**
 * 各行に前の試合からのレート変動 (diff) 列を追加する。
 * 入力は playedAt 昇順ソート済みを前提。
 */
function calcRatingDiff(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  const sorted = [...rows].sort((a, b) =>
    String(a.playedAt ?? "").localeCompare(String(b.playedAt ?? "")),
  );

  return sorted.map((row, i) => {
    const prev = i > 0 ? (sorted[i - 1].rating as number | null | undefined) : null;
    const curr = row.rating as number | null | undefined;
    const diff =
      curr != null && prev != null ? curr - prev : null;
    return {
      ...row,
      diff: diff != null ? (diff >= 0 ? `+${diff}` : String(diff)) : "—",
    };
  });
}

/**
 * 先発ポケモンの成績を集計する。
 * 入力として `myTeam`, `mySelection`, `result` 列を期待する。
 */
function calcLeadsWinRate(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  const stats = new Map<string, { total: number; wins: number }>();

  for (const row of rows) {
    if (
      !Array.isArray(row.myTeam) ||
      !Array.isArray(row.mySelection) ||
      row.mySelection.length === 0 ||
      typeof row.result !== "string"
    ) {
      continue;
    }

    // mySelection の先頭を先発とする
    const leadIndex = row.mySelection[0];
    const leadPokemon = row.myTeam[leadIndex];
    if (!leadPokemon || typeof leadPokemon !== "object" || !("slug" in leadPokemon)) continue;

    const slug = String(leadPokemon.slug);
    const result = row.result;

    const current = stats.get(slug) ?? { total: 0, wins: 0 };
    current.total += 1;
    if (result === "win") {
      current.wins += 1;
    }
    stats.set(slug, current);
  }

  if (stats.size === 0) return [];

  return Array.from(stats.entries())
    .map(([slug, data]) => {
      const winRate = ((data.wins / data.total) * 100).toFixed(1);
      return {
        pokemon: slug,
        total: data.total,
        wins: data.wins,
        losses: data.total - data.wins,
        winRate: `${winRate}%`,
      };
    })
    .sort((a, b) => b.total - a.total || parseFloat(b.winRate) - parseFloat(a.winRate));
}

// ─────────────────────────────────────────────────────────────────────────────
// レジストリ
// ─────────────────────────────────────────────────────────────────────────────

export const PRESET_TRANSFORMERS: readonly Transformer[] = [
  {
    id: "none",
    labelKey: "dashboard.transformer.none",
    descriptionKey: "dashboard.transformer.noneDesc",
    fn: (rows) => rows,
  },
  {
    id: "winrate",
    labelKey: "dashboard.transformer.winrate",
    descriptionKey: "dashboard.transformer.winrateDesc",
    fn: calcWinRate,
  },
  {
    id: "streak",
    labelKey: "dashboard.transformer.streak",
    descriptionKey: "dashboard.transformer.streakDesc",
    fn: calcStreak,
  },
  {
    id: "ratingDiff",
    labelKey: "dashboard.transformer.ratingDiff",
    descriptionKey: "dashboard.transformer.ratingDiffDesc",
    fn: calcRatingDiff,
  },
  {
    id: "leadsWinRate",
    labelKey: "dashboard.transformer.leadsWinRate",
    descriptionKey: "dashboard.transformer.leadsWinRateDesc",
    fn: calcLeadsWinRate,
  },
];

export const PRESET_TRANSFORMER_IDS = PRESET_TRANSFORMERS.map((t) => t.id);

export function findPresetTransformer(id: string): Transformer | undefined {
  return PRESET_TRANSFORMERS.find((t) => t.id === id);
}

// ─────────────────────────────────────────────────────────────────────────────
// applyTransformer: WidgetRenderer から呼ぶメイン関数
// ─────────────────────────────────────────────────────────────────────────────

export function applyTransformer(
  transformerId: string | undefined,
  transformerCode: string | undefined,
  rows: Record<string, unknown>[],
): Record<string, unknown>[] {
  if (!transformerId || transformerId === "none") return rows;

  if (transformerId === "custom") {
    if (!transformerCode?.trim()) return rows;
    try {
      let code = transformerCode;
      let fn: unknown;

      if (code.includes("export default")) {
        // Strip basic TypeScript parameter types for the main function
        // Handles: export default function transform(rows: Rows) -> return function transform(rows)
        code = code.replace(
          /export\s+default\s+function(\s+[a-zA-Z0-9_]+)?\s*\(\s*([a-zA-Z0-9_]+)\s*(:\s*[a-zA-Z0-9_<>\[\]]+)?\s*\)/,
          "return function$1($2)"
        );

        // Handles: export default (rows: Rows) => -> return (rows) =>
        code = code.replace(
          /export\s+default\s*\(\s*([a-zA-Z0-9_]+)\s*(:\s*[a-zA-Z0-9_<>\[\]]+)?\s*\)\s*=>/,
          "return ($1) =>"
        );
        
        // Fallback for just export default without inline parameters (e.g. export default transform)
        code = code.replace(/export\s+default\s+/, "return ");
        
        // eslint-disable-next-line no-new-func
        const getTransformer = new Function(code);
        fn = getTransformer();
        
        if (typeof fn !== "function") {
          throw new Error("Custom transformer must export a default function");
        }
      } else {
        // Legacy support (just plain `return rows.map(...)`)
        // eslint-disable-next-line no-new-func
        fn = new Function("rows", code);
      }

      const result = (fn as (r: Record<string, unknown>[]) => Record<string, unknown>[])(rows);
      if (!Array.isArray(result)) {
        throw new Error("Custom transformer must return an array");
      }
      if (result.some((r) => typeof r !== "object" || r === null)) {
        throw new Error("Custom transformer must return an array of objects");
      }
      return result;
    } catch (e) {
      throw new Error(`Transformer Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const preset = findPresetTransformer(transformerId);
  if (!preset) return rows;

  try {
    return preset.fn(rows);
  } catch (e) {
    throw new Error(`Preset "${transformerId}" Error: ${e instanceof Error ? e.message : String(e)}`);
  }
}
