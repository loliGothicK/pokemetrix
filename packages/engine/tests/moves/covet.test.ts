import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Covet", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "snorlax", moves: ["covet"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "gengar", item: "leftovers", moves: ["sludgebomb"] }),
      pokemon({ species: "raichu", moves: ["sleeptalk"] }),
    ],
  );

  const res = env.executeTurn("move covet 1, move sleeptalk", "move sludgebomb 1, move sleeptalk");
  env.assertStateMatch(res.engineState, env.sim);
});
