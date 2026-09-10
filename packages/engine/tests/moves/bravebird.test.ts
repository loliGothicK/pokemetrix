import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: bravebird does recoil damage", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "staraptor", ability: "intimidate", moves: ["bravebird"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "venusaur", ability: "overgrow", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["bravebird", "sleeptalk"],
    },
  );

  // Staraptor uses Brave Bird on Snorlax.
  env.executeAndAssert("move bravebird 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
