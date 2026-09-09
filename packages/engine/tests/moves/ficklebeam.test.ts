import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test.skip("Move: Fickle Beam", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "hydrapple", moves: ["ficklebeam"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move ficklebeam 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
