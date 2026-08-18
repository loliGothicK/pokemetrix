import React, { useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import Image from "next/image";
import type { TsumeData } from "@/types/quiz";
import { TsumeEngine } from "@/utils/tsumeEngine";
import { SurfaceCard } from "@/components/common/SurfaceCard";
import { useTranslation } from "react-i18next";
import { Dex } from "@pkmn/dex";

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
function runSimulation(tsumeData: TsumeData, queuedActions: { move: string }[], t: any) {
  const engine = new TsumeEngine(tsumeData);
  let ended = false;

  const historyKey: string[] = [];
  for (const action of queuedActions) {
    const p1Choice = action.move;
    historyKey.push(p1Choice);
    const currentKey = historyKey.join(",");
    const oppChoice = engine.getOpponentHeuristicChoice(currentKey);
    ended = engine.simulateTurn(p1Choice, oppChoice);
    if (ended) break;
  }

  const rawLogs = engine.getLog();

  let skipNext = false;
  const deduplicatedLogs: string[] = [];
  for (const l of rawLogs) {
    if (l.startsWith("|split|")) {
      skipNext = true;
      continue;
    }
    if (skipNext) {
      skipNext = false;
      continue;
    }
    deduplicatedLogs.push(l);
  }

  const displayLogs = deduplicatedLogs
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

  // Calculate overall HP for simple win/loss check, or detailed HP arrays
  const p1HPs = [engine.getP1ActiveHP(0), engine.getP1ActiveHP(1)];
  const p2HPs = [engine.getP2ActiveHP(0), engine.getP2ActiveHP(1)];

  const p1TotalHP = p1HPs.reduce((a, b) => a + b, 0);
  const p2TotalHP = p2HPs.reduce((a, b) => a + b, 0);

  return {
    engine,
    p1HPs,
    p1MaxHPs: [engine.getP1ActiveMaxHP(0), engine.getP1ActiveMaxHP(1)],
    p2HPs,
    p2MaxHPs: [engine.getP2ActiveMaxHP(0), engine.getP2ActiveMaxHP(1)],
    p1TotalHP,
    p2TotalHP,
    logs: displayLogs.length > 0 ? displayLogs : [t("quiz.tsume.whatWillYouDo")],
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
  const { t } = useTranslation();
  const [queuedActions, setQueuedActions] = useState<{ move: string }[]>([]);
  const [gameState, setGameState] = useState(() => runSimulation(tsumeData, [], t));
  const { engine, p1HPs, p1MaxHPs, p2HPs, p2MaxHPs, p2TotalHP, logs, isOver } = gameState;

  // Track the current turn's sub-selections
  const [selectingSlot, setSelectingSlot] = useState<number>(0);
  const [currentTurnSelections, setCurrentTurnSelections] = useState<string[]>([]);

  // Modals state
  const [targetModalOpen, setTargetModalOpen] = useState(false);
  const [pendingMove, setPendingMove] = useState<{
    type?: "move" | "switch";
    id: string;
    index: number;
    target: string;
  } | null>(null);

  // Sync state variables for rendering based on current engine state
  const p1Active = engine["battle"].p1.active;
  const p2Active = engine["battle"].p2.active;

  // Calculate which slots actually need decisions
  // If a slot is fainted or null, it doesn't need a decision (it will just be 'pass')
  const advanceSlot = (selections: string[]) => {
    let nextSlot = selectingSlot + 1;
    // Skip fainted slots
    while (nextSlot < 2 && (!p1Active[nextSlot] || p1Active[nextSlot].hp <= 0)) {
      selections[nextSlot] = "pass";
      nextSlot++;
    }

    if (nextSlot >= 2) {
      // Both slots have made their choices, dispatch to simulation!
      // Format: "move 1 1, move 2"
      const finalChoiceString = selections.map((s) => s || "pass").join(", ");

      const newActions = [...queuedActions, { move: finalChoiceString }];
      setQueuedActions(newActions);

      const nextState = runSimulation(tsumeData, newActions, t);
      setGameState(nextState);
      onActionsChange(newActions.map((a) => a.move));

      setCurrentTurnSelections([]);

      // Start the next turn finding the first alive slot
      let firstAlive = 0;
      while (
        firstAlive < 2 &&
        (!nextState.engine["battle"].p1.active[firstAlive] ||
          nextState.engine["battle"].p1.active[firstAlive].hp <= 0)
      ) {
        firstAlive++;
      }
      setSelectingSlot(firstAlive);

      if (nextState.isOver) {
        setTimeout(() => {
          if (onSubmit) onSubmit();
        }, 500);
      }
    } else {
      setCurrentTurnSelections(selections);
      setSelectingSlot(nextSlot);
    }
  };

  const handleMoveSelect = (moveId: string, index: number) => {
    if (isOver || showExplanation) return;

    // Check if move needs a target
    const moveData = Dex.moves.get(moveId);
    if (moveData.target === "normal" || moveData.target === "any") {
      setPendingMove({ id: moveId, index: index + 1, target: moveData.target });
      setTargetModalOpen(true);
    } else {
      // No target required
      const newSelections = [...currentTurnSelections];
      newSelections[selectingSlot] = `move ${index + 1}`;
      advanceSlot(newSelections);
    }
  };

  const handleTargetSelect = (targetIndex: string) => {
    if (!pendingMove) return;
    const newSelections = [...currentTurnSelections];
    newSelections[selectingSlot] = `move ${pendingMove.index} ${targetIndex}`;

    setTargetModalOpen(false);
    setPendingMove(null);
    advanceSlot(newSelections);
  };

  const handleReset = () => {
    setQueuedActions([]);
    setCurrentTurnSelections([]);
    setSelectingSlot(0); // This assumes slot 0 is alive, would need logic if it starts fainted
    setGameState(runSimulation(tsumeData, [], t));
    onActionsChange([]);
  };

  return (
    <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Battle Screen */}
      <SurfaceCard
        sx={{
          p: 2,
          position: "relative",
          minHeight: 380,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundImage: "linear-gradient(to bottom, #e0f7fa 0%, #b2ebf2 100%)",
          color: "#000",
        }}
      >
        {/* Opponent Area */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, pr: { xs: 2, md: 8 } }}>
          {[0, 1].map((idx) => {
            const opp = p2Active[idx];
            if (!opp || !opp.species) return <Box key={`opp-empty-${idx}`} sx={{ width: 180 }} />;

            const hpPercent = Math.max(0, (p2HPs[idx] / p2MaxHPs[idx]) * 100);
            const hpColor = hpPercent > 50 ? "success" : hpPercent > 20 ? "warning" : "error";

            return (
              <Paper
                key={`opp-${idx}`}
                elevation={3}
                sx={{
                  p: 1.5,
                  minWidth: 180,
                  borderRadius: 2,
                  bgcolor: "rgba(255,255,255,0.9)",
                  border: "2px solid #555",
                  color: "#000",
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                  {formatSpeciesName(opp.species.name)} Lv50
                </Typography>
                <Box
                  sx={{ mt: 1, height: 8, bgcolor: "#ccc", borderRadius: 4, overflow: "hidden" }}
                >
                  <Box
                    sx={{
                      height: "100%",
                      width: `${hpPercent}%`,
                      bgcolor: `${hpColor}.main`,
                      transition: "width 0.5s ease",
                    }}
                  />
                </Box>
              </Paper>
            );
          })}
        </Box>

        {/* Sprites Area */}
        <Box
          sx={{
            position: "relative",
            height: 180,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: 2,
          }}
        >
          {/* Player Sprites */}
          <Box sx={{ display: "flex", gap: 2, mt: 8 }}>
            {[1, 0].map((idx) => {
              const poke = p1Active[idx];
              if (!poke || !poke.species)
                return <Box key={`p1-sprite-empty-${idx}`} sx={{ width: 120 }} />;
              const isSelected = selectingSlot === idx && !isOver;
              return (
                <Box
                  key={`p1-sprite-${idx}`}
                  sx={{
                    filter: p1HPs[idx] <= 0 ? "grayscale(100%) opacity(50%)" : "none",
                    transform: isSelected ? "scale(1.1)" : "scale(1)",
                    transition: "all 0.3s",
                    borderBottom: isSelected ? "4px solid #f00" : "4px solid transparent",
                  }}
                >
                  <Image
                    src={`/pokemon/${poke.species.id}.png`}
                    alt={poke.species.name}
                    width={120}
                    height={120}
                    style={{ objectFit: "contain", transform: "scaleX(-1)" }}
                    unoptimized
                  />
                </Box>
              );
            })}
          </Box>

          {/* Opponent Sprites */}
          <Box sx={{ display: "flex", gap: 2, mb: 8 }}>
            {[0, 1].map((idx) => {
              const poke = p2Active[idx];
              if (!poke || !poke.species)
                return <Box key={`p2-sprite-empty-${idx}`} sx={{ width: 120 }} />;
              return (
                <Box
                  key={`p2-sprite-${idx}`}
                  sx={{
                    filter: p2HPs[idx] <= 0 ? "grayscale(100%) opacity(50%)" : "none",
                    transition: "all 0.5s",
                  }}
                >
                  <Image
                    src={`/pokemon/${poke.species.id}.png`}
                    alt={poke.species.name}
                    width={120}
                    height={120}
                    style={{ objectFit: "contain" }}
                    unoptimized
                  />
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Player Area */}
        <Box sx={{ display: "flex", justifyContent: "flex-start", gap: 2, pl: { xs: 2, md: 8 } }}>
          {[0, 1].map((idx) => {
            const poke = p1Active[idx];
            if (!poke || !poke.species) return <Box key={`p1-empty-${idx}`} sx={{ width: 180 }} />;

            const hpPercent = Math.max(0, (p1HPs[idx] / p1MaxHPs[idx]) * 100);
            const hpColor = hpPercent > 50 ? "success" : hpPercent > 20 ? "warning" : "error";
            const isSelected = selectingSlot === idx && !isOver;

            return (
              <Paper
                key={`p1-${idx}`}
                elevation={isSelected ? 8 : 3}
                sx={{
                  p: 1.5,
                  minWidth: 180,
                  borderRadius: 2,
                  bgcolor: isSelected ? "#fff9e6" : "rgba(255,255,255,0.9)",
                  border: isSelected ? "3px solid #fbc02d" : "2px solid #555",
                  color: "#000",
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                  {formatSpeciesName(poke.species.name)} Lv50
                </Typography>
                <Box
                  sx={{ mt: 1, height: 8, bgcolor: "#ccc", borderRadius: 4, overflow: "hidden" }}
                >
                  <Box
                    sx={{
                      height: "100%",
                      width: `${hpPercent}%`,
                      bgcolor: `${hpColor}.main`,
                      transition: "width 0.5s ease",
                    }}
                  />
                </Box>
                <Typography
                  variant="caption"
                  sx={{ display: "block", textAlign: "right", mt: 0.5, fontWeight: "bold" }}
                >
                  {Math.ceil(p1HPs[idx])} / {p1MaxHPs[idx]}
                </Typography>
              </Paper>
            );
          })}
        </Box>
      </SurfaceCard>

      {/* Control Panel */}
      <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", md: "row" } }}>
        <SurfaceCard
          sx={{ flex: 1, p: 2, border: "4px solid #555", borderRadius: 2, minHeight: 120 }}
        >
          <Stack spacing={0.5}>
            {logs.slice(-4).map((log, i) => (
              <Typography
                key={i}
                variant="body1"
                sx={{ fontFamily: "monospace", fontSize: "1.1rem" }}
              >
                {log}
              </Typography>
            ))}
          </Stack>
          {(isOver || queuedActions.length > 0 || currentTurnSelections.length > 0) &&
            !showExplanation && (
              <Box sx={{ mt: 2 }}>
                <Button variant="outlined" onClick={handleReset} size="small">
                  {t("quiz.tsume.undoReset")}
                </Button>
              </Box>
            )}
        </SurfaceCard>

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
                color={p2TotalHP <= 0 ? "success.main" : "error.main"}
                sx={{ fontWeight: "bold" }}
              >
                {p2TotalHP <= 0 ? t("quiz.tsume.solved") : t("quiz.tsume.failed")}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, height: "100%" }}>
              {p1Active[selectingSlot] &&
                p1Active[selectingSlot].moveSlots.map((moveSlot: any, index: number) => {
                  const moveId = moveSlot.id;
                  const moveName = moveSlot.move;
                  return (
                    <Button
                      key={moveId}
                      variant="contained"
                      onClick={() => handleMoveSelect(moveId, index)}
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
                      {moveName}
                    </Button>
                  );
                })}
              {tsumeData.playerSide.bench && tsumeData.playerSide.bench.length > 0 && (
                <Button
                  variant="contained"
                  onClick={() => {
                    setPendingMove({ type: "switch", id: "switch", index: 0, target: "" } as any);
                    setTargetModalOpen(true);
                  }}
                  disabled={showExplanation}
                  sx={{
                    bgcolor: "#e3f2fd",
                    color: "#1565c0",
                    "&:hover": { bgcolor: "#bbdefb" },
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    textTransform: "capitalize",
                    border: "2px solid #90caf9",
                    boxShadow: "none",
                  }}
                >
                  {t("quiz.tsume.switch")}
                </Button>
              )}
            </Box>
          )}
        </SurfaceCard>
      </Box>

      {/* Target/Switch Modal */}
      <Dialog open={targetModalOpen} onClose={() => setTargetModalOpen(false)}>
        <DialogTitle>
          {pendingMove?.type === "switch"
            ? t("quiz.tsume.selectSwitch")
            : t("quiz.tsume.selectTarget")}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {pendingMove?.type === "switch" ? (
              // Render Bench options
              tsumeData.playerSide.bench?.map((benchPoke, idx) => {
                const globalIdx = 3 + idx; // Active are 1 and 2. Bench starts at 3.
                // Need to check if benchPoke is alive (simulate with basic logic or engine state if available)
                // In Tsume, bench Pokemon are fully healed unless otherwise specified, but let's assume they are valid targets.
                return (
                  <Button
                    key={`switch-bench-${idx}`}
                    variant="outlined"
                    onClick={() => handleTargetSelect(String(globalIdx))}
                    color="primary"
                  >
                    Switch to {formatSpeciesName(benchPoke.species)}
                  </Button>
                );
              })
            ) : (
              // Render Target options
              <>
                {[0, 1].map((idx) => {
                  const opp = p2Active[idx];
                  if (!opp || opp.hp <= 0) return null;
                  return (
                    <Button
                      key={`target-opp-${idx}`}
                      variant="outlined"
                      onClick={() => handleTargetSelect(String(idx + 1))}
                    >
                      Opponent: {formatSpeciesName(opp.species.name)}
                    </Button>
                  );
                })}

                {[0, 1].map((idx) => {
                  if (idx === selectingSlot) return null; // Can't normally target self unless specified
                  const ally = p1Active[idx];
                  if (!ally || ally.hp <= 0) return null;
                  return (
                    <Button
                      key={`target-ally-${idx}`}
                      variant="outlined"
                      onClick={() => handleTargetSelect(`-${idx + 1}`)}
                      color="success"
                    >
                      Ally: {formatSpeciesName(ally.species.name)}
                    </Button>
                  );
                })}
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTargetModalOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
