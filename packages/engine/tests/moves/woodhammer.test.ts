import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Wood Hammer deals damage with recoil", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "abomasnow", moves: ["woodhammer"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "blastoise", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["woodhammer", "sleeptalk"],
    },
  );

  env.executeAndAssert("move woodhammer 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
