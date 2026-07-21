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
} from "@mui/material";
import type { SlotResolution, TeamMergeConflict } from "@/hooks/useAuthSync";
import { Dispatch, SetStateAction } from "react";
import { rounded } from "@/utils/styles";
import { TrainedPokemon } from "@/store/team/team";

function isSamePokemon(a: TrainedPokemon | null, b: TrainedPokemon | null) {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

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

  if (local === null && server === null) {
    return null; // Empty slot
  }

  const isIdentical = isSamePokemon(local, server);

  // Helper to render a compact pokemon card
  const renderCard = (p: TrainedPokemon | null, type: "local" | "server") => {
    if (!p) return <Box sx={{ flex: 1, p: 1, border: "1px dashed", borderColor: "divider", ...rounded(1) }}><Typography variant="caption" color="text.secondary">Empty</Typography></Box>;
    
    const isSelected = resolution === type;
    const color = type === "local" ? "warning" : "info";

    return (
      <Box
        onClick={() => onResolve(type)}
        sx={{
          flex: 1,
          p: 1,
          border: "2px solid",
          borderColor: isSelected ? `${color}.main` : "transparent",
          bgcolor: isSelected ? alpha(theme.palette[color].main, 0.1) : "background.paper",
          cursor: "pointer",
          transition: "all 0.2s",
          display: "flex",
          alignItems: "center",
          gap: 1,
          ...rounded(1),
          "&:hover": {
            bgcolor: alpha(theme.palette[color].main, 0.05),
          }
        }}
      >
        <Image
          src={`/pokemon/${p.identifier}.png`}
          alt={p.identifier}
          width={40}
          height={40}
          style={{ objectFit: "contain", filter: isSelected ? "none" : "grayscale(50%)" }}
        />
        <Box>
          <Typography variant="caption" sx={{ fontWeight: "bold", display: "block" }}>
            {type.toUpperCase()}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: 10 }}>
            {p.nature.plus ? `+${p.nature.plus} ` : ""}{p.nature.minus ? `-${p.nature.minus}` : ""}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: 10 }}>
            EVs: {Object.values(p.evs).reduce<number>((a, b) => a + Number(b), 0)} total
          </Typography>
        </Box>
      </Box>
    );
  };

  if (isIdentical) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", p: 1, border: "1px solid", borderColor: "divider", ...rounded(1), bgcolor: "action.hover" }}>
        <Image src={`/pokemon/${local!.identifier}.png`} alt={local!.identifier} width={32} height={32} />
        <Typography variant="body2" sx={{ ml: 1, flex: 1 }}>{local!.identifier}</Typography>
        <Chip size="small" label="Identical" variant="outlined" />
      </Box>
    );
  }

  return (
    <Stack direction="row" spacing={1} sx={{ p: 1, border: "1px solid", borderColor: "divider", ...rounded(1), bgcolor: "action.disabledBackground" }}>
      {renderCard(local, "local")}
      {renderCard(server, "server")}
    </Stack>
  );
}

function MergeConflictRow({
  conflict,
  onChange,
}: {
  readonly conflict: TeamMergeConflict;
  readonly onChange: (newConflict: TeamMergeConflict) => void;
}) {
  const isLocalOnly = conflict.serverTeam === null;
  const isServerOnly = conflict.localTeam === null;
  const isConflict = !isLocalOnly && !isServerOnly;

  return (
    <Box
      sx={{
        p: 2,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        ...rounded(2),
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
        {isLocalOnly && <Chip label="Local Only" size="small" color="warning" variant="outlined" sx={{ fontFamily: "monospace", fontSize: 11 }} />}
        {isServerOnly && <Chip label="Server Only" size="small" color="info" variant="outlined" sx={{ fontFamily: "monospace", fontSize: 11 }} />}
        {isConflict && <Chip label="Conflict" size="small" color="error" variant="outlined" sx={{ fontFamily: "monospace", fontSize: 11 }} />}

        <Typography variant="subtitle2" sx={{ flex: 1, fontWeight: 700 }}>
          {conflict.name || "(無名チーム)"}
        </Typography>
      </Box>

      <Stack spacing={1}>
        {Array.from({ length: 6 }).map((_, i) => (
          <PokemonSlotDiff
            key={i}
            local={conflict.localTeam?.members[i] || null}
            server={conflict.serverTeam?.members[i] || null}
            resolution={conflict.slotResolutions[i]}
            onResolve={(res) => {
              const newResolutions = [...conflict.slotResolutions];
              newResolutions[i] = res;
              onChange({ ...conflict, slotResolutions: newResolutions });
            }}
          />
        ))}
      </Stack>
    </Box>
  );
}

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
      sx={{
        "& .MuiDialog-paper": {
          ...rounded(3),
          maxHeight: "85vh"
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }} component="div">
        <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
          チームの競合を解決する
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          同じチームに対してローカルとサーバーで異なる変更があります。スロットごとに採用するポケモンを選択してください。
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 2 }}>
        <Stack spacing={2}>
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
            競合はありません
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2.5, gap: 1 }}>
        <Button variant="outlined" color="inherit" onClick={onCancelAction}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onCommitAction}
          sx={{ fontFamily: "monospace" }}
        >
          Commit →
        </Button>
      </DialogActions>
    </Dialog>
  );
}
