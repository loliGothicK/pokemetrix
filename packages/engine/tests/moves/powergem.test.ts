import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: Power Gem", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "arcanine", moves: ["powergem"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move powergem 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
