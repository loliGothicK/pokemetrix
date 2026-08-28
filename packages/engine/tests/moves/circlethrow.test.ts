import { describe, test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

describe("Move: Circle Throw", () => {
  test("Circle Throw forces target to switch", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "lucario", moves: ["circlethrow", "sleeptalk"] }),
        pokemon({ species: "charizard", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "clefable", moves: ["sleeptalk"] }),
        pokemon({ species: "raichu", moves: ["sleeptalk"] }),
        pokemon({ species: "gengar", moves: ["sleeptalk"] }), // bench pokemon for p2
      ],
    );

    const res = env.executeTurn(
      "move circlethrow 1, move sleeptalk",
      "move sleeptalk, move sleeptalk",
    );
    env.assertStateMatch(res.engineState, env.sim);
  });
});
