import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Pounce", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "beedrill", moves: ["pounce"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move pounce 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
