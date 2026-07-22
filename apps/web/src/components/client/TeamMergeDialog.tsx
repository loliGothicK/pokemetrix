"use client";

import Image from "next/image";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
  alpha,
  useTheme,
  useMediaQuery,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import type { SlotResolution, TeamMergeConflict } from "@/hooks/useAuthSync";
import { Dispatch, SetStateAction } from "react";
import { TrainedPokemon } from "@/store/team/team";
import { useTranslation } from "react-i18next";

// ────────────────────────────────────────────────────────────────
// Diff helpers
// ────────────────────────────────────────────────────────────────

function isSamePokemon(a: TrainedPokemon | null, b: TrainedPokemon | null) {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

type DiffField = "item" | "ability" | "gender" | "nature" | "moves" | "evs";

function getDiffFields(a: TrainedPokemon, b: TrainedPokemon): DiffField[] {
  const fields: DiffField[] = [];
  if (JSON.stringify(a.item) !== JSON.stringify(b.item)) fields.push("item");
  if (JSON.stringify(a.ability) !== JSON.stringify(b.ability)) fields.push("ability");
  if (JSON.stringify(a.gender) !== JSON.stringify(b.gender)) fields.push("gender");
  if (JSON.stringify(a.nature) !== JSON.stringify(b.nature)) fields.push("nature");
  if (JSON.stringify(a.moves) !== JSON.stringify(b.moves)) fields.push("moves");
  if (JSON.stringify(a.evs) !== JSON.stringify(b.evs)) fields.push("evs");
  return fields;
}

function renderFieldValue(p: TrainedPokemon | null, field: DiffField): string {
  if (!p) return "—";
  switch (field) {
    case "item":
      return p.item != null ? `#${p.item}` : "—";
    case "ability":
      return `#${p.ability}`;
    case "gender":
      return p.gender.specified ?? (p.gender.fixed ? "fixed" : "—");
    case "nature":
      return (
        [p.nature.plus ? `+${p.nature.plus}` : null, p.nature.minus ? `-${p.nature.minus}` : null]
          .filter(Boolean)
          .join(" / ") || "—"
      );
    case "moves":
      return p.moves.map((m) => (m != null ? `#${m}` : "—")).join(", ");
    case "evs":
      return (
        Object.entries(p.evs)
          .filter(([, v]) => Number(v) > 0)
          .map(([k, v]) => `${k}:${v}`)
          .join(" ") || "0"
      );
  }
}

// ────────────────────────────────────────────────────────────────
// Desktop: PokemonSlotDiff
// ────────────────────────────────────────────────────────────────

function PokemonSlotDiff({
  local,
  server,
  resolution,
  onResolve,
}: {
  readonly local: TrainedPokemon | null;
  readonly server: TrainedPokemon | null;
  readonly resolution: SlotResolution;
  readonly onResolve: (res: SlotResolution) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();

  if (local === null && server === null) return null;

  // 両方存在して同一 → 表示しない（差分のみ表示ポリシー）
  if (local !== null && server !== null && isSamePokemon(local, server)) return null;

  const diffFields = local !== null && server !== null ? getDiffFields(local, server) : [];

  const renderCard = (p: TrainedPokemon | null, type: "local" | "server") => {
    if (!p) {
      return (
        <Box
          sx={{
            flex: 1,
            p: 1.5,
            border: "1px dashed",
            borderColor: "divider",
            borderRadius: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {t("merge.emptySlot")}
          </Typography>
        </Box>
      );
    }

    const isSelected = resolution === type;
    const color = type === "local" ? "warning" : "info";

    return (
      <Box
        onClick={() => onResolve(type)}
        sx={{
          flex: 1,
          p: 1.5,
          border: "2px solid",
          borderColor: isSelected ? `${color}.main` : "divider",
          bgcolor: isSelected ? alpha(theme.palette[color].main, 0.1) : "background.paper",
          cursor: "pointer",
          transition: "all 0.15s",
          borderRadius: 1,
          "&:hover": {
            bgcolor: alpha(theme.palette[color].main, 0.06),
          },
        }}
      >
        {/* Header */}
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "center", mb: diffFields.length > 0 ? 1 : 0 }}
        >
          <Image
            src={`/pokemon/${p.identifier}.png`}
            alt={p.identifier}
            width={36}
            height={36}
            style={{ objectFit: "contain", filter: isSelected ? "none" : "grayscale(40%)" }}
          />
          <Box>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                display: "block",
                textTransform: "uppercase",
                color: `${color}.main`,
              }}
            >
              {t(`merge.source.${type}`)}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
              {p.identifier}
            </Typography>
          </Box>
        </Stack>

        {/* Diff fields */}
        {diffFields.length > 0 && (
          <Stack spacing={0.25}>
            {diffFields.map((field) => (
              <Typography
                key={field}
                variant="caption"
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 0.5,
                  color: "text.secondary",
                  fontSize: 10,
                  fontFamily: "monospace",
                }}
              >
                <Box component="span" sx={{ color: `${color}.main`, fontWeight: 700 }}>
                  {t(`merge.field.${field}`)}:
                </Box>
                <Box component="span" sx={{ wordBreak: "break-all" }}>
                  {renderFieldValue(p, field)}
                </Box>
              </Typography>
            ))}
          </Stack>
        )}
      </Box>
    );
  };

  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        p: 1,
        borderBottom: { xs: "1px dashed", sm: "none" },
        borderColor: "divider",
        borderRadius: { xs: 0, sm: 1 },
        bgcolor: { xs: "transparent", sm: "action.disabledBackground" },
      }}
    >
      {renderCard(local, "local")}
      {renderCard(server, "server")}
    </Stack>
  );
}

// ────────────────────────────────────────────────────────────────
// Mobile: MobilePokemonSlotDiff
// ────────────────────────────────────────────────────────────────

function MobilePokemonSlotDiff({
  local,
  server,
  resolution,
  onResolve,
}: {
  readonly local: TrainedPokemon | null;
  readonly server: TrainedPokemon | null;
  readonly resolution: SlotResolution;
  readonly onResolve: (res: SlotResolution) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();

  if (local === null && server === null) return null;
  if (local !== null && server !== null && isSamePokemon(local, server)) return null;

  const diffFields = local !== null && server !== null ? getDiffFields(local, server) : [];

  const p = local || server;
  if (!p) return null;

  return (
    <Box
      sx={{
        p: 1.5,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        bgcolor: "background.paper",
        boxShadow: theme.shadows[1],
      }}
    >
      {/* Target Pokemon Icon & Title */}
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            bgcolor: "action.hover",
            borderRadius: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Image
            src={`/pokemon/${p.identifier}.png`}
            alt={p.identifier}
            width={36}
            height={36}
            style={{ objectFit: "contain" }}
          />
        </Box>
        <Box>
          <Typography
            variant="body2"
            sx={{ fontWeight: 700, textTransform: "capitalize", fontSize: 15 }}
          >
            {p.identifier}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t("merge.slotDiffDetected")}
          </Typography>
        </Box>
      </Stack>

      {/* Comparison List */}
      {diffFields.length > 0 && (
        <Stack spacing={1.5} sx={{ mb: 2.5 }}>
          {diffFields.map((field) => (
            <Box key={field}>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  color: "text.primary",
                  fontWeight: 700,
                  mb: 0.5,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  pb: 0.5,
                }}
              >
                {t(`merge.field.${field}`)}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ pt: 0.5 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "warning.main",
                      display: "block",
                      fontWeight: 700,
                      mb: 0.25,
                      fontSize: 10,
                    }}
                  >
                    LOCAL
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      wordBreak: "break-all",
                      fontFamily: "monospace",
                      display: "block",
                      lineHeight: 1.3,
                      fontSize: 11,
                    }}
                  >
                    {renderFieldValue(local, field)}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "info.main",
                      display: "block",
                      fontWeight: 700,
                      mb: 0.25,
                      fontSize: 10,
                    }}
                  >
                    SERVER
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      wordBreak: "break-all",
                      fontFamily: "monospace",
                      display: "block",
                      lineHeight: 1.3,
                      fontSize: 11,
                    }}
                  >
                    {renderFieldValue(server, field)}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          ))}
        </Stack>
      )}

      {(local === null || server === null) && (
        <Typography
          variant="body2"
          sx={{ mb: 2.5, textAlign: "center", p: 1, bgcolor: "action.hover", borderRadius: 1 }}
        >
          {local === null ? t("merge.onlyInServer") : t("merge.onlyInLocal")}
        </Typography>
      )}

      {/* Resolution Action */}
      <ToggleButtonGroup
        value={resolution}
        exclusive
        onChange={(_, val) => {
          if (val !== null) onResolve(val);
        }}
        fullWidth
        size="small"
        sx={{
          "& .MuiToggleButtonGroup-grouped": {
            border: "1px solid",
            borderColor: "divider",
          },
        }}
      >
        <ToggleButton value="local" color="warning" sx={{ fontWeight: 700, py: 1 }}>
          {t("merge.source.local")}
        </ToggleButton>
        <ToggleButton value="server" color="info" sx={{ fontWeight: 700, py: 1 }}>
          {t("merge.source.server")}
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}

// ────────────────────────────────────────────────────────────────
// MergeConflictRow
// ────────────────────────────────────────────────────────────────

function MergeConflictRow({
  conflict,
  onChange,
}: {
  readonly conflict: TeamMergeConflict;
  readonly onChange: (newConflict: TeamMergeConflict) => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const isLocalOnly = conflict.serverTeam === null;
  const isServerOnly = conflict.localTeam === null;
  const isConflict = !isLocalOnly && !isServerOnly;

  const hasDiff = Array.from({ length: 6 }).some((_, i) => {
    const local = conflict.localTeam?.members[i] ?? null;
    const server = conflict.serverTeam?.members[i] ?? null;
    return !isSamePokemon(local, server);
  });

  return (
    <Box
      sx={{
        p: { xs: 0, sm: 2 },
        borderColor: "divider",
        bgcolor: { xs: "transparent", sm: "background.paper" },
        borderRadius: { xs: 0, sm: 2 },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, px: { xs: 0.5, sm: 0 } }}>
        {isLocalOnly && (
          <Chip
            label={t("merge.tag.localOnly")}
            size="small"
            color="warning"
            variant="outlined"
            sx={{ fontFamily: "monospace", fontSize: 11 }}
          />
        )}
        {isServerOnly && (
          <Chip
            label={t("merge.tag.serverOnly")}
            size="small"
            color="info"
            variant="outlined"
            sx={{ fontFamily: "monospace", fontSize: 11 }}
          />
        )}
        {isConflict && (
          <Chip
            label={t("merge.tag.conflict")}
            size="small"
            color="error"
            variant="outlined"
            sx={{ fontFamily: "monospace", fontSize: 11 }}
          />
        )}
        <Typography variant="subtitle2" sx={{ flex: 1, fontWeight: 700 }}>
          {conflict.name || t("merge.unnamedTeam")}
        </Typography>
      </Box>

      {hasDiff ? (
        <Stack spacing={isMobile ? 2 : 1}>
          {Array.from({ length: 6 }).map((_, i) => {
            const local = conflict.localTeam?.members[i] ?? null;
            const server = conflict.serverTeam?.members[i] ?? null;
            const res = conflict.slotResolutions[i];
            const onResolve = (res: SlotResolution) => {
              const newResolutions = [...conflict.slotResolutions];
              newResolutions[i] = res;
              onChange({ ...conflict, slotResolutions: newResolutions });
            };

            if (local === null && server === null) return null;
            if (local !== null && server !== null && isSamePokemon(local, server)) return null;

            return isMobile ? (
              <MobilePokemonSlotDiff
                key={i}
                local={local}
                server={server}
                resolution={res}
                onResolve={onResolve}
              />
            ) : (
              <PokemonSlotDiff
                key={i}
                local={local}
                server={server}
                resolution={res}
                onResolve={onResolve}
              />
            );
          })}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ py: 1, px: { xs: 0.5, sm: 0 } }}>
          {t("merge.noDiff")}
        </Typography>
      )}
    </Box>
  );
}

// ────────────────────────────────────────────────────────────────
// TeamMergeDialog
// ────────────────────────────────────────────────────────────────

type TeamMergeDialogProps = {
  readonly open: boolean;
  readonly conflicts: TeamMergeConflict[];
  readonly setConflicts: Dispatch<SetStateAction<TeamMergeConflict[]>>;
  readonly onCommitAction: () => Promise<void>;
  readonly onCancelAction: () => void;
};

export function TeamMergeDialog({
  open,
  conflicts,
  setConflicts,
  onCommitAction,
  onCancelAction,
}: TeamMergeDialogProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleConflictChange = (index: number, newConflict: TeamMergeConflict) => {
    setConflicts((prev) => {
      const copy = [...prev];
      copy[index] = newConflict;
      return copy;
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onCancelAction}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: { xs: 2, sm: 3 },
          maxHeight: "90vh",
          m: { xs: 1, sm: 3 },
          width: "100%",
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }} component="div">
        <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
          {t("merge.title")}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {t("merge.description")}
        </Typography>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: isMobile ? "action.hover" : "transparent" }}
      >
        <Stack spacing={isMobile ? 3 : 2}>
          {conflicts.map((conflict, i) => (
            <MergeConflictRow
              key={conflict.teamId}
              conflict={conflict}
              onChange={(nc) => handleConflictChange(i, nc)}
            />
          ))}
        </Stack>

        {conflicts.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
            {t("merge.noConflicts")}
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2.5, gap: 1 }}>
        <Button variant="outlined" color="inherit" onClick={onCancelAction}>
          {t("merge.cancel")}
        </Button>
        <Button variant="contained" onClick={onCommitAction} sx={{ fontFamily: "monospace" }}>
          {t("merge.commit")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
