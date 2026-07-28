"use client";

import { useEffect, useMemo, useState } from "react";
import {
  alpha,
  Box,
  Button,
  Dialog,
  DialogContent,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Autocomplete,
  Chip,
} from "@mui/material";
import Close from "@mui/icons-material/Close";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useHotkeys } from "react-hotkeys-hook";
import { match } from "ts-pattern";
import type { TrainedPokemon } from "@/store/team/team";
import type {
  BattleFormat,
  BattleRecord,
  BattleResult,
  Season,
} from "@/store/battle-record/battleRecord";
import { emptyDraft, draftFromRecord, type BattleRecordDraft } from "./formState";
import { YourTeamSelector } from "./YourTeamSelector";
import { OpponentSlots } from "./OpponentSlots";
import { flexRowCenter, sectionLabel } from "@/theme/sx";

interface BattleRecordFormDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly editing: BattleRecord | null;
  /** アクティブチームのメンバー（新規記録の初期値） */
  readonly teamMembers: readonly TrainedPokemon[];
  readonly teamId: string | null;
  readonly seasons: readonly Season[];
  readonly defaultSeasonId: string | null;
  readonly onSubmit: (draft: BattleRecordDraft, seasonId: string) => Promise<void>;
  readonly submitting: boolean;
}

const RESULT_OPTIONS: readonly BattleResult[] = ["win", "loss", "draw"];

const PREDEFINED_TAGS = [
  { slug: "trick-room", group: "gimmick" },
  { slug: "tailwind", group: "gimmick" },
  { slug: "weather-rain", group: "gimmick" },
  { slug: "weather-sun", group: "gimmick" },
  { slug: "weather-snow", group: "gimmick" },
  { slug: "weather-sand", group: "gimmick" },
  { slug: "redirection", group: "gimmick" },
  { slug: "perish-trap", group: "gimmick" },
  { slug: "speed-control", group: "role" },
  { slug: "follow-me", group: "role" },
  { slug: "fake-out", group: "role" },
  { slug: "intimidate", group: "role" },
  { slug: "cycle", group: "role" },
  { slug: "sleep-control", group: "role" },
  { slug: "mega-focused", group: "role" },
  { slug: "standard", group: "role" },
];

const PREDEFINED_TAG_SLUGS = PREDEFINED_TAGS.map((t) => t.slug);

export function BattleRecordFormDialog({
  open,
  onClose,
  editing,
  teamMembers,
  teamId,
  seasons,
  defaultSeasonId,
  onSubmit,
  submitting,
}: BattleRecordFormDialogProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  const [seasonId, setSeasonId] = useState<string | null>(defaultSeasonId);
  const [draft, setDraft] = useState<BattleRecordDraft>(emptyDraft);
  const [resultChosen, setResultChosen] = useState(false);

  const format: BattleFormat = useMemo(
    () => seasons.find((s) => s.id === seasonId)?.format ?? "doubles",
    [seasons, seasonId],
  );

  useEffect(() => {
    if (!open) return;
    if (editing) {
      const editFormat = seasons.find((s) => s.id === editing.seasonId)?.format ?? "doubles";
      setSeasonId(editing.seasonId);
      setDraft(draftFromRecord(editing, editFormat));
      setResultChosen(true);
    } else {
      setSeasonId(defaultSeasonId);
      setDraft(emptyDraft({ teamId, myTeam: teamMembers }));
      setResultChosen(false);
    }
  }, [open, editing, defaultSeasonId, teamId, teamMembers, seasons]);

  const chooseResult = (result: BattleResult) => {
    setDraft((prev) => ({ ...prev, result }));
    setResultChosen(true);
  };

  const canSave = resultChosen && seasonId !== null && !submitting;

  const handleSubmit = async () => {
    if (!canSave || !seasonId) return;
    await onSubmit(draft, seasonId);
  };

  useHotkeys("w", () => chooseResult("win"), { enabled: open }, [open]);
  useHotkeys("l", () => chooseResult("loss"), { enabled: open }, [open]);
  useHotkeys("d", () => chooseResult("draw"), { enabled: open }, [open]);
  useHotkeys(
    "ctrl+s, meta+s",
    (e) => {
      e.preventDefault();
      void handleSubmit();
    },
    { enabled: open, enableOnFormTags: true },
    [open, canSave, seasonId, draft],
  );

  const resultColor = (result: BattleResult): string =>
    match(result)
      .with("win", () => theme.palette.success.main)
      .with("loss", () => theme.palette.error.main)
      .with("draw", () => theme.palette.text.secondary)
      .exhaustive();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper">
      {/* ヘッダー */}
      <Stack direction="row" sx={{ ...flexRowCenter, px: 3, py: 2, gap: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: "0.06em", flexGrow: 1 }}>
          {editing ? t("battleRecord.form.editTitle") : t("battleRecord.form.newTitle")}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: { xs: "none", sm: "block" } }}
        >
          {t("battleRecord.form.escHint")}
        </Typography>
        <IconButton onClick={onClose} size="small" aria-label={t("common.close")}>
          <Close />
        </IconButton>
      </Stack>
      <Divider />

      <DialogContent>
        <Stack spacing={3}>
          {/* 勝敗（大きいボタン + W/L/D キー） */}
          <Box>
            <Stack direction="row" spacing={1} sx={{ ...flexRowCenter, mb: 1 }}>
              <Typography variant="overline" sx={{ ...sectionLabel, fontWeight: 700 }}>
                {t("battleRecord.form.result")}
              </Typography>
              <Stack direction="row" spacing={0.5}>
                {["W", "L", "D"].map((k) => (
                  <Box
                    key={k}
                    sx={{
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      border: "1px solid",
                      borderColor: theme.palette.divider,
                      color: "text.secondary",
                      borderRadius: 0.75,
                      py: 0.75,
                      px: 1.5,
                    }}
                  >
                    {k}
                  </Box>
                ))}
              </Stack>
            </Stack>
            <Stack direction="row" spacing={1.5}>
              {RESULT_OPTIONS.map((result) => {
                const active = resultChosen && draft.result === result;
                const color = resultColor(result);
                return (
                  <Box
                    key={result}
                    onClick={() => chooseResult(result)}
                    role="button"
                    aria-pressed={active}
                    sx={{
                      flex: 1,
                      textAlign: "center",
                      border: "2px solid",
                      borderColor: active ? color : theme.palette.divider,
                      bgcolor: active ? alpha(color, 0.14) : "transparent",
                      color: active ? color : "text.secondary",
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      "&:hover": { borderColor: color, bgcolor: alpha(color, 0.08) },
                      borderRadius: 3,
                      py: 1.5,
                    }}
                  >
                    {t(`battleRecord.result.${result}`).toUpperCase()}
                  </Box>
                );
              })}
            </Stack>
          </Box>

          {/* 自チーム選出 */}
          <YourTeamSelector
            myTeam={draft.myTeam}
            selection={draft.selection}
            onChange={(selection) => setDraft((prev) => ({ ...prev, selection }))}
            format={format}
          />

          <Divider />

          {/* 相手チーム */}
          <OpponentSlots
            opponents={draft.opponents}
            onChange={(opponents) => setDraft((prev) => ({ ...prev, opponents }))}
            format={format}
          />

          <Divider />

          {/* シーズン / レート / 日時 */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <FormControl size="small" fullWidth>
              <InputLabel id="record-season-label">{t("battleRecord.form.season")}</InputLabel>
              <Select
                labelId="record-season-label"
                label={t("battleRecord.form.season")}
                value={seasonId ?? ""}
                onChange={(e) => setSeasonId(e.target.value || null)}
                disabled={editing !== null}
              >
                {seasons.map((season) => (
                  <MenuItem key={season.id} value={season.id}>
                    {season.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              size="small"
              fullWidth
              type="number"
              label={t("battleRecord.form.rating")}
              placeholder="1650"
              value={draft.rating}
              onChange={(e) => setDraft((prev) => ({ ...prev, rating: e.target.value }))}
            />
          </Stack>

          <TextField
            size="small"
            type="datetime-local"
            label={t("battleRecord.form.playedAt")}
            value={draft.playedAt}
            onChange={(e) => setDraft((prev) => ({ ...prev, playedAt: e.target.value }))}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ maxWidth: { sm: 260 } }}
          />

          <TextField
            size="small"
            fullWidth
            multiline
            minRows={2}
            label={t("battleRecord.form.notes")}
            placeholder={t("battleRecord.form.notesPlaceholder")}
            value={draft.notes}
            onChange={(e) => setDraft((prev) => ({ ...prev, notes: e.target.value }))}
          />

          <Autocomplete
            multiple
            freeSolo
            size="small"
            options={PREDEFINED_TAG_SLUGS}
            value={draft.tags as string[]}
            onChange={(_e, newValue) => {
              setDraft((prev) => ({ ...prev, tags: newValue as string[] }));
            }}
            groupBy={(option) => {
              const preset = PREDEFINED_TAGS.find((p) => p.slug === option);
              return preset ? t(`battleRecord.form.tagGroups.${preset.group}`) : "Custom";
            }}
            getOptionLabel={(option) => {
              const preset = PREDEFINED_TAGS.find((p) => p.slug === option);
              return preset ? t(`taxonomy.${preset.slug}`) : option;
            }}
            // @ts-ignore
            renderTags={(value: readonly string[], getTagProps: any) =>
              value.map((option, index) => {
                const preset = PREDEFINED_TAGS.find((p) => p.slug === option);
                const label = preset ? t(`taxonomy.${preset.slug}`) : option;

                const { key, ...tagProps } = getTagProps({ index });
                return (
                  <Chip key={key} variant="outlined" size="small" label={label} {...tagProps} />
                );
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label={t("battleRecord.form.tags")}
                placeholder={t("battleRecord.form.tagsPlaceholder")}
              />
            )}
          />
        </Stack>
      </DialogContent>

      <Divider />
      <Stack direction="row" spacing={1} sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={submitting}>
          {t("common.cancel")}
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!canSave}
          sx={{ flexGrow: 1, fontWeight: 700 }}
        >
          {resultChosen ? t("common.save") : t("battleRecord.form.selectResultFirst")}
        </Button>
      </Stack>
    </Dialog>
  );
}
