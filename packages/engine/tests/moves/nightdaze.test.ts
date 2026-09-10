import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: Night Daze", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "zoroark", moves: ["nightdaze"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move nightdaze 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
