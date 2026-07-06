"use client";

import { alpha, Box, Stack, Typography } from "@mui/material";
import Image from "next/image";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { getAppPalette } from "@/theme/palette";
import type { TrainedPokemon } from "@/store/team/team";
import type { BattleFormat } from "@/store/battle-record/battleRecord";
import {
  broughtCount,
  cycleMember,
  memberState,
  selectionLimits,
  type MemberSelectionState,
  type Selection,
} from "./selection";

interface YourTeamSelectorProps {
  readonly myTeam: readonly TrainedPokemon[];
  readonly selection: Selection;
  readonly onChange: (selection: Selection) => void;
  readonly format: BattleFormat;
}

/** 選出状態の表示色（自チーム・相手で共通） */
export const LEAD_COLOR = "#f5b400";
export const BROUGHT_COLOR = "#3b82f6";

const stateColor = (state: MemberSelectionState): string | null =>
  state === "lead" ? LEAD_COLOR : state === "back" ? BROUGHT_COLOR : null;

/**
 * 自チームメンバーの選出UI。カードをタップして
 * 未選出 → 選出（後発, 青）→ 先発（黄）→ 未選出 を切り替える。
 */
export function YourTeamSelector({ myTeam, selection, onChange, format }: YourTeamSelectorProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const palette = getAppPalette(theme.palette.mode);
  const limits = selectionLimits(format);

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 1, flexWrap: "wrap" }}>
        <Typography variant="overline" sx={{ fontWeight: 700, letterSpacing: "0.08em" }}>
          {t("battleRecord.form.myTeam")}
        </Typography>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Legend color={LEAD_COLOR} label={t("battleRecord.selection.lead")} />
          <Legend color={BROUGHT_COLOR} label={t("battleRecord.selection.brought")} />
        </Stack>
        <Box sx={{ flexGrow: 1 }} />
        <Typography variant="caption" color="text.secondary">
          {broughtCount(selection)}/{limits.maxBrought} · {selection.leads.length}/
          {limits.leadCount} {t("battleRecord.selection.leadShort")}
        </Typography>
      </Stack>

      {myTeam.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
          {t("battleRecord.form.noMembers")}
        </Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(3, 1fr)", sm: "repeat(6, 1fr)" },
            gap: 1,
          }}
        >
          {myTeam.map((member, index) => {
            const state = memberState(selection, index);
            const color = stateColor(state);
            return (
              <Box
                key={member.boxId}
                onClick={() => onChange(cycleMember(selection, index, format))}
                role="button"
                aria-label={t(`pokemon.${member.identifier}.name`)}
                aria-pressed={state !== "unused"}
                sx={{
                  position: "relative",
                  border: "2px solid",
                  borderColor: color ?? palette.edge,
                  borderRadius: 2,
                  bgcolor: color ? alpha(color, 0.12) : palette.surface,
                  p: 0.5,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  cursor: "pointer",
                  transition: "border-color 0.15s, background-color 0.15s",
                  opacity: state === "unused" ? 0.7 : 1,
                }}
              >
                <Image
                  src={`/pokemon/${member.identifier}.png`}
                  alt={member.identifier}
                  width={44}
                  height={44}
                />
                <Typography variant="caption" noWrap sx={{ maxWidth: "100%", fontWeight: 600 }}>
                  {t(`pokemon.${member.identifier}.name`)}
                </Typography>
                {color && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      bgcolor: color,
                      border: "2px solid",
                      borderColor: palette.surface,
                    }}
                  />
                )}
              </Box>
            );
          })}
        </Box>
      )}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
        {t("battleRecord.selection.hint")}
      </Typography>
    </Box>
  );
}

export function Legend({ color, label }: { readonly color: string; readonly label: string }) {
  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
      <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: color }} />
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Stack>
  );
}
