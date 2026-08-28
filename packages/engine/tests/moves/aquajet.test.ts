import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Aqua Jet (アクアジェット) has +1 priority", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "blastoise", ability: "torrent", moves: ["aquajet"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "jolteon", ability: "voltabsorb", moves: ["thunderbolt"] }),
      pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["aquajet", "thunderbolt", "sleeptalk"],
    },
  );

  // Blastoise is much slower than Jolteon, but Aqua Jet is +1 priority, so it hits first.
  env.executeAndAssert("move aquajet 1, move sleeptalk", "move thunderbolt 1, move sleeptalk");
});
