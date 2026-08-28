import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: Iron Head", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "blastoise", moves: ["ironhead"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move ironhead 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
