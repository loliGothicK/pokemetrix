import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: Hammer Arm", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "kangaskhan", moves: ["hammerarm"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move hammerarm 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
