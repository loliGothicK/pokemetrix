import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: energyball deals damage and lowers SpD", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["energyball"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "energyball", secondary: "inherit" }, "sleeptalk"],
      engineConfig: {
        secondary: "always",
        crits: "never",
      },
    },
  );
  env.executeAndAssert("move energyball 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
