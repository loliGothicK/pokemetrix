import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: Wild Charge", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "pikachu", moves: ["wildcharge"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move wildcharge 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
