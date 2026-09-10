import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: Last Resort", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "kangaskhan", moves: ["lastresort", "sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert([
    ["move sleeptalk, move sleeptalk", "move sleeptalk, move sleeptalk"],
    ["move lastresort 1, move sleeptalk", "move sleeptalk, move sleeptalk"],
  ]);
});
