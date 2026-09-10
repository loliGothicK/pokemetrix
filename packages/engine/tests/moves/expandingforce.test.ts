import { test } from "vitest";
import { TestEnvironment } from "@/sim-utils";
import { pokemon } from "@/sim-utils";

test("Move: Expanding Force", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "alakazam", moves: ["expandingforce", "psychicterrain"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", moves: ["sleeptalk"] }),
    ],
  );

  env.executeTurn("move psychicterrain, move sleeptalk", "move sleeptalk, move sleeptalk");
  env.executeAndAssert("move expandingforce 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
