"use client";

import {
  alpha,
  Box,
  Button,
  CircularProgress,
  Divider,
  Fab,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  SpeedDial,
  SpeedDialIcon,
  SpeedDialAction,
} from "@mui/material";
import { Add, Delete, SaveOutlined } from "@mui/icons-material";

import { Search } from "@mui/icons-material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import { useAtomValue } from "jotai";
import { isAuthenticatedAtom } from "@/store/auth";
import { useBoxData } from "@/hooks/useBoxData";
import { itemById } from "@/data/items";
import { itemSprite } from "@/lib/image";
import { useState } from "react";
import { SelectPokemonDialog } from "@/components/client/team-builder/SelectPokemonDialog";
import { Training } from "@/components/client/team-builder/training";
import { toDefault } from "@/data/utility/training";
import type { TrainedPokemon } from "@/store/team/team";
import { useHotkeys } from "react-hotkeys-hook";
import { moveById } from "@/data/moves";

export default function BoxPage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const { box, isLoading, saveToBox, removeFromBox } = useBoxData();
  const [search, setSearch] = useState("");

  const [selectOpen, setSelectOpen] = useState(false);
  const [editingPokemon, setEditingPokemon] = useState<TrainedPokemon | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleSpeciesSelect = (identifier: string | null) => {
    const pokemon = toDefault(identifier);
    if (!pokemon) return;
    setSelectOpen(false);
    setEditingPokemon(pokemon);
  };

  const handleSaveToBox = () => {
    if (!editingPokemon) return;
    saveToBox(editingPokemon);
    setEditingPokemon(null);
  };

  useHotkeys("ctrl+s", handleSaveToBox);

  if (!isAuthenticated) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">
          {t("auth.loginRequired")}
        </Typography>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  // 育成編集ビュー（slot-detail と同じくページフロー内で Training を描画）
  if (editingPokemon) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
        {/* ヘッダー */}
        <Stack
          direction="row"
          sx={{
            alignItems: "center",
            px: 2,
            py: 1.5,
            borderBottom: "1px solid",
            borderColor: theme.palette.divider,
            bgcolor: theme.palette.background.paper,
            position: "sticky",
            top: 0,
            zIndex: 1,
          }}
        >
          <IconButton
            edge="start"
            onClick={() => setEditingPokemon(null)}
            aria-label={t("teamBuilder.back")}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "flex-start", ml: 2 }}>
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              sx={{
                minHeight: "auto",
                "& .MuiTab-root": {
                  minHeight: "auto",
                  py: 0.5,
                  textTransform: "none",
                  fontWeight: 600,
                },
              }}
            >
              <Tab label={t("teamBuilder.tabOpenSpecs")} />
              <Tab label={t("teamBuilder.tabEvSpreads")} />
            </Tabs>
          </Box>
          <Stack
            direction="row"
            spacing={1}
            sx={{ ml: "auto", flexShrink: 0, display: { xs: "none", md: "flex" } }}
          >
            <Button variant="contained" startIcon={<SaveOutlined />} onClick={handleSaveToBox}>
              {t("box.saveToBox")}
            </Button>
            <IconButton
              size="small"
              onClick={() => setDeleteDialogOpen(true)}
              sx={{
                color: "error.main",
                bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
                "&:hover": { bgcolor: "error.main", color: "#fff" },
              }}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>

        <Box sx={{ flexGrow: 1, p: { xs: 1.5, md: 3 } }}>
          <Training
            member={editingPokemon}
            activeTab={activeTab}
            onUpdate={(updated) => setEditingPokemon(updated)}
          />
        </Box>

        <SpeedDial
          ariaLabel="Actions"
          sx={{ display: { xs: "flex", md: "none" }, position: "fixed", bottom: 16, right: 16 }}
          icon={<SpeedDialIcon />}
        >
          <SpeedDialAction
            icon={<SaveOutlined />}
            title={t("box.saveToBox")}
            slotProps={{ tooltip: { title: t("box.saveToBox"), open: true } }}
            onClick={handleSaveToBox}
          />
          <SpeedDialAction
            icon={<Delete />}
            title={t("teamBuilder.delete")}
            slotProps={{ tooltip: { title: t("teamBuilder.delete"), open: true } }}
            onClick={() => setDeleteDialogOpen(true)}
          />
        </SpeedDial>

        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          aria-labelledby="delete-pokemon-dialog-title"
        >
          <DialogTitle id="delete-pokemon-dialog-title">{t("teamBuilder.delete")}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {t("teamBuilder.deleteTeamConfirm", {
                name: editingPokemon
                  ? t(`pokemon.${editingPokemon.identifier}.name`)
                  : t("pokemon.unknown"),
              })}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>{t("teamBuilder.cancel")}</Button>
            <Button
              color="error"
              variant="contained"
              disableElevation
              onClick={() => {
                if (editingPokemon?.boxId) removeFromBox(editingPokemon.boxId);
                setEditingPokemon(null);
                setDeleteDialogOpen(false);
              }}
            >
              {t("teamBuilder.delete")}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  const filtered = search.trim()
    ? box.filter(
        (p) =>
          t(`pokemon.${p.identifier}.name`).toLowerCase().includes(search.trim().toLowerCase()) ||
          p.identifier.includes(search.trim().toLowerCase()),
      )
    : box;

  return (
    <Box sx={{ p: 3 }}>
      {/* ヘッダー行: タイトル + 追加ボタン */}
      <Stack direction="row" sx={{ alignItems: "center", mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, flexGrow: 1 }}>
          {t("box.title")}
        </Typography>
        <Fab onClick={() => setSelectOpen(true)} color="primary" aria-label="add" size="medium">
          <Add />
        </Fab>
      </Stack>

      {/* 検索バー */}
      <TextField
        size="small"
        placeholder={t("box.searchPlaceholder")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 3, width: { xs: "100%", sm: 320 } }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />

      {filtered.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography variant="body1" color="text.secondary">
            {search ? t("box.noResults") : t("box.empty")}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {filtered.map((pokemon) => (
            <Grid component="div" size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={pokemon.boxId}>
              <Paper
                onClick={() => setEditingPokemon(pokemon)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: { xs: 1, sm: 2 },
                  p: { xs: 1.5, sm: 2 },
                  bgcolor: theme.palette.background.paperRaised,
                  border: "1px solid",
                  borderColor: theme.palette.divider,
                  cursor: "pointer",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    borderColor: theme.palette.primary.main,
                    boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.12)}`,
                  },
                  borderRadius: 3,
                }}
              >
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    overflow: "hidden",
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    flexShrink: 0,
                    borderRadius: 2,
                  }}
                >
                  <Image
                    src={`/pokemon/${pokemon.identifier}.png`}
                    alt={pokemon.identifier}
                    width={56}
                    height={56}
                  />
                  {pokemon.item &&
                    (() => {
                      const item = itemById.get(pokemon.item);
                      return item ? (
                        <Box
                          sx={{
                            position: "absolute",
                            bottom: 0,
                            right: 0,
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            bgcolor: alpha(theme.palette.background.paperRaised, 0.8),
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Image
                            src={itemSprite(item.identifier)}
                            alt={item.identifier}
                            width={18}
                            height={18}
                          />
                        </Box>
                      ) : null;
                    })()}
                </Box>

                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
                    {t(`pokemon.${pokemon.identifier}.name`)}
                    {pokemon.item
                      ? ` @ ${t(`items.${itemById.get(pokemon.item)?.identifier}.name`)}`
                      : t("box.noItem")}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Grid container>
                    {pokemon.moves
                      .filter((move) => move !== null)
                      .map((move) => {
                        return (
                          <Grid size={6} key={move}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              noWrap
                              sx={{ display: "block" }}
                            >
                              {t(`moves.${moveById.get(move)!.identifier}.name`)}
                            </Typography>
                          </Grid>
                        );
                      })}
                  </Grid>
                </Box>

                <Fab
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromBox(pokemon.boxId);
                  }}
                  sx={{
                    boxShadow: "none",
                    bgcolor: alpha(theme.palette.error.main, 0.1),
                    color: theme.palette.error.main,
                    flexShrink: 0,
                    "&:hover": { bgcolor: theme.palette.error.main, color: "#fff" },
                  }}
                  aria-label={t("box.delete")}
                >
                  <Delete fontSize="small" />
                </Fab>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Step 1: 種族選択ダイアログ */}
      <SelectPokemonDialog
        title={t("box.addPokemon")}
        open={selectOpen}
        onClose={() => setSelectOpen(false)}
        translator={t}
        onChange={handleSpeciesSelect}
      />
    </Box>
  );
}
