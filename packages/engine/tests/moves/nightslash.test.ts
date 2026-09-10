import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: Night Slash", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "ariados", moves: ["nightslash"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move nightslash 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
