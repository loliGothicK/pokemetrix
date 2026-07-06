"use client";

import { Autocomplete, Box, Chip, Stack, TextField, Typography } from "@mui/material";
import type { AutocompleteRenderInputParams } from "@mui/material/Autocomplete";
import type { TextFieldProps } from "@mui/material/TextField";
import type { ReactNode } from "react";
import {
  parseQueryToken,
  queryTokenLabel,
  type QueryFieldDefinition,
  type QueryToken,
} from "./queryableAutocomplete";
import {
  useQueryableAutocomplete,
  type UseQueryableAutocompleteOptions,
} from "./useQueryableAutocomplete";

export interface QueryableAutocompleteProps extends Omit<
  UseQueryableAutocompleteOptions,
  "fields"
> {
  /** The queryable fields (e.g. `type`) and their allowed values. */
  readonly fields: readonly QueryFieldDefinition[];
  readonly label?: ReactNode;
  readonly placeholder?: string;
  readonly helperText?: ReactNode;
  readonly textFieldProps?: Omit<TextFieldProps, "label" | "placeholder" | "helperText">;
}

export function QueryableAutocomplete({
  fields,
  limit,
  defaultValue,
  onTokensChange,
  label,
  placeholder,
  helperText,
  textFieldProps,
}: QueryableAutocompleteProps) {
  const queryable = useQueryableAutocomplete({
    fields,
    limit,
    defaultValue,
    onTokensChange,
  });

  return (
    <Autocomplete
      {...queryable.getAutocompleteProps()}
      renderValue={(value, getItemProps) =>
        value.map((option, index) => {
          const { key, ...itemProps } = getItemProps({ index });
          const token: QueryToken = parseQueryToken(option, fields);
          return (
            <Chip
              key={key}
              label={queryTokenLabel(token, fields)}
              color={token.kind === "field" ? "primary" : "default"}
              variant={token.kind === "field" ? "filled" : "outlined"}
              size="small"
              {...itemProps}
            />
          );
        })
      }
      renderOption={(props, option) => {
        const { key, ...others } = props;
        const suggestion = queryable.getSuggestion(option);
        return (
          <Box key={key} component="li" {...others}>
            <Stack
              direction="row"
              sx={{ width: "100%", alignItems: "baseline", justifyContent: "space-between" }}
            >
              <Typography variant="body2">{suggestion?.label ?? option}</Typography>
              {suggestion?.caption ? (
                <Typography variant="caption" sx={{ color: "text.secondary", ml: 2 }}>
                  {suggestion.caption}
                </Typography>
              ) : null}
            </Stack>
          </Box>
        );
      }}
      renderInput={(params: AutocompleteRenderInputParams) => (
        <TextField
          {...params}
          {...textFieldProps}
          label={label}
          placeholder={placeholder}
          helperText={helperText}
        />
      )}
    />
  );
}
