import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Shadow Claw", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "charizard", moves: ["shadowclaw"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move shadowclaw 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
