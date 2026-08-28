import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: Gigaton Hammer", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "tinkaton", moves: ["gigatonhammer"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move gigatonhammer 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
