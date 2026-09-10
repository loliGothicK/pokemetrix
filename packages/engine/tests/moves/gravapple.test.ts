import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Grav Apple", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "flapple", moves: ["gravapple"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move gravapple 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
