import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Foul Play uses target Attack", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "umbreon", ability: "innerfocus", moves: ["foulplay", "sleeptalk"] }),
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "annihilape", ability: "vitalspirit", moves: ["bulkup", "sleeptalk"] }),
      pokemon({ species: "vaporeon", ability: "waterabsorb", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "foulplay", damage_roll: "max" }, "bulkup", "sleeptalk"],
      engineConfig: { accuracy: "always", damage_roll: "max" },
    },
  );

  env.executeAndAssert("move sleeptalk, move sleeptalk", "move bulkup, move sleeptalk");
  env.executeAndAssert("move foulplay 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
