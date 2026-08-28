import { describe, test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

describe("Move: Dragon Tail", () => {
  test("Dragon Tail forces target to switch", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "garchomp", moves: ["dragontail", "sleeptalk"] }),
        pokemon({ species: "charizard", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "clefable", moves: ["sleeptalk"] }),
        pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
        pokemon({ species: "gengar", moves: ["sleeptalk"] }),
      ],
    );
    const res = env.executeTurn(
      "move dragontail 2, move sleeptalk",
      "move sleeptalk, move sleeptalk",
    );
    env.assertStateMatch(res.engineState, env.sim);
  });
});
