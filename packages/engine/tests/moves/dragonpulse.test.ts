import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: dragonpulse deals damage without secondary effects", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "dragonite", ability: "multiscale", moves: ["dragonpulse"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["dragonpulse", "sleeptalk"],
      engineConfig: {
        crits: "never",
      },
    },
  );

  // Latias uses Dragon Pulse.
  env.executeAndAssert("move dragonpulse 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
