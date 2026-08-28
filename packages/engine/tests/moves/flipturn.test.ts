import { test } from "vitest";
import { expect } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Flip Turn", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "blastoise", moves: ["flipturn"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  const result = env.executeTurn(
    "move flipturn 1, move sleeptalk",
    "move sleeptalk, move sleeptalk",
  );
  expect(result.engineState.turn_state).toBe("WaitingForSwitch");
  env.engine.submit_switch_choice(1, 0, 0);
  expect(env.engine.get_state().p1.active[0].species).toBe("charizard");
});
