import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: surf", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "vaporeon", ability: "waterabsorb", moves: ["surf"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", ability: "cursedbody", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "surf" }, "sleeptalk"],
      engineConfig: { damage_roll: "max", crits: "never" },
    },
  );

  env.executeAndAssert("move surf, move sleeptalk", "move sleeptalk, move sleeptalk");
});
