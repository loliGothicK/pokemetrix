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
import { resolveMyTeamDisplay, resolveOpponentDisplay } from "./battleRecordList.logic";

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

function SpriteRow({
  slugs,
  selectedIndices,
}: {
  readonly slugs: readonly string[];
  /** 選出されているインデックスのセット。null の場合は全て選出扱い */
  readonly selectedIndices: ReadonlySet<number> | null;
}) {
  return (
    <Stack direction="row" spacing={-0.5} sx={{ alignItems: "center" }}>
      {slugs.map((slug, i) => {
        const isSelected = selectedIndices === null || selectedIndices.has(i);
        return (
          <Box
            key={`${slug}-${i}`}
            sx={{
              width: 26,
              height: 26,
              position: "relative",
              flexShrink: 0,
              opacity: isSelected ? 1 : 0.35,
              filter: isSelected ? "none" : "grayscale(1)",
              transition: "opacity 0.15s, filter 0.15s",
            }}
          >
            <Image src={`/pokemon/${slug}.png`} alt={slug} width={26} height={26} />
          </Box>
        );
      })}
    </Stack>
  );
}

export function BattleRecordList({ records, onEdit, onDelete }: BattleRecordListProps) {
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

        const { slugs: myAllSlugs, selectedIndices: mySelectedSet } = resolveMyTeamDisplay(record);
        const { slugs: oppAllSlugs, selectedIndices: oppSelectedSet } =
          resolveOpponentDisplay(record);

        const delta = deltas[index];

        return (
          <Paper
            key={record.id}
            elevation={0}
            sx={{
              position: "relative",
              overflow: "hidden",
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
              direction="row"
              spacing={1}
              sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 0.5 }}
            >
              {/* 結果 */}
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  color: accent,
                  minWidth: 36,
                }}
              >
                {t(`battleRecord.result.${record.result}`).toUpperCase()}
              </Typography>

              {/* 自軍 vs 相手 */}
              <Stack
                direction="row"
                spacing={0.5}
                sx={{ alignItems: "center", flexGrow: 1, minWidth: 0 }}
              >
                <SpriteRow slugs={myAllSlugs} selectedIndices={mySelectedSet} />
                <Typography variant="caption" color="text.secondary" sx={{ px: 0.25 }}>
                  {t("battleRecord.vs")}
                </Typography>
                {oppAllSlugs.length > 0 ? (
                  <SpriteRow slugs={oppAllSlugs} selectedIndices={oppSelectedSet} />
                ) : (
                  <Typography variant="caption" color="text.disabled">
                    {t("battleRecord.form.noOpponents")}
                  </Typography>
                )}
              </Stack>

              {/* レート変動 / 記録レート */}
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
                    minWidth: 40,
                    textAlign: "right",
                  }}
                >
                  {delta > 0 ? `+${delta}` : delta}
                </Typography>
              ) : record.rating !== null ? (
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 700, minWidth: 40, textAlign: "right" }}
                >
                  {record.rating}
                </Typography>
              ) : null}

              {/* アクション */}
              <Stack
                direction="row"
                className="row-actions"
                sx={{ opacity: { xs: 1, md: 0 }, transition: "opacity 0.15s", ml: "auto" }}
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

            {/* 日時 + メモ（2行目） */}
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mt: 0.25 }}>
              <Typography variant="caption" color="text.secondary">
                {new Date(record.playedAt).toLocaleString(i18n.language, {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
              </Typography>
              {record.notes && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  noWrap
                  sx={{ maxWidth: { xs: 160, md: 320 } }}
                >
                  {record.notes}
                </Typography>
              )}
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );
}
