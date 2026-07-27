/**
 * ウィジェットテンプレート定義
 *
 * 各テンプレートは Query / Transformer / Visualization のデフォルトセットを持つ。
 * VisualizeEditor のテンプレート選択UIから適用される。
 */

import type { VisualizationType } from "@/store/dashboard/dashboard";

export interface WidgetTemplate {
  readonly id: string;
  /** i18n key */
  readonly labelKey: string;
  /** i18n key for description */
  readonly descriptionKey: string;
  readonly visualization: VisualizationType;
  /** Transformer ID. "none" = passthrough */
  readonly transformer: string;
  readonly query: string;
}

export const WIDGET_TEMPLATES: readonly WidgetTemplate[] = [
  {
    id: "winrateSummary",
    labelKey: "dashboard.template.winrateSummary",
    descriptionKey: "dashboard.template.winrateSummaryDesc",
    visualization: "stat",
    transformer: "winrate",
    query: "SELECT result FROM records ORDER BY playedAt ASC",
  },
  {
    id: "resultBreakdown",
    labelKey: "dashboard.template.resultBreakdown",
    descriptionKey: "dashboard.template.resultBreakdownDesc",
    visualization: "table",
    transformer: "none",
    query: "SELECT result, COUNT(*) count FROM records GROUP BY result ORDER BY count DESC",
  },
  {
    id: "leadsAnalysis",
    labelKey: "dashboard.template.leadsAnalysis",
    descriptionKey: "dashboard.template.leadsAnalysisDesc",
    visualization: "table",
    transformer: "leadsWinRate",
    query: "SELECT myTeam, mySelection, opponents, result FROM records",
  },
  {
    id: "matchupPivot",
    labelKey: "dashboard.template.matchupPivot",
    descriptionKey: "dashboard.template.matchupPivotDesc",
    visualization: "heatmap",
    transformer: "matchupPivot",
    query: "SELECT myTeam, mySelection, opponents, result, format FROM records",
  },
  {
    id: "winLossCauses",
    labelKey: "dashboard.template.winLossCauses",
    descriptionKey: "dashboard.template.winLossCausesDesc",
    visualization: "table",
    transformer: "winLossCauses",
    query: "SELECT opponents, result FROM records",
  },
  {
    id: "ratingHistory",
    labelKey: "dashboard.template.ratingHistory",
    descriptionKey: "dashboard.template.ratingHistoryDesc",
    visualization: "table",
    transformer: "ratingDiff",
    query: "SELECT playedAt, result, rating FROM records ORDER BY playedAt ASC LIMIT 30",
  },
  {
    id: "maxRating",
    labelKey: "dashboard.template.maxRating",
    descriptionKey: "dashboard.template.maxRatingDesc",
    visualization: "stat",
    transformer: "none",
    query: "SELECT MAX(rating) maxRating FROM records",
  },
  {
    id: "recentMatches",
    labelKey: "dashboard.template.recentMatches",
    descriptionKey: "dashboard.template.recentMatchesDesc",
    visualization: "table",
    transformer: "none",
    query:
      "SELECT playedAt, result, firstOrSecond, rating FROM records ORDER BY playedAt DESC LIMIT 10",
  },
  {
    id: "currentStreak",
    labelKey: "dashboard.template.currentStreak",
    descriptionKey: "dashboard.template.currentStreakDesc",
    visualization: "stat",
    transformer: "streak",
    query: "SELECT result, playedAt FROM records ORDER BY playedAt ASC",
  },
];
