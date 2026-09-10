import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Overheat", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "charizard", moves: ["overheat"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move overheat 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
