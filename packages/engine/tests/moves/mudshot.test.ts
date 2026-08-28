import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: Mud Shot", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "blastoise", moves: ["mudshot"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move mudshot 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
