import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Fake Out", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "incineroar", moves: ["fakeout", "sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk", "encore"] }),
    ],
  );

  // Turn 1: Fake Out works, Clefable uses Encore on Incineroar
  const res1 = env.executeTurn("move fakeout 2, move sleeptalk", "move sleeptalk, move encore 1");
  env.assertStateMatch(res1.engineState, env.sim);

  // Turn 2: Incineroar is Encored into Fake Out, which should fail
  const res2 = env.executeTurn("move fakeout 2, move sleeptalk", "move sleeptalk, move sleeptalk");
  env.assertStateMatch(res2.engineState, env.sim);
});
