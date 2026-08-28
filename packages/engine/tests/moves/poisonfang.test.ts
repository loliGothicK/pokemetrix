import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Poison Fang", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "arbok", moves: ["poisonfang"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move poisonfang 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
