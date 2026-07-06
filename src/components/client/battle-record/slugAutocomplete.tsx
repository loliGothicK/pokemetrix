"use client";

import { Autocomplete, TextField, createFilterOptions } from "@mui/material";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { itemList } from "@/data/items";
import { abilityById } from "@/data/abilities";
import { moveById } from "@/data/moves";
import { championsPokemonByIdentifier } from "@/data/champions-pokemon";

/** slug と表示ラベルの組 */
export interface SlugOption {
  readonly slug: string;
  readonly label: string;
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
export const usePokemonMoveOptions = (pokemonSlug: string): readonly SlugOption[] => {
  const { t } = useTranslation();
  return useMemo(() => {
    const pokemon = championsPokemonByIdentifier.get(pokemonSlug);
    if (!pokemon) return [];
    return pokemon.moves
      .map((id) => moveById.get(id))
      .filter((move) => move !== undefined)
      .map((move) => ({ slug: move.identifier, label: t(`moves.${move.identifier}.name`) }))
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
