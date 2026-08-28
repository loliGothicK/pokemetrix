import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Terrain Pulse", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "blastoise", moves: ["terrainpulse", "sleeptalk"] }),
      pokemon({ species: "raichu", moves: ["electricterrain", "sleeptalk"] }),
    ],
    [
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["terrainpulse", "electricterrain", "sleeptalk"],
      engineConfig: { damage_roll: "max", crits: "never", accuracy: "always" },
    },
  );

  env.executeTurn("move sleeptalk, move electricterrain", "move sleeptalk, move sleeptalk");
  env.executeAndAssert("move terrainpulse 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
