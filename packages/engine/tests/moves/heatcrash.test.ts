import { test } from "vitest";
import { TestEnvironment } from "@/sim-utils";
import { pokemon } from "@/sim-utils";

test("Move: heatcrash", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "charizard", moves: ["heatcrash"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "gengar", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move heatcrash 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
