import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Beat Up", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "weavile", moves: ["beatup"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"], status: "par" }), // Status condition! Should be excluded!
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "gengar", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "beatup", accuracy: true }, "sleeptalk"],
      engineConfig: { accuracy: "always", damage_roll: "max" },
    },
  );

  env.executeAndAssert("move beatup 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
