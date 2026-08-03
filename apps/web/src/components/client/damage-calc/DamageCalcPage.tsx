"use client";

import {
  Box,
  Button,
  ButtonGroup,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { preloadDamageEngine } from "@/lib/damage";
import type { Weather, Terrain } from "@/lib/damage";
import { SurfaceCard } from "@/components/common/SurfaceCard";
import { flexRowCenter } from "@/theme/sx";
import { PokemonPanel } from "./PokemonPanel";
import { ResultPanel } from "./ResultPanel";
import { useDamageCalcPage } from "./useDamageCalcPage";
import { MobileDamageCalcLayout } from "./MobileDamageCalcLayout";

// ----------------------------------------------------------------
// Weather & terrain: active-button colours
// ----------------------------------------------------------------
const WEATHER_COLORS: Record<Weather, string | null> = {
  none: null,
  sun: "#f57c00", // orange
  rain: "#1565c0", // blue
  snow: "#4fc3f7", // light-blue
  sandstorm: "#8d6e63", // brown
};

const TERRAIN_COLORS: Record<Terrain, string | null> = {
  none: null,
  electric: "#f9a825", // yellow
  grassy: "#388e3c", // green
  misty: "#e91e63", // pink
  psychic: "#7b1fa2", // purple
};

const FIELD_EFFECT_COLORS: Record<string, string> = {
  fairyAura: "#e91e63", // pink
  wonderRoom: "#7b1fa2", // purple
};

export default function DamageCalcPage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  useEffect(() => {
    preloadDamageEngine();
  }, []);

  const {
    attacker,
    defender,
    setAttacker,
    setDefender,
    weather,
    setWeather,
    terrain,
    setTerrain,
    fairyAura,
    setFairyAura,
    wonderRoom,
    setWonderRoom,
    gravity,
    setGravity,
    screens,
    setScreens,
    isDoubles,
    setIsDoubles,
    isCrit,
    setIsCrit,
    critDisabled,
    result,
  } = useDamageCalcPage();

  const weatherOptions: { value: Weather; label: string }[] = [
    { value: "sun", label: t("damageCalc.weatherSun") },
    { value: "rain", label: t("damageCalc.weatherRain") },
    { value: "snow", label: t("damageCalc.weatherSnow") },
    { value: "sandstorm", label: t("damageCalc.weatherSandstorm") },
  ];

  const terrainOptions: { value: Terrain; label: string }[] = [
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
    {
      key: "gravity",
      label: t("damageCalc.condGravity"),
      active: gravity,
      onToggle: () => setGravity(!gravity),
    },
  ];

  // Helper: per-button sx that applies a colour when active
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

  // Panel tint colours
  const attackerBorder = isDark ? "rgba(96,165,250,0.45)" : "rgba(21,101,192,0.35)";
  const defenderBorder = isDark ? "rgba(251,146,60,0.45)" : "rgba(194,65,12,0.35)";
  const attackerBg = isDark ? "rgba(59,130,246,0.04)" : "rgba(21,101,192,0.03)";
  const defenderBg = isDark ? "rgba(251,146,60,0.04)" : "rgba(194,65,12,0.03)";

  // Summary props for ResultPanel
  const summary = {
    attackerName: attacker.identifier,
    defenderName: defender.identifier,
    moveName: attacker.move,
    attackerEvs: {
      hp: attacker.evHp,
      atk: attacker.evAtk,
      def: attacker.evDef,
      spa: attacker.evSpa,
      spd: attacker.evSpd,
      spe: attacker.evSpe,
    },
    defenderEvs: {
      hp: defender.evHp,
      atk: defender.evAtk,
      def: defender.evDef,
      spa: defender.evSpa,
      spd: defender.evSpd,
      spe: defender.evSpe,
    },
    weather: weather !== "none" ? weather : null,
    terrain: terrain !== "none" ? terrain : null,
    fairyAura,
    wonderRoom,
    isDoubles,
    isCrit,
    screens,
    attackerItem: attacker.item,
    attackerConditions: attacker.conditions,
    defenderConditions: defender.conditions,
  };

  // ── Mobile layout (xs/sm) ────────────────────────────────────────────────
  if (isMobile) {
    return (
      <MobileDamageCalcLayout
        attacker={attacker}
        setAttacker={setAttacker}
        defender={defender}
        setDefender={setDefender}
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
        isCrit={isCrit}
        setIsCrit={setIsCrit}
        result={result}
        summary={summary}
      />
    );
  }

  // ── Desktop layout (md+) – unchanged ────────────────────────────────────
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1536, mx: "auto" }}>
      {/* Title + Singles/Doubles toggle */}
      <Stack direction="row" sx={{ ...flexRowCenter, mb: 3, gap: 2, flexWrap: "wrap" }}>
        <Typography variant="h5" sx={{ fontWeight: 700, flexGrow: 1 }}>
          {t("damageCalc.title")}
        </Typography>
        <ButtonGroup variant="outlined" size="small" disableElevation>
          <Button
            variant={!isDoubles ? "contained" : "outlined"}
            onClick={() => setIsDoubles(false)}
          >
            {t("damageCalc.singles")}
          </Button>
          <Button variant={isDoubles ? "contained" : "outlined"} onClick={() => setIsDoubles(true)}>
            {t("damageCalc.doubles")}
          </Button>
        </ButtonGroup>
      </Stack>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          gap: 3,
          alignItems: "flex-start",
        }}
      >
        {/* ── Left Column: Inputs ── */}
        <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Attacker / Defender panels */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1fr 1fr" }, gap: 3 }}>
            <PokemonPanel
              label={t("damageCalc.attacker")}
              role="attacker"
              value={attacker}
              onChange={setAttacker}
              activeMove={attacker.move}
              isDoubles={isDoubles}
              sx={{ borderColor: attackerBorder, bgcolor: attackerBg }}
            />
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

          {/* Field Conditions */}
          <SurfaceCard sx={{ px: 6, py: 3, mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              {t("damageCalc.field")}
            </Typography>

            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              sx={{ alignItems: "flex-start" }}
            >
              {/* Weather */}
              <Box>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, mb: 0.75, display: "block", color: "text.secondary" }}
                >
                  {t("damageCalc.weather")}
                </Typography>
                <ToggleButtonGroup
                  value={weather === "none" ? null : weather}
                  exclusive
                  onChange={(_, v) => {
                    setWeather(v === null ? "none" : (v as Weather));
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
                  sx={{ fontWeight: 600, mb: 0.75, display: "block", color: "text.secondary" }}
                >
                  {t("damageCalc.terrain")}
                </Typography>
                <ToggleButtonGroup
                  value={terrain === "none" ? null : terrain}
                  exclusive
                  onChange={(_, v) => {
                    setTerrain(v === null ? "none" : (v as Terrain));
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

              {/* Field Effects — same height as weather/terrain via ToggleButton rows */}
              <Box>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, mb: 0.75, display: "block", color: "text.secondary" }}
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
            </Stack>
          </SurfaceCard>
        </Box>

        {/* ── Right Column: Sticky Result ── */}
        <Box
          sx={{
            width: { lg: 400, xl: 460 },
            flexShrink: 0,
            position: "sticky",
            top: 24, // Matches standard app bar padding/clearance
            // Ensure the sticky panel doesn't extend infinitely if it's too tall
            maxHeight: "calc(100vh - 48px)",
            overflowY: "auto",
          }}
        >
          <ResultPanel
            result={result}
            isCrit={isCrit}
            critDisabled={critDisabled}
            onCritChange={setIsCrit}
            summary={summary}
          />
        </Box>
      </Box>
    </Box>
  );
}
