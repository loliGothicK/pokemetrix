import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Water Pulse", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "blastoise", moves: ["waterpulse"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move waterpulse 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
