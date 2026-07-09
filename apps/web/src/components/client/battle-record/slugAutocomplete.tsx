"use client";

import { Autocomplete, TextField, createFilterOptions } from "@mui/material";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { itemList } from "@/data/items";
import { abilityById } from "@/data/abilities";
import { moveById } from "@/data/moves";
import { championsPokemonByIdentifier } from "@/data/champions-pokemon";

/** slug と表示ラベルの組 */
export interface SlugOption<T extends object = {}> {
  readonly slug: string;
  readonly label: string;
  readonly metadata?: T;
}

const filterOptions = createFilterOptions<SlugOption>({
  limit: 50,
  stringify: (option) => `${option.label} ${option.slug}`,
});

/** 持ち物の選択肢（ローカライズ済みラベル付き） */
export const useItemOptions = (): readonly SlugOption[] => {
  const { t } = useTranslation();
  return useMemo(
    () =>
      itemList
        .map((item) => ({ slug: item.identifier, label: t(`items.${item.identifier}.name`) }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [t],
  );
};

/**
 * ダメージ計算で使う特別な仮想アイテム識別子。
 * 個別のタイプ強化アイテム（きせきのタネ・じしゃく 等）は
 * まとめて 1 つの「タイプ強化アイテム」選択肢に一本化している。
 */
export const TYPE_BOOST_ITEM = "type-boost";

/**
 * ダメージ計算で意味のある持ち物と、その表示用ダメージ倍率。
 * ここに載っている個別アイテムのみが選択肢に出る。
 * タイプ強化系は TYPE_BOOST_ITEM に一本化する。
 */
const DAMAGE_CALC_ITEM_MULTIPLIERS: Record<string, string> = {
  [TYPE_BOOST_ITEM]: "×1.2",
  "choice-band": "×1.5",
  "choice-specs": "×1.5",
  "life-orb": "×1.3",
  "expert-belt": "×1.2",
  "muscle-band": "×1.1",
  "wise-glasses": "×1.1",
};

export const useDamageCalcItemOptions = (): readonly SlugOption[] => {
  const { t } = useTranslation();
  return useMemo(() => {
    const options: SlugOption[] = [];

    // Unified type-boosting item
    options.push({
      slug: TYPE_BOOST_ITEM,
      label: `${t("damageCalc.typeBoostItem")} (${DAMAGE_CALC_ITEM_MULTIPLIERS[TYPE_BOOST_ITEM]})`,
    });

    // Individual items, with their damage multiplier appended to the label
    for (const identifier of [
      "choice-band",
      "choice-specs",
      "life-orb",
      "expert-belt",
      "muscle-band",
      "wise-glasses",
    ]) {
      const mult = DAMAGE_CALC_ITEM_MULTIPLIERS[identifier];
      options.push({
        slug: identifier,
        label: `${t(`items.${identifier}.name`)} (${mult})`,
      });
    }

    return options.sort((a, b) => a.label.localeCompare(b.label));
  }, [t]);
};

/**
 * 指定ポケモンが持ちうる特性の選択肢。
 * championsPokemon.abilities（そのポケモンの特性ID）を参照する。
 */
export const usePokemonAbilityOptions = (pokemonSlug: string): readonly SlugOption[] => {
  const { t } = useTranslation();
  return useMemo(() => {
    const pokemon = championsPokemonByIdentifier.get(pokemonSlug);
    if (!pokemon) return [];
    return pokemon.abilities
      .map((id) => abilityById.get(id))
      .filter((ability) => ability !== undefined)
      .map((ability) => ({
        slug: ability.identifier,
        label: t(`abilities.${ability.identifier}.name`),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [pokemonSlug, t]);
};

/**
 * 指定ポケモンが覚えられる技の選択肢。
 * championsPokemon.moves（そのポケモンの技ID）を参照する。
 */
export const usePokemonMoveOptions = (
  pokemonSlug: string,
): readonly SlugOption<{
  category: "physical" | "special";
}>[] => {
  const { t } = useTranslation();
  return useMemo(() => {
    const pokemon = championsPokemonByIdentifier.get(pokemonSlug);
    if (!pokemon) return [];
    return pokemon.moves
      .map((id) => moveById.get(id))
      .filter((move) => move !== undefined)
      .filter((move) => move.category !== "status")
      .map((move) => ({
        slug: move.identifier,
        label: t(`moves.${move.identifier}.name`),
        category: move.category,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [pokemonSlug, t]);
};

interface SlugAutocompleteProps {
  readonly options: readonly SlugOption[];
  readonly value: string | null;
  readonly onChange: (slug: string | null) => void;
  readonly label: string;
  readonly placeholder?: string;
}

/** 単一 slug を選ぶ Autocomplete */
export function SlugAutocomplete({
  options,
  value,
  onChange,
  label,
  placeholder,
}: SlugAutocompleteProps) {
  const selected = useMemo(
    () => options.find((option) => option.slug === value) ?? null,
    [options, value],
  );

  return (
    <Autocomplete
      options={options}
      value={selected}
      onChange={(_, next) => onChange(next?.slug ?? null)}
      filterOptions={filterOptions}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, val) => option.slug === val.slug}
      size="small"
      renderInput={(params) => <TextField {...params} label={label} placeholder={placeholder} />}
    />
  );
}

interface MovesAutocompleteProps {
  readonly options: readonly SlugOption[];
  readonly value: readonly string[];
  readonly onChange: (slugs: readonly string[]) => void;
  readonly label: string;
}

/** 複数 slug（技）を選ぶ Autocomplete */
export function MovesAutocomplete({ options, value, onChange, label }: MovesAutocompleteProps) {
  const selected = useMemo(
    () => value.map((slug) => options.find((o) => o.slug === slug) ?? { slug, label: slug }),
    [options, value],
  );

  return (
    <Autocomplete
      multiple
      options={options}
      value={selected}
      onChange={(_, next) => onChange(next.map((option) => option.slug))}
      filterOptions={filterOptions}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, val) => option.slug === val.slug}
      size="small"
      renderInput={(params) => <TextField {...params} label={label} />}
    />
  );
}
