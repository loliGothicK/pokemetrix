import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Comeuppance", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "houndoom", moves: ["comeuppance"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "gengar", moves: ["sludgebomb"] }),
      pokemon({ species: "raichu", moves: ["sleeptalk"] }),
    ],
  );

  const res = env.executeTurn(
    "move comeuppance, move sleeptalk",
    "move sludgebomb 1, move sleeptalk",
  );
  env.assertStateMatch(res.engineState, env.sim);
});
