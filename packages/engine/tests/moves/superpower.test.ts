import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: superpower", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["superpower"] }),
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", ability: "cursedbody", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "superpower" }, "sleeptalk"],
      engineConfig: { damage_roll: "max", crits: "never" },
    },
  );

  env.executeAndAssert("move superpower 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
