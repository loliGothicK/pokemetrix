"use client";

import { useState } from "react";
import { alpha, Box, IconButton, Stack, Typography } from "@mui/material";
import Add from "@mui/icons-material/Add";
import Close from "@mui/icons-material/Close";
import EditNote from "@mui/icons-material/EditNote";
import Image from "next/image";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { SelectPokemonDialog } from "@/components/client/team-builder/SelectPokemonDialog";
import type { BattleFormat, OpponentSelectionRole } from "@/store/battle-record/battleRecord";
import { flexRowCenter, sectionLabel } from "@/theme/sx";
import type { OpponentDraft } from "./formState";
import { nextOpponentKey } from "./formState";
import { cycleOpponentRole, selectionLimits } from "./selection";
import { OpponentDetailDialog } from "./OpponentDetailDialog";
import { BACK_COLOR, LEAD_COLOR, Legend } from "./YourTeamSelector";

const MAX_OPPONENTS = 6;

interface OpponentSlotsProps {
  readonly opponents: readonly OpponentDraft[];
  readonly onChange: (opponents: readonly OpponentDraft[]) => void;
  readonly format: BattleFormat;
}

const roleColor = (role: OpponentSelectionRole | null): string | null =>
  role === "lead" ? LEAD_COLOR : role === "back" ? BACK_COLOR : null;

/**
 * 相手6枠。空きスロットは + で種族検索して追加。
 * 追加後はカードのタップで 選出外 → 後発 → 先発 を循環（自チームと同じ操作感）。
 * 鉛筆アイコンで持ち物・技などの詳細をあとから追記できる。
 */
export function OpponentSlots({ opponents, onChange, format }: OpponentSlotsProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [selectOpen, setSelectOpen] = useState(false);
  const [detailIndex, setDetailIndex] = useState<number | null>(null);
  const limits = selectionLimits(format);

  const backCount = opponents.filter((o) => o.selectionRole !== null).length;
  const leadCount = opponents.filter((o) => o.selectionRole === "lead").length;

  const addSpecies = (identifier: string | null) => {
    if (!identifier || opponents.length >= MAX_OPPONENTS) return;
    onChange([
      ...opponents,
      {
        key: nextOpponentKey(),
        pokemonSlug: identifier,
        itemSlug: null,
        abilitySlug: null,
        moves: [],
        selectionRole: null,
        notes: "",
      },
    ]);
    setSelectOpen(false);
  };

  const removeAt = (index: number) => {
    onChange(opponents.filter((_, i) => i !== index));
  };

  const cycleAt = (index: number) => {
    const current = opponents[index];
    // この個体を除いた選出数
    const others = opponents.filter((_, i) => i !== index);
    const counts = {
      back: others.filter((o) => o.selectionRole !== null).length,
      leads: others.filter((o) => o.selectionRole === "lead").length,
    };
    const nextRole = cycleOpponentRole(current.selectionRole, counts, format);
    onChange(opponents.map((o, i) => (i === index ? { ...o, selectionRole: nextRole } : o)));
  };

  const slots = Array.from({ length: MAX_OPPONENTS }, (_, i) => opponents[i] ?? null);

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ ...flexRowCenter, mb: 1, flexWrap: "wrap" }}>
        <Typography variant="overline" sx={{ ...sectionLabel, fontWeight: 700 }}>
          {t("battleRecord.form.opponents")}
        </Typography>
        <Stack direction="row" spacing={1.5} sx={flexRowCenter}>
          <Legend color={LEAD_COLOR} label={t("battleRecord.selection.lead")} />
          <Legend color={BACK_COLOR} label={t("battleRecord.selection.back")} />
        </Stack>
        <Box sx={{ flexGrow: 1 }} />
        <Typography variant="caption" color="text.secondary">
          {backCount}/{limits.maxBack} · {leadCount}/{limits.leadCount}{" "}
          {t("battleRecord.selection.leadShort")}
        </Typography>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "repeat(3, 1fr)", sm: "repeat(6, 1fr)" },
          gap: 1,
        }}
      >
        {slots.map((opponent, index) => {
          if (!opponent) {
            return (
              <Box
                key={`empty-${index}`}
                onClick={() => opponents.length < MAX_OPPONENTS && setSelectOpen(true)}
                role="button"
                aria-label={t("battleRecord.form.addOpponent")}
                sx={{
                  aspectRatio: "1 / 1",
                  border: "1px dashed",
                  borderColor: "divider",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: opponents.length < MAX_OPPONENTS ? "pointer" : "default",
                  color: "text.disabled",
                  "&:hover": {
                    borderColor: opponents.length < MAX_OPPONENTS ? "primary.main" : "divider",
                  },
                  borderRadius: 2,
                }}
              >
                <Add fontSize="small" />
              </Box>
            );
          }

          const color = roleColor(opponent.selectionRole);
          const hasDetail = Boolean(opponent.itemSlug) || opponent.moves.length > 0;

          return (
            <Box
              key={opponent.key}
              onClick={() => cycleAt(index)}
              role="button"
              aria-label={t(`pokemon.${opponent.pokemonSlug}.name`)}
              aria-pressed={opponent.selectionRole !== null}
              sx={{
                position: "relative",
                aspectRatio: "1 / 1",
                border: "2px solid",
                borderColor: color ?? "divider",
                bgcolor: color ? alpha(color, 0.12) : "background.paper",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                opacity: opponent.selectionRole === null ? 0.75 : 1,
                transition: "border-color 0.15s, background-color 0.15s",
                "&:hover .slot-action": { opacity: 1 },
                overflow: "hidden",
                borderRadius: 2,
              }}
            >
              <Image
                src={`/pokemon/${opponent.pokemonSlug}.png`}
                alt={opponent.pokemonSlug}
                width={44}
                height={44}
              />
              {color && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 4,
                    left: 4,
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    bgcolor: color,
                    border: "2px solid",
                    borderColor: "background.paper",
                  }}
                />
              )}
              {/* 詳細を追記 */}
              <IconButton
                className="slot-action"
                size="small"
                aria-label={t("battleRecord.form.editOpponent")}
                onClick={(e) => {
                  e.stopPropagation();
                  setDetailIndex(index);
                }}
                sx={{
                  position: "absolute",
                  bottom: -8,
                  left: "50%",
                  transform: "translateX(-50%)",
                  opacity: { xs: 1, sm: 0 },
                  transition: "opacity 0.15s",
                  bgcolor: "background.paperRaised",
                  border: "1px solid",
                  borderColor: "divider",
                  width: 22,
                  height: 22,
                  color: hasDetail ? theme.palette.success.main : "text.secondary",
                  "&:hover": { bgcolor: "background.paperRaised" },
                }}
              >
                <EditNote sx={{ fontSize: 15 }} />
              </IconButton>
              {/* 削除 */}
              <IconButton
                className="slot-action"
                size="small"
                aria-label={t("battleRecord.form.removeOpponent")}
                onClick={(e) => {
                  e.stopPropagation();
                  removeAt(index);
                }}
                sx={{
                  position: "absolute",
                  top: -8,
                  right: -8,
                  opacity: { xs: 1, sm: 0 },
                  transition: "opacity 0.15s",
                  bgcolor: "error.main",
                  color: "#fff",
                  width: 20,
                  height: 20,
                  "&:hover": { bgcolor: "error.dark" },
                }}
              >
                <Close sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>
          );
        })}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
        {t("battleRecord.selection.hint")}
      </Typography>

      <SelectPokemonDialog
        title={t("battleRecord.form.addOpponent")}
        open={selectOpen}
        onClose={() => setSelectOpen(false)}
        translator={t}
        onChange={addSpecies}
        excludedIdentifiers={opponents.map((o) => o?.pokemonSlug).filter(Boolean) as string[]}
      />

      <OpponentDetailDialog
        open={detailIndex !== null}
        opponent={detailIndex !== null ? (opponents[detailIndex] ?? null) : null}
        onClose={() => setDetailIndex(null)}
        onSave={(updated) => {
          if (detailIndex !== null) {
            onChange(opponents.map((o, i) => (i === detailIndex ? updated : o)));
          }
          setDetailIndex(null);
        }}
      />
    </Box>
  );
}
