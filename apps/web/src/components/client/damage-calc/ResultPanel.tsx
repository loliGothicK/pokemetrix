"use client";

import {
  Box,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  ToggleButton,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { getAppPalette } from "@/theme/palette";
import type { DamageCalcResult } from "./useDamageCalcPage";

type ResultPanelProps = {
  readonly result: DamageCalcResult;
  readonly isCrit: boolean;
  readonly onCritChange: (v: boolean) => void;
};

export function ResultPanel({ result, isCrit, onCritChange }: ResultPanelProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const palette = getAppPalette(theme.palette.mode);
  const { output, analysis, isLoading, isError, missingReason } = result;

  const critToggle = (
    <CritToggle isCrit={isCrit} onChange={onCritChange} label={t("damageCalc.isCrit")} />
  );

  if (isLoading) {
    return (
      <Paper
        elevation={0}
        sx={{ p: 2, border: "1px solid", borderColor: palette.edge, borderRadius: 3 }}
      >
        <LinearProgress />
      </Paper>
    );
  }

  if (isError) {
    return (
      <Paper
        elevation={0}
        sx={{ p: 2, border: "1px solid", borderColor: palette.edge, borderRadius: 3 }}
      >
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography color="error" variant="body2">
            {t("damageCalc.calcError")}
          </Typography>
          {critToggle}
        </Stack>
      </Paper>
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
      <Paper
        elevation={0}
        sx={{ p: 2, border: "1px solid", borderColor: palette.edge, borderRadius: 3 }}
      >
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography color="text.secondary" variant="body2">
            {hint}
          </Typography>
          {critToggle}
        </Stack>
      </Paper>
    );
  }

  const hasAnalysis = analysis !== undefined;
  const koLabel = hasAnalysis
    ? getKOLabel(analysis.minHitsToKO, analysis.maxHitsToKO, analysis.ohkoChance, t)
    : null;

  return (
    <Paper
      elevation={0}
      sx={{ px: 6, py: 3, border: "1px solid", borderColor: palette.edge, borderRadius: 3 }}
    >
      <Stack
        direction="row"
        sx={{ justifyContent: "space-between", alignItems: "center", mb: 1.5 }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {t("damageCalc.result")}
        </Typography>
        {critToggle}
      </Stack>

      <Stack spacing={2}>
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: "baseline", flexWrap: "wrap", gap: 1 }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
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
        </Stack>

        {hasAnalysis && koLabel && (
          <Box>
            <Chip
              label={koLabel}
              color={
                analysis.minHitsToKO === 1
                  ? "error"
                  : analysis.minHitsToKO === 2
                    ? "warning"
                    : "default"
              }
              size="small"
              sx={{ fontWeight: 600 }}
            />
          </Box>
        )}

        {hasAnalysis && <HpBar minPercent={analysis.minPercent} maxPercent={analysis.maxPercent} />}

        <Box>
          <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: "block" }}>
            {t("damageCalc.rolls")}
          </Typography>
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.5 }}>
            {output.rolls.map((roll, i) => (
              <Chip
                key={i}
                label={roll}
                size="small"
                variant={i === 0 || i === output.rolls.length - 1 ? "filled" : "outlined"}
                color={
                  hasAnalysis && i === output.rolls.length - 1 && analysis.maxPercent >= 100
                    ? "error"
                    : "default"
                }
                sx={{ fontSize: 11, height: 22 }}
              />
            ))}
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}

// ---------------------------------------------------------------------------
// HP bar
//
// Left = 100% HP (full), right = 0% HP (fainted).
// At CSS position x%, remaining HP = (100 - x)%.
//
// Example: minDmg=63%, maxDmg=76%
//
//   x=0        x=24%       x=37%                     x=100%
//   |← green →|← stripe →|←────────── gray ─────────|
//              ↑           ↑
//           (100-76)     (100-63)
//
// Zone A (guaranteed remaining): x = 0            .. (100-maxDmg),  width = (100-maxDmg)
// Zone B (random range):         x = (100-maxDmg) .. (100-minDmg),  width = (maxDmg-minDmg)
// Zone C (guaranteed damage):    x = (100-minDmg) .. 100,            width = minDmg
//
// Zone B sub-segment for damage range [dStart, dEnd]:
//   remaining HP goes from (100-dStart)% down to (100-dEnd)%
//   bar positions: left = (100-dEnd), right = (100-dStart), width = dEnd-dStart
// ---------------------------------------------------------------------------

function hpColor(remainingPct: number, isDark: boolean): string {
  if (remainingPct > 50) return isDark ? "#4caf50" : "#388e3c"; // green  > 50%
  if (remainingPct > 20) return isDark ? "#ffc107" : "#f9a825"; // yellow 20–50%
  return isDark ? "#f44336" : "#c62828"; // red   ≤ 20%
}

type HpBarProps = {
  readonly minPercent: number;
  readonly maxPercent: number;
};

function HpBar({ minPercent, maxPercent }: HpBarProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const isDark = theme.palette.mode === "dark";

  const minDmg = Math.min(100, Math.max(0, minPercent));
  const maxDmg = Math.min(100, Math.max(0, maxPercent));

  // Zone boundaries (CSS left %)
  const xAB = 100 - maxDmg; // A/B: guaranteed-remaining / random-range boundary
  const xBC = 100 - minDmg; // B/C: random-range / guaranteed-damage boundary

  const widthA = xAB; // = 100 - maxDmg
  const widthB = xBC - xAB; // = maxDmg - minDmg
  const widthC = 100 - xBC; // = minDmg

  // Zone A color: worst-case remaining HP = widthA%
  const colorA = hpColor(widthA, isDark);

  const grayC = isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.22)";
  const barBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const stripe = isDark ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0.25)";

  // Zone B: split at HP thresholds 50% (dmg=50) and 20% (dmg=80)
  // Each sub-segment [dStart,dEnd]: bar x = (100-dEnd) to (100-dStart)
  type Seg = { x: number; w: number; color: string };
  const bSegs: Seg[] = [];
  if (widthB > 0) {
    const thresholds = [50, 80].filter((d) => d > minDmg && d < maxDmg);
    const splits = [minDmg, ...thresholds, maxDmg];
    for (let i = 0; i < splits.length - 1; i++) {
      const dStart = splits[i];
      const dEnd = splits[i + 1];
      const sx = 100 - dEnd;
      const sw = dEnd - dStart;
      const midHp = 100 - (dStart + dEnd) / 2;
      bSegs.push({ x: sx, w: sw, color: hpColor(midHp, isDark) });
    }
  }

  return (
    <Box>
      <Tooltip
        title={`${minPercent.toFixed(1)}%〜${maxPercent.toFixed(1)}%`}
        placement="top"
        arrow
      >
        <Box
          sx={{
            position: "relative",
            height: 20,
            borderRadius: 10,
            bgcolor: barBg,
            overflow: "hidden",
            cursor: "default",
          }}
        >
          {/* Zone A: guaranteed remaining HP */}
          {widthA > 0 && (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: 0,
                width: `${widthA}%`,
                bgcolor: colorA,
              }}
            />
          )}

          {/* Zone B: random range (colored base + stripe) */}
          {bSegs.map((seg, i) => (
            <Box key={i}>
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: `${seg.x}%`,
                  width: `${seg.w}%`,
                  bgcolor: seg.color,
                  opacity: 0.65,
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: `${seg.x}%`,
                  width: `${seg.w}%`,
                  background: `repeating-linear-gradient(-45deg, ${stripe}, ${stripe} 3px, transparent 3px, transparent 7px)`,
                }}
              />
            </Box>
          ))}

          {/* Zone C: guaranteed damage */}
          {widthC > 0 && (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${xBC}%`,
                width: `${widthC}%`,
                bgcolor: grayC,
              }}
            />
          )}

          {/* A/B marker (max damage line) */}
          {xAB > 0 && xAB < 100 && (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${xAB}%`,
                width: 2,
                bgcolor: isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.55)",
                transform: "translateX(-1px)",
              }}
            />
          )}

          {/* B/C marker (min damage line) */}
          {xBC > 0 && xBC < 100 && widthB > 0 && (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${xBC}%`,
                width: 2,
                bgcolor: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.38)",
                transform: "translateX(-1px)",
              }}
            />
          )}

          {/* KO overlay */}
          {maxDmg >= 100 && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                bgcolor: isDark ? "rgba(244,67,54,0.35)" : "rgba(198,40,40,0.25)",
              }}
            />
          )}
        </Box>
      </Tooltip>

      <Stack direction="row" sx={{ justifyContent: "space-between", mt: 0.5, px: 0.25 }}>
        <Typography variant="caption" sx={{ color: "text.disabled", fontSize: 10 }}>
          {maxDmg >= 100
            ? t("damageCalc.hpKO")
            : `${t("damageCalc.hpRemaining")}: ${(100 - maxDmg).toFixed(1)}%〜${(100 - minDmg).toFixed(1)}%`}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.disabled", fontSize: 10 }}>
          {`${t("damageCalc.hpDamage")}: ${minDmg.toFixed(1)}%〜${maxDmg.toFixed(1)}%`}
        </Typography>
      </Stack>
    </Box>
  );
}

// ---------------------------------------------------------------------------

function CritToggle({
  isCrit,
  onChange,
  label,
}: {
  readonly isCrit: boolean;
  readonly onChange: (v: boolean) => void;
  readonly label: string;
}) {
  return (
    <ToggleButton
      value="crit"
      selected={isCrit}
      onChange={() => onChange(!isCrit)}
      size="small"
      color="warning"
      sx={{ px: 1.5, py: 0.25, fontSize: 12, lineHeight: 1.4, textTransform: "none" }}
    >
      {label}
    </ToggleButton>
  );
}

function getKOLabel(
  minHits: number,
  maxHits: number,
  ohkoChance: number,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string {
  if (minHits === 1 && ohkoChance === 1) return t("damageCalc.ohko");
  if (minHits === 1 && ohkoChance > 0)
    return t("damageCalc.ohkoChance", { chance: Math.round(ohkoChance * 100) });
  if (minHits === maxHits) return t("damageCalc.guaranteedKO", { n: minHits });
  return t("damageCalc.possibleKO", { n: minHits });
}
