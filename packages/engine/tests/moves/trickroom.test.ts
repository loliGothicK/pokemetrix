import { test, expect } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Trick Room toggles the field condition", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "alakazam", moves: ["trickroom"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );

  const first = env.executeTurn("move trickroom, move sleeptalk", "move sleeptalk, move sleeptalk");
  env.assertStateMatch(first.engineState, env.sim);
  expect(first.engineState.trick_room).toBe(true);

  const second = env.executeTurn(
    "move trickroom, move sleeptalk",
    "move sleeptalk, move sleeptalk",
  );
  env.assertStateMatch(second.engineState, env.sim);
  expect(second.engineState.trick_room).toBe(false);
});
