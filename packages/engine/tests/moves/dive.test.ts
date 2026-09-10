import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: dive makes user semi-invulnerable on turn 1", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "blastoise", ability: "torrent", moves: ["dive"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["bodyslam"] }),
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["dive", "bodyslam", "sleeptalk"],
    },
  );

  // Turn 1: Blastoise dives. Snorlax bodyslams, but it misses!
  env.executeAndAssert("move dive 1, move sleeptalk", "move bodyslam 1, move sleeptalk");
});
