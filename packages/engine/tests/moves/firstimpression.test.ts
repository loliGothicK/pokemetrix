import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: First Impression", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "ariados", moves: ["firstimpression", "sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move firstimpression 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
