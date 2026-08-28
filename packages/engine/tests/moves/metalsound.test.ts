import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Metal Sound", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "jolteon", moves: ["metalsound"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move metalsound 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
