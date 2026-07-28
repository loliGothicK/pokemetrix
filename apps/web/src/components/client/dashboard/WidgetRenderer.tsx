"use client";

import { useMemo } from "react";
import { alpha, Box, CircularProgress, Stack, Typography, Skeleton, Button } from "@mui/material";
import AutoFixHighRoundedIcon from "@mui/icons-material/AutoFixHighRounded";
import { useBattleRecords } from "@/hooks/useBattleRecords";
import type { DashboardWidget } from "@/store/dashboard/dashboard";
import { executeSql } from "@/lib/sql/engine";
import {
  TableVisualizer,
  StatVisualizer,
  GaugeVisualizer,
  HistogramVisualizer,
  HeatmapVisualizer,
} from "./GenericVisualizers";
import { applyTransformer } from "./transformers";

import { useTranslation } from "react-i18next";

/** DataSource を seasonId に解決するヘルパー */
function resolveSeasonId(
  widget: DashboardWidget,
  variableValues: Readonly<Record<string, string | null>>,
): string | undefined {
  // 後方互換: 旧フォーマット（dataSource なし）
  const ds = widget.dataSource;
  if (!ds) return undefined;

  let sid: string | null = null;
  if (ds.type === "season") {
    sid = ds.seasonId;
  } else if (ds.type === "variable") {
    sid = variableValues[ds.variableId] ?? null;
  }

  return sid === null ? undefined : sid;
}

function NoteWidget({ widget }: { readonly widget: DashboardWidget }) {
  const { t } = useTranslation();
  const body = typeof widget.options?.body === "string" ? widget.options.body : "";

  return (
    <Typography
      variant="body2"
      sx={{ whiteSpace: "pre-wrap" }}
      color={body ? "inherit" : "text.secondary"}
    >
      {body || t("dashboard.widget.note.placeholder")}
    </Typography>
  );
}

function WidgetLoading() {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
      <CircularProgress size={24} />
    </Box>
  );
}

function WidgetEmpty({ message }: { readonly message: string }) {
  return (
    <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 3 }}>
      {message}
    </Typography>
  );
}

import { match } from "ts-pattern";

/** カスタムクエリを実行して汎用ビジュアライザを描画するウィジェット */
function CustomQueryWidget({
  seasonId,
  query,
  visualization,
  transformer,
  transformerCode,
}: {
  readonly seasonId?: string;
  readonly query: string;
  readonly visualization: string;
  readonly transformer?: string;
  readonly transformerCode?: string;
}) {
  const { records, isLoading } = useBattleRecords({ seasonId });

  const { resultData, error } = useMemo(() => {
    if (!records || records.length === 0) return { resultData: [], error: null };
    try {
      const raw = executeSql(query, records as unknown as Record<string, unknown>[]);
      return { resultData: applyTransformer(transformer, transformerCode, raw), error: null };
    } catch (e) {
      return { resultData: [], error: e instanceof Error ? e.message : String(e) };
    }
  }, [query, transformer, transformerCode, records]);

  if (isLoading) return <WidgetLoading />;

  if (error) {
    return <WidgetEmpty message={`Error: ${error}`} />;
  }

  // Auto-detect heatmap data to avoid breakage on existing widgets
  const actualVis =
    resultData.length > 0 && (resultData[0] as any)?._type === "heatmap"
      ? "heatmap"
      : visualization;

  return match(actualVis)
    .with("table", () => <TableVisualizer data={resultData} />)
    .with("stat", () => <StatVisualizer data={resultData} />)
    .with("gauge", () => <GaugeVisualizer data={resultData} />)
    .with("histogram", () => <HistogramVisualizer data={resultData} />)
    .with("heatmap", () => <HeatmapVisualizer data={resultData} />)
    .otherwise(() => <WidgetEmpty message={`Unknown visualization: ${actualVis}`} />);
}

/**
 * ウィジェットの種別に応じて表示内容を切り替えるレンダラ。
 * データは既存の battle-record 集計ロジックを再利用する。
 */
export function WidgetRenderer({
  widget,
  editing,
  variableValues = {},
  onEditClick,
}: {
  readonly widget: DashboardWidget;
  readonly editing?: boolean;
  /** Variable 参照の解決用: { variableId -> seasonId | null } */
  readonly variableValues?: Readonly<Record<string, string | null>>;
  readonly onEditClick?: () => void;
}) {
  const { t } = useTranslation();
  const seasonId = resolveSeasonId(widget, variableValues);

  if (widget.templateId === "note") {
    return <NoteWidget widget={widget} />;
  }

  // Generic Visualization mapping
  const vis = widget.visualization;
  const queryStr = widget.query;

  if (!vis) {
    return (
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          sx={{
            borderRadius: 1, py: 1, px: 2,
          }}
        />
        <Stack
          spacing={2}
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
            bgcolor: (theme) => alpha(theme.palette.background.paper, 0.7),
            backdropFilter: "blur(4px)",
            borderRadius: 1, py: 1, px: 2,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 700, color: "text.secondary" }}>
            {t("dashboard.widget.notConfigured", "Visualize is not configured")}
          </Typography>
          {editing && onEditClick && (
            <Button
              variant="contained"
              size="small"
              startIcon={<AutoFixHighRoundedIcon />}
              onClick={(e) => {
                e.stopPropagation();
                onEditClick();
              }}
            >
              {t("dashboard.widget.openSettings", "Open Settings")}
            </Button>
          )}
        </Stack>
      </Box>
    );
  }

  return (
    <CustomQueryWidget
      seasonId={seasonId}
      query={queryStr ?? "SELECT * FROM records LIMIT 10"}
      visualization={vis}
      transformer={widget.transformer}
      transformerCode={widget.transformerCode}
    />
  );
}
