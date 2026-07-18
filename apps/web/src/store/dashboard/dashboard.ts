import { z } from "zod";
import type { DataSource, DashboardVariable } from "@/lib/db/schema";

export type { DataSource, DashboardVariable };

export const visualizationTypeSchema = z.enum(["table", "gauge", "stat", "histogram", "custom"]);
export type VisualizationType = z.infer<typeof visualizationTypeSchema>;

// =====================================================================
// DTO（クライアント⇔サーバ間でやり取りするシリアライズ済みの形）
// 設計: .design/dashboard.md
// =====================================================================

/** ウィジェットのデータソース（Zod スキーマ） */
export const dataSourceSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("season"), seasonId: z.string().min(1).nullable() }),
  z.object({ type: z.literal("variable"), variableId: z.string().min(1) }),
]);

/** ダッシュボード変数（Zod スキーマ） */
export const dashboardVariableSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1).max(50),
    label: z.string().min(1).max(100),
    type: z.literal("season"),
    defaultSeasonId: z.string().min(1).nullable(),
  })
  .readonly();

/** ダッシュボード上の1ウィジェット */
export interface DashboardWidget {
  readonly id: string;
  readonly templateId?: string;
  readonly title: string;
  readonly dataSource: DataSource;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly options?: Record<string, unknown>;
  readonly visualization?: VisualizationType;
  readonly query?: string;
  /**
   * Transformer ID.
   * - "none" | undefined : パススルー
   * - "winrate" / "streak" / "ratingDiff" : プリセット
   * - "custom" : transformerCode を new Function で実行
   */
  readonly transformer?: string;
  /** transformer === "custom" のときのユーザー定義 JS 関数本体 */
  readonly transformerCode?: string;
}

/** ダッシュボード1件 */
export interface Dashboard {
  readonly id: string;
  readonly name: string;
  readonly isDefault: boolean;
  readonly layout: readonly DashboardWidget[];
  readonly variables: readonly DashboardVariable[];
  /** ISO 8601 */
  readonly createdAt: string;
  /** ISO 8601 */
  readonly updatedAt: string;
}

// =====================================================================
// 後方互換: 旧フォーマット (seasonId 直持ち) を新形式に変換
// =====================================================================

/** 旧ウィジェット形式（seasonId 直持ち）*/
interface LegacyWidget {
  readonly id: string;
  readonly type?: string;
  readonly templateId?: string;
  readonly title: string;
  readonly seasonId?: string | null;
  readonly dataSource?: DataSource;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly options?: Record<string, unknown>;
  readonly visualization?: VisualizationType;
  readonly query?: string;
  readonly transformer?: string;
  readonly transformerCode?: string;
}

/**
 * すでに新フォーマットのウィジェットはそのまま返す。
 */
export function migrateWidget(raw: LegacyWidget): DashboardWidget {
  const templateId = raw.templateId ?? raw.type;
  const dataSource: DataSource =
    raw.dataSource ?? ({ type: "season", seasonId: raw.seasonId ?? null } satisfies DataSource);

  let visualization = raw.visualization;
  let query = raw.query;

  // Convert legacy templates to generic SQL widgets
  if (!visualization && templateId !== "note") {
    switch (templateId) {
      case "winRateSummary":
        visualization = "table";
        query = "SELECT result, COUNT(*) AS count FROM ? GROUP BY result";
        break;
      case "winRateTrend":
        visualization = "table"; // Fallback since we don't have heatmap yet
        query = "SELECT playedAt, result FROM ? ORDER BY playedAt ASC LIMIT 30";
        break;
      case "topOpponents":
        visualization = "table";
        query =
          "SELECT opponent, COUNT(*) AS count FROM ? GROUP BY opponent ORDER BY count DESC LIMIT 10";
        break;
      case "recentRecords":
        visualization = "table";
        query = "SELECT playedAt, opponent, result FROM ? ORDER BY playedAt DESC LIMIT 10";
        break;
      default:
        // Do nothing if it doesn't match legacy templates
        break;
    }
  }

  return {
    id: raw.id,
    templateId,
    title: raw.title,
    dataSource,
    x: raw.x,
    y: raw.y,
    w: raw.w,
    h: raw.h,
    ...(raw.options !== undefined && { options: raw.options }),
    ...(visualization !== undefined && { visualization }),
    ...(query !== undefined && { query }),
    ...(raw.transformer !== undefined && { transformer: raw.transformer }),
    ...(raw.transformerCode !== undefined && { transformerCode: raw.transformerCode }),
  };
}

// =====================================================================
// 入力バリデーション（Zod）
// =====================================================================

/** グリッド列数の上限（lg ブレークポイント基準） */
export const DASHBOARD_GRID_MAX_COLS = 8;
/** ウィジェット行高の上限 */
export const DASHBOARD_GRID_MAX_ROWS = 12;

export const dashboardWidgetSchema = z
  .object({
    id: z.string().min(1),
    templateId: z.string().optional(),
    title: z.string().max(100),
    dataSource: dataSourceSchema,
    x: z.number().int().min(0),
    y: z.number().int().min(0),
    w: z.number().int().min(1).max(DASHBOARD_GRID_MAX_COLS),
    h: z.number().int().min(1).max(DASHBOARD_GRID_MAX_ROWS),
    options: z.record(z.string(), z.unknown()).optional(),
    visualization: visualizationTypeSchema.optional(),
    query: z.string().optional(),
    transformer: z.string().optional(),
    transformerCode: z.string().optional(),
  })
  .readonly();

const dashboardInputObject = z.object({
  id: z.string().min(1).optional(),
  name: z.string().trim().min(1).max(100),
  isDefault: z.boolean().optional(),
  layout: z
    .array(dashboardWidgetSchema)
    .max(30)
    .refine((arr) => new Set(arr.map((w) => w.id)).size === arr.length, "widget id must be unique")
    .readonly()
    .optional(),
  variables: z
    .array(dashboardVariableSchema)
    .max(20)
    .refine(
      (arr) => new Set(arr.map((v) => v.name)).size === arr.length,
      "variable name must be unique",
    )
    .readonly()
    .optional(),
});

export const dashboardInputSchema = dashboardInputObject.readonly();

export type DashboardInput = z.infer<typeof dashboardInputSchema>;

export const dashboardUpdateSchema = dashboardInputObject.omit({ id: true }).partial().readonly();

export type DashboardUpdate = Partial<Omit<DashboardInput, "id">>;
