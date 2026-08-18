import React, { useState } from "react";
import { Box, Stack, Typography, Button, Paper } from "@mui/material";
import Image from "next/image";
import type { TsumeData, TsumePokemon } from "@/types/quiz";
import { TsumeEngine } from "@/utils/tsumeEngine";
import { SurfaceCard } from "@/components/common/SurfaceCard";

interface TsumeActionFormatProps {
  tsumeData: TsumeData;
  selectedActions: string[];
  onActionsChange: (actions: string[]) => void;
  onSubmit?: () => void;
  showExplanation: boolean;
  correctMoves?: string[];
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const formatSpeciesName = (speciesId: string) => speciesId.split("-").map(capitalize).join("-");

// Pure function to run simulation
function runSimulation(tsumeData: TsumeData, queuedActions: { move: string }[]) {
  const engine = new TsumeEngine(tsumeData);
  let ended = false;

  for (const action of queuedActions) {
    const oppChoice = engine.getOpponentHeuristicChoice();
    ended = engine.simulateTurn(`move ${action.move}`, oppChoice);
    if (ended) break;
  }

  const rawLogs = engine.getLog();
  const displayLogs = rawLogs
    .filter(
      (l) =>
        l.startsWith("|-damage|") ||
        l.startsWith("|move|") ||
        l.startsWith("|-heal|") ||
        l.startsWith("|faint|") ||
        l.startsWith("|-fail|"),
    )
    .map((l) => {
      const parts = l.split("|");
      if (parts[1] === "move") {
        const poke = parts[2].split(" ")[1];
        return `${poke} used ${parts[3]}!`;
      }
      if (parts[1] === "-damage") {
        const poke = parts[2].split(" ")[1];
        return `${poke} took damage!`;
      }
      if (parts[1] === "faint") {
        const poke = parts[2].split(" ")[1];
        return `${poke} fainted!`;
      }
      if (parts[1] === "-fail") {
        return `But it failed!`;
      }
      return l;
    });

  return {
    p1HP: engine.getP1ActiveHP(),
    p1MaxHP: engine.getP1ActiveMaxHP(),
    p2HP: engine.getP2ActiveHP(),
    p2MaxHP: engine.getP2ActiveMaxHP(),
    logs: displayLogs.length > 0 ? displayLogs : ["What will you do?"],
    isOver: ended,
  };
}

export function TsumeActionFormat({
  tsumeData,
  onActionsChange,
  onSubmit,
  showExplanation,
  correctMoves, // eslint-disable-line @typescript-eslint/no-unused-vars
}: TsumeActionFormatProps) {
  const [queuedActions, setQueuedActions] = useState<{ move: string }[]>([]);
  const [gameState, setGameState] = useState(() => runSimulation(tsumeData, []));

  const { p1HP, p1MaxHP, p2HP, p2MaxHP, logs, isOver } = gameState;

  const activePlayers = tsumeData.playerSide.active.filter(
    (poke: TsumePokemon) => poke.moves && poke.moves.length > 0,
  );
  const currentActor = activePlayers[0]; // Simplified for 1v1
  const currentOpponent = tsumeData.opponentSide.active[0];

  const p1HpPercent = Math.max(0, (p1HP / p1MaxHP) * 100);
  const p2HpPercent = Math.max(0, (p2HP / p2MaxHP) * 100);
  const p1HpColor = p1HpPercent > 50 ? "success" : p1HpPercent > 20 ? "warning" : "error";
  const p2HpColor = p2HpPercent > 50 ? "success" : p2HpPercent > 20 ? "warning" : "error";

  const handleMoveSelect = (move: string) => {
    if (isOver || showExplanation) return;

    const newActions = [...queuedActions, { move }];
    setQueuedActions(newActions);

    // Evaluate synchronously to derive next UI state and side-effects
    const newState = runSimulation(tsumeData, newActions);
    setGameState(newState);

    if (newState.isOver && newState.p2HP <= 0 && newState.p1HP > 0) {
      onActionsChange(newActions.map((a) => a.move));

      if (onSubmit && !showExplanation) {
        setTimeout(() => {
          onSubmit();
        }, 1200);
      }
    } else {
      onActionsChange([]);
    }
  };

  const handleReset = () => {
    setQueuedActions([]);
    setGameState(runSimulation(tsumeData, []));
    onActionsChange([]);
  };

  if (!currentActor || !currentOpponent) return null;

  return (
    <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Battle Screen */}
      <SurfaceCard
        sx={{
          p: 2,
          position: "relative",
          minHeight: 320,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundImage: "linear-gradient(to bottom, #e0f7fa 0%, #b2ebf2 100%)",
          color: "#000",
        }}
      >
        {/* Opponent Area */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            width: "100%",
            pl: 2,
            pr: { xs: 2, md: 8 },
          }}
        >
          <Box sx={{ flex: 1 }} />
          <Paper
            elevation={3}
            sx={{
              p: 1.5,
              minWidth: 200,
              borderRadius: 2,
              bgcolor: "rgba(255,255,255,0.9)",
              border: "2px solid #555",
              color: "#000",
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
              {formatSpeciesName(currentOpponent.species)} Lv50
            </Typography>
            <Box sx={{ mt: 1, height: 8, bgcolor: "#ccc", borderRadius: 4, overflow: "hidden" }}>
              <Box
                sx={{
                  height: "100%",
                  width: `${p2HpPercent}%`,
                  bgcolor: `${p2HpColor}.main`,
                  transition: "width 0.5s ease",
                }}
              />
            </Box>
          </Paper>
        </Box>

        {/* Sprites Area */}
        <Box
          sx={{
            position: "relative",
            height: 160,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: 4,
          }}
        >
          {/* Player Sprite (Bottom Leftish) */}
          <Box
            sx={{
              mt: 8,
              filter: p1HP <= 0 ? "grayscale(100%) opacity(50%)" : "none",
              transition: "all 0.5s",
            }}
          >
            <Image
              src={`/pokemon/${currentActor.species}.png`}
              alt={currentActor.species}
              width={120}
              height={120}
              style={{ objectFit: "contain", transform: "scaleX(-1)" }}
              unoptimized
            />
          </Box>
          {/* Opponent Sprite (Top Rightish) */}
          <Box
            sx={{
              mb: 8,
              filter: p2HP <= 0 ? "grayscale(100%) opacity(50%)" : "none",
              transition: "all 0.5s",
            }}
          >
            <Image
              src={`/pokemon/${currentOpponent.species}.png`}
              alt={currentOpponent.species}
              width={120}
              height={120}
              style={{ objectFit: "contain" }}
              unoptimized
            />
          </Box>
        </Box>

        {/* Player Area */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "flex-end",
            width: "100%",
            pr: 2,
            pl: { xs: 2, md: 8 },
            mt: -2,
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 1.5,
              minWidth: 220,
              borderRadius: 2,
              bgcolor: "rgba(255,255,255,0.9)",
              border: "2px solid #555",
              color: "#000",
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
              {formatSpeciesName(currentActor.species)} Lv50
            </Typography>
            <Box sx={{ mt: 1, height: 8, bgcolor: "#ccc", borderRadius: 4, overflow: "hidden" }}>
              <Box
                sx={{
                  height: "100%",
                  width: `${p1HpPercent}%`,
                  bgcolor: `${p1HpColor}.main`,
                  transition: "width 0.5s ease",
                }}
              />
            </Box>
            <Typography
              variant="caption"
              sx={{ display: "block", textAlign: "right", mt: 0.5, fontWeight: "bold" }}
            >
              {Math.ceil(p1HP)} / {p1MaxHP}
            </Typography>
          </Paper>
          <Box sx={{ flex: 1 }} />
        </Box>
      </SurfaceCard>

      {/* Control Panel */}
      <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", md: "row" } }}>
        {/* Message Box */}
        <SurfaceCard
          sx={{ flex: 1, p: 2, border: "4px solid #555", borderRadius: 2, minHeight: 120 }}
        >
          <Stack spacing={0.5}>
            {logs.slice(-3).map((log, i) => (
              <Typography
                key={i}
                variant="body1"
                sx={{ fontFamily: "monospace", fontSize: "1.1rem" }}
              >
                {log}
              </Typography>
            ))}
          </Stack>

          {(isOver || queuedActions.length > 0) && !showExplanation && (
            <Box sx={{ mt: 2 }}>
              <Button variant="outlined" onClick={handleReset} size="small">
                Undo / Reset
              </Button>
            </Box>
          )}
        </SurfaceCard>

        {/* Move Grid */}
        <SurfaceCard sx={{ flex: 1, p: 2, border: "4px solid #ccc", borderRadius: 2 }}>
          {isOver ? (
            <Box
              sx={{
                display: "flex",
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                variant="h6"
                color={p2HP <= 0 ? "success.main" : "error.main"}
                sx={{ fontWeight: "bold" }}
              >
                {p2HP <= 0 ? "Puzzle Solved!" : "You lost!"}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, height: "100%" }}>
              {(currentActor.moves ?? []).map((move: string) => (
                <Button
                  key={move}
                  variant="contained"
                  onClick={() => handleMoveSelect(move)}
                  disabled={showExplanation}
                  sx={{
                    bgcolor: "#f5f5f5",
                    color: "#000",
                    "&:hover": { bgcolor: "#e0e0e0" },
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    textTransform: "capitalize",
                    border: "2px solid #ccc",
                    boxShadow: "none",
                  }}
                >
                  {move}
                </Button>
              ))}
            </Box>
          )}
        </SurfaceCard>
      </Box>
    </Box>
  );
}
