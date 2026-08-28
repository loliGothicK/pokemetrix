import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: Iron Defense", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "blastoise", moves: ["irondefense"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move irondefense, move sleeptalk", "move sleeptalk, move sleeptalk");
});
