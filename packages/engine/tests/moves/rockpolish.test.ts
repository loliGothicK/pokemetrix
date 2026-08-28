import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Rock Polish", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "steelix-mega", moves: ["rockpolish"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move rockpolish, move sleeptalk", "move sleeptalk, move sleeptalk");
});
