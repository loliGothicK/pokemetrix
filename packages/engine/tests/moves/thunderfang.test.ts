import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Thunder Fang", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "arcanine", moves: ["thunderfang", "sleeptalk"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "blastoise", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "thunderfang", accuracy: true }, "sleeptalk"],
      engineConfig: { damage_roll: "max", crits: "never", accuracy: "always" },
    },
  );

  env.executeAndAssert("move thunderfang 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
