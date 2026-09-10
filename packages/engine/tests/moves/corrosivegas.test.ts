import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Corrosive Gas", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "gengar", moves: ["corrosivegas"], item: "leftovers" }),
      pokemon({ species: "pikachu", moves: ["sleeptalk"], item: "lightball" }),
    ],
    [
      pokemon({ species: "clefable", moves: ["sleeptalk"], item: "sitrusberry" }),
      pokemon({ species: "raichu", moves: ["sleeptalk"], item: "choiceband" }),
    ],
  );

  // Corrosive Gas hits all adjacent Pokemon!
  const res = env.executeTurn(
    "move corrosivegas, move sleeptalk",
    "move sleeptalk, move sleeptalk",
  );

  // Gengar's item is Leftovers (user). Pikachu, Clefable, Raichu's items should be removed.
  env.assertStateMatch(res.engineState, env.sim);
});
