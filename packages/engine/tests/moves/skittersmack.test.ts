import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Skitter Smack", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "beedrill", moves: ["skittersmack"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move skittersmack 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
