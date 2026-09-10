import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Glare inflicts paralysis", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "arbok", ability: "intimidate", moves: ["glare", "sleeptalk"] }),
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "vaporeon", ability: "waterabsorb", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "glare", damage_roll: "max" }, "sleeptalk"],
      engineConfig: { accuracy: "always", damage_roll: "max" },
    },
  );

  env.executeAndAssert("move glare 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
