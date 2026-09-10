import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Agility (こうそくいどう) raises Speed by 2 stages", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "pikachu", ability: "static", moves: ["agility"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "umbreon", ability: "synchronize", moves: ["sleeptalk"] }),
      pokemon({ species: "charizard", ability: "blaze", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["agility", "sleeptalk"],
    },
  );

  env.executeAndAssert("move agility, move sleeptalk", "move sleeptalk, move sleeptalk");
});
