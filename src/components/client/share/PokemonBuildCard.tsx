"use client";

import { alpha, Box, Chip, Divider, Grid, Paper, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import { getAppPalette } from "@/theme/palette";
import { itemById } from "@/data/items";
import { abilityById } from "@/data/abilities";
import { moveById } from "@/data/moves";
import { championsPokemonByIdentifier } from "@/data/champions-pokemon";
import { itemSprite, typeIcon } from "@/lib/image";
import { calcHp, calcStatus } from "@/data/utility/training";
import { natureObjectToString } from "@/data/nature";
import { match } from "ts-pattern";
import type { TrainedPokemon } from "@/store/team/team";

// ── 定数 ────────────────────────────────────────────────────────────────────

const STAT_KEYS = ["hp", "atk", "def", "spa", "spd", "spe"] as const;
type StatKey = (typeof STAT_KEYS)[number];

// 性格補正の色
const NATURE_BOOST_COLOR = "#ef5350"; // red
const NATURE_DROP_COLOR = "#42a5f5"; // blue

// ── ユーティリティ ───────────────────────────────────────────────────────────

function calcStat(
  key: StatKey,
  base: number,
  ev: number,
  plus?: StatKey | null,
  minus?: StatKey | null,
): number {
  if (key === "hp") return calcHp(base, ev);
  const natureMult = match(key)
    .when((key) => key === plus, () => 1.1)
    .when((key) => key === minus, () => 0.9)
    .otherwise(() => 1.0);
  return calcStatus(base, ev, natureMult);
}

function statColor(
  key: StatKey,
  plus?: StatKey | null,
  minus?: StatKey | null,
): string | undefined {
  if (key === "hp") return undefined;
  if (key === plus) return NATURE_BOOST_COLOR;
  if (key === minus) return NATURE_DROP_COLOR;
  return undefined;
}

// ── サブコンポーネント ────────────────────────────────────────────────────────

function StatRow({
  label,
  ev,
  actual,
  color,
}: {
  label: string;
  base: number;
  ev: number;
  actual: number;
  color?: string;
}) {
  const theme = useTheme();
  const maxActual = 252; // bar の最大参考値（EV252フル）

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
      {/* ラベル */}
      <Typography
        variant="caption"
        sx={{
          width: 28,
          fontWeight: 700,
          fontSize: "0.65rem",
          color: color ?? "text.secondary",
          flexShrink: 0,
          letterSpacing: 0.3,
        }}
      >
        {label}
      </Typography>

      {/* 実数値バー */}
      <Box
        sx={{
          flex: 1,
          height: 6,
          borderRadius: 3,
          bgcolor: alpha(theme.palette.action.disabled, 0.15),
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: `${Math.min((actual / maxActual) * 100, 100)}%`,
            borderRadius: 3,
            bgcolor: color ?? theme.palette.primary.main,
            opacity: 0.85,
          }}
        />
      </Box>

      {/* 数値 */}
      <Typography
        variant="caption"
        sx={{
          width: 26,
          textAlign: "right",
          fontWeight: 700,
          fontSize: "0.65rem",
          color: color ?? "text.primary",
          flexShrink: 0,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {actual}
      </Typography>

      {/* EV */}
      <Typography
        variant="caption"
        sx={{
          width: 24,
          textAlign: "right",
          fontSize: "0.6rem",
          color: ev > 0 ? "text.secondary" : alpha(theme.palette.text.secondary, 0.3),
          flexShrink: 0,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {ev > 0 ? `+${ev}` : "–"}
      </Typography>
    </Box>
  );
}

// ── メインコンポーネント ──────────────────────────────────────────────────────

export interface PokemonBuildCardProps {
  pokemon: TrainedPokemon;
}

export function PokemonBuildCard({ pokemon }: PokemonBuildCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const palette = getAppPalette(theme.palette.mode);

  const championData = championsPokemonByIdentifier.get(pokemon.identifier);
  const item = pokemon.item != null ? itemById.get(pokemon.item) : null;
  const ability = abilityById.get(pokemon.ability);
  const natureName = natureObjectToString(pokemon.nature);
  const { plus, minus } = pokemon.nature;

  // ステータス実数値
  const baseStat = championData?.status ?? [45, 45, 45, 45, 45, 45];
  const statLabels: Record<StatKey, string> = {
    hp: t("teamBuilder.status.hp.name"),
    atk: t("teamBuilder.status.atk.name"),
    def: t("teamBuilder.status.def.name"),
    spa: t("teamBuilder.status.spa.name"),
    spd: t("teamBuilder.status.spd.name"),
    spe: t("teamBuilder.status.spe.name"),
  };

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: palette.surfaceRaised,
        border: "1px solid",
        borderColor: palette.edge,
        borderRadius: 3,
        overflow: "hidden",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── ヘッダー: タイプ帯 ──────────────────────────────────────── */}
      <Box
        sx={{
          background: championData?.types.length
            ? `linear-gradient(135deg,
                ${alpha(theme.palette.primary.main, 0.35)} 0%,
                ${alpha(theme.palette.primary.dark, 0.15)} 100%)`
            : alpha(theme.palette.primary.main, 0.1),
          px: 2,
          pt: 1.5,
          pb: 1,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        {/* ポケモン画像 */}
        <Box
          sx={{
            width: { xs: 56, sm: 72 },
            height: { xs: 56, sm: 72 },
            flexShrink: 0,
            position: "relative",
            filter: `drop-shadow(0 4px 8px ${alpha(theme.palette.common.black, 0.3)})`,
          }}
        >
          <Image
            src={`/pokemon/${pokemon.identifier}.png`}
            alt={t(`pokemon.${pokemon.identifier}.name`)}
            fill
            style={{ objectFit: "contain" }}
            sizes="(max-width: 600px) 56px, 72px"
          />
        </Box>

        {/* 名前 + タイプ + 持ち物 */}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 800,
              fontSize: { xs: "0.85rem", sm: "0.95rem" },
              lineHeight: 1.2,
              mb: 0.4,
            }}
            noWrap
          >
            {t(`pokemon.${pokemon.identifier}.name`)}
          </Typography>

          {/* タイプアイコン */}
          {championData?.types && (
            <Stack direction="row" spacing={0.5} sx={{ mb: 0.5 }}>
              {championData.types.map((type) => (
                <Box
                  key={type}
                  component="img"
                  src={typeIcon(type)}
                  alt={t(`types.${type}.name`)}
                  sx={{ height: 14, width: "auto" }}
                />
              ))}
            </Stack>
          )}

          {/* 持ち物 */}
          {item && (
            <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
              <Box
                component="img"
                src={itemSprite(item.identifier)}
                alt={t(`items.${item.identifier}.name`)}
                sx={{ width: 16, height: 16 }}
              />
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", fontSize: "0.65rem" }}
                noWrap
              >
                {t(`items.${item.identifier}.name`)}
              </Typography>
            </Stack>
          )}
        </Box>
      </Box>

      {/* ── ボディ ─────────────────────────────────────────────────── */}
      <Box
        sx={{
          p: { xs: 1.5, sm: 2 },
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
        }}
      >
        {/* 特性 + 性格 */}
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
          {ability && (
            <Chip
              label={t(`abilities.${ability.identifier}.name`)}
              size="small"
              variant="outlined"
              sx={{
                fontSize: "0.6rem",
                height: 20,
                borderColor: palette.edgeSoft,
                color: "text.secondary",
              }}
            />
          )}
          {natureName && (
            <Chip
              label={natureName}
              size="small"
              sx={{
                fontSize: "0.6rem",
                height: 20,
                bgcolor: alpha(theme.palette.secondary.main, 0.12),
                color: theme.palette.secondary.main,
              }}
            />
          )}
        </Stack>

        <Divider sx={{ borderColor: palette.edge, opacity: 0.6 }} />

        {/* ステータス */}
        <Box>
          <Stack spacing={0.4}>
            {STAT_KEYS.map((key, i) => {
              const base = baseStat[i] ?? 45;
              const ev = pokemon.evs[key];
              const actual = calcStat(key, base, ev, plus ?? undefined, minus ?? undefined);
              const color = statColor(key, plus ?? undefined, minus ?? undefined);
              return (
                <StatRow
                  key={key}
                  label={statLabels[key]}
                  base={base}
                  ev={ev}
                  actual={actual}
                  color={color}
                />
              );
            })}
          </Stack>
        </Box>

        <Divider sx={{ borderColor: palette.edge, opacity: 0.6 }} />

        {/* 技 */}
        <Grid container spacing={0.75}>
          {pokemon.moves.map((moveId, i) => {
            const move = moveId != null ? moveById.get(moveId) : null;
            return (
              <Grid component="div" size={6} key={i}>
                {move ? (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.75,
                      px: 1,
                      py: 0.5,
                      borderRadius: 1.5,
                      bgcolor: alpha(theme.palette.action.hover, 0.5),
                      border: "1px solid",
                      borderColor: palette.edge,
                      minHeight: 28,
                    }}
                  >
                    <Box
                      component="img"
                      src={typeIcon(move.type)}
                      alt={t(`types.${move.type}.name`)}
                      sx={{ width: 14, height: 14, flexShrink: 0 }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: "0.6rem",
                        fontWeight: 600,
                        lineHeight: 1.2,
                        color: "text.primary",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t(`moves.${move.identifier}.name`)}
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      px: 1,
                      py: 0.5,
                      borderRadius: 1.5,
                      border: "1px dashed",
                      borderColor: alpha(palette.edge, 0.5),
                      minHeight: 28,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: "0.6rem",
                        color: alpha(theme.palette.text.secondary, 0.4),
                        fontStyle: "italic",
                      }}
                    >
                      –
                    </Typography>
                  </Box>
                )}
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Paper>
  );
}
