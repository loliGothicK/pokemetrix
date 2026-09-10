import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Focus Energy applies volatile status and prints start log", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "beedrill", ability: "swarm", moves: ["focusenergy", "sleeptalk"] }),
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "vaporeon", ability: "waterabsorb", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "focusenergy", damage_roll: "max" }, "sleeptalk"],
      engineConfig: { accuracy: "always", damage_roll: "max" },
    },
  );

  env.executeAndAssert("move focusenergy, move sleeptalk", "move sleeptalk, move sleeptalk");
});
