"use client";

import { useState, useMemo, Fragment } from "react";
import {
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  Chip,
  Stack,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import type { HeatmapData, HeatmapMatrix, HeatmapCell } from "./transformers";

// ─────────────────────────────────────────────────────────────────────────────
// 信頼度バッジ
// ─────────────────────────────────────────────────────────────────────────────

type ConfidenceLevel = "high" | "mid" | "low" | "none";

function getConfidence(total: number): ConfidenceLevel {
  if (total === 0) return "none";
  if (total >= 10) return "high";
  if (total >= 3) return "mid";
  return "low";
}

const CONFIDENCE_COLOR: Record<ConfidenceLevel, "primary" | "warning" | "error" | "default"> = {
  high: "primary",
  mid: "warning",
  low: "error",
  none: "default",
};

// ─────────────────────────────────────────────────────────────────────────────
// 勝率カラー計算
// ─────────────────────────────────────────────────────────────────────────────

function winRateColor(cell: HeatmapCell, isDarkMode: boolean): string {
  if (cell.total === 0) {
    return isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
  }
  const rate = cell.wins / cell.total;
  const dist = rate - 0.5;

  if (dist > 0) {
    const sat = Math.round(dist * 2 * 60);
    const light = isDarkMode ? 28 : 34;
    return `hsl(130, ${sat}%, ${light}%)`;
  } else if (dist < 0) {
    const sat = Math.round(Math.abs(dist) * 2 * 70);
    const light = isDarkMode ? 30 : 38;
    return `hsl(0, ${sat}%, ${light}%)`;
  }
  return isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";
}

// ─────────────────────────────────────────────────────────────────────────────
// セルコンポーネント
// ─────────────────────────────────────────────────────────────────────────────

function HeatCell({
  cell,
  isDarkMode,
}: {
  readonly cell: HeatmapCell;
  readonly isDarkMode: boolean;
}) {
  const { t } = useTranslation();
  if (cell.total === 0) {
    return (
      <Box
        sx={{
          bgcolor: isDarkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
          borderRadius: 0.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "text.disabled",
          fontSize: "0.7rem",
          minHeight: 44,
        }}
      >
        —
      </Box>
    );
  }

  const rate = cell.wins / cell.total;
  const confidence = getConfidence(cell.total);
  const pct = Math.round(rate * 100);
  const losses = cell.total - cell.wins;
  const tooltipText = `${cell.wins}W - ${losses}L (n=${cell.total})`;

  return (
    <Tooltip title={tooltipText} placement="top" arrow>
      <Box
        sx={{
          bgcolor: winRateColor(cell, isDarkMode),
          borderRadius: 0.5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 0.25,
          minHeight: 44,
          cursor: "default",
          transition: "opacity 0.15s",
          "&:hover": { opacity: 0.85 },
        }}
      >
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: "0.8rem",
            color: "#fff",
            lineHeight: 1,
          }}
        >
          {pct}%
        </Typography>
        <Typography
          sx={{
            fontSize: "0.6rem",
            color: "rgba(255,255,255,0.75)",
            lineHeight: 1,
          }}
        >
          {confidence === "low"
            ? t("dashboard.heatmap.confidence.low", "Low")
            : `n=${cell.total}`}
        </Typography>
      </Box>
    </Tooltip>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// マトリクス本体
// ─────────────────────────────────────────────────────────────────────────────

function HeatmapGrid({
  matrix,
  isDarkMode,
}: {
  readonly matrix: HeatmapMatrix;
  readonly isDarkMode: boolean;
}) {
  const { t } = useTranslation();

  if (matrix.myLeads.length === 0 || matrix.rows.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
        {t("dashboard.heatmap.noData", "データが足りません")}
      </Typography>
    );
  }

  const colCount = matrix.myLeads.length;

  return (
    <Box sx={{ width: "100%", overflowX: "auto", overflowY: "auto", maxHeight: "calc(100% - 64px)" }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `minmax(100px, 1.5fr) repeat(${colCount}, minmax(72px, 1fr))`,
          gap: 0.5,
          minWidth: colCount * 80 + 110,
        }}
      >
        {/* 左上の説明ラベル */}
        <Box sx={{ display: "flex", alignItems: "flex-end", pb: 0.5, pr: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: "0.65rem" }}>
            {t("dashboard.heatmap.oppLead", "相手 ↓")} / {t("dashboard.heatmap.myLead", "自分 →")}
          </Typography>
        </Box>

        {/* 列ヘッダー: 自分の先発 */}
        {matrix.myLeads.map((myLead) => (
          <Tooltip key={myLead} title={myLead} placement="top" arrow>
            <Box
              sx={{
                bgcolor: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                borderRadius: 0.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                px: 0.5,
                py: 0.75,
              }}
            >
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: "0.68rem",
                  textAlign: "center",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "100%",
                }}
              >
                {myLead}
              </Typography>
            </Box>
          </Tooltip>
        ))}

        {/* データ行 */}
        {matrix.rows.map((row) => {
          const confidence = getConfidence(row.totalSamples);
          return (
            <Fragment key={row.oppLead}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 0.5, pr: 0.5, minWidth: 0 }}
              >
                <Tooltip title={row.oppLead} placement="right" arrow>
                  <Typography
                    sx={{
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    {row.oppLead}
                  </Typography>
                </Tooltip>
                <Chip
                  label={row.totalSamples}
                  size="small"
                  color={CONFIDENCE_COLOR[confidence]}
                  sx={{ height: 16, fontSize: "0.6rem", flexShrink: 0, "& .MuiChip-label": { px: 0.5 } }}
                />
              </Box>

              {matrix.myLeads.map((myLead) => (
                <HeatCell
                  key={`${row.oppLead}-${myLead}`}
                  cell={row.cells[myLead] ?? { wins: 0, total: 0 }}
                  isDarkMode={isDarkMode}
                />
              ))}
            </Fragment>
          );
        })}
      </Box>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// メインコンポーネント
// ─────────────────────────────────────────────────────────────────────────────

export function HeatmapVisualizer({
  data,
}: {
  readonly data: readonly Record<string, unknown>[];
}) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"singles" | "doubles">("doubles");

  const heatmapData = useMemo<HeatmapData | null>(() => {
    const d = data[0];
    if (!d || (d as any)._type !== "heatmap") return null;
    return d as unknown as HeatmapData;
  }, [data]);

  if (!heatmapData) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 3 }}>
        {t("dashboard.visualize.noData", "No data")}
      </Typography>
    );
  }

  const singlesHasData = heatmapData.singles.rows.length > 0;
  const doublesHasData = heatmapData.doubles.rows.length > 0;

  const effectiveMode: "singles" | "doubles" = (() => {
    if (mode === "doubles" && !doublesHasData && singlesHasData) return "singles";
    if (mode === "singles" && !singlesHasData && doublesHasData) return "doubles";
    return mode;
  })();

  const matrix = effectiveMode === "singles" ? heatmapData.singles : heatmapData.doubles;

  const isDarkMode =
    typeof window !== "undefined" &&
    document.documentElement.getAttribute("data-mui-color-scheme") === "dark";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", gap: 1 }}>
      {/* コントロールバー */}
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexShrink: 0 }}>
        <ToggleButtonGroup
          value={effectiveMode}
          exclusive
          onChange={(_, v) => { if (v) setMode(v); }}
          size="small"
          sx={{ "& .MuiToggleButton-root": { px: 1.5, py: 0.25, fontSize: "0.72rem" } }}
        >
          <ToggleButton value="singles" disabled={!singlesHasData}>
            {t("dashboard.heatmap.singles", "Singles")}
          </ToggleButton>
          <ToggleButton value="doubles" disabled={!doublesHasData}>
            {t("dashboard.heatmap.doubles", "Doubles")}
          </ToggleButton>
        </ToggleButtonGroup>

        {/* 凡例 */}
        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", ml: "auto" }}>
          <Box sx={{ width: 28, height: 10, borderRadius: 0.25, bgcolor: "hsl(0, 70%, 38%)" }} />
          <Typography variant="caption" color="text.secondary">
            {t("dashboard.heatmap.legendLow", "負け")}
          </Typography>
          <Box sx={{ width: 28, height: 10, borderRadius: 0.25, bgcolor: "rgba(128,128,128,0.3)" }} />
          <Typography variant="caption" color="text.secondary">50%</Typography>
          <Box sx={{ width: 28, height: 10, borderRadius: 0.25, bgcolor: "hsl(130, 60%, 34%)" }} />
          <Typography variant="caption" color="text.secondary">
            {t("dashboard.heatmap.legendHigh", "勝ち")}
          </Typography>
        </Stack>
      </Stack>

      {/* マトリクス */}
      <HeatmapGrid matrix={matrix} isDarkMode={isDarkMode} />
    </Box>
  );
}
