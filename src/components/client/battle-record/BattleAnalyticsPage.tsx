"use client";

import { useEffect, useMemo, useState } from "react";
import {
  alpha,
  Avatar,
  Box,
  Button,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import SportsMmaRounded from "@mui/icons-material/SportsMmaRounded";
import Link from "next/link";
import { useAtomValue } from "jotai";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { isAuthenticatedAtom } from "@/store/auth";
import { getAppPalette } from "@/theme/palette";
import { useSeasons } from "@/hooks/useSeasons";
import { useBattleRecords } from "@/hooks/useBattleRecords";
import {
  opponentStats,
  tally,
  tallyByOrder,
  winRatePercent,
  type RecordTally,
} from "@/store/battle-record/analytics";

function StatCard({
  label,
  value,
  caption,
  accent,
}: {
  readonly label: string;
  readonly value: string;
  readonly caption?: string;
  readonly accent?: string;
}) {
  const theme = useTheme();
  const palette = getAppPalette(theme.palette.mode);
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        height: "100%",
        border: "1px solid",
        borderColor: palette.edge,
        borderRadius: 3,
        bgcolor: palette.surfaceRaised,
      }}
    >
      <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 800, color: accent ?? "text.primary", mt: 0.5 }}>
        {value}
      </Typography>
      {caption && (
        <Typography variant="caption" color="text.secondary">
          {caption}
        </Typography>
      )}
    </Paper>
  );
}

function WinRateBar({ label, tally: t }: { readonly label: string; readonly tally: RecordTally }) {
  const { t: translate } = useTranslation();
  const percent = winRatePercent(t);
  return (
    <Box sx={{ mb: 2 }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", mb: 0.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {label}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {percent === null
            ? "—"
            : `${percent}% (${translate("battleRecord.analytics.wldShort", {
                w: t.wins,
                l: t.losses,
                d: t.draws,
              })})`}
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={percent ?? 0}
        sx={{ height: 8, borderRadius: 4 }}
      />
    </Box>
  );
}

export default function BattleAnalyticsPage() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const palette = getAppPalette(theme.palette.mode);
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const { seasons, isLoading: seasonsLoading } = useSeasons();

  const [activeSeasonId, setActiveSeasonId] = useState<string | null>(null);
  const activeSeason = useMemo(
    () => seasons.find((s) => s.id === activeSeasonId) ?? null,
    [seasons, activeSeasonId],
  );

  useEffect(() => {
    if (activeSeasonId === null && seasons.length > 0) {
      setActiveSeasonId(seasons[0].id);
    }
  }, [seasons, activeSeasonId]);

  const { records, isLoading: recordsLoading } = useBattleRecords({ seasonId: activeSeasonId });

  const overall = useMemo(() => tally(records), [records]);
  const byOrder = useMemo(() => tallyByOrder(records), [records]);
  const opponents = useMemo(() => opponentStats(records), [records]);
  const overallPercent = winRatePercent(overall);

  if (!isAuthenticated) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">
          {t("auth.loginRequired")}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{ alignItems: { md: "center" }, mb: 3 }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700, flexGrow: 1 }}>
          {t("battleRecord.analytics.title")}
        </Typography>
        <Button
          component={Link}
          href="/battle-record"
          startIcon={<SportsMmaRounded />}
          variant="outlined"
        >
          {t("battleRecord.analytics.backToRecords")}
        </Button>
      </Stack>

      <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 260 }, mb: 3 }}>
        <InputLabel id="analytics-season-label">{t("battleRecord.season.label")}</InputLabel>
        <Select
          labelId="analytics-season-label"
          label={t("battleRecord.season.label")}
          value={activeSeason?.id ?? ""}
          onChange={(e) => setActiveSeasonId(e.target.value || null)}
          displayEmpty
        >
          {seasons.length === 0 && (
            <MenuItem value="" disabled>
              {t("battleRecord.season.none")}
            </MenuItem>
          )}
          {seasons.map((season) => (
            <MenuItem key={season.id} value={season.id}>
              {season.name} · {t(`battleRecord.format.${season.format}`)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {seasonsLoading || recordsLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : records.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography variant="body1" color="text.secondary">
            {t("battleRecord.analytics.empty")}
          </Typography>
        </Box>
      ) : (
        <Stack spacing={3}>
          {/* サマリーカード */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, md: 3 }}>
              <StatCard
                label={t("battleRecord.analytics.winRate")}
                value={overallPercent === null ? "—" : `${overallPercent}%`}
                accent={theme.palette.primary.main}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <StatCard label={t("battleRecord.analytics.total")} value={String(overall.total)} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <StatCard
                label={t("battleRecord.result.win")}
                value={String(overall.wins)}
                accent={theme.palette.success.main}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <StatCard
                label={t("battleRecord.result.loss")}
                value={String(overall.losses)}
                accent={theme.palette.error.main}
              />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            {/* 先後別勝率 */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  height: "100%",
                  border: "1px solid",
                  borderColor: palette.edge,
                  borderRadius: 3,
                  bgcolor: palette.surface,
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                  {t("battleRecord.analytics.byOrder")}
                </Typography>
                <WinRateBar label={t("battleRecord.order.first")} tally={byOrder.first} />
                <WinRateBar label={t("battleRecord.order.second")} tally={byOrder.second} />
                {byOrder.unknown.total > 0 && (
                  <WinRateBar label={t("battleRecord.order.unknown")} tally={byOrder.unknown} />
                )}
              </Paper>
            </Grid>

            {/* 対面ポケモン別成績 */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  height: "100%",
                  border: "1px solid",
                  borderColor: palette.edge,
                  borderRadius: 3,
                  bgcolor: palette.surface,
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                  {t("battleRecord.analytics.topOpponents")}
                </Typography>
                <Stack spacing={1.25}>
                  {opponents.slice(0, 12).map((opponent) => {
                    const percent = winRatePercent(opponent);
                    return (
                      <Stack
                        key={opponent.pokemonSlug}
                        direction="row"
                        spacing={1.5}
                        sx={{ alignItems: "center" }}
                      >
                        <Avatar
                          src={`/pokemon/${opponent.pokemonSlug}.png`}
                          alt={opponent.pokemonSlug}
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                          }}
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
                            sx={{ height: 6, borderRadius: 3, mt: 0.25 }}
                          />
                        </Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ whiteSpace: "nowrap" }}
                        >
                          {percent === null ? "—" : `${percent}%`}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ whiteSpace: "nowrap", minWidth: 64, textAlign: "right" }}
                        >
                          {t("battleRecord.analytics.wldShort", {
                            w: opponent.wins,
                            l: opponent.losses,
                            d: opponent.draws,
                          })}
                        </Typography>
                      </Stack>
                    );
                  })}
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Stack>
      )}
    </Box>
  );
}
