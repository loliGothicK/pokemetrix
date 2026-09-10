import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Sacred Sword", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "gallade", moves: ["sacredsword"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move sacredsword 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
