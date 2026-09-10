import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: Mud-Slap", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "arbok", moves: ["mudslap"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move mudslap 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
