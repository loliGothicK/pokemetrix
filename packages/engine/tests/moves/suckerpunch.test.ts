import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Sucker Punch", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "arbok", moves: ["suckerpunch", "sleeptalk"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "blastoise", moves: ["hydropump", "sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [
        { id: "suckerpunch", accuracy: true },
        { id: "hydropump", accuracy: true },
        "sleeptalk",
      ],
      engineConfig: { damage_roll: "max", crits: "never", accuracy: "always" },
    },
  );

  env.executeAndAssert("move suckerpunch 1, move sleeptalk", "move hydropump 1, move sleeptalk");
});
