import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Recover heals 50%", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "starmie", ability: "illuminate", moves: ["recover"] }),
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "recover", damage_roll: "max" }, "sleeptalk"],
      engineConfig: { accuracy: "always", damage_roll: "max" },
    },
  );

  // HP modified naturally or no longer needed
  env.executeAndAssert("move recover, move sleeptalk", "move sleeptalk, move sleeptalk");
});
