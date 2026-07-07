"use client";

import { alpha, Box, Divider, Grid, Paper, Stack, Tooltip, Typography } from "@mui/material";
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
import type { Type } from "@/types/pokemon";

// ── タイプカラー ──────────────────────────────────────────────────────────────

const TYPE_BG: Record<Type, string> = {
  normal: "#9e9e9e",
  fighting: "#ef6c00",
  flying: "#5c9ce6",
  poison: "#ab47bc",
  ground: "#c8a96e",
  rock: "#bdb76b",
  bug: "#7cb342",
  ghost: "#5e5ce6",
  steel: "#78909c",
  fire: "#f4511e",
  water: "#29b6f6",
  grass: "#43a047",
  electric: "#f9a825",
  psychic: "#ec407a",
  ice: "#26c6da",
  dragon: "#5c6bc0",
  dark: "#5d4037",
  fairy: "#e91e8c",
  stellar: "#7c83d4",
};

// ── ステータス計算 ────────────────────────────────────────────────────────────

const STAT_KEYS = ["hp", "atk", "def", "spa", "spd", "spe"] as const;
type StatKey = (typeof STAT_KEYS)[number];

const NATURE_UP = "#ef5350";
const NATURE_DOWN = "#42a5f5";

function calcStat(
  key: StatKey,
  base: number,
  ev: number,
  plus?: StatKey | null,
  minus?: StatKey | null,
) {
  if (key === "hp") return calcHp(base, ev);
  const mult = match(key)
    .when(
      (k) => k === plus,
      () => 1.1,
    )
    .when(
      (k) => k === minus,
      () => 0.9,
    )
    .otherwise(() => 1.0);
  return calcStatus(base, ev, mult);
}

function statColor(key: StatKey, plus?: StatKey | null, minus?: StatKey | null) {
  if (key === "hp") return undefined;
  if (key === plus) return NATURE_UP;
  if (key === minus) return NATURE_DOWN;
  return undefined;
}

// ── Tooltip の共通スタイル ────────────────────────────────────────────────────

const TooltipContent = ({
  title,
  body,
  meta,
}: {
  readonly title: string;
  readonly body?: string;
  readonly meta?: string;
}) => (
  <Box sx={{ p: 0.25, maxWidth: 240 }}>
    <Typography sx={{ fontWeight: 700, fontSize: "0.78rem", mb: body ? 0.5 : 0 }}>
      {title}
    </Typography>
    {meta && (
      <Typography sx={{ fontSize: "0.66rem", color: "text.disabled", mb: body ? 0.25 : 0 }}>
        {meta}
      </Typography>
    )}
    {body && (
      <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", lineHeight: 1.5 }}>
        {body}
      </Typography>
    )}
  </Box>
);

// ── StatRow ───────────────────────────────────────────────────────────────────

function StatRow({
  label,
  ev,
  actual,
  color,
}: {
  readonly label: string;
  readonly ev: number;
  readonly actual: number;
  readonly color?: string;
}) {
  const theme = useTheme();
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Typography
        sx={{
          width: 28,
          fontSize: "0.62rem",
          fontWeight: 700,
          color: color ?? "text.secondary",
          flexShrink: 0,
        }}
      >
        {label}
      </Typography>
      <Box
        sx={{
          flex: 1,
          height: 5,
          borderRadius: "2px",
          bgcolor: alpha(theme.palette.divider, 0.3),
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            height: "100%",
            width: `${Math.min((actual / 252) * 100, 100)}%`,
            bgcolor: color ?? theme.palette.primary.main,
            opacity: 0.8,
          }}
        />
      </Box>
      <Typography
        sx={{
          width: 24,
          fontSize: "0.62rem",
          fontWeight: 700,
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
          color: color ?? "text.primary",
          flexShrink: 0,
        }}
      >
        {actual}
      </Typography>
      <Typography
        sx={{
          width: 22,
          fontSize: "0.58rem",
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
          color: "text.disabled",
          flexShrink: 0,
        }}
      >
        {ev > 0 ? `+${ev}` : ""}
      </Typography>
    </Box>
  );
}

// ── MoveChip ──────────────────────────────────────────────────────────────────

function MoveChip({ moveId }: { readonly moveId: number | null }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const palette = getAppPalette(theme.palette.mode);
  const move = moveId != null ? moveById.get(moveId) : null;

  if (!move) {
    return (
      <Box
        sx={{
          height: 34,
          display: "flex",
          alignItems: "center",
          px: 1.5,
          borderRadius: "6px",
          border: "1px dashed",
          borderColor: alpha(palette.edge, 0.4),
        }}
      >
        <Typography
          sx={{
            fontSize: "0.7rem",
            color: alpha(theme.palette.text.secondary, 0.3),
            fontStyle: "italic",
          }}
        >
          —
        </Typography>
      </Box>
    );
  }

  const tc = TYPE_BG[move.type as Type] ?? "#9e9e9e";

  // Tooltip のメタ行: タイプ / 分類 / 威力 / 命中
  const powerStr = move.power != null ? String(move.power) : "—";
  const accuracyStr = move.accuracy != null ? `${move.accuracy}%` : "—";
  const metaStr = `${t(`types.${move.type}.name`)} · ${move.category} · Power ${powerStr} · Acc ${accuracyStr}`;
  const effectStr = move.effect ?? undefined;

  return (
    <Tooltip
      title={
        <TooltipContent
          title={t(`moves.${move.identifier}.name`)}
          meta={metaStr}
          body={effectStr}
        />
      }
      arrow
      placement="top"
      enterDelay={300}
    >
      <Box
        sx={{
          height: 34,
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          px: 1.25,
          borderRadius: "6px",
          background: `linear-gradient(105deg, ${tc}28 0%, ${tc}0e 100%)`,
          border: "1px solid",
          borderColor: `${tc}50`,
          cursor: "default",
        }}
      >
        <Box
          component="img"
          src={typeIcon(move.type)}
          alt=""
          sx={{ width: 14, height: 14, flexShrink: 0 }}
        />
        <Typography
          sx={{
            fontSize: "0.72rem",
            fontWeight: 600,
            lineHeight: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: "text.primary",
          }}
        >
          {t(`moves.${move.identifier}.name`)}
        </Typography>
      </Box>
    </Tooltip>
  );
}

// ── メインコンポーネント ──────────────────────────────────────────────────────

export interface PokemonBuildCardProps {
  readonly pokemon: TrainedPokemon;
  readonly showStats: boolean;
}

export function PokemonBuildCard({ pokemon, showStats }: PokemonBuildCardProps) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const palette = getAppPalette(theme.palette.mode);

  // 既存の表示慣習に合わせる: name を主表示、formName は副次テキスト（無ければ空文字）
  const pokemonName = t(`pokemon.${pokemon.identifier}.name`);
  const formNameKey = `pokemon.${pokemon.identifier}.formName` as const;
  const formName = i18n.exists(formNameKey) ? t(formNameKey) : "";
  const data = championsPokemonByIdentifier.get(pokemon.identifier);
  const item = pokemon.item != null ? itemById.get(pokemon.item) : null;
  const ability = abilityById.get(pokemon.ability);
  const nature = natureObjectToString(pokemon.nature);
  const { plus, minus } = pokemon.nature;
  const baseStat = data?.status ?? [45, 45, 45, 45, 45, 45];
  const types = data?.types ?? [];

  const c1 = TYPE_BG[types[0] as Type] ?? "#1565c0";
  const c2 = TYPE_BG[(types[1] ?? types[0]) as Type] ?? c1;

  // 性格補正テキスト (↑Atk / ↓SpA)
  const natureBoostLabel = (() => {
    if (!plus && !minus) return undefined;
    const statName = (k: string) => t(`teamBuilder.status.${k}.name`);
    const parts: string[] = [];
    if (plus) parts.push(`↑${statName(plus)}`);
    if (minus) parts.push(`↓${statName(minus)}`);
    return parts.join(" / ");
  })();

  // 特性 description（翻訳キー: abilities.{identifier}.description）
  const abilityDescription = ability ? t(`abilities.${ability.identifier}.description`) : undefined;

  // 持ち物 description（翻訳キー: items.{identifier}.description）
  const itemDescription = item ? t(`items.${item.identifier}.description`) : undefined;

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
        borderRadius: "12px",
        overflow: "hidden",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── 名前行 ──────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          px: 2,
          py: 1.25,
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          borderBottom: "1px solid",
          borderColor: palette.edge,
        }}
      >
        <Typography sx={{ fontWeight: 800, fontSize: "0.9rem", lineHeight: 1, flexShrink: 0 }}>
          {pokemonName}
          {formName && (
            <Typography
              component="span"
              sx={{ ml: 0.5, fontSize: "0.75em", color: "text.secondary", fontWeight: 500 }}
            >
              {formName}
            </Typography>
          )}
        </Typography>

        <Typography sx={{ fontSize: "0.82rem", color: "text.disabled", flexShrink: 0 }}>
          @
        </Typography>

        {item ? (
          <Tooltip
            title={
              <TooltipContent title={t(`items.${item.identifier}.name`)} body={itemDescription} />
            }
            arrow
            placement="top"
            enterDelay={300}
          >
            <Typography
              sx={{
                fontSize: "0.82rem",
                fontWeight: 500,
                color: "text.secondary",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                minWidth: 0,
                cursor: "default",
              }}
            >
              {t(`items.${item.identifier}.name`)}
            </Typography>
          </Tooltip>
        ) : (
          <Typography
            sx={{
              fontSize: "0.82rem",
              color: alpha(theme.palette.text.secondary, 0.35),
              fontStyle: "italic",
            }}
          >
            {t("box.noItem")}
          </Typography>
        )}

        {types.length > 0 && (
          <Stack direction="row" spacing={0.5} sx={{ ml: "auto", flexShrink: 0 }}>
            {types.map((type) => (
              <Box
                key={type}
                component="img"
                src={typeIcon(type)}
                alt={t(`types.${type}.name`)}
                sx={{ height: 16, width: "auto" }}
              />
            ))}
          </Stack>
        )}
      </Box>

      {/* ── ヒーロー ─────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          position: "relative",
          background: `linear-gradient(145deg, ${c1}40 0%, ${c2}1a 60%, transparent 100%)`,
          pt: 2,
          pb: 1.5,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            width: { xs: 112, sm: 128 },
            height: { xs: 112, sm: 128 },
            position: "relative",
            filter: `drop-shadow(0 8px 20px ${alpha(theme.palette.common.black, 0.4)})`,
          }}
        >
          <Image
            src={`/pokemon/${pokemon.identifier}.png`}
            alt={formName ? `${pokemonName} (${formName})` : pokemonName}
            fill
            style={{ objectFit: "contain" }}
            sizes="(max-width: 600px) 112px, 128px"
          />
        </Box>

        {item && (
          <Tooltip
            title={
              <TooltipContent title={t(`items.${item.identifier}.name`)} body={itemDescription} />
            }
            arrow
            placement="left"
            enterDelay={300}
          >
            <Box
              sx={{
                position: "absolute",
                bottom: 10,
                right: 14,
                width: 32,
                height: 32,
                borderRadius: "8px",
                bgcolor: alpha(palette.surface, 0.85),
                border: "1px solid",
                borderColor: palette.edge,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(4px)",
                cursor: "default",
              }}
            >
              <Box
                component="img"
                src={itemSprite(item.identifier)}
                alt={t(`items.${item.identifier}.name`)}
                sx={{ width: 22, height: 22 }}
              />
            </Box>
          </Tooltip>
        )}
      </Box>

      {/* ── ボディ ───────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          px: 2,
          pt: 1.5,
          pb: 2,
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          gap: 1.25,
        }}
      >
        {/* 特性 + 性格 */}
        <Box sx={{ display: "flex", gap: 3 }}>
          {ability && (
            <Tooltip
              title={
                <TooltipContent
                  title={t(`abilities.${ability.identifier}.name`)}
                  body={abilityDescription}
                />
              }
              arrow
              placement="top"
              enterDelay={300}
            >
              <Box sx={{ cursor: "default" }}>
                <Typography sx={{ fontSize: "0.62rem", color: "text.disabled", mb: 0.25 }}>
                  {t("share.abilityLabel")}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: "text.primary",
                    lineHeight: 1,
                  }}
                >
                  {t(`abilities.${ability.identifier}.name`)}
                </Typography>
              </Box>
            </Tooltip>
          )}

          {nature && (
            <Tooltip
              title={
                natureBoostLabel ? (
                  <TooltipContent title={nature} body={natureBoostLabel} />
                ) : undefined
              }
              arrow
              placement="top"
              enterDelay={300}
              disableHoverListener={!natureBoostLabel}
            >
              <Box sx={{ cursor: natureBoostLabel ? "default" : "auto" }}>
                <Typography sx={{ fontSize: "0.62rem", color: "text.disabled", mb: 0.25 }}>
                  {t("share.natureLabel")}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: "text.primary",
                    lineHeight: 1,
                  }}
                >
                  {nature}
                </Typography>
              </Box>
            </Tooltip>
          )}
        </Box>

        {/* 技 (2×2) */}
        <Grid container spacing={0.75}>
          {pokemon.moves.map((moveId, i) => (
            <Grid component="div" size={6} key={i}>
              <MoveChip moveId={moveId} />
            </Grid>
          ))}
        </Grid>

        {/* ステータス */}
        {showStats && (
          <>
            <Divider sx={{ borderColor: palette.edge }} />
            <Stack spacing={0.3}>
              {STAT_KEYS.map((key, i) => {
                const base = baseStat[i] ?? 45;
                const ev = pokemon.evs[key];
                const actual = calcStat(key, base, ev, plus ?? undefined, minus ?? undefined);
                const color = statColor(key, plus ?? undefined, minus ?? undefined);
                return (
                  <StatRow
                    key={key}
                    label={statLabels[key]}
                    ev={ev}
                    actual={actual}
                    color={color}
                  />
                );
              })}
            </Stack>
          </>
        )}
      </Box>
    </Paper>
  );
}
