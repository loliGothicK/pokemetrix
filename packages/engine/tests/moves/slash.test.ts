import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Slash", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "sirfetchd", ability: "scrappy", moves: ["slash", "sleeptalk"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", ability: "intimidate", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", ability: "unaware", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["slash", "sleeptalk"],
    },
  );
  env.executeAndAssert("move slash 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
