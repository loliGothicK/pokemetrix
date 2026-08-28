import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: toxic", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "gengar", ability: "cursedbody", moves: ["toxic"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", ability: "cursedbody", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "toxic" }, "sleeptalk"],
      engineConfig: { damage_roll: "max", crits: "never" },
    },
  );

  env.executeAndAssert("move toxic 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
