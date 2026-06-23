import {
  Avatar,
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { championsPokemonList, type ChampionsPokemon } from "@/data/champions-pokemon";
import { ComponentProps, useMemo, useState } from "react";
import { typeIcon } from "@/lib/image";
import {
  matchesQueryTokens,
  QueryableAutocomplete,
  type QueryFieldDefinition,
  type QueryToken,
} from "@/components/common/queryable-autocomplete";

type SelectPokemonDialogProps = Pick<ComponentProps<typeof Dialog>, "open" | "onClose"> & {
  title: string;
  onChange: (identifier: string | null) => void;
  translator: (identifier: string) => string;
};

/** Cap the rendered result rows so a broad filter can't tank the dialog. */
const MAX_RESULTS = 100;

export function SelectPokemonDialog({
  title,
  open,
  onClose,
  onChange,
  translator,
}: SelectPokemonDialogProps) {
  const [tokens, setTokens] = useState<readonly QueryToken[]>([]);

  const pokemonOptions = useMemo(() => {
    const forms = championsPokemonList
      .filter(({ form }) => form !== undefined)
      .map(({ form }) => form!);

    return championsPokemonList
      .filter(({ id, identifier }) => !identifier.includes("-mega") && !forms.includes(id))
      .toSorted((a, b) => a.identifier.localeCompare(b.identifier));
  }, []);

  // The only queryable field for now is `type`, populated with the types that
  // actually appear in the option set. Labels are localized via the translator.
  const fields: readonly QueryFieldDefinition[] = useMemo(() => {
    const seen = new Set<string>();
    for (const pokemon of pokemonOptions) {
      for (const type of pokemon.types) {
        seen.add(type);
      }
    }

    return [
      {
        key: "type",
        label: translator("teamBuilder.query.type"),
        values: Array.from(seen)
          .sort()
          .map((type) => ({ value: type, label: translator(type) })),
      },
    ];
  }, [pokemonOptions, translator]);

  // Each pokemon is matched by name (identifier + localized name) and by type.
  const results = useMemo(() => {
    const matched = pokemonOptions.filter((pokemon) =>
      matchesQueryTokens(
        {
          text: `${pokemon.identifier} ${translator(`pokemon.${pokemon.identifier}.name`)}`,
          fields: { type: pokemon.types },
        },
        tokens,
      ),
    );

    return { matched, visible: matched.slice(0, MAX_RESULTS) };
  }, [pokemonOptions, tokens, translator]);

  const handleSelect = (pokemon: ChampionsPokemon) => {
    onChange(pokemon.identifier);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{
        "& .MuiDialog-container": {
          alignItems: "flex-start",
          pt: 10,
        },
      }}
    >
      <DialogTitle>{title}</DialogTitle>
      <Divider />
      <DialogContent>
        <QueryableAutocomplete
          fields={fields}
          onTokensChange={setTokens}
          label={translator("teamBuilder.query.label")}
          placeholder="pikachu, @type:fire..."
          helperText={translator("teamBuilder.query.helper")}
        />

        <Box
          sx={{
            mt: 2,
            maxHeight: 360,
            overflowY: "auto",
          }}
        >
          {results.matched.length === 0 ? (
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", py: 4, textAlign: "center" }}
            >
              {translator("teamBuilder.query.noResults")}
            </Typography>
          ) : (
            <Stack divider={<Divider flexItem />}>
              {results.visible.map((pokemon) => (
                <Stack
                  key={pokemon.id}
                  direction="row"
                  onClick={() => handleSelect(pokemon)}
                  sx={{
                    alignItems: "center",
                    gap: 1,
                    px: 1,
                    py: 1,
                    cursor: "pointer",
                    borderRadius: 2,
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  <Chip
                    avatar={<Avatar src={`/pokemon/${pokemon.identifier}.png`} />}
                    label={translator(`pokemon.${pokemon.identifier}.name`)}
                    sx={{
                      height: 48,
                      fontSize: "1.1rem",
                      borderRadius: 24,
                      "& .MuiChip-avatar": {
                        width: 40,
                        height: 40,
                      },
                    }}
                  />
                  <Box sx={{ flexGrow: 1 }} />
                  {pokemon.types.map((type) => (
                    <Chip
                      key={type}
                      avatar={<Avatar src={typeIcon(type)} />}
                      label={translator(type)}
                      sx={{
                        height: 40,
                        fontSize: "1rem",
                        "& .MuiChip-avatar": {
                          width: 32,
                          height: 32,
                        },
                      }}
                    />
                  ))}
                </Stack>
              ))}
            </Stack>
          )}

          {results.matched.length > results.visible.length ? (
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", display: "block", py: 1, textAlign: "center" }}
            >
              {translator("teamBuilder.query.more")}
            </Typography>
          ) : null}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
