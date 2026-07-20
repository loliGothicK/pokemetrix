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
 * 入力として `myTeam`, `mySelection`, `opponents`, `result` 列を期待する。
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

    const opponents = Array.isArray(row.opponents) ? row.opponents : [];
    
    // opponentのleadを抽出
    const oppLeads = opponents
      .filter((o: any) => o && o.selectionRole === "lead")
      .map((o: any) => String(o.pokemonSlug))
      .sort(); // 順序を一定にするためソート

    // シングルかダブルかを推測する
    let isDoubles = false;
    if (row.format === "doubles") {
      isDoubles = true;
    } else if (row.format === "singles") {
      isDoubles = false;
    } else if (oppLeads.length >= 2) {
      isDoubles = true;
    } else if (oppLeads.length === 1) {
      isDoubles = false;
    } else {
      isDoubles = row.mySelection.length >= 4;
    }

    const leadCount = isDoubles ? 2 : 1;
    const myLeadIndices = row.mySelection.slice(0, leadCount);
    
    const myLeads = myLeadIndices
      .map((idx: any) => {
        const p = (row.myTeam as any[])[idx as number];
        return p && typeof p === "object" && "slug" in p ? String(p.slug) : null;
      })
      .filter(Boolean) as string[];

    if (myLeads.length === 0) continue;
    
    // ダブル等の場合、順序を一定にする
    myLeads.sort();

    const myLeadsStr = myLeads.join(" & ");
    const result = row.result;

    const current = stats.get(myLeadsStr) ?? { total: 0, wins: 0 };
    current.total += 1;
    if (result === "win") {
      current.wins += 1;
    }
    stats.set(myLeadsStr, current);
  }

  if (stats.size === 0) return [];

  return Array.from(stats.entries())
    .map(([key, data]) => {
      const winRate = ((data.wins / data.total) * 100).toFixed(1);
      return {
        pokemon: key,
        total: data.total,
        wins: data.wins,
        losses: data.total - data.wins,
        winRate: `${winRate}%`,
      };
    })
    .sort((a, b) => b.total - a.total || parseFloat(b.winRate) - parseFloat(a.winRate));
}

// ─────────────────────────────────────────────────────────────────────────────
// ヒートマップ型
// ─────────────────────────────────────────────────────────────────────────────

export interface HeatmapCell {
  wins: number;
  total: number;
}

export interface HeatmapRow {
  oppLead: string;
  cells: Record<string, HeatmapCell>;
  totalSamples: number;
}

export interface HeatmapMatrix {
  /** 横軸（自分の頻出先発）、上位6パターン */
  myLeads: string[];
  rows: HeatmapRow[];
}

export interface HeatmapData {
  readonly _type: "heatmap";
  readonly singles: HeatmapMatrix;
  readonly doubles: HeatmapMatrix;
}

// ─────────────────────────────────────────────────────────────────────────────
// ヘルパー: シングル / ダブル の判定
// ─────────────────────────────────────────────────────────────────────────────

function detectFormat(row: Record<string, unknown>): "singles" | "doubles" | null {
  if (row.format === "singles") return "singles";
  if (row.format === "doubles") return "doubles";
  
  // 推測: mySelection が 4体以上ならダブル、3体以下ならシングル
  if (Array.isArray(row.mySelection) && row.mySelection.length > 0) {
    return row.mySelection.length >= 4 ? "doubles" : "singles";
  }
  
  // 推測: 相手の選出リードが 2体以上ならダブル、1体ならシングル
  if (Array.isArray(row.opponents)) {
    const oppLeads = row.opponents.filter((o: any) => o && o.selectionRole === "lead");
    if (oppLeads.length >= 2) return "doubles";
    if (oppLeads.length === 1) return "singles";
  }
  
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// ヘルパー: マトリクスを構築する
// ─────────────────────────────────────────────────────────────────────────────

function buildMatrix(
  rows: Record<string, unknown>[],
  leadCount: number,
): HeatmapMatrix {
  const myLeadCounts = new Map<string, number>();
  /** oppLeadKey -> myLeadKey -> cell */
  const matrix = new Map<string, Map<string, HeatmapCell>>();

  for (const row of rows) {
    if (
      !Array.isArray(row.myTeam) ||
      !Array.isArray(row.mySelection) ||
      row.mySelection.length === 0 ||
      typeof row.result !== "string"
    ) continue;

    const opponents = Array.isArray(row.opponents) ? row.opponents : [];
    const oppLeads = opponents
      .filter((o: any) => o && o.selectionRole === "lead")
      .map((o: any) => String(o.pokemonSlug))
      .sort();

    if (leadCount === 2 && oppLeads.length < 2) continue;
    if (leadCount === 1 && oppLeads.length < 1) continue;

    const myLeadIndices = row.mySelection.slice(0, leadCount);
    const myLeads = myLeadIndices
      .map((idx: any) => {
        const p = (row.myTeam as any[])[idx as number];
        return p && typeof p === "object" && "slug" in p ? String(p.slug) : null;
      })
      .filter(Boolean) as string[];

    if (myLeads.length < leadCount) continue;
    myLeads.sort();
    const myLeadsKey = myLeads.join(" & ");
    myLeadCounts.set(myLeadsKey, (myLeadCounts.get(myLeadsKey) ?? 0) + 1);

    const oppLeadsForThis = leadCount === 2 ? oppLeads.slice(0, 2) : oppLeads.slice(0, 1);
    oppLeadsForThis.sort();
    const oppLeadsKey = oppLeadsForThis.join(" & ");

    if (!matrix.has(oppLeadsKey)) matrix.set(oppLeadsKey, new Map());
    const oppMap = matrix.get(oppLeadsKey)!;

    if (!oppMap.has(myLeadsKey)) oppMap.set(myLeadsKey, { wins: 0, total: 0 });
    const cell = oppMap.get(myLeadsKey)!;
    cell.total += 1;
    if (row.result === "win") cell.wins += 1;
  }

  // 横軸: 自分の頻出先発 上位6
  const topMyLeads = Array.from(myLeadCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(e => e[0]);

  // 縦軸: 相手先発を遭遇頻度順にソート
  const matrixRows: HeatmapRow[] = Array.from(matrix.entries())
    .map(([oppLead, myLeadMap]) => {
      const cells: Record<string, HeatmapCell> = {};
      let totalSamples = 0;

      for (const myLead of topMyLeads) {
        const c = myLeadMap.get(myLead);
        if (c) {
          cells[myLead] = { ...c };
          totalSamples += c.total;
        } else {
          cells[myLead] = { wins: 0, total: 0 };
        }
      }

      return { oppLead, cells, totalSamples };
    })
    .sort((a, b) => b.totalSamples - a.totalSamples)
    .slice(0, 60);

  return { myLeads: topMyLeads, rows: matrixRows };
}

/**
 * 自分の先発 vs 相手の先発 の相性ヒートマップデータを生成する。
 * シングルとダブルのレコードを完全に分離して計算する。
 */
function calcMatchupPivot(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  const singlesRows = rows.filter(r => detectFormat(r) === "singles");
  const doublesRows = rows.filter(r => detectFormat(r) === "doubles");

  const result: HeatmapData = {
    _type: "heatmap",
    singles: buildMatrix(singlesRows, 1),
    doubles: buildMatrix(doublesRows, 2),
  };

  // HeatmapVisualizer が data[0] として受け取れるよう1要素配列で返す
  return [result as unknown as Record<string, unknown>];
}



/**
 * 相手のポケモン vs 勝敗のブレイクダウン
 */
function calcWinLossCauses(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  const stats = new Map<string, { total: number; winLead: number; winBack: number; lossLead: number; lossBack: number }>();

  for (const row of rows) {
    if (typeof row.result !== "string") continue;
    
    const opponents = Array.isArray(row.opponents) ? row.opponents : [];
    const result = row.result;
    
    for (const o of opponents) {
      if (!o || typeof o !== "object" || !("pokemonSlug" in o)) continue;
      const slug = String(o.pokemonSlug);
      const role = String(o.selectionRole);
      
      if (!stats.has(slug)) {
        stats.set(slug, { total: 0, winLead: 0, winBack: 0, lossLead: 0, lossBack: 0 });
      }
      
      const stat = stats.get(slug)!;
      stat.total += 1;
      
      if (result === "win") {
        if (role === "lead") stat.winLead += 1;
        else stat.winBack += 1;
      } else if (result === "loss") {
        if (role === "lead") stat.lossLead += 1;
        else stat.lossBack += 1;
      }
    }
  }

  if (stats.size === 0) return [];

  return Array.from(stats.entries())
    .map(([slug, data]) => {
      const winMatches = data.winLead + data.winBack;
      const lossMatches = data.lossLead + data.lossBack;
      
      return {
        pokemon: slug,
        total: data.total,
        wins: `${winMatches} (Lead ${data.winLead} / Back ${data.winBack})`,
        losses: `${lossMatches} (Lead ${data.lossLead} / Back ${data.lossBack})`,
      };
    })
    .sort((a, b) => (b.total as number) - (a.total as number))
    .slice(0, 20); // Top 20
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
  {
    id: "matchupPivot",
    labelKey: "dashboard.transformer.matchupPivot",
    descriptionKey: "dashboard.transformer.matchupPivotDesc",
    fn: calcMatchupPivot,
  },
  {
    id: "winLossCauses",
    labelKey: "dashboard.transformer.winLossCauses",
    descriptionKey: "dashboard.transformer.winLossCausesDesc",
    fn: calcWinLossCauses,
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
      if (!code.includes("export default")) {
        throw new Error("Custom transformer must export a default function");
      }

      // Strip basic TypeScript parameter types for the main function
      // Handles: export default function transform(rows: Rows) -> return function transform(rows)
      code = code.replace(
        /export\s+default\s+function(\s+[a-zA-Z0-9_]+)?\s*\(\s*([a-zA-Z0-9_]+)\s*(:\s*[a-zA-Z0-9_<>[\]]+)?\s*\)/,
        "return function$1($2)"
      );

      // Handles: export default (rows: Rows) => -> return (rows) =>
      code = code.replace(
        /export\s+default\s*\(\s*([a-zA-Z0-9_]+)\s*(:\s*[a-zA-Z0-9_<>[\]]+)?\s*\)\s*=>/,
        "return ($1) =>"
      );
      
      // Fallback for just export default without inline parameters (e.g. export default transform)
      code = code.replace(/export\s+default\s+/, "return ");
      
      // eslint-disable-next-line no-new-func
      const getTransformer = new Function(code);
      const fn = getTransformer();
      
      if (typeof fn !== "function") {
        throw new Error("Custom transformer must export a default function");
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
