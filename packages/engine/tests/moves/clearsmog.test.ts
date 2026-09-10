import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Clear Smog", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "gengar", moves: ["clearsmog"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "clefable", moves: ["amnesia", "sleeptalk"] }),
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move clearsmog 1, move sleeptalk", "move amnesia, move sleeptalk");
  // Turn 2: Clear Smog should remove the +2 SpD from Amnesia
  env.executeAndAssert("move clearsmog 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
