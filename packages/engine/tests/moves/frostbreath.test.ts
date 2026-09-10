import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: Frost Breath", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "glalie", moves: ["frostbreath"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move frostbreath 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
