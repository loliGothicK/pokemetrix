"use client";

import { Autocomplete, TextField, createFilterOptions } from "@mui/material";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { itemList } from "@/data/items";
import { abilityList } from "@/data/abilities";
import { MoveList } from "@/data/moves";

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

/** 特性の選択肢 */
export const useAbilityOptions = (): readonly SlugOption[] => {
  const { t } = useTranslation();
  return useMemo(
    () =>
      abilityList
        .map((ability) => ({
          slug: ability.identifier,
          label: t(`abilities.${ability.identifier}.name`),
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [t],
  );
};

/** 技の選択肢 */
export const useMoveOptions = (): readonly SlugOption[] => {
  const { t } = useTranslation();
  return useMemo(
    () =>
      MoveList.map((move) => ({
        slug: move.identifier,
        label: t(`moves.${move.identifier}.name`),
      })).sort((a, b) => a.label.localeCompare(b.label)),
    [t],
  );
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
