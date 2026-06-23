"use client";

import { useEffect, useState } from "react";
import { Box, Button, IconButton, Paper, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useSetAtom } from "jotai";
import { getAppPalette } from "@/theme/palette";
import { Training } from "@/components/client/team-builder/training";
import { activeSlotIndexAtom, TrainedPokemon } from "@/store/team/team";
import { toDefault } from "@/data/utility/training";
import { useActiveTeam } from "@/hooks/useActiveTeam";
import { SelectPokemonDialog } from "@/components/client/team-builder/SelectPokemonDialog";

/**
 * URLのスロット（`/team-builder/[slot]`）に対応した単一スロットの育成画面。
 * かつてタブ（TeamTabs）で切り替えていた内容を、1ページ＝1スロットとして表示する。
 */
export default function TeamSlotDetail({
  slot,
  showBackButton = false,
}: {
  slot: number;
  showBackButton?: boolean;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const palette = getAppPalette(theme.palette.mode);
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [team, updateSlot] = useActiveTeam();
  const setActiveSlotIndex = useSetAtom(activeSlotIndexAtom);

  // URL 由来のスロットを、Lint セレクタ（activeSlotLintIssueAtom）が参照する atom に同期する。
  useEffect(() => {
    setActiveSlotIndex(slot);
  }, [slot, setActiveSlotIndex]);

  if (!team) {
    return null;
  }

  const member = team.members[slot] ?? null;
  const title = member
    ? t(`pokemon.${member.identifier}.name`)
    : t("teamBuilder.slotLabel", { index: slot + 1 });

  return (
    <Paper
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: palette.surfaceRaised,
        border: "1px solid",
        borderColor: palette.edge,
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: "center",
          px: 2,
          py: 1.5,
          borderBottom: "1px solid",
          borderColor: palette.edge,
        }}
      >
        {showBackButton && (
          <IconButton
            edge="start"
            aria-label={t("teamBuilder.back")}
            onClick={() => router.push("/team-builder")}
          >
            <ArrowBackIcon />
          </IconButton>
        )}
        <Typography variant="h6" noWrap sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
      </Stack>

      <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
        {member ? (
          <Box sx={{ p: { xs: 1, md: 3 } }}>
            <Training
              member={member}
              onUpdate={(trained: TrainedPokemon) => updateSlot(slot, trained)}
            />
          </Box>
        ) : (
          <Box sx={{ textAlign: "center", py: 6, px: 3 }}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {t("teamBuilder.emptySlot")}
            </Typography>
            <Button variant="contained" onClick={() => setDialogOpen(true)}>
              {t("teamBuilder.selectPokemon")}
            </Button>
          </Box>
        )}
      </Box>

      <SelectPokemonDialog
        title={t("teamBuilder.selectPokemon")}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        translator={t}
        onChange={(identifier) => {
          updateSlot(slot, toDefault(identifier));
          setDialogOpen(false);
        }}
      />
    </Paper>
  );
}
