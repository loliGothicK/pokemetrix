"use client";

import { useMemo } from "react";
import { alpha, Box, IconButton, Paper, Stack, Typography } from "@mui/material";
import Edit from "@mui/icons-material/Edit";
import Delete from "@mui/icons-material/Delete";
import Image from "next/image";
import { useTheme, type Theme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { match } from "ts-pattern";
import { getAppPalette } from "@/theme/palette";
import type { BattleRecord, BattleResult } from "@/store/battle-record/battleRecord";

interface BattleRecordListProps {
  /** playedAt 降順で並んだ記録 */
  readonly records: readonly BattleRecord[];
  readonly formatLabel?: string;
  readonly onEdit: (record: BattleRecord) => void;
  readonly onDelete: (id: string) => void;
}

const resultAccent = (result: BattleResult, theme: Theme): string =>
  match(result)
    .with("win", () => theme.palette.success.main)
    .with("loss", () => theme.palette.error.main)
    .with("draw", () => theme.palette.text.disabled)
    .exhaustive();

function SpriteRow({ slugs }: { readonly slugs: readonly string[] }) {
  return (
    <Stack direction="row" spacing={-0.5} sx={{ alignItems: "center" }}>
      {slugs.map((slug, i) => (
        <Box
          key={`${slug}-${i}`}
          sx={{ width: 26, height: 26, position: "relative", flexShrink: 0 }}
        >
          <Image src={`/pokemon/${slug}.png`} alt={slug} width={26} height={26} />
        </Box>
      ))}
    </Stack>
  );
}

export function BattleRecordList({
  records,
  formatLabel,
  onEdit,
  onDelete,
}: BattleRecordListProps) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const palette = getAppPalette(theme.palette.mode);

  // 直前（1つ古い）記録とのレート差分
  const deltas = useMemo(
    () =>
      records.map((record, i) => {
        const older = records[i + 1];
        if (record.rating === null || !older || older.rating === null) return null;
        return record.rating - older.rating;
      }),
    [records],
  );

  if (records.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography variant="body1" color="text.secondary">
          {t("battleRecord.empty")}
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={1}>
      {records.map((record, index) => {
        const accent = resultAccent(record.result, theme);
        const myLead = record.mySelection ?? [];
        const mySlugs = (
          myLead.length > 0 ? myLead.map((i) => record.myTeam[i]).filter(Boolean) : record.myTeam
        ).map((m) => m!.identifier);
        const broughtOpp = record.opponents.filter((o) => o.selectionRole !== null);
        const oppSlugs = (
          broughtOpp.length > 0
            ? [...broughtOpp].sort(
                (a, b) =>
                  (a.selectionRole === "lead" ? 0 : 1) - (b.selectionRole === "lead" ? 0 : 1),
              )
            : record.opponents
        ).map((o) => o.pokemonSlug);
        const delta = deltas[index];

        return (
          <Paper
            key={record.id}
            elevation={0}
            sx={{
              position: "relative",
              overflow: "hidden",
              borderRadius: 2,
              border: "1px solid",
              borderColor: palette.edge,
              bgcolor: alpha(accent, 0.06),
              pl: 2,
              pr: 1.5,
              py: 1.25,
              "&::before": {
                content: '""',
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: 4,
                bgcolor: accent,
              },
              "&:hover .row-actions": { opacity: 1 },
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.5}
              sx={{ alignItems: { md: "center" } }}
            >
              {/* 結果 + 日時/フォーマット */}
              <Box sx={{ minWidth: { md: 150 } }}>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 800, letterSpacing: "0.08em", color: accent }}
                >
                  {t(`battleRecord.result.${record.result}`).toUpperCase()}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                  {new Date(record.playedAt).toLocaleString(i18n.language, {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {formatLabel ? ` · ${formatLabel}` : ""}
                </Typography>
              </Box>

              {/* 自軍 vs 相手 */}
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: "center", flexGrow: 1, minWidth: 0, flexWrap: "wrap" }}
              >
                <SpriteRow slugs={mySlugs} />
                <Typography variant="caption" color="text.secondary" sx={{ px: 0.5 }}>
                  {t("battleRecord.vs")}
                </Typography>
                {oppSlugs.length > 0 ? (
                  <SpriteRow slugs={oppSlugs} />
                ) : (
                  <Typography variant="caption" color="text.disabled">
                    {t("battleRecord.form.noOpponents")}
                  </Typography>
                )}
              </Stack>

              {/* レート変動 / 記録レート */}
              <Box sx={{ textAlign: { md: "right" }, minWidth: { md: 90 } }}>
                {delta !== null ? (
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 800,
                      color:
                        delta > 0
                          ? theme.palette.success.main
                          : delta < 0
                            ? theme.palette.error.main
                            : "text.secondary",
                    }}
                  >
                    {delta > 0 ? `+${delta}` : delta}
                  </Typography>
                ) : record.rating !== null ? (
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {record.rating}
                  </Typography>
                ) : null}
                {record.notes && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    noWrap
                    sx={{ display: "block", maxWidth: { md: 220 } }}
                  >
                    {record.notes}
                  </Typography>
                )}
              </Box>

              {/* アクション */}
              <Stack
                direction="row"
                className="row-actions"
                sx={{ opacity: { xs: 1, md: 0 }, transition: "opacity 0.15s" }}
              >
                <IconButton
                  size="small"
                  onClick={() => onEdit(record)}
                  aria-label={t("common.edit")}
                >
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => onDelete(record.id)}
                  aria-label={t("common.delete")}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );
}
