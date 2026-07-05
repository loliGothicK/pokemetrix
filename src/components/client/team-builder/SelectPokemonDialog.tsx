import {
  Avatar,
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  InputAdornment,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import Search from "@mui/icons-material/Search";
import { championsPokemonList, type ChampionsPokemon } from "@/data/champions-pokemon";
import { ComponentProps, useMemo, useState } from "react";
import { typeIcon } from "@/lib/image";
import {
  matchesQueryTokens,
  QueryableAutocomplete,
  type QueryFieldDefinition,
  type QueryToken,
} from "@/components/common/queryable-autocomplete";
import { useBoxData } from "@/hooks/useBoxData";
import { useAtomValue } from "jotai";
import { isAuthenticatedAtom } from "@/store/auth";
import type { TrainedPokemon } from "@/store/team/team";

type SelectPokemonDialogProps = Pick<ComponentProps<typeof Dialog>, "open" | "onClose"> & {
  title: string;
  onChange: (identifier: string | null) => void;
  translator: (identifier: string) => string;
  onSelectFromBox?: (pokemon: TrainedPokemon) => void;
};

/** Cap the rendered result rows so a broad filter can't tank the dialog. */
const MAX_RESULTS = 100;

export function SelectPokemonDialog({
  title,
  open,
  onClose,
  onChange,
  translator,
  onSelectFromBox,
}: SelectPokemonDialogProps) {
  const [tokens, setTokens] = useState<readonly QueryToken[]>([]);
  const [tab, setTab] = useState<"master" | "box">("master");
  const [boxSearch, setBoxSearch] = useState("");
  const { box } = useBoxData();
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const showBoxTab = isAuthenticated && Boolean(onSelectFromBox);
  const activeTab = showBoxTab ? tab : "master";

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

  const filteredBox = useMemo(() => {
    const trimmed = boxSearch.trim().toLowerCase();
    if (!trimmed) return box;
    return box.filter(
      (p) =>
        translator(`pokemon.${p.identifier}.name`).toLowerCase().includes(trimmed) ||
        p.identifier.includes(trimmed),
    );
  }, [box, boxSearch, translator]);

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
      {showBoxTab && (
        <Tabs
          value={tab}
          onChange={(_, v: "master" | "box") => setTab(v)}
          sx={{ px: 2 }}
        >
          <Tab value="master" label={translator("teamBuilder.selectPokemon")} />
          <Tab value="box" label={translator("box.title")} />
        </Tabs>
      )}
      <Divider />
      <DialogContent>
        {activeTab === "master" ? (
          <>
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
          </>
        ) : (
          <>
            <TextField
              size="small"
              fullWidth
              placeholder={translator("box.searchPlaceholder")}
              value={boxSearch}
              onChange={(e) => setBoxSearch(e.target.value)}
              sx={{ mb: 2 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Box sx={{ maxHeight: 360, overflowY: "auto" }}>
              {filteredBox.length === 0 ? (
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", py: 4, textAlign: "center" }}
                >
                  {translator("box.empty")}
                </Typography>
              ) : (
                <Stack divider={<Divider flexItem />}>
                  {filteredBox.map((pokemon) => (
                    <Stack
                      key={pokemon.boxId}
                      direction="row"
                      onClick={() => {
                        if (onSelectFromBox) {
                          onSelectFromBox(pokemon);
                        } else {
                          onChange(pokemon.identifier);
                        }
                      }}
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
                          "& .MuiChip-avatar": { width: 40, height: 40 },
                        }}
                      />
                    </Stack>
                  ))}
                </Stack>
              )}
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
