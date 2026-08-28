import { test } from "vitest";
import { TestEnvironment } from "@/sim-utils";
import { pokemon } from "@/sim-utils";

test("Move: lowsweep", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "machamp", moves: ["lowsweep"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move lowsweep 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
