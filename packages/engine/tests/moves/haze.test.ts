import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Haze clears all boosts", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "vaporeon", ability: "waterabsorb", moves: ["haze", "sleeptalk"] }),
      pokemon({ species: "gengar", ability: "cursedbody", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "haze", damage_roll: "max" }, "sleeptalk"],
      engineConfig: { accuracy: "always", damage_roll: "max" },
    },
  );

  env.executeTurn("move haze, move sleeptalk", "move sleeptalk, move sleeptalk");
});
