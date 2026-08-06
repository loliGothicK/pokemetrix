import React, { useState, useEffect } from "react";
import { Box, Stack, MenuItem, Select, FormControl, InputLabel } from "@mui/material";
import type { TsumeData, TsumePokemon } from "@/types/quiz";

interface TsumeActionFormatProps {
  tsumeData: TsumeData;
  selectedActions: string[];
  onActionsChange: (actions: string[]) => void;
  showExplanation: boolean;
  correctMoves?: string[];
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const formatSpeciesName = (speciesId: string) =>
  speciesId.split("-").map(capitalize).join("-");

export function TsumeActionFormat({
  tsumeData,
  onActionsChange,
  showExplanation,
  correctMoves,
}: TsumeActionFormatProps) {
  // Local state: Record<playerIndex, { move, target }>
  const [selections, setSelections] = useState<
    Record<number, { move: string; target: string }>
  >({});

  const singleOpponent =
    tsumeData.opponentSide.active.length === 1
      ? tsumeData.opponentSide.active[0].species
      : null;

  // All selectable targets on the field and bench
  const allTargets = [
    ...tsumeData.playerSide.active.map((p: TsumePokemon) => ({ species: p.species, label: "Ally Active" })),
    ...(tsumeData.playerSide.bench || []).map((p: TsumePokemon) => ({ species: p.species, label: "Ally Bench" })),
    ...tsumeData.opponentSide.active.map((p: TsumePokemon) => ({ species: p.species, label: "Opponent Active" })),
    ...(tsumeData.opponentSide.bench || []).map((p: TsumePokemon) => ({ species: p.species, label: "Opponent Bench" })),
  ];

  const handleMoveChange = (playerIndex: number, move: string) => {
    setSelections((prev) => ({
      ...prev,
      [playerIndex]: { move, target: prev[playerIndex]?.target || "" },
    }));
  };

  const handleTargetChange = (playerIndex: number, target: string) => {
    setSelections((prev) => ({
      ...prev,
      [playerIndex]: { ...prev[playerIndex], target },
    }));
  };

  // Compile action string matching correctMoves format: "Move Name (Target: Species-Id)"
  const compileActionString = (move: string, targetSpeciesId: string) => {
    if (!targetSpeciesId || targetSpeciesId === "self") {
      return move;
    }
    const formattedTarget = formatSpeciesName(targetSpeciesId);
    return `${move} (Target: ${formattedTarget})`;
  };

  useEffect(() => {
    const actions: string[] = [];
    Object.values(selections).forEach((sel) => {
      if (sel.move) {
        // When there's only 1 opponent, auto-assign that opponent as target
        const effectiveTarget = singleOpponent ?? sel.target;
        let actionStr = compileActionString(sel.move, effectiveTarget);
        
        // If the un-targeted move is explicitly listed in correctMoves (e.g. Protect, Destiny Bond),
        // use it without a target.
        if (correctMoves?.includes(sel.move)) {
          actionStr = sel.move;
        }

        actions.push(actionStr);
      }
    });
    onActionsChange(actions);
  }, [selections, onActionsChange, singleOpponent, correctMoves]);

  // Only render cards for players that actually have moves
  const activePlayers = tsumeData.playerSide.active
    .map((poke: TsumePokemon, index: number) => ({ poke, index }))
    .filter(({ poke }: { poke: TsumePokemon }) => poke.moves && poke.moves.length > 0);

  // Skip pokemon name label when only one player pokemon has moves
  const isHeadsUp = activePlayers.length === 1;

  return (
    <Box sx={{ mt: 3 }}>
      <Stack spacing={3}>
        {activePlayers.map(({ poke, index }) => {
          const currentSelection = selections[index] || { move: "", target: "" };

          return (
            <Stack
              key={index}
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ alignItems: "center" }}
            >
              {/* Show pokemon name only when multiple pokemon need selections */}
              {!isHeadsUp && (
                <Box sx={{ minWidth: 120, flexShrink: 0 }}>
                  <strong>{formatSpeciesName(poke.species)}</strong>
                </Box>
              )}

              <FormControl fullWidth disabled={showExplanation}>
                <InputLabel>Move</InputLabel>
                <Select
                  value={currentSelection.move}
                  label="Move"
                  onChange={(e) => handleMoveChange(index, e.target.value)}
                >
                  {(poke.moves ?? []).map((move: string) => (
                    <MenuItem key={move} value={move}>
                      {move}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Hide target selector when there's only 1 opponent — target is obvious */}
              {!singleOpponent && (
                <FormControl fullWidth disabled={showExplanation}>
                  <InputLabel>Target</InputLabel>
                  <Select
                    value={currentSelection.target}
                    label="Target"
                    onChange={(e) => handleTargetChange(index, e.target.value)}
                  >
                    <MenuItem value="self">
                      <em>Self / Field</em>
                    </MenuItem>
                    {allTargets.map((target) => (
                      <MenuItem key={target.species} value={target.species}>
                        {formatSpeciesName(target.species)}{" "}
                        <em style={{ marginLeft: 4, opacity: 0.6 }}>
                          ({target.label})
                        </em>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Stack>
          );
        })}
      </Stack>
    </Box>
  );
}

