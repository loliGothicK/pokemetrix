import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Electro Ball", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "jolteon", moves: ["electroball"] }), // Fast
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }), // Slow
      pokemon({ species: "gengar", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move electroball 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
