import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: darkpulse has chance to flinch", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "gengar", ability: "cursedbody", moves: ["darkpulse"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "darkpulse", secondary: "inherit" }, "sleeptalk"],
      engineConfig: {
        secondary: "always",
        crits: "never",
      },
    },
  );

  // Gengar uses Dark Pulse. It flinches opposing Snorlax.
  env.executeAndAssert("move darkpulse 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
