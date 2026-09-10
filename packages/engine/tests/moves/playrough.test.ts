import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: Play Rough", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "pikachu", moves: ["playrough"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move playrough 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
