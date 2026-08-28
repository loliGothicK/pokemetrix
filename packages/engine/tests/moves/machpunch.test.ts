import { test } from "vitest";
import { TestEnvironment } from "@/sim-utils";
import { pokemon } from "@/sim-utils";

test("Move: machpunch", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "infernape", moves: ["machpunch"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move machpunch 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
