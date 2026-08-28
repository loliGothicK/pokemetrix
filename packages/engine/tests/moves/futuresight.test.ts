import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Future Sight", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "clefable", moves: ["futuresight"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move futuresight 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
