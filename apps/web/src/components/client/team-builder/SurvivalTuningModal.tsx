import {
  alpha,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import { championsPokemonList, type ChampionsPokemon } from "@/data/champions-pokemon";
import { moveById, moveByIdentifier } from "@/data/moves";
import { typeIcon } from "@/lib/image";
import { type EV } from "@/types/pokemon";
import { type TrainedPokemon } from "@/store/team/team";
import {
  optimizeSurvival,
  type SurvivalTuningContext,
  type SurvivalOptimizationResult,
} from "@/data/utility/survivalCalc";
import { calcHp } from "@/data/utility/training";
import { resolveDamageInput, type ResolveContext } from "@/lib/damage/resolve";
import { calculate } from "@/lib/damage/engine";
import type { Weather, Terrain } from "@/lib/damage";

interface CurrentSurvivalStatus {
  survivingRolls: number;
  survivalRate: number;
  maxDamage: number;
  hpStat: number;
}

interface SurvivalTuningModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onApply: (evs: { hp: EV; def: EV; spd: EV }) => void;
  readonly ongoing: TrainedPokemon;
  readonly activePokemon: ChampionsPokemon;
  readonly remainingEvs: number;
}

export function SurvivalTuningModal({
  open,
  onClose,
  onApply,
  ongoing,
  activePokemon,
  remainingEvs,
}: SurvivalTuningModalProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  const currentBulkEvs = (ongoing.evs?.hp ?? 0) + (ongoing.evs?.def ?? 0) + (ongoing.evs?.spd ?? 0);
  const availablePool = currentBulkEvs + remainingEvs;

  // 仮想敵ポケモン
  const [opponentIdentifier, setOpponentIdentifier] = useState<string>("incineroar");
  const opponentPokemon = useMemo(() => {
    return (
      championsPokemonList.find((p) => p.identifier === opponentIdentifier) ??
      championsPokemonList[0]
    );
  }, [opponentIdentifier]);

  // 仮想敵の技一覧 (攻撃技のみ)
  const availableMoves = useMemo(() => {
    if (!opponentPokemon) return [];
    return opponentPokemon.moves
      .map((id) => moveById.get(id))
      .filter((m): m is NonNullable<typeof m> => !!m && m.category !== "status")
      .toSorted((a, b) => (b.power ?? 0) - (a.power ?? 0));
  }, [opponentPokemon]);

  const [selectedMoveIdentifier, setSelectedMoveIdentifier] = useState<string | null>(null);

  // 選択中の技が候補になければ先頭の技を採用（render時に導出）
  const effectiveMoveIdentifier = useMemo(() => {
    if (
      selectedMoveIdentifier &&
      availableMoves.some((m) => m.identifier === selectedMoveIdentifier)
    ) {
      return selectedMoveIdentifier;
    }
    return availableMoves[0]?.identifier ?? "";
  }, [availableMoves, selectedMoveIdentifier]);

  // 攻撃側の設定
  const [atkNatureBoost, setAtkNatureBoost] = useState<boolean>(true);
  const [atkEv, setAtkEv] = useState<number>(32);
  const [opponentItem, setOpponentItem] = useState<string | null>(null);

  // 耐えライン (生存基準)
  // 16 = 確定耐え (100%), 15 = 最高乱数以外耐え (93.8%), 14 = 87.5%, 12 = 75.0%, 8 = 50.0%
  const [minSurvivingRolls, setMinSurvivingRolls] = useState<number>(16);

  // 環境設定
  const [weather] = useState<Weather>("none");
  const [terrain] = useState<Terrain>("none");
  const [isDoubles, setIsDoubles] = useState<boolean>(true);
  const [reflect, setReflect] = useState<boolean>(false);
  const [lightScreen, setLightScreen] = useState<boolean>(false);
  const [auroraVeil, setAuroraVeil] = useState<boolean>(false);

  // 最適化計算結果
  const [calcResult, setCalcResult] = useState<SurvivalOptimizationResult | null>(null);
  const [currentStatus, setCurrentStatus] = useState<CurrentSurvivalStatus | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  // 計算のトリガー
  useEffect(() => {
    if (!open || !opponentPokemon || !effectiveMoveIdentifier) {
      return;
    }

    const moveObj = moveByIdentifier.get(effectiveMoveIdentifier);
    if (!moveObj) return;

    const isPhysical = moveObj.category === "physical";
    const natureObj: Record<string, number> = {};
    if (atkNatureBoost) {
      natureObj[isPhysical ? "atk" : "spa"] = 1.1;
    }

    const ctx: SurvivalTuningContext = {
      attacker: {
        identifier: opponentPokemon.identifier,
        move: effectiveMoveIdentifier,
        ability: opponentPokemon.abilities[0]
          ? typeof opponentPokemon.abilities[0] === "string"
            ? opponentPokemon.abilities[0]
            : null
          : null,
        item: opponentItem,
        boosts: {},
        evHp: 0,
        evAtk: isPhysical ? atkEv : 0,
        evDef: 0,
        evSpa: !isPhysical ? atkEv : 0,
        evSpd: 0,
        evSpe: 0,
        hpPercent: 100,
        conditions: {},
        moveConditions: {},
        itemConditions: {},
        natures: natureObj,
      },
      defenderBase: {
        identifier: activePokemon.identifier,
        nature: ongoing.nature ?? {},
        baseStats: {
          hp: activePokemon.status[0],
          def: activePokemon.status[2],
          spd: activePokemon.status[4],
        },
        item: ongoing.item ? String(ongoing.item) : null,
      },
      environment: {
        weather,
        terrain,
        isDoubles,
        screens: { reflect, lightScreen, auroraVeil },
        isCrit: false,
      },
      availablePool,
      options: {
        minSurvivingRolls,
      },
    };

    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setIsCalculating(true);
    });

    void (async () => {
      // 1. 耐え調整の計算
      try {
        const res = await optimizeSurvival(ctx);
        if (!cancelled) {
          setCalcResult(res);
          setIsCalculating(false);
        }
      } catch (err) {
        console.error("Failed to calculate survival tuning:", err);
        if (!cancelled) setIsCalculating(false);
      }

      // 2. 現在の配分でのダメージ計算
      const defMultiplier =
        ongoing.nature?.plus === "def" ? 1.1 : ongoing.nature?.minus === "def" ? 0.9 : 1.0;
      const spdMultiplier =
        ongoing.nature?.plus === "spd" ? 1.1 : ongoing.nature?.minus === "spd" ? 0.9 : 1.0;

      const currentH = calcHp(activePokemon.status[0], ongoing.evs?.hp ?? 0);
      const currentResolveCtx: ResolveContext = {
        attacker: ctx.attacker,
        defender: {
          identifier: activePokemon.identifier,
          move: null,
          ability: activePokemon.abilities[0]
            ? typeof activePokemon.abilities[0] === "string"
              ? activePokemon.abilities[0]
              : null
            : null,
          item: ongoing.item ? String(ongoing.item) : null,
          boosts: {},
          evHp: ongoing.evs?.hp ?? 0,
          evAtk: 0,
          evDef: ongoing.evs?.def ?? 0,
          evSpa: 0,
          evSpd: ongoing.evs?.spd ?? 0,
          evSpe: 0,
          hpPercent: 100,
          conditions: {},
          moveConditions: {},
          itemConditions: {},
          natures: {
            def: defMultiplier,
            spd: spdMultiplier,
          },
        },
        weather,
        terrain,
        fairyAura: false,
        wonderRoom: false,
        gravity: false,
        screens: { reflect, lightScreen, auroraVeil },
        isDoubles,
        isCrit: false,
      };

      const curDmgInput = resolveDamageInput(currentResolveCtx);
      if (curDmgInput) {
        try {
          const curOut = await calculate(curDmgInput);
          if (!cancelled) {
            const survivingRolls = curOut.rolls.filter((dmg) => dmg < currentH).length;
            setCurrentStatus({
              survivingRolls,
              survivalRate: survivingRolls / 16,
              maxDamage: curOut.max,
              hpStat: currentH,
            });
          }
        } catch {
          if (!cancelled) setCurrentStatus(null);
        }
      } else {
        if (!cancelled) setCurrentStatus(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    open,
    opponentPokemon,
    effectiveMoveIdentifier,
    atkNatureBoost,
    atkEv,
    opponentItem,
    minSurvivingRolls,
    weather,
    terrain,
    isDoubles,
    reflect,
    lightScreen,
    auroraVeil,
    ongoing,
    activePokemon,
    remainingEvs,
    availablePool,
  ]);

  const candidateToShow = calcResult?.best ?? calcResult?.fallback ?? null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            p: 1,
          },
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>
        {t("teamBuilder.survivalModalTitle")}
      </DialogTitle>

      <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        {/* 1. 仮想敵 & 技の選択 */}
        <Stack spacing={2}>
          <Autocomplete
            options={championsPokemonList}
            getOptionLabel={(option) => t(`pokemon.${option.identifier}.name`)}
            value={opponentPokemon}
            onChange={(_, val) => {
              if (val) setOpponentIdentifier(val.identifier);
            }}
            renderInput={(params) => (
              <TextField {...params} label={t("teamBuilder.survivalOpponent")} size="small" />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props} key={option.id} sx={{ display: "flex", gap: 1 }}>
                <Typography>{t(`pokemon.${option.identifier}.name`)}</Typography>
              </Box>
            )}
          />

          <FormControl size="small" fullWidth>
            <InputLabel id="survival-move-label">{t("teamBuilder.survivalMove")}</InputLabel>
            <Select
              labelId="survival-move-label"
              value={effectiveMoveIdentifier}
              label={t("teamBuilder.survivalMove")}
              onChange={(e) => setSelectedMoveIdentifier(e.target.value)}
            >
              {availableMoves.map((m) => (
                <MenuItem key={m.id} value={m.identifier}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <Avatar src={typeIcon(m.type)} sx={{ width: 18, height: 18 }} />
                    <Typography sx={{ fontSize: "0.875rem" }}>
                      {t(`moves.${m.identifier}.name`)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      (威力: {m.power ?? "-"})
                    </Typography>
                  </Stack>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {/* 2. 仮想敵の攻撃力・持ち物 */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: "center" }}>
          <FormControlLabel
            control={
              <Switch
                checked={atkNatureBoost}
                onChange={(e) => setAtkNatureBoost(e.target.checked)}
                size="small"
              />
            }
            label={
              <Typography variant="body2">{t("teamBuilder.survivalAtkNature")} (1.1x)</Typography>
            }
          />

          <TextField
            label={t("teamBuilder.survivalAtkEv")}
            type="number"
            size="small"
            value={atkEv}
            onChange={(e) => setAtkEv(Math.max(0, Math.min(32, Number(e.target.value))))}
            slotProps={{ htmlInput: { min: 0, max: 32 } }}
            sx={{ width: { xs: "100%", sm: 120 } }}
          />

          <FormControl size="small" sx={{ flexGrow: 1, width: { xs: "100%", sm: "auto" } }}>
            <InputLabel>{t("teamBuilder.survivalItem")}</InputLabel>
            <Select
              value={opponentItem ?? "none"}
              label={t("teamBuilder.survivalItem")}
              onChange={(e) => setOpponentItem(e.target.value === "none" ? null : e.target.value)}
            >
              <MenuItem value="none">{t("teamBuilder.noItem")}</MenuItem>
              <MenuItem value="choice-band">こだわりハチマキ (1.5x)</MenuItem>
              <MenuItem value="choice-specs">こだわりメガネ (1.5x)</MenuItem>
              <MenuItem value="life-orb">いのちのたま (1.3x)</MenuItem>
              <MenuItem value="type-boost">タイプ強化アイテム (1.2x)</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {/* 3. 耐えライン（生存基準） */}
        <FormControl size="small" fullWidth>
          <InputLabel>{t("teamBuilder.survivalTarget")}</InputLabel>
          <Select
            value={minSurvivingRolls}
            label={t("teamBuilder.survivalTarget")}
            onChange={(e) => setMinSurvivingRolls(Number(e.target.value))}
          >
            <MenuItem value={16}>{t("teamBuilder.survivalGuaranteed")}</MenuItem>
            <MenuItem value={15}>{t("teamBuilder.survivalHighestRollExcluded")}</MenuItem>
            <MenuItem value={14}>{t("teamBuilder.survivalHighChance")}</MenuItem>
            <MenuItem value={12}>{t("teamBuilder.survivalMediumChance")}</MenuItem>
            <MenuItem value={8}>{t("teamBuilder.survivalFiftyFifty")}</MenuItem>
          </Select>
        </FormControl>

        {/* 4. 環境設定 (天候、フィールド、壁、ダブル) */}
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
          <Chip
            label={t("teamBuilder.survivalDoubles")}
            color={isDoubles ? "primary" : "default"}
            variant={isDoubles ? "filled" : "outlined"}
            size="small"
            clickable
            onClick={() => setIsDoubles(!isDoubles)}
          />
          <Chip
            label={t("teamBuilder.survivalReflect")}
            color={reflect ? "info" : "default"}
            variant={reflect ? "filled" : "outlined"}
            size="small"
            clickable
            onClick={() => setReflect(!reflect)}
          />
          <Chip
            label={t("teamBuilder.survivalLightScreen")}
            color={lightScreen ? "info" : "default"}
            variant={lightScreen ? "filled" : "outlined"}
            size="small"
            clickable
            onClick={() => setLightScreen(!lightScreen)}
          />
          <Chip
            label={t("teamBuilder.survivalAuroraVeil")}
            color={auroraVeil ? "info" : "default"}
            variant={auroraVeil ? "filled" : "outlined"}
            size="small"
            clickable
            onClick={() => setAuroraVeil(!auroraVeil)}
          />
        </Stack>

        <Divider />

        {/* 5. 最適化計算結果のプレビュー */}
        {isCalculating && <LinearProgress />}

        {candidateToShow && (
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: calcResult?.achieved
                ? alpha(theme.palette.success.main, 0.08)
                : alpha(theme.palette.warning.main, 0.08),
              border: "1px solid",
              borderColor: calcResult?.achieved
                ? alpha(theme.palette.success.main, 0.3)
                : alpha(theme.palette.warning.main, 0.3),
            }}
          >
            <Stack spacing={2}>
              <Typography
                variant="subtitle2"
                color={calcResult?.achieved ? "success.main" : "warning.main"}
                sx={{ fontWeight: 700 }}
              >
                {calcResult?.achieved
                  ? t("teamBuilder.survivalAchieved")
                  : t("teamBuilder.survivalFailed")}
              </Typography>

              {/* 1. 調整後の目標配分 */}
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1.5,
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Stack
                  direction="row"
                  spacing={2}
                  sx={{ justifyContent: "space-between", alignItems: "center" }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "primary.main" }}>
                    {t("teamBuilder.survivalTunedSpread")}: H{candidateToShow.evs.hp} / B
                    {candidateToShow.evs.def} / D{candidateToShow.evs.spd}
                  </Typography>
                  <Chip
                    size="small"
                    label={t("teamBuilder.survivalTotalCost", { cost: candidateToShow.totalUsed })}
                    color={candidateToShow.totalUsed === 0 ? "success" : "primary"}
                    variant="outlined"
                  />
                </Stack>

                <Stack
                  direction="row"
                  spacing={2}
                  sx={{ justifyContent: "space-between", mt: 0.75 }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {t("teamBuilder.survivalSurvivingRolls", {
                      rolls: candidateToShow.survivingRolls,
                      rate: Math.round(candidateToShow.survivalRate * 1000) / 10,
                    })}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t("teamBuilder.survivalMaxDamage", {
                      damage: candidateToShow.maxDamage,
                      hp: candidateToShow.hpStat,
                    })}
                  </Typography>
                </Stack>

                {candidateToShow.totalUsed === 0 && (
                  <Typography
                    variant="caption"
                    color="success.main"
                    sx={{ display: "block", mt: 0.5, fontWeight: 600 }}
                  >
                    {t("teamBuilder.survivalZeroCostNotice")}
                  </Typography>
                )}
              </Box>

              {/* 2. 現在の配分での状況 */}
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1.5,
                  bgcolor: alpha(theme.palette.action.hover, 0.04),
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Stack
                  direction="row"
                  spacing={2}
                  sx={{ justifyContent: "space-between", alignItems: "center" }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "text.secondary" }}>
                    {t("teamBuilder.survivalCurrentEvs", {
                      hp: ongoing.evs?.hp ?? 0,
                      def: ongoing.evs?.def ?? 0,
                      spd: ongoing.evs?.spd ?? 0,
                      cost: currentBulkEvs,
                    })}
                  </Typography>
                </Stack>

                {currentStatus && (
                  <Stack
                    direction="row"
                    spacing={2}
                    sx={{ justifyContent: "space-between", mt: 0.75 }}
                  >
                    <Typography
                      variant="caption"
                      color={
                        currentStatus.survivingRolls >= minSurvivingRolls
                          ? "success.main"
                          : "error.main"
                      }
                      sx={{ fontWeight: 600 }}
                    >
                      {t("teamBuilder.survivalSurvivingRolls", {
                        rolls: currentStatus.survivingRolls,
                        rate: Math.round(currentStatus.survivalRate * 1000) / 10,
                      })}{" "}
                      (
                      {currentStatus.survivingRolls >= minSurvivingRolls
                        ? t("teamBuilder.survivalCurrentSurvived")
                        : t("teamBuilder.survivalCurrentNotSurvived")}
                      )
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t("teamBuilder.survivalMaxDamage", {
                        damage: currentStatus.maxDamage,
                        hp: currentStatus.hpStat,
                      })}
                    </Typography>
                  </Stack>
                )}

                {currentBulkEvs > candidateToShow.totalUsed && (
                  <Typography
                    variant="caption"
                    color="info.main"
                    sx={{ display: "block", mt: 0.75, fontWeight: 600 }}
                  >
                    {t("teamBuilder.survivalDiffSave", {
                      diff: currentBulkEvs - candidateToShow.totalUsed,
                    })}
                  </Typography>
                )}
                {currentBulkEvs < candidateToShow.totalUsed && (
                  <Typography
                    variant="caption"
                    color="warning.main"
                    sx={{ display: "block", mt: 0.75, fontWeight: 600 }}
                  >
                    {t("teamBuilder.survivalDiffNeed", {
                      diff: candidateToShow.totalUsed - currentBulkEvs,
                    })}
                  </Typography>
                )}
                {currentBulkEvs === candidateToShow.totalUsed &&
                  (ongoing.evs?.hp !== candidateToShow.evs.hp ||
                    ongoing.evs?.def !== candidateToShow.evs.def ||
                    ongoing.evs?.spd !== candidateToShow.evs.spd) && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mt: 0.75, fontWeight: 500 }}
                    >
                      {t("teamBuilder.survivalDiffAdjust")}
                    </Typography>
                  )}
              </Box>
            </Stack>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          {t("teamBuilder.survivalClose")}
        </Button>
        <Button
          variant="contained"
          color="primary"
          disabled={!candidateToShow}
          onClick={() => {
            if (candidateToShow) {
              onApply({
                hp: candidateToShow.evs.hp as EV,
                def: candidateToShow.evs.def as EV,
                spd: candidateToShow.evs.spd as EV,
              });
              onClose();
            }
          }}
          sx={{ fontWeight: 600 }}
        >
          {t("teamBuilder.survivalApplyAdjustment")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
