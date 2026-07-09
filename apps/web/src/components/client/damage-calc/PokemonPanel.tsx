import {
  Autocomplete,
  Box,
  Checkbox,
  createFilterOptions,
  Divider,
  FormControlLabel,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import { getAppPalette } from "@/theme/palette";
import { championsPokemonList, championsPokemonByIdentifier } from "@/data/champions-pokemon";
import { moveByIdentifier } from "@/data/moves";
import {
  usePokemonMoveOptions,
  usePokemonAbilityOptions,
  useDamageCalcItemOptions,
  SlugAutocomplete,
} from "@/components/client/battle-record/slugAutocomplete";
import { calcHp, calcStatus } from "@/data/utility/training";
import { getMoveMechanics, VARIABLE_POWER_MOVES, type StatKey } from "@/lib/damage";
import NumberField from "@/components/client/input/NumberField";
import type { PokemonPanelState } from "./useDamageCalcPage";

type PokemonOption = {
  readonly identifier: string;
  readonly label: string;
};

const pokemonFilterOptions = createFilterOptions<PokemonOption>({
  limit: 50,
  stringify: (option) => `${option.label} ${option.identifier}`,
});

type ScreenState = {
  readonly reflect: boolean;
  readonly lightScreen: boolean;
  readonly auroraVeil: boolean;
};

type PokemonPanelProps = {
  readonly label: string;
  readonly role: "attacker" | "defender";
  readonly value: PokemonPanelState;
  readonly onChange: (
    updater: PokemonPanelState | ((prev: PokemonPanelState) => PokemonPanelState),
  ) => void;
  /** The attacker's currently-selected move identifier — drives progressive disclosure. */
  readonly activeMove: string | null;
  /** Defender only: wall checkboxes */
  readonly screens?: ScreenState;
  readonly onScreensChange?: (updater: ScreenState | ((prev: ScreenState) => ScreenState)) => void;
};

/** Stat metadata: EV field key, status[] index, i18n label key. */
const STAT_META: Record<StatKey, { evKey: keyof PokemonPanelState; index: number; labelKey: string }> = {
  hp: { evKey: "evHp", index: 0, labelKey: "damageCalc.hp" },
  atk: { evKey: "evAtk", index: 1, labelKey: "damageCalc.attack" },
  def: { evKey: "evDef", index: 2, labelKey: "damageCalc.defense" },
  spa: { evKey: "evSpa", index: 3, labelKey: "damageCalc.spAttack" },
  spd: { evKey: "evSpd", index: 4, labelKey: "damageCalc.spDefense" },
  spe: { evKey: "evSpe", index: 5, labelKey: "damageCalc.speed" },
};

export function PokemonPanel({
  label,
  role,
  value,
  onChange,
  activeMove,
  screens,
  onScreensChange,
}: PokemonPanelProps) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const palette = getAppPalette(theme.palette.mode);

  const isAttacker = role === "attacker";

  // Pokemon options
  const pokemonOptions = useMemo((): readonly PokemonOption[] => {
    return championsPokemonList
      .map((p) => {
        const name = t(`pokemon.${p.identifier}.name`, p.identifier);
        const isFormNameExists = i18n.exists(`pokemon.${p.identifier}.formName`);
        const label = isFormNameExists
          ? `${name} (${t(`pokemon.${p.identifier}.formName`)})`
          : name;
        return { identifier: p.identifier, label };
      })
      .toSorted((a, b) => a.label.localeCompare(b.label));
  }, [t, i18n]);

  const selectedPokemon = useMemo(
    () => pokemonOptions.find((o) => o.identifier === value.identifier) ?? null,
    [pokemonOptions, value.identifier],
  );

  const pokemon = value.identifier
    ? championsPokemonByIdentifier.get(value.identifier)
    : undefined;

  // Move mechanics of the active (attacker's) move — drives disclosure for both panels.
  const activeMoveData = activeMove ? moveByIdentifier.get(activeMove) : undefined;
  const mechanics =
    activeMoveData && activeMoveData.category !== "status"
      ? getMoveMechanics(activeMoveData.identifier, activeMoveData.category)
      : null;

  const moveOptions = usePokemonMoveOptions(value.identifier ?? "");
  const abilityOptions = usePokemonAbilityOptions(value.identifier ?? "");
  const itemOptions = useDamageCalcItemOptions();

  // Attacker: only damaging moves (allow variable-power moves whose static power is 0/null).
  const filteredMoveOptions = useMemo(() => {
    if (!isAttacker) return moveOptions;
    return moveOptions.filter((m) => {
      const move = moveByIdentifier.get(m.slug);
      if (!move || move.category === "status") return false;
      if (VARIABLE_POWER_MOVES.has(move.identifier)) return true;
      return move.power !== null && move.power > 0;
    });
  }, [moveOptions, isAttacker]);

  // Which stats to reveal on this panel.
  const statsToShow: StatKey[] = useMemo(() => {
    if (isAttacker) {
      if (!mechanics) return ["atk", "spa"];
      const s: StatKey[] = [];
      // Foul Play uses the target's attack → attacker's own offensive stat is not used.
      if (!mechanics.useTargetAttack) s.push(mechanics.offensiveStat);
      for (const extra of mechanics.attackerExtraStats) if (!s.includes(extra)) s.push(extra);
      return s;
    }
    // Defender
    if (!mechanics) return ["hp", "def", "spd"];
    const s: StatKey[] = ["hp", mechanics.defensiveStat];
    for (const extra of mechanics.defenderExtraStats) if (!s.includes(extra)) s.push(extra);
    return s;
  }, [isAttacker, mechanics]);

  // The stat the panel's single Rank control applies to.
  const rankStat: StatKey | null = useMemo(() => {
    if (isAttacker) {
      if (!mechanics) return "atk";
      if (mechanics.useTargetAttack) return null; // foul play: attacker rank unused
      return mechanics.offensiveStat;
    }
    return mechanics ? mechanics.defensiveStat : "def";
  }, [isAttacker, mechanics]);

  const showAttackerHp = isAttacker && mechanics?.usesAttackerHp === true;
  const showHpPercent = !isAttacker || showAttackerHp;

  const setEv = (evKey: keyof PokemonPanelState, v: number) =>
    onChange((prev) => ({ ...prev, [evKey]: v }));

  return (
    <Paper
      elevation={0}
      sx={{ px: 6, py: 3, border: "1px solid", borderColor: palette.edge, borderRadius: 3 }}
    >
      <Stack spacing={2}>
        {/* Header */}
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          {value.identifier && (
            <Image
              src={`/pokemon/${value.identifier}.png`}
              alt={value.identifier}
              width={40}
              height={40}
              style={{ imageRendering: "pixelated" }}
            />
          )}
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {label}
          </Typography>
        </Stack>

        {/* Basics */}
        <Autocomplete
          options={pokemonOptions}
          value={selectedPokemon}
          onChange={(_, next) =>
            onChange((prev) => ({
              ...prev,
              identifier: next?.identifier ?? null,
              move: null,
              ability: null,
            }))
          }
          filterOptions={pokemonFilterOptions}
          getOptionLabel={(option) => option.label}
          isOptionEqualToValue={(option, val) => option.identifier === val.identifier}
          size="small"
          renderInput={(params) => (
            <TextField
              {...params}
              label={t("damageCalc.pokemon")}
              placeholder={t("damageCalc.selectPokemon")}
            />
          )}
        />

        {/* Move (attacker only) */}
        {isAttacker && (
          <Stack spacing={1}>
            <SlugAutocomplete
              options={filteredMoveOptions}
              value={value.move}
              onChange={(slug) =>
                onChange((prev) => ({ ...prev, move: slug, moveConditions: {} }))
              }
              label={t("damageCalc.move")}
              placeholder={t("damageCalc.selectMove")}
            />
            {/* Conditional-power toggles for the selected move */}
            {mechanics && mechanics.conditions.length > 0 && (
              <Stack direction="row" sx={{ flexWrap: "wrap", ml: -0.5 }}>
                {mechanics.conditions.map((cond) => (
                  <FormControlLabel
                    key={cond.key}
                    control={
                      <Checkbox
                        size="small"
                        checked={value.moveConditions[cond.key] ?? false}
                        onChange={(e) =>
                          onChange((prev) => ({
                            ...prev,
                            moveConditions: { ...prev.moveConditions, [cond.key]: e.target.checked },
                          }))
                        }
                      />
                    }
                    label={t(cond.labelKey)}
                  />
                ))}
              </Stack>
            )}
          </Stack>
        )}

        <SlugAutocomplete
          options={abilityOptions}
          value={value.ability}
          onChange={(slug) => onChange((prev) => ({ ...prev, ability: slug }))}
          label={t("damageCalc.ability")}
        />

        <SlugAutocomplete
          options={itemOptions}
          value={value.item}
          onChange={(slug) => onChange((prev) => ({ ...prev, item: slug }))}
          label={t("damageCalc.item")}
        />

        {/* Status */}
        <Divider textAlign="left">{t("damageCalc.status")}</Divider>

        {/* Foul Play notice on the attacker panel */}
        {isAttacker && mechanics?.useTargetAttack && (
          <Typography variant="caption" color="text.secondary">
            {t("damageCalc.usesTargetAttack")}
          </Typography>
        )}

        <Stack spacing={1}>
          {statsToShow.map((statKey) => {
            const meta = STAT_META[statKey];
            const ev = value[meta.evKey] as number;
            const actual = pokemon
              ? statKey === "hp"
                ? calcHp(pokemon.status[0], ev)
                : calcStatus(pokemon.status[meta.index], ev)
              : undefined;
            const showRank = rankStat === statKey;
            return (
              <Stack key={statKey} direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <EvField
                  label={t(meta.labelKey)}
                  value={ev}
                  statValue={actual}
                  onChange={(v) => setEv(meta.evKey, v)}
                  grow={showRank}
                />
                {showRank && (
                  <NumberField
                    value={value.boost}
                    label={t("damageCalc.rank")}
                    min={-6}
                    max={6}
                    step={1}
                    size="small"
                    width={96}
                    format={{ signDisplay: "exceptZero" }}
                    onValueChange={(v) => onChange((prev) => ({ ...prev, boost: v || 0 }))}
                  />
                )}
              </Stack>
            );
          })}

          {/* Current HP % */}
          {showHpPercent && (
            <NumberField
              value={value.hpPercent}
              label={t("damageCalc.hpPercent")}
              min={1}
              max={100}
              step={1}
              size="small"
              width={140}
              onValueChange={(v) =>
                onChange((prev) => ({ ...prev, hpPercent: v == null ? 100 : v }))
              }
            />
          )}
        </Stack>

        {/* Conditions */}
        <Divider textAlign="left">{t("damageCalc.conditions")}</Divider>

        <Stack direction="row" sx={{ flexWrap: "wrap", ml: -0.5 }}>
          {/* Attacker: burn */}
          {isAttacker && (
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={value.isBurned}
                  onChange={(e) => onChange((prev) => ({ ...prev, isBurned: e.target.checked }))}
                />
              }
              label={t("damageCalc.burn")}
            />
          )}

          {/* Defender: screens */}
          {!isAttacker && screens && onScreensChange && (
            <>
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={screens.reflect}
                    onChange={(e) => onScreensChange((s) => ({ ...s, reflect: e.target.checked }))}
                  />
                }
                label={t("damageCalc.reflect")}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={screens.lightScreen}
                    onChange={(e) =>
                      onScreensChange((s) => ({ ...s, lightScreen: e.target.checked }))
                    }
                  />
                }
                label={t("damageCalc.lightScreen")}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={screens.auroraVeil}
                    onChange={(e) =>
                      onScreensChange((s) => ({ ...s, auroraVeil: e.target.checked }))
                    }
                  />
                }
                label={t("damageCalc.auroraVeil")}
              />
            </>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}

function EvField({
  label,
  value,
  statValue,
  onChange,
  grow,
}: {
  readonly label: string;
  readonly value: number;
  readonly statValue?: number;
  readonly onChange: (value: number) => void;
  readonly grow?: boolean;
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexGrow: grow ? 1 : 0 }}>
      <TextField
        label={label}
        type="number"
        size="small"
        value={value}
        onChange={(e) => {
          const parsed = parseInt(e.target.value, 10);
          if (!isNaN(parsed) && parsed >= 0 && parsed <= 32) onChange(parsed);
        }}
        slotProps={{ htmlInput: { min: 0, max: 32, step: 1 } }}
        sx={{ width: 96 }}
      />
      {statValue !== undefined && (
        <Typography
          variant="caption"
          sx={{ color: "text.secondary", minWidth: 32, textAlign: "right" }}
        >
          {statValue}
        </Typography>
      )}
    </Box>
  );
}
