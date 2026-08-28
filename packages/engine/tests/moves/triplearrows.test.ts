import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Triple Arrows", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "decidueye", moves: ["triplearrows"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move triplearrows 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
