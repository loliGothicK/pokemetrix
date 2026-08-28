import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Fire Spin", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "charizard", moves: ["firespin"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move firespin 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
