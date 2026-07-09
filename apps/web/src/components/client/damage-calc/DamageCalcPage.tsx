"use client";

import {
  Box,
  Button,
  ButtonGroup,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { getAppPalette } from "@/theme/palette";
import { preloadDamageEngine } from "@/lib/damage";
import type { Weather, Terrain } from "@/lib/damage";
import { PokemonPanel } from "./PokemonPanel";
import { ResultPanel } from "./ResultPanel";
import { useDamageCalcPage } from "./useDamageCalcPage";

export default function DamageCalcPage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const palette = getAppPalette(theme.palette.mode);

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
    screens,
    setScreens,
    isDoubles,
    setIsDoubles,
    isCrit,
    setIsCrit,
    result,
  } = useDamageCalcPage();

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

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: "auto" }}>
      {/* Title + Singles/Doubles toggle */}
      <Stack direction="row" sx={{ alignItems: "center", mb: 3, gap: 2, flexWrap: "wrap" }}>
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

      {/* Attacker / Defender panels */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 3,
          mb: 3,
        }}
      >
        <PokemonPanel
          label={t("damageCalc.attacker")}
          role="attacker"
          value={attacker}
          onChange={setAttacker}
          activeMove={attacker.move}
        />
        <PokemonPanel
          label={t("damageCalc.defender")}
          role="defender"
          value={defender}
          onChange={setDefender}
          activeMove={attacker.move}
          screens={screens}
          onScreensChange={setScreens}
        />
      </Box>

      {/* Field Conditions */}
      <Paper
        elevation={0}
        sx={{
          px: 6,
          py: 3,
          mb: 3,
          border: "1px solid",
          borderColor: palette.edge,
          borderRadius: 3,
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
          {t("damageCalc.field")}
        </Typography>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          {/* Weather row */}
          <Box>
            <Typography
              variant="caption"
              sx={{ fontWeight: 600, mb: 0.75, display: "block", color: "text.secondary" }}
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
                  sx={{ px: 1.5, py: 0.5, fontSize: 12, lineHeight: 1.4 }}
                >
                  {opt.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          {/* Terrain row */}
          <Box>
            <Typography
              variant="caption"
              sx={{ fontWeight: 600, mb: 0.75, display: "block", color: "text.secondary" }}
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
                  sx={{ px: 1.5, py: 0.5, fontSize: 12, lineHeight: 1.4 }}
                >
                  {opt.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
        </Stack>
      </Paper>

      {/* Result */}
      <ResultPanel result={result} isCrit={isCrit} onCritChange={setIsCrit} />
    </Box>
  );
}
