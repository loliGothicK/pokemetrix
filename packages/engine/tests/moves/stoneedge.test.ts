import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Stone Edge", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "arcanine", moves: ["stoneedge"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "gengar", moves: ["sleeptalk"] }),
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move stoneedge 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
