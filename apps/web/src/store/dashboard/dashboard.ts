import { z } from "zod";
import type { WidgetType } from "@/lib/db/schema";

export type { WidgetType };

// =====================================================================
// DTO（クライアント⇔サーバ間でやり取りするシリアライズ済みの形）
// 設計: .design/dashboard.md
// =====================================================================

/** ダッシュボード上の1ウィジェット */
export interface DashboardWidget {
  readonly id: string;
  readonly type: WidgetType;
  readonly title: string;
  /** null = 全シーズン統合 */
  readonly seasonId: string | null;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly options?: Record<string, unknown>;
}

/** ダッシュボード1件 */
export interface Dashboard {
  readonly id: string;
  readonly name: string;
  readonly isDefault: boolean;
  readonly layout: readonly DashboardWidget[];
  /** ISO 8601 */
  readonly createdAt: string;
  /** ISO 8601 */
  readonly updatedAt: string;
}

// =====================================================================
// 入力バリデーション（Zod）
// =====================================================================

export const widgetTypeSchema = z.enum([
  "winRateSummary",
  "winRateTrend",
  "orderSplit",
  "topOpponents",
  "recentRecords",
  "ratingTrend",
  "note",
]);

/** グリッド列数の上限（lg ブレークポイント基準） */
export const DASHBOARD_GRID_MAX_COLS = 8;
/** ウィジェット行高の上限 */
export const DASHBOARD_GRID_MAX_ROWS = 12;

export const dashboardWidgetSchema = z
  .object({
    id: z.string().min(1),
    type: widgetTypeSchema,
    title: z.string().max(100),
    seasonId: z.string().min(1).nullable(),
    x: z.number().int().min(0),
    y: z.number().int().min(0),
    w: z.number().int().min(1).max(DASHBOARD_GRID_MAX_COLS),
    h: z.number().int().min(1).max(DASHBOARD_GRID_MAX_ROWS),
    options: z.record(z.string(), z.unknown()).optional(),
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
});

export const dashboardInputSchema = dashboardInputObject.readonly();

export type DashboardInput = z.infer<typeof dashboardInputSchema>;

export const dashboardUpdateSchema = dashboardInputObject.omit({ id: true }).partial().readonly();

export type DashboardUpdate = Partial<Omit<DashboardInput, "id">>;
