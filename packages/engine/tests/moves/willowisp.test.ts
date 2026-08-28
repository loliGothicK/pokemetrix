import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Will-O-Wisp", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "charizard", moves: ["willowisp"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move willowisp 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
