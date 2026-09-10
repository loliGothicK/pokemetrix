import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: Thunder Punch", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "charizard", moves: ["thunderpunch"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move thunderpunch 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
