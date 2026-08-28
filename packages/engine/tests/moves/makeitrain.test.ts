import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: Make It Rain", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "gholdengo", moves: ["makeitrain"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move makeitrain, move sleeptalk", "move sleeptalk, move sleeptalk");
});
