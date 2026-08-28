import { expect, test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Baton Pass (バトンタッチ) allows a mid-turn switch and passes stat boosts", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "scizor", ability: "technician", moves: ["swordsdance", "batonpass"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "gengar", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
  );

  env.executeTurn("move swordsdance, move sleeptalk", "move sleeptalk, move sleeptalk");

  const res2 = env.executeTurn("move batonpass, move sleeptalk", "move sleeptalk, move sleeptalk");

  expect(res2.engineState.turn_state).toBe("WaitingForSwitch");

  env.engine.submit_switch_choice(1, 0, 0);

  const resumedState = env.engine.get_state();

  expect(resumedState.p1.active[0].species).toBe("charizard");
  expect(resumedState.p1.active[0].boosts.atk).toBe(2);
});
