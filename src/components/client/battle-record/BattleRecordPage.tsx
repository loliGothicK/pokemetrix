"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import Add from "@mui/icons-material/Add";
import Edit from "@mui/icons-material/Edit";
import Delete from "@mui/icons-material/Delete";
import InsightsRounded from "@mui/icons-material/InsightsRounded";
import Image from "next/image";
import Link from "next/link";
import { useAtomValue } from "jotai";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { isAuthenticatedAtom } from "@/store/auth";
import { getAppPalette } from "@/theme/palette";
import { useSeasons } from "@/hooks/useSeasons";
import { useBattleRecords } from "@/hooks/useBattleRecords";
import { useTeamsData } from "@/hooks/useTeamsData";
import { championsPokemonByIdentifier } from "@/data/champions-pokemon";
import { typeIcon } from "@/lib/image";
import { tally } from "@/store/battle-record/analytics";
import { draftToInput, type BattleRecordDraft } from "./formState";
import type {
  BattleRecord,
  BattleResult,
  Season,
  SeasonInput,
} from "@/store/battle-record/battleRecord";
import type { Team, TrainedPokemon } from "@/store/team/team";
import { SeasonFormDialog } from "./SeasonFormDialog";
import { BattleRecordFormDialog } from "./BattleRecordFormDialog";
import { BattleRecordList } from "./BattleRecordList";

type ResultFilter = "all" | BattleResult;

function PartyPanel({ team }: { readonly team: Team | null }) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const palette = getAppPalette(theme.palette.mode);
  const members = (team?.members ?? []).filter((m): m is TrainedPokemon => m !== null);

  return (
    <Box>
      <Typography
        variant="overline"
        sx={{ fontWeight: 800, letterSpacing: "0.12em", color: "text.secondary" }}
      >
        {t("battleRecord.party")}
      </Typography>
      {members.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {t("battleRecord.noParty")}
        </Typography>
      ) : (
        <Stack spacing={0.75} sx={{ mt: 1 }}>
          {members.map((member) => {
            const types = championsPokemonByIdentifier.get(member.identifier)?.types ?? [];
            const formName = `pokemon.${member.identifier}.formName`;
            return (
              <Stack
                key={member.boxId}
                direction="row"
                spacing={1}
                sx={{
                  alignItems: "center",
                  p: 0.75,
                  borderRadius: 2,
                  bgcolor: palette.surfaceRaised,
                }}
              >
                <Image
                  src={`/pokemon/${member.identifier}.png`}
                  alt={member.identifier}
                  width={36}
                  height={36}
                />
                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                    {t(`pokemon.${member.identifier}.name`)}
                    {i18n.exists(formName) && (
                      <Typography
                        component="span"
                        sx={{ ml: 0.5, fontSize: "0.75em", color: "text.secondary" }}
                      >
                        {t(formName)}
                      </Typography>
                    )}
                  </Typography>
                  <Stack direction="row" spacing={0.5} sx={{ mt: 0.25 }}>
                    {types.map((type) => (
                      <Chip
                        key={type}
                        size="small"
                        avatar={
                          <Box
                            component="img"
                            src={typeIcon(type)}
                            alt={type}
                            sx={{ width: 14, height: 14 }}
                          />
                        }
                        label={t(`types.${type}.name`)}
                        sx={{ height: 18, fontSize: "0.6rem", "& .MuiChip-label": { px: 0.5 } }}
                      />
                    ))}
                  </Stack>
                </Box>
              </Stack>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}

function StatsBar({ records }: { readonly records: readonly BattleRecord[] }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const palette = getAppPalette(theme.palette.mode);
  const stats = useMemo(() => tally(records), [records]);
  const winPct = stats.total === 0 ? 0 : Math.round((stats.wins / stats.total) * 100);
  const decided = stats.wins + stats.losses;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 3,
        border: "1px solid",
        borderColor: palette.edge,
        bgcolor: palette.surface,
      }}
    >
      <Stack direction="row" spacing={3} sx={{ alignItems: "center", flexWrap: "wrap" }}>
        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
            {t("battleRecord.analytics.winRate")}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 900, color: theme.palette.primary.main }}>
            {stats.total === 0 ? "—" : `${winPct}%`}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Counter label="W" value={stats.wins} color={theme.palette.success.main} />
          <Counter label="L" value={stats.losses} color={theme.palette.error.main} />
          <Counter label="D" value={stats.draws} color={theme.palette.text.secondary} />
        </Stack>
        <Box sx={{ flexGrow: 1, minWidth: 160 }}>
          <Box
            sx={{
              display: "flex",
              height: 8,
              borderRadius: 4,
              overflow: "hidden",
              bgcolor: palette.edge,
            }}
          >
            {decided > 0 && (
              <>
                <Box
                  sx={{
                    width: `${(stats.wins / decided) * 100}%`,
                    bgcolor: theme.palette.success.main,
                  }}
                />
                <Box
                  sx={{
                    width: `${(stats.losses / decided) * 100}%`,
                    bgcolor: theme.palette.error.main,
                  }}
                />
              </>
            )}
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
            {t("battleRecord.games", { count: stats.total })}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

function Counter({
  label,
  value,
  color,
}: {
  readonly label: string;
  readonly value: number;
  readonly color: string;
}) {
  return (
    <Box sx={{ textAlign: "center" }}>
      <Typography variant="caption" sx={{ fontWeight: 800, color }}>
        {label}
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1 }}>
        {value}
      </Typography>
    </Box>
  );
}

export default function BattleRecordPage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const palette = getAppPalette(theme.palette.mode);
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const { teams, isLoading: teamsLoading } = useTeamsData();
  const {
    seasons,
    isLoading: seasonsLoading,
    createSeason,
    updateSeason,
    removeSeason,
    isMutating: seasonMutating,
  } = useSeasons();

  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [activeSeasonId, setActiveSeasonId] = useState<string | null>(null);
  const [filter, setFilter] = useState<ResultFilter>("all");

  const activeTeam = useMemo(
    () => teams.find((tm) => tm.id === activeTeamId) ?? null,
    [teams, activeTeamId],
  );
  const activeSeason = useMemo(
    () => seasons.find((s) => s.id === activeSeasonId) ?? null,
    [seasons, activeSeasonId],
  );

  useEffect(() => {
    if (activeTeamId === null && teams.length > 0) setActiveTeamId(teams[0].id);
    if (activeTeamId !== null && !teams.some((tm) => tm.id === activeTeamId)) {
      setActiveTeamId(teams[0]?.id ?? null);
    }
  }, [teams, activeTeamId]);

  useEffect(() => {
    if (activeSeasonId === null && seasons.length > 0) setActiveSeasonId(seasons[0].id);
    if (activeSeasonId !== null && !seasons.some((s) => s.id === activeSeasonId)) {
      setActiveSeasonId(seasons[0]?.id ?? null);
    }
  }, [seasons, activeSeasonId]);

  const {
    records,
    isLoading: recordsLoading,
    createRecord,
    updateRecord,
    removeRecord,
    isMutating,
  } = useBattleRecords({ seasonId: activeSeasonId, teamId: activeTeamId });

  const counts = useMemo(() => tally(records), [records]);
  const filteredRecords = useMemo(
    () => (filter === "all" ? records : records.filter((r) => r.result === filter)),
    [records, filter],
  );

  const teamMembers = useMemo(
    () => (activeTeam?.members ?? []).filter((m): m is TrainedPokemon => m !== null),
    [activeTeam],
  );

  const [seasonDialogOpen, setSeasonDialogOpen] = useState(false);
  const [seasonEditing, setSeasonEditing] = useState<Season | null>(null);
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [recordEditing, setRecordEditing] = useState<BattleRecord | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [seasonDeleteOpen, setSeasonDeleteOpen] = useState(false);

  if (!isAuthenticated) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">
          {t("auth.loginRequired")}
        </Typography>
      </Box>
    );
  }

  const handleSeasonSubmit = async (input: SeasonInput) => {
    if (seasonEditing) {
      await updateSeason(seasonEditing.id, input);
    } else {
      const created = await createSeason(input);
      setActiveSeasonId(created.id);
    }
    setSeasonDialogOpen(false);
  };

  const handleRecordSubmit = async (draft: BattleRecordDraft, seasonId: string) => {
    const input = draftToInput(draft, seasonId);
    if (recordEditing) {
      const { seasonId: _seasonId, ...update } = input;
      await updateRecord(recordEditing.id, update);
    } else {
      await createRecord(input);
    }
    setRecordDialogOpen(false);
  };

  const filterTabs: readonly { readonly value: ResultFilter; readonly label: string }[] = [
    { value: "all", label: `${t("battleRecord.filter.all")} ${counts.total}` },
    { value: "win", label: `${t("battleRecord.result.win")} ${counts.wins}` },
    { value: "loss", label: `${t("battleRecord.result.loss")} ${counts.losses}` },
    { value: "draw", label: `${t("battleRecord.result.draw")} ${counts.draws}` },
  ];

  const showEmptyState =
    !teamsLoading && !seasonsLoading && (teams.length === 0 || seasons.length === 0);

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "240px minmax(0, 1fr)" },
        gap: { xs: 2, md: 3 },
        p: { xs: 2, md: 3 },
        alignItems: "start",
      }}
    >
      {/* 左: チーム選択 + パーティ */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 3,
          border: "1px solid",
          borderColor: palette.edge,
          bgcolor: palette.surface,
          position: { md: "sticky" },
          top: { md: 16 },
        }}
      >
        <FormControl size="small" fullWidth sx={{ mb: 2 }}>
          <InputLabel id="team-select-label">{t("battleRecord.team")}</InputLabel>
          <Select
            labelId="team-select-label"
            label={t("battleRecord.team")}
            value={activeTeam?.id ?? ""}
            onChange={(e) => setActiveTeamId(e.target.value || null)}
            displayEmpty
          >
            {teams.length === 0 && (
              <MenuItem value="" disabled>
                {t("battleRecord.noTeams")}
              </MenuItem>
            )}
            {teams.map((tm) => (
              <MenuItem key={tm.id} value={tm.id}>
                {tm.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <PartyPanel team={activeTeam} />
      </Paper>

      {/* 右: 統計 + 操作 + リスト */}
      <Box>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ alignItems: { sm: "center" }, mb: 2 }}
        >
          <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 220 } }}>
            <InputLabel id="season-select-label">{t("battleRecord.season.label")}</InputLabel>
            <Select
              labelId="season-select-label"
              label={t("battleRecord.season.label")}
              value={activeSeason?.id ?? ""}
              onChange={(e) => setActiveSeasonId(e.target.value || null)}
              displayEmpty
            >
              {seasons.length === 0 && (
                <MenuItem value="" disabled>
                  {t("battleRecord.season.none")}
                </MenuItem>
              )}
              {seasons.map((season) => (
                <MenuItem key={season.id} value={season.id}>
                  {season.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Tooltip title={t("battleRecord.season.new")}>
            <IconButton
              color="primary"
              onClick={() => {
                setSeasonEditing(null);
                setSeasonDialogOpen(true);
              }}
              aria-label={t("battleRecord.season.new")}
            >
              <Add />
            </IconButton>
          </Tooltip>
          {activeSeason && (
            <>
              <Tooltip title={t("common.edit")}>
                <IconButton
                  onClick={() => {
                    setSeasonEditing(activeSeason);
                    setSeasonDialogOpen(true);
                  }}
                  aria-label={t("common.edit")}
                >
                  <Edit />
                </IconButton>
              </Tooltip>
              <Tooltip title={t("common.delete")}>
                <IconButton
                  color="error"
                  onClick={() => setSeasonDeleteOpen(true)}
                  aria-label={t("common.delete")}
                >
                  <Delete />
                </IconButton>
              </Tooltip>
            </>
          )}
          <Box sx={{ flexGrow: 1 }} />
          <Button
            component={Link}
            href="/battle-analytics"
            startIcon={<InsightsRounded />}
            variant="outlined"
          >
            {t("battleRecord.viewAnalytics")}
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            disabled={!activeSeasonId}
            onClick={() => {
              setRecordEditing(null);
              setRecordDialogOpen(true);
            }}
          >
            {t("battleRecord.recordBattle")}
          </Button>
        </Stack>

        {showEmptyState ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {teams.length === 0
                ? t("battleRecord.needTeam")
                : t("battleRecord.season.emptyPrompt")}
            </Typography>
            {teams.length === 0 ? (
              <Button component={Link} href="/team-builder" variant="contained">
                {t("navigation.items.createTeam")}
              </Button>
            ) : (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => {
                  setSeasonEditing(null);
                  setSeasonDialogOpen(true);
                }}
              >
                {t("battleRecord.season.new")}
              </Button>
            )}
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 2 }}>
              <StatsBar records={records} />
            </Box>

            <Tabs
              value={filter}
              onChange={(_, value: ResultFilter) => setFilter(value)}
              sx={{ mb: 2, minHeight: 36 }}
              variant="scrollable"
              scrollButtons="auto"
            >
              {filterTabs.map((tab) => (
                <Tab
                  key={tab.value}
                  value={tab.value}
                  label={tab.label}
                  sx={{ minHeight: 36, py: 0 }}
                />
              ))}
            </Tabs>

            {recordsLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress />
              </Box>
            ) : (
              <BattleRecordList
                records={filteredRecords}
                formatLabel={activeSeason?.name}
                onEdit={(record) => {
                  setRecordEditing(record);
                  setRecordDialogOpen(true);
                }}
                onDelete={(id) => setPendingDelete(id)}
              />
            )}
          </>
        )}
      </Box>

      {/* ダイアログ群 */}
      <SeasonFormDialog
        open={seasonDialogOpen}
        onClose={() => setSeasonDialogOpen(false)}
        editing={seasonEditing}
        onSubmit={handleSeasonSubmit}
        submitting={seasonMutating}
      />

      <BattleRecordFormDialog
        open={recordDialogOpen}
        onClose={() => setRecordDialogOpen(false)}
        editing={recordEditing}
        teamMembers={teamMembers}
        teamId={activeTeamId}
        seasons={seasons}
        defaultSeasonId={activeSeasonId}
        onSubmit={handleRecordSubmit}
        submitting={isMutating}
      />

      {/* 記録削除の確認 */}
      <Dialog open={pendingDelete !== null} onClose={() => setPendingDelete(null)}>
        <DialogTitle>{t("battleRecord.deleteTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t("battleRecord.deleteConfirm")}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingDelete(null)}>{t("common.cancel")}</Button>
          <Button
            color="error"
            variant="contained"
            onClick={async () => {
              if (pendingDelete) await removeRecord(pendingDelete);
              setPendingDelete(null);
            }}
          >
            {t("common.delete")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* シーズン削除の確認 */}
      <Dialog open={seasonDeleteOpen} onClose={() => setSeasonDeleteOpen(false)}>
        <DialogTitle>{t("battleRecord.season.deleteTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("battleRecord.season.deleteConfirm", { name: activeSeason?.name ?? "" })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSeasonDeleteOpen(false)}>{t("common.cancel")}</Button>
          <Button
            color="error"
            variant="contained"
            onClick={async () => {
              if (activeSeason) await removeSeason(activeSeason.id);
              setSeasonDeleteOpen(false);
            }}
          >
            {t("common.delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
