import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: bodypress uses Defense instead of Attack for damage calculation", () => {
  const env = new TestEnvironment(
    [
      // Charizard (Defense: 98, Attack: 104)
      pokemon({ species: "blastoise", ability: "torrent", moves: ["bodypress"] }),
      // Snorlax uses sleep talk to pass
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
      pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["bodypress", "sleeptalk"],
      engineConfig: {
        secondary: "always",
      },
    },
  );

  env.executeAndAssert("move bodypress 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
