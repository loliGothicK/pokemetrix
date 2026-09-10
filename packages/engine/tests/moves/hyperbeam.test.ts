import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Hyper Beam", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "venusaur-mega", moves: ["hyperbeam"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move hyperbeam 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
