import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: Ice Spinner", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "blastoise", moves: ["icespinner"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move icespinner 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
