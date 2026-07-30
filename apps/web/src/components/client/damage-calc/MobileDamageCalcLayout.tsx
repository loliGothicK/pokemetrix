"use client";

import {
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Button,
  ButtonGroup,
  Chip,
  Divider,
  Drawer,
  LinearProgress,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import SportsKabaddiRoundedIcon from "@mui/icons-material/SportsKabaddiRounded";
import NatureRoundedIcon from "@mui/icons-material/NatureRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import { SurfaceCard } from "@/components/common/SurfaceCard";
import type { Weather, Terrain } from "@/lib/damage";
import { PokemonPanel } from "./PokemonPanel";
import { ResultPanel, HpBar } from "./ResultPanel";
import type { PokemonPanelState, DamageCalcResult } from "./useDamageCalcPage";

// ── Colour maps (mirrored from DamageCalcPage) ──────────────────────────────
const WEATHER_COLORS: Record<Weather, string | null> = {
  none: null,
  sun: "#f57c00",
  rain: "#1565c0",
  snow: "#4fc3f7",
  sandstorm: "#8d6e63",
};

const TERRAIN_COLORS: Record<Terrain, string | null> = {
  none: null,
  electric: "#f9a825",
  grassy: "#388e3c",
  misty: "#e91e63",
  psychic: "#7b1fa2",
};

const FIELD_EFFECT_COLORS: Record<string, string> = {
  fairyAura: "#e91e63",
  wonderRoom: "#7b1fa2",
};

// ── Bottom navigation tab indices (3 tabs — no Result tab) ───────────────────
const TAB_ATTACKER = 0;
const TAB_FIELD = 1;
const TAB_DEFENDER = 2;

// ── Field Conditions panel (mobile-only inline version) ──────────────────────

type FieldConditionsPanelProps = {
  readonly weather: Weather;
  readonly setWeather: (v: Weather) => void;
  readonly terrain: Terrain;
  readonly setTerrain: (v: Terrain) => void;
  readonly fairyAura: boolean;
  readonly setFairyAura: (v: boolean) => void;
  readonly wonderRoom: boolean;
  readonly setWonderRoom: (v: boolean) => void;
  readonly screens: { reflect: boolean; lightScreen: boolean; auroraVeil: boolean };
  readonly setScreens: (updater: { reflect: boolean; lightScreen: boolean; auroraVeil: boolean } | ((prev: { reflect: boolean; lightScreen: boolean; auroraVeil: boolean }) => { reflect: boolean; lightScreen: boolean; auroraVeil: boolean })) => void;
  readonly isDoubles: boolean;
  readonly setIsDoubles: (v: boolean) => void;
};

function MobileFieldConditionsPanel({
  weather,
  setWeather,
  terrain,
  setTerrain,
  fairyAura,
  setFairyAura,
  wonderRoom,
  setWonderRoom,
  screens,
  setScreens,
  isDoubles,
  setIsDoubles,
}: FieldConditionsPanelProps) {
  const { t } = useTranslation();

  const activeColorSx = (color: string | null, active: boolean) =>
    color && active
      ? {
          px: 1.5,
          py: 0.5,
          fontSize: 12,
          lineHeight: 1.4,
          color: "#fff",
          bgcolor: color,
          borderColor: `${color} !important`,
          "&:hover": { bgcolor: color, opacity: 0.85 },
          "&.Mui-selected": { bgcolor: color, color: "#fff", borderColor: `${color} !important` },
        }
      : { px: 1.5, py: 0.5, fontSize: 12, lineHeight: 1.4 };

  const weatherOptions: { value: Weather; label: string }[] = [
    { value: "none", label: t("damageCalc.weatherNone") },
    { value: "sun", label: t("damageCalc.weatherSun") },
    { value: "rain", label: t("damageCalc.weatherRain") },
    { value: "snow", label: t("damageCalc.weatherSnow") },
    { value: "sandstorm", label: t("damageCalc.weatherSandstorm") },
  ];

  const terrainOptions: { value: Terrain; label: string }[] = [
    { value: "none", label: t("damageCalc.weatherNone") },
    { value: "electric", label: t("damageCalc.terrainElectric") },
    { value: "grassy", label: t("damageCalc.terrainGrassy") },
    { value: "misty", label: t("damageCalc.terrainMisty") },
    { value: "psychic", label: t("damageCalc.terrainPsychic") },
  ];

  const fieldEffectOptions = [
    {
      key: "fairyAura",
      label: t("damageCalc.fairyAura"),
      active: fairyAura,
      onToggle: () => setFairyAura(!fairyAura),
    },
    {
      key: "wonderRoom",
      label: t("damageCalc.wonderRoom"),
      active: wonderRoom,
      onToggle: () => setWonderRoom(!wonderRoom),
    },
  ];

  return (
    <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Singles / Doubles toggle */}
      <Box>
        <Typography
          variant="caption"
          sx={{ fontWeight: 600, mb: 1, display: "block", color: "text.secondary" }}
        >
          {t("damageCalc.isDoubles")}
        </Typography>
        <ButtonGroup variant="outlined" size="small" disableElevation>
          <Button
            variant={!isDoubles ? "contained" : "outlined"}
            onClick={() => setIsDoubles(false)}
          >
            {t("damageCalc.singles")}
          </Button>
          <Button
            variant={isDoubles ? "contained" : "outlined"}
            onClick={() => setIsDoubles(true)}
          >
            {t("damageCalc.doubles")}
          </Button>
        </ButtonGroup>
      </Box>

      {/* Weather */}
      <Box>
        <Typography
          variant="caption"
          sx={{ fontWeight: 600, mb: 1, display: "block", color: "text.secondary" }}
        >
          {t("damageCalc.weather")}
        </Typography>
        <ToggleButtonGroup
          value={weather}
          exclusive
          onChange={(_, v) => {
            if (v !== null) setWeather(v as Weather);
          }}
          size="small"
          sx={{ flexWrap: "wrap", gap: 0.5 }}
        >
          {weatherOptions.map((opt) => (
            <ToggleButton
              key={opt.value}
              value={opt.value}
              sx={activeColorSx(WEATHER_COLORS[opt.value], weather === opt.value)}
            >
              {opt.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {/* Terrain */}
      <Box>
        <Typography
          variant="caption"
          sx={{ fontWeight: 600, mb: 1, display: "block", color: "text.secondary" }}
        >
          {t("damageCalc.terrain")}
        </Typography>
        <ToggleButtonGroup
          value={terrain}
          exclusive
          onChange={(_, v) => {
            if (v !== null) setTerrain(v as Terrain);
          }}
          size="small"
          sx={{ flexWrap: "wrap", gap: 0.5 }}
        >
          {terrainOptions.map((opt) => (
            <ToggleButton
              key={opt.value}
              value={opt.value}
              sx={activeColorSx(TERRAIN_COLORS[opt.value], terrain === opt.value)}
            >
              {opt.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {/* Field Effects */}
      <Box>
        <Typography
          variant="caption"
          sx={{ fontWeight: 600, mb: 1, display: "block", color: "text.secondary" }}
        >
          {t("damageCalc.fieldEffects")}
        </Typography>
        <Stack direction="row" sx={{ gap: 0.5, flexWrap: "wrap" }}>
          {fieldEffectOptions.map((opt) => {
            const color = FIELD_EFFECT_COLORS[opt.key];
            return (
              <ToggleButton
                key={opt.key}
                value={opt.key}
                selected={opt.active}
                onChange={opt.onToggle}
                size="small"
                sx={activeColorSx(color, opt.active)}
              >
                {opt.label}
              </ToggleButton>
            );
          })}
        </Stack>
      </Box>

      {/* Screens */}
      <Box>
        <Typography
          variant="caption"
          sx={{ fontWeight: 600, mb: 1, display: "block", color: "text.secondary" }}
        >
          {t("damageCalc.screen")}
        </Typography>
        <Stack direction="row" sx={{ gap: 0.5, flexWrap: "wrap" }}>
          {(
            [
              { key: "reflect", label: t("damageCalc.reflect") },
              { key: "lightScreen", label: t("damageCalc.lightScreen") },
              { key: "auroraVeil", label: t("damageCalc.auroraVeil") },
            ] as const
          ).map(({ key, label }) => (
            <ToggleButton
              key={key}
              value={key}
              selected={screens[key]}
              onChange={() => setScreens({ ...screens, [key]: !screens[key] })}
              size="small"
              sx={{ px: 1.5, py: 0.5, fontSize: 12, lineHeight: 1.4 }}
            >
              {label}
            </ToggleButton>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}

// ── Compact result summary strip (always visible, no output state) ────────────

type MobileResultSummaryProps = {
  readonly result: DamageCalcResult;
};

function MobileResultSummary({ result }: MobileResultSummaryProps) {
  const { t } = useTranslation();
  const { output, analysis, isLoading, missingReason } = result;

  if (isLoading) {
    return (
      <Box sx={{ px: 2, pt: 1 }}>
        <LinearProgress sx={{ borderRadius: 1 }} />
      </Box>
    );
  }

  if (!output) {
    const hint =
      missingReason === "attacker"
        ? t("damageCalc.hintSelectAttacker")
        : missingReason === "move"
          ? t("damageCalc.hintSelectMove")
          : missingReason === "defender"
            ? t("damageCalc.hintSelectDefender")
            : t("damageCalc.noResult");
    return (
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      </Box>
    );
  }

  const hasAnalysis = analysis !== undefined;

  // KO chip calculation (single-hit only for the summary strip)
  let koLabel: string | null = null;
  let koColor: "error" | "warning" | "default" = "default";
  if (hasAnalysis) {
    const defHp =
      analysis.minPercent > 0
        ? Math.round((output.min / analysis.minPercent) * 100)
        : undefined;
    if (defHp) {
      const minKO = output.max > 0 ? Math.ceil(defHp / output.max) : Infinity;
      const maxKO = output.min > 0 ? Math.ceil(defHp / output.min) : Infinity;
      const ohkoChance = output.rolls.filter((r) => r >= defHp).length / output.rolls.length;
      if (minKO === 1 && ohkoChance === 1) {
        koLabel = t("damageCalc.ohko");
        koColor = "error";
      } else if (minKO === 1 && ohkoChance > 0) {
        koLabel = t("damageCalc.ohkoChance", { chance: Math.round(ohkoChance * 100) });
        koColor = "warning";
      } else if (minKO === maxKO) {
        koLabel = t("damageCalc.guaranteedKO", { n: minKO });
        koColor = minKO === 2 ? "warning" : "default";
      } else {
        koLabel = t("damageCalc.possibleKO", { n: minKO });
      }
    }
  }

  const barMin = hasAnalysis ? analysis.minPercent : 0;
  const barMax = hasAnalysis ? analysis.maxPercent : 0;

  return (
    <Box sx={{ px: 2, py: 1.5 }}>
      <Stack direction="row" sx={{ alignItems: "center", gap: 1.5, flexWrap: "wrap", mb: hasAnalysis ? 1.5 : 0 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>
          {t("damageCalc.damageRange", { min: output.min, max: output.max })}
        </Typography>
        {hasAnalysis && (
          <Typography variant="body2" color="text.secondary">
            {t("damageCalc.percentRange", {
              minPercent: analysis.minPercent,
              maxPercent: analysis.maxPercent,
            })}
          </Typography>
        )}
        {koLabel && (
          <Chip
            label={koLabel}
            color={koColor}
            size="small"
            sx={{ height: 22, fontSize: 12, fontWeight: 700 }}
          />
        )}
      </Stack>
      {hasAnalysis && <HpBar minPercent={barMin} maxPercent={barMax} />}
    </Box>
  );
}

// ── Props type ───────────────────────────────────────────────────────────────

type CalcSummary = {
  readonly attackerName: string | null;
  readonly defenderName: string | null;
  readonly moveName: string | null;
  readonly attackerEvs: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
  readonly defenderEvs: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
  readonly weather: string | null;
  readonly terrain: string | null;
  readonly fairyAura: boolean;
  readonly wonderRoom: boolean;
  readonly isDoubles: boolean;
  readonly isCrit: boolean;
  readonly screens: { reflect: boolean; lightScreen: boolean; auroraVeil: boolean };
  readonly attackerItem: string | null;
  readonly attackerConditions: Readonly<Record<string, boolean>>;
  readonly defenderConditions: Readonly<Record<string, boolean>>;
};

type MobileDamageCalcLayoutProps = {
  readonly attacker: PokemonPanelState;
  readonly setAttacker: (updater: PokemonPanelState | ((prev: PokemonPanelState) => PokemonPanelState)) => void;
  readonly defender: PokemonPanelState;
  readonly setDefender: (updater: PokemonPanelState | ((prev: PokemonPanelState) => PokemonPanelState)) => void;
  readonly weather: Weather;
  readonly setWeather: (v: Weather) => void;
  readonly terrain: Terrain;
  readonly setTerrain: (v: Terrain) => void;
  readonly fairyAura: boolean;
  readonly setFairyAura: (v: boolean) => void;
  readonly wonderRoom: boolean;
  readonly setWonderRoom: (v: boolean) => void;
  readonly screens: { reflect: boolean; lightScreen: boolean; auroraVeil: boolean };
  readonly setScreens: (updater: { reflect: boolean; lightScreen: boolean; auroraVeil: boolean } | ((prev: { reflect: boolean; lightScreen: boolean; auroraVeil: boolean }) => { reflect: boolean; lightScreen: boolean; auroraVeil: boolean })) => void;
  readonly isDoubles: boolean;
  readonly setIsDoubles: (v: boolean) => void;
  readonly isCrit: boolean;
  readonly setIsCrit: (v: boolean) => void;
  readonly result: DamageCalcResult;
  readonly summary: CalcSummary;
};

// ── Main component ───────────────────────────────────────────────────────────

const BOTTOM_NAV_HEIGHT = 56;

export function MobileDamageCalcLayout({
  attacker,
  setAttacker,
  defender,
  setDefender,
  weather,
  setWeather,
  terrain,
  setTerrain,
  fairyAura,
  setFairyAura,
  wonderRoom,
  setWonderRoom,
  screens,
  setScreens,
  isDoubles,
  setIsDoubles,
  isCrit,
  setIsCrit,
  result,
  summary,
}: MobileDamageCalcLayoutProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [activeTab, setActiveTab] = useState(TAB_ATTACKER);
  const [isResultDrawerOpen, setIsResultDrawerOpen] = useState(false);

  const attackerBorder = isDark ? "rgba(96,165,250,0.45)" : "rgba(21,101,192,0.35)";
  const defenderBorder = isDark ? "rgba(251,146,60,0.45)" : "rgba(194,65,12,0.35)";
  const attackerBg = isDark ? "rgba(59,130,246,0.04)" : "rgba(21,101,192,0.03)";
  const defenderBg = isDark ? "rgba(251,146,60,0.04)" : "rgba(194,65,12,0.03)";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        pb: `${BOTTOM_NAV_HEIGHT}px`,
        minHeight: 0,
      }}
    >
      {/* ── Panel content ────────────────────────────────────────────────── */}
      {activeTab === TAB_ATTACKER && (
        <Box sx={{ p: 2 }}>
          <PokemonPanel
            label={t("damageCalc.attacker")}
            role="attacker"
            value={attacker}
            onChange={setAttacker}
            activeMove={attacker.move}
            isDoubles={isDoubles}
            sx={{ borderColor: attackerBorder, bgcolor: attackerBg }}
          />
        </Box>
      )}

      {activeTab === TAB_FIELD && (
        <SurfaceCard sx={{ m: 2, borderRadius: 3 }}>
          <MobileFieldConditionsPanel
            weather={weather}
            setWeather={setWeather}
            terrain={terrain}
            setTerrain={setTerrain}
            fairyAura={fairyAura}
            setFairyAura={setFairyAura}
            wonderRoom={wonderRoom}
            setWonderRoom={setWonderRoom}
            screens={screens}
            setScreens={setScreens}
            isDoubles={isDoubles}
            setIsDoubles={setIsDoubles}
          />
        </SurfaceCard>
      )}

      {activeTab === TAB_DEFENDER && (
        <Box sx={{ p: 2 }}>
          <PokemonPanel
            label={t("damageCalc.defender")}
            role="defender"
            value={defender}
            onChange={setDefender}
            activeMove={attacker.move}
            isDoubles={isDoubles}
            screens={screens}
            onScreensChange={setScreens}
            sx={{ borderColor: defenderBorder, bgcolor: defenderBg }}
          />
        </Box>
      )}

      {/* ── Fixed Result Summary Strip ── */}
      {result.output && !result.isLoading && !result.isError && (
        <Paper
          elevation={4}
          onClick={() => setIsResultDrawerOpen(true)}
          sx={{
            position: "fixed",
            bottom: BOTTOM_NAV_HEIGHT,
            left: 0,
            right: 0,
            zIndex: theme.zIndex.appBar - 1,
            cursor: "pointer",
            borderTop: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            "&:active": { bgcolor: "action.hover" },
          }}
        >
          <Box sx={{ p: 1, pointerEvents: "none" }}>
            <MobileResultSummary result={result} />
          </Box>
        </Paper>
      )}

      {/* ── Result Drawer ── */}
      <Drawer
        anchor="bottom"
        open={isResultDrawerOpen}
        onClose={() => setIsResultDrawerOpen(false)}
        sx={{
          "& .MuiDrawer-paper": {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            pb: 4,
            maxHeight: "85vh",
          },
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 4,
            bgcolor: "divider",
            borderRadius: 2,
            mx: "auto",
            mt: 1.5,
            mb: 1,
          }}
        />
        <Box sx={{ px: 2, pb: 2, overflowY: "auto" }}>
          <ResultPanel
            result={result}
            isCrit={isCrit}
            onCritChange={setIsCrit}
            summary={summary}
          />
        </Box>
      </Drawer>

      {/* ── Fixed bottom navigation ───────────────────────────────────────── */}
      <Paper
        elevation={8}
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: theme.zIndex.appBar,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <BottomNavigation
          showLabels
          value={activeTab}
          onChange={(_, v: number) => setActiveTab(v)}
          sx={{ height: BOTTOM_NAV_HEIGHT }}
        >
          <BottomNavigationAction
            id="mobile-tab-attacker"
            label={t("damageCalc.attacker")}
            icon={<SportsKabaddiRoundedIcon />}
          />
          <BottomNavigationAction
            id="mobile-tab-field"
            label={t("damageCalc.fieldTab")}
            icon={<NatureRoundedIcon />}
          />
          <BottomNavigationAction
            id="mobile-tab-defender"
            label={t("damageCalc.defender")}
            icon={<ShieldRoundedIcon />}
          />
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
