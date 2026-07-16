"use client";

import { useMemo } from "react";
import {
  alpha,
  Avatar,
  Box,
  CircularProgress,
  LinearProgress,
  Stack,
  Typography,
  Skeleton,
  Button,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import AutoFixHighRoundedIcon from "@mui/icons-material/AutoFixHighRounded";
import { useBattleRecords } from "@/hooks/useBattleRecords";
import { flexRowCenter } from "@/theme/sx";
import type { DashboardWidget } from "@/store/dashboard/dashboard";
import { executeSql } from "@/lib/sql/engine";
import {
  TableVisualizer,
  StatVisualizer,
  GaugeVisualizer,
  HistogramVisualizer,
} from "./GenericVisualizers";

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

/** カスタムクエリを実行して汎用ビジュアライザを描画するウィジェット */
function CustomQueryWidget({
  seasonId,
  query,
  visualization,
}: {
  readonly seasonId?: string;
  readonly query: string;
  readonly visualization: string;
}) {
  const { t } = useTranslation();
  const { records, isLoading } = useBattleRecords({ seasonId });

  const resultData = useMemo(() => {
    if (!records || records.length === 0) return [];
    try {
      return executeSql(query, records as unknown as Record<string, unknown>[]);
    } catch (e) {
      console.error("Custom SQL Query Error:", e);
      return [];
    }
  }, [query, records]);

  if (isLoading) return <WidgetLoading />;

  switch (visualization) {
    case "table":
      return <TableVisualizer data={resultData} />;
    case "stat":
      return <StatVisualizer data={resultData} />;
    case "gauge":
      return <GaugeVisualizer data={resultData} />;
    case "histogram":
      return <HistogramVisualizer data={resultData} />;
    default:
      return <WidgetEmpty message={`Unknown visualization: ${visualization}`} />;
  }
}

/**
 * ウィジェットの種別に応じて表示内容を切り替えるレンダラ。
 * データは既存の battle-record 集計ロジックを再利用する。
 */
export function WidgetRenderer({
  widget,
  editing,
  variableValues = {},
  onOptionsChange,
  onEditClick,
}: {
  readonly widget: DashboardWidget;
  readonly editing?: boolean;
  /** Variable 参照の解決用: { variableId -> seasonId | null } */
  readonly variableValues?: Readonly<Record<string, string | null>>;
  readonly onOptionsChange?: (options: Record<string, unknown>) => void;
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
        <Skeleton variant="rectangular" width="100%" height="100%" sx={{ borderRadius: 1 }} />
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
            borderRadius: 1,
            p: 2,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 700, color: "text.secondary" }}>
            Visualize が設定されていません
          </Typography>
          {onEditClick && (
            <Button
              variant="contained"
              size="small"
              startIcon={<AutoFixHighRoundedIcon />}
              onClick={(e) => {
                e.stopPropagation();
                onEditClick();
              }}
            >
              設定を開く
            </Button>
          )}
        </Stack>
      </Box>
    );
  }

  return (
    <CustomQueryWidget
      seasonId={seasonId}
      query={queryStr ?? "SELECT * FROM ? LIMIT 10"}
      visualization={vis}
    />
  );
}
