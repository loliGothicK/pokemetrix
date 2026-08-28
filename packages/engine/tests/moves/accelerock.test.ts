import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Accelerock (アクセルロック) has +1 priority", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "lycanrocdusk", ability: "toughclaws", moves: ["accelerock"] }),
      pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
    ],
    [
      // Jolteon (Base Speed 130) is naturally faster than Lycanroc-Dusk (Base Speed 110).
      pokemon({ species: "jolteon", ability: "voltabsorb", moves: ["discharge"] }),
      pokemon({ species: "blastoise", ability: "torrent", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["accelerock", "discharge", "sleeptalk"],
      engineConfig: {
        damage_roll: "max",
        crits: "never",
        accuracy: "always",
        secondary: "never",
      },
    },
  );

  // Since Accelerock is priority +1, Lycanroc should move BEFORE Jolteon despite being slower!
  env.executeAndAssert("move accelerock 1, move sleeptalk", "move discharge, move sleeptalk");
});
