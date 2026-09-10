import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Air Slash (エアスラッシュ) has a 30% chance to flinch", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "charizard", ability: "blaze", moves: ["airslash"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "umbreon", ability: "synchronize", moves: ["sleeptalk"] }),
      pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "airslash", secondary: "inherit" }, "sleeptalk"],
      engineConfig: { secondary: "always" },
    },
  );

  // Target umbreon
  env.executeAndAssert("move airslash 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
