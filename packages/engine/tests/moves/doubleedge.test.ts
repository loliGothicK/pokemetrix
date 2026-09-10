import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: doubleedge causes recoil damage", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "tauros", ability: "intimidate", moves: ["doubleedge"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["doubleedge", "sleeptalk"],
      engineConfig: {
        crits: "never",
      },
    },
  );

  // Tauros uses Double-Edge, taking recoil
  env.executeAndAssert("move doubleedge 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
