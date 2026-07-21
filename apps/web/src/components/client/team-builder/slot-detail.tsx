"use client";

import { useEffect, useState } from "react";
import { Alert, Box, Button, IconButton, Snackbar, Stack, Typography, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import DeleteOutlineIcon from "@mui/icons-material/Delete";
import { alpha } from "@mui/material";
import { useAtomValue } from "jotai";
import { useSetAtom } from "jotai";
import { Training } from "@/components/client/team-builder/training";
import { activeSlotIndexAtom, TrainedPokemon } from "@/store/team/team";
import { toDefault } from "@/data/utility/training";
import { useActiveTeam } from "@/hooks/useActiveTeam";
import { SelectPokemonDialog } from "@/components/client/team-builder/SelectPokemonDialog";
import { useBoxData } from "@/hooks/useBoxData";
import { isAuthenticatedAtom } from "@/store/auth";
import { SurfaceCard } from "@/components/common/SurfaceCard";
import { emptyStateCenter, flexRowCenter } from "@/theme/sx";

/**
 * URLのスロット（`/team-builder/[slot]`）に対応した単一スロットの育成画面。
 * かつてタブ（TeamTabs）で切り替えていた内容を、1ページ＝1スロットとして表示する。
 */
export default function TeamSlotDetail({
  slot,
  showBackButton = false,
}: {
  readonly slot: number;
  readonly showBackButton?: boolean;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [savedSnackbar, setSavedSnackbar] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [team, updateSlot] = useActiveTeam();
  const setActiveSlotIndex = useSetAtom(activeSlotIndexAtom);
  const { saveToBox } = useBoxData();
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);

  // URL 由来のスロットを、Lint セレクタ（activeSlotLintIssueAtom）が参照する atom に同期する。
  useEffect(() => {
    setActiveSlotIndex(slot);
  }, [slot, setActiveSlotIndex]);

  if (!team) {
    return null;
  }

  const member = team.members[slot] ?? null;

  return (
    <SurfaceCard
      raised
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{
          ...flexRowCenter,
          px: 2,
          py: 1.5,
          borderBottom: "1px solid",
          borderColor: theme.palette.divider,
        }}
      >
        {showBackButton && (
          <IconButton
            edge="start"
            aria-label={t("teamBuilder.back")}
            onClick={() => router.push("/team-builder?view=overview")}
          >
            <ArrowBackIcon />
          </IconButton>
        )}
        {member && (
          <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "flex-start", ml: showBackButton ? 2 : 0 }}>
            <Tabs 
              value={activeTab} 
              onChange={(_, v) => setActiveTab(v)}
              sx={{ minHeight: "auto", "& .MuiTab-root": { minHeight: "auto", py: 0.5, textTransform: "none", fontWeight: 600 } }}
            >
              <Tab label={t("teamBuilder.tabOpenSpecs")} />
              <Tab label={t("teamBuilder.tabEvSpreads")} />
            </Tabs>
          </Box>
        )}

        {member && (
          <Stack direction="row" spacing={1} sx={{ ml: "auto", flexShrink: 0 }}>
            {isAuthenticated && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<SaveOutlinedIcon />}
                onClick={() => {
                  saveToBox(member);
                  setSavedSnackbar(true);
                }}
              >
                {t("box.saveToBox")}
              </Button>
            )}
            <IconButton
              size="small"
              onClick={() => setDeleteDialogOpen(true)}
              sx={{
                color: "error.main",
                bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
                "&:hover": { bgcolor: "error.main", color: "#fff" },
              }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Stack>
        )}
      </Stack>

      <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
        {member ? (
          <Box sx={{ p: { xs: 1, md: 3 } }}>
            <Training
              member={member}
              activeTab={activeTab}
              onUpdate={(trained: TrainedPokemon) => updateSlot(slot, trained)}
            />
          </Box>
        ) : (
          <Box sx={{ ...emptyStateCenter, py: 6, px: 3 }}>
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
        onSelectFromBox={(pokemon) => {
          updateSlot(slot, pokemon);
          setDialogOpen(false);
        }}
        excludedIdentifiers={team.members.map((m) => m?.identifier).filter(Boolean) as string[]}
      />

      <Snackbar
        open={savedSnackbar}
        autoHideDuration={2000}
        onClose={() => setSavedSnackbar(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setSavedSnackbar(false)}>
          {t("box.savedToBox")}
        </Alert>
      </Snackbar>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-pokemon-dialog-title"
      >
        <DialogTitle id="delete-pokemon-dialog-title">{t("teamBuilder.delete")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("teamBuilder.deleteTeamConfirm", { name: member ? t(`pokemon.${member.identifier}.name`) : t("pokemon.unknown") })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>{t("teamBuilder.cancel")}</Button>
          <Button
            color="error"
            variant="contained"
            disableElevation
            onClick={() => {
              updateSlot(slot, null);
              setDeleteDialogOpen(false);
            }}
          >
            {t("teamBuilder.delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </SurfaceCard>
  );
}
