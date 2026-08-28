import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Zen Headbutt has a flinch chance", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "slowbro", moves: ["zenheadbutt"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move zenheadbutt 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
