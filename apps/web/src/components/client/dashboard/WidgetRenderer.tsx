"use client";

import { useMemo } from "react";
import {
  alpha,
  Avatar,
  Box,
  CircularProgress,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useBattleRecords } from "@/hooks/useBattleRecords";
import { flexRowCenter } from "@/theme/sx";
import {
  opponentStats,
  ratingTrend,
  tally,
  tallyByOrder,
  winRatePercent,
  winRateTrend,
} from "@/store/battle-record/analytics";
import type { DashboardWidget } from "@/store/dashboard/dashboard";

/** ウィジェット内の勝率バー（BattleAnalyticsPage の WinRateBar 相当の簡易版） */
function InlineWinRateBar({
  label,
  wins,
  losses,
  draws,
}: {
  readonly label: string;
  readonly wins: number;
  readonly losses: number;
  readonly draws: number;
}) {
  const { t } = useTranslation();
  const total = wins + losses + draws;
  const percent = total === 0 ? null : Math.round((wins / total) * 100);
  return (
    <Box sx={{ mb: 1.5 }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", mb: 0.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {label}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {percent === null
            ? "—"
            : `${percent}% (${t("battleRecord.analytics.wldShort", { w: wins, l: losses, d: draws })})`}
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={percent ?? 0}
        sx={{ height: 6, borderRadius: 3 }}
      />
    </Box>
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

function WinRateSummaryWidget({ seasonId }: { readonly seasonId: string | null }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { records, isLoading } = useBattleRecords({ seasonId });
  const overall = useMemo(() => tally(records), [records]);
  const percent = winRatePercent(overall);

  if (isLoading) return <WidgetLoading />;
  if (overall.total === 0) return <WidgetEmpty message={t("battleRecord.analytics.empty")} />;

  return (
    <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
      <Box>
        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
          {t("battleRecord.analytics.winRate")}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.primary.main }}>
          {percent === null ? "—" : `${percent}%`}
        </Typography>
      </Box>
      <Box>
        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
          {t("battleRecord.analytics.total")}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          {overall.total}
        </Typography>
      </Box>
      <Box>
        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
          {t("battleRecord.result.win")}/{t("battleRecord.result.loss")}/
          {t("battleRecord.result.draw")}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {overall.wins}/{overall.losses}/{overall.draws}
        </Typography>
      </Box>
    </Stack>
  );
}

function OrderSplitWidget({ seasonId }: { readonly seasonId: string | null }) {
  const { t } = useTranslation();
  const { records, isLoading } = useBattleRecords({ seasonId });
  const byOrder = useMemo(() => tallyByOrder(records), [records]);

  if (isLoading) return <WidgetLoading />;
  if (records.length === 0) return <WidgetEmpty message={t("battleRecord.analytics.empty")} />;

  return (
    <Box>
      <InlineWinRateBar
        label={t("battleRecord.order.first")}
        wins={byOrder.first.wins}
        losses={byOrder.first.losses}
        draws={byOrder.first.draws}
      />
      <InlineWinRateBar
        label={t("battleRecord.order.second")}
        wins={byOrder.second.wins}
        losses={byOrder.second.losses}
        draws={byOrder.second.draws}
      />
      {byOrder.unknown.total > 0 && (
        <InlineWinRateBar
          label={t("battleRecord.order.unknown")}
          wins={byOrder.unknown.wins}
          losses={byOrder.unknown.losses}
          draws={byOrder.unknown.draws}
        />
      )}
    </Box>
  );
}

function TopOpponentsWidget({
  seasonId,
  limit,
}: {
  readonly seasonId: string | null;
  readonly limit: number;
}) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { records, isLoading } = useBattleRecords({ seasonId });
  const opponents = useMemo(() => opponentStats(records), [records]);

  if (isLoading) return <WidgetLoading />;
  if (opponents.length === 0) return <WidgetEmpty message={t("battleRecord.analytics.empty")} />;

  return (
    <Stack spacing={1.25}>
      {opponents.slice(0, limit).map((opponent) => {
        const percent = winRatePercent(opponent);
        return (
          <Stack key={opponent.pokemonSlug} direction="row" spacing={1.5} sx={flexRowCenter}>
            <Avatar
              src={`/pokemon/${opponent.pokemonSlug}.png`}
              alt={opponent.pokemonSlug}
              sx={{ width: 28, height: 28, bgcolor: alpha(theme.palette.primary.main, 0.08) }}
            />
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                {i18n.exists(`pokemon.${opponent.pokemonSlug}.name`)
                  ? t(`pokemon.${opponent.pokemonSlug}.name`)
                  : opponent.pokemonSlug}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={percent ?? 0}
                sx={{ height: 5, borderRadius: 2.5, mt: 0.25 }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
              {percent === null ? "—" : `${percent}%`}
            </Typography>
          </Stack>
        );
      })}
    </Stack>
  );
}

function RecentRecordsWidget({ seasonId }: { readonly seasonId: string | null }) {
  const { t } = useTranslation();
  const { records, isLoading } = useBattleRecords({ seasonId });
  const theme = useTheme();

  const recent = useMemo(
    () =>
      records
        .slice()
        .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime())
        .slice(0, 8),
    [records],
  );

  if (isLoading) return <WidgetLoading />;
  if (recent.length === 0) return <WidgetEmpty message={t("battleRecord.empty")} />;

  const resultColor = (result: string) =>
    result === "win"
      ? theme.palette.success.main
      : result === "loss"
        ? theme.palette.error.main
        : theme.palette.text.secondary;

  return (
    <Stack spacing={1}>
      {recent.map((record) => (
        <Stack
          key={record.id}
          direction="row"
          spacing={1.5}
          sx={{
            ...flexRowCenter,
            borderLeft: "3px solid",
            borderColor: resultColor(record.result),
            pl: 1,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 700, color: resultColor(record.result) }}>
            {t(`battleRecord.result.${record.result}`)}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1 }}>
            {new Date(record.playedAt).toLocaleDateString()}
          </Typography>
          {record.rating !== null && (
            <Typography variant="caption" color="text.secondary">
              {record.rating}
            </Typography>
          )}
        </Stack>
      ))}
    </Stack>
  );
}

function WinRateTrendWidget({ seasonId }: { readonly seasonId: string | null }) {
  const { t } = useTranslation();
  const { records, isLoading } = useBattleRecords({ seasonId });
  const points = useMemo(() => winRateTrend(records), [records]);

  if (isLoading) return <WidgetLoading />;
  if (points.length === 0) return <WidgetEmpty message={t("battleRecord.analytics.empty")} />;

  const last = points[points.length - 1];

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
        {last.cumulativeWinRate === null ? "—" : `${last.cumulativeWinRate}%`}
      </Typography>
      <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap" }}>
        {points.slice(-30).map((point) => (
          <Box
            key={point.recordId}
            title={`#${point.gameNumber}: ${point.cumulativeWinRate ?? "—"}%`}
            sx={{
              width: 8,
              height: 24,
              borderRadius: 1,
              bgcolor:
                point.result === "win"
                  ? "success.main"
                  : point.result === "loss"
                    ? "error.main"
                    : "grey.500",
            }}
          />
        ))}
      </Stack>
    </Box>
  );
}

function RatingTrendWidget({ seasonId }: { readonly seasonId: string | null }) {
  const { t } = useTranslation();
  const { records, isLoading } = useBattleRecords({ seasonId });
  const points = useMemo(() => ratingTrend(records), [records]);

  if (isLoading) return <WidgetLoading />;
  if (points.length === 0) return <WidgetEmpty message={t("battleRecord.analytics.empty")} />;

  const latest = points[points.length - 1];
  const min = Math.min(...points.map((p) => p.rating));
  const max = Math.max(...points.map((p) => p.rating));
  const range = Math.max(max - min, 1);

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
        {latest.rating}
      </Typography>
      <Stack direction="row" spacing={0.5} sx={{ alignItems: "flex-end", height: 48 }}>
        {points.slice(-30).map((point) => (
          <Box
            key={point.recordId}
            title={`#${point.gameNumber}: ${point.rating}`}
            sx={{
              width: 6,
              height: `${Math.max(((point.rating - min) / range) * 100, 6)}%`,
              borderRadius: 1,
              bgcolor: "primary.main",
            }}
          />
        ))}
      </Stack>
    </Box>
  );
}

function NoteWidget({
  widget,
  editing,
  onOptionsChange,
}: {
  readonly widget: DashboardWidget;
  readonly editing: boolean;
  readonly onOptionsChange?: (options: Record<string, unknown>) => void;
}) {
  const { t } = useTranslation();
  const body = typeof widget.options?.body === "string" ? widget.options.body : "";

  if (editing) {
    return (
      <TextField
        multiline
        minRows={3}
        fullWidth
        placeholder={t("dashboard.widget.note.placeholder")}
        value={body}
        onChange={(e) => onOptionsChange?.({ ...widget.options, body: e.target.value })}
      />
    );
  }

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

/**
 * ウィジェットの種別に応じて表示内容を切り替えるレンダラ。
 * データは既存の battle-record 集計ロジックを再利用する。
 */
export function WidgetRenderer({
  widget,
  editing,
  onOptionsChange,
}: {
  readonly widget: DashboardWidget;
  readonly editing?: boolean;
  readonly onOptionsChange?: (options: Record<string, unknown>) => void;
}) {
  switch (widget.type) {
    case "winRateSummary":
      return <WinRateSummaryWidget seasonId={widget.seasonId} />;
    case "winRateTrend":
      return <WinRateTrendWidget seasonId={widget.seasonId} />;
    case "orderSplit":
      return <OrderSplitWidget seasonId={widget.seasonId} />;
    case "topOpponents":
      return (
        <TopOpponentsWidget
          seasonId={widget.seasonId}
          limit={typeof widget.options?.limit === "number" ? widget.options.limit : 12}
        />
      );
    case "recentRecords":
      return <RecentRecordsWidget seasonId={widget.seasonId} />;
    case "ratingTrend":
      return <RatingTrendWidget seasonId={widget.seasonId} />;
    case "note":
      return (
        <NoteWidget widget={widget} editing={editing ?? false} onOptionsChange={onOptionsChange} />
      );
    default:
      return null;
  }
}
